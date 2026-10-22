import { useState } from 'react';
import { formatBytes, formatDateTime, generateRadicado } from '../utils/format';
import { compressFileIfNeeded } from '../utils/compression';
import { uploadDocumentFile } from '../services/storageService';
import { SYSTEM_STORAGE_CAPACITY_BYTES } from '../data/users';
import gradesService from '../services/gradesService';

export default function UploadModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUploadSuccess, 
  existingCount = 0,
  initialFolder = 'planeaciones',
  totalUsedBytes = 0
}) {
  const SYSTEM_STORAGE_CAPACITY = SYSTEM_STORAGE_CAPACITY_BYTES; // 2 GB
  const remainingBytes = Math.max(0, SYSTEM_STORAGE_CAPACITY - totalUsedBytes);
  const isStorageFull = totalUsedBytes >= SYSTEM_STORAGE_CAPACITY;

  const isPrivileged = currentUser && ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);

  const defaultFolder = (initialFolder && initialFolder !== 'all' && initialFolder !== 'publico' && initialFolder !== 'calificaciones' && initialFolder !== 'observador')
    ? initialFolder
    : (isPrivileged ? 'institucional' : 'planeaciones');
  const isInst = defaultFolder === 'institucional';
  const isBov = defaultFolder === 'boveda';

  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState(defaultFolder);
  const [grade, setGrade] = useState(isInst ? 'General' : (isBov ? 'Directivo' : 'Tercero (3°)'));
  const [subject, setSubject] = useState(isInst ? 'Institucional' : (isBov ? 'Directiva' : 'Matemáticas'));
  const [period, setPeriod] = useState('1° Periodo');
  const [isPublic, setIsPublic] = useState(initialFolder === 'publico' || isInst);
  const [notes, setNotes] = useState('');

  // Estados para Bóveda si aplica
  const [bovedaYear, setBovedaYear] = useState('2026');
  const [bovedaSubfolder, setBovedaSubfolder] = useState('consejo');

  const [selectedFile, setSelectedFile] = useState(null);
  const [compressedInfo, setCompressedInfo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Manejador del cambio de carpeta con auto-completado
  const handleFolderChange = (targetFolder) => {
    setFolder(targetFolder);
    if (targetFolder === 'institucional') {
      setGrade('General');
      setSubject('Institucional');
      setIsPublic(true);
    } else if (targetFolder === 'boveda') {
      setGrade('Directivo');
      setSubject('Directiva');
      setIsPublic(false);
    } else {
      if (grade === 'General' || grade === 'Directivo') {
        setGrade('Tercero (3°)');
      }
      if (subject === 'Institucional' || subject === 'Directiva') {
        setSubject('Matemáticas');
      }
    }
  };

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage('');

    // Validar si la cuota global de 2 GB de la Fase de Prueba ya está llena
    if (isStorageFull) {
      setErrorMessage('El almacenamiento asignado para la fase de prueba (2 GB) se encuentra lleno. Contacte a la administración para habilitar espacio adicional.');
      setSelectedFile(null);
      setCompressedInfo(null);
      return;
    }

    // Validar límite de peso según el rol
    if (file.size > currentUser.maxUploadBytes) {
      setErrorMessage(`El archivo pesa ${formatBytes(file.size)}, superando el límite de ${currentUser.maxUploadLabel} asignado a tu perfil.`);
      setSelectedFile(null);
      setCompressedInfo(null);
      return;
    }

    // Validar si este archivo sobrepasa el espacio restante para alcanzar los 2 GB
    if (file.size > remainingBytes) {
      setErrorMessage(`El archivo pesa ${formatBytes(file.size)}, superando el espacio disponible restante en la fase de prueba (${formatBytes(remainingBytes)} disponibles de 2 GB).`);
      setSelectedFile(null);
      setCompressedInfo(null);
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const result = await compressFileIfNeeded(file);
      setCompressedInfo(result);
    } catch {
      setCompressedInfo({
        file,
        fileName: file.name,
        rawBytes: file.size,
        compressedBytes: file.size,
        ratio: null,
        isCompressed: false,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setCompressedInfo(null);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isStorageFull) {
      setErrorMessage('La fase de prueba ha alcanzado el límite de 2 GB. Contacte a la administración para continuar.');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Por favor seleccione un archivo para adjuntar.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Por favor ingrese el título del documento.');
      return;
    }

    const rawBytes = selectedFile.size;
    const finalSize = compressedInfo?.compressedBytes || rawBytes;

    if (totalUsedBytes + finalSize > SYSTEM_STORAGE_CAPACITY) {
      setErrorMessage(`Este documento supera la capacidad máxima de 2 GB de la fase de prueba. Quedan solo ${formatBytes(remainingBytes)} disponibles.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const radicado = generateRadicado(existingCount);
      const fileToUpload = compressedInfo?.file || selectedFile;
      const finalSize = compressedInfo?.compressedBytes || rawBytes;

      // Subir archivo al bucket de Supabase Storage
      const { storageKey, error: uploadErr } = await uploadDocumentFile(
        fileToUpload,
        folder,
        radicado
      );

      if (uploadErr) {
        console.warn('Continuando con radicación local/metadatos tras advertencia en Storage:', uploadErr);
      }

      const newDoc = {
        id: radicado,
        title: title.trim(),
        folder,
        grade: folder === 'boveda' ? 'Directivo' : grade,
        subject: folder === 'boveda' ? 'Directiva' : subject,
        teacher: currentUser.name,
        period,
        isPublic: folder === 'boveda' ? false : (Boolean(isPublic) || folder === 'institucional'),
        fileName: compressedInfo?.fileName || selectedFile.name,
        fileSize: formatBytes(rawBytes),
        compressedSize: compressedInfo?.isCompressed ? formatBytes(finalSize) : null,
        rawBytes: finalSize,
        ratio: compressedInfo?.ratio || null,
        isCompressed: Boolean(compressedInfo?.isCompressed),
        uploadedAt: formatDateTime(),
        notes: notes.trim(),
        ...(folder === 'boveda' ? { bovedaYear, bovedaSubfolder } : {}),
        storageKey: storageKey || null,
        fileBlob: fileToUpload,
      };

      await onUploadSuccess(newDoc);
      handleClose();
    } catch (err) {
      console.error('Error durante la subida:', err);
      setErrorMessage('Error al radicar el documento. Por favor intente nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setSelectedFile(null);
    setCompressedInfo(null);
    setNotes('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="modal-backdrop show" onClick={handleClose}>
      <div className="modal modal-preview" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon">
              <i className="ph-bold ph-cloud-arrow-up"></i>
            </div>
            <div>
              <h3>Registrar Nuevo Documento</h3>
              <p>Se asignará radicado institucional automáticamente</p>
            </div>
          </div>
          <button className="btn-close" onClick={handleClose} aria-label="Cerrar modal">
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        <form id="docForm" onSubmit={handleSubmit}>
          {isStorageFull && (
            <div className="upload-storage-full-alert">
              <div className="alert-header">
                <i className="ph-bold ph-lock-key"></i>
                <strong>Capacidad de 2 GB Alcanzada (Fase de Prueba)</strong>
              </div>
              <p>
                El almacenamiento asignado para la <strong>fase de prueba (2 GB)</strong> se encuentra lleno. Para radicar nuevos documentos, contacte a la administración.
              </p>
            </div>
          )}

          {errorMessage && (
            <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.8rem' }}>
              <i className="ph-bold ph-warning-circle" style={{ marginRight: '6px' }}></i>
              {errorMessage}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="docTitle">Título del Documento *</label>
            <input 
              type="text" 
              id="docTitle" 
              placeholder="Ej: Planeación Bimestral de Matemáticas..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-3">
            <div className="form-group">
              <label htmlFor="docFolder">Carpeta de Destino</label>
              <select id="docFolder" value={folder} onChange={(e) => handleFolderChange(e.target.value)}>
                {initialFolder === 'boveda' ? (
                  <option value="boveda">Bóveda Directiva</option>
                ) : (
                  <>
                    <option value="planeaciones">Planeaciones</option>
                    <option value="talleres">Guías & Talleres</option>
                    {isPrivileged && <option value="institucional">Institucional & Circulares</option>}
                  </>
                )}
              </select>
            </div>

            {folder !== 'boveda' ? (
              <>
                <div className="form-group">
                  <label htmlFor="docGrade">Grado</label>
                  <select id="docGrade" value={grade} onChange={(e) => setGrade(e.target.value)}>
                    <option value="Pre-Jardín">Pre-Jardín</option>
                    <option value="Transición">Transición</option>
                    <option value="Primero (1°)">Grado 1°</option>
                    <option value="Segundo (2°)">Grado 2°</option>
                    <option value="Tercero (3°)">Grado 3°</option>
                    <option value="Cuarto (4°)">Grado 4°</option>
                    <option value="Quinto (5°)">Grado 5°</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="docSubject">Área / Materia</label>
                  <select id="docSubject" value={subject} onChange={(e) => setSubject(e.target.value)}>
                    <option value="Matemáticas">Matemáticas</option>
                    <option value="Lengua Castellana">Lengua Castellana</option>
                    <option value="Ciencias Naturales">Ciencias Naturales</option>
                    <option value="Ciencias Sociales">Ciencias Sociales</option>
                    <option value="Inglés">Inglés</option>
                    <option value="Educación Artística">Educación Artística</option>
                    <option value="Educación Física">Educación Física</option>
                    <option value="Religión">Religión</option>
                    <option value="Ética y Valores">Ética y Valores</option>
                    <option value="Tecnología e Informática">Tecnología e Informática</option>
                    <option value="Institucional">Institucional</option>
                  </select>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="docBovedaYear">Año Lectivo</label>
                  <select id="docBovedaYear" value={bovedaYear} onChange={(e) => setBovedaYear(e.target.value)}>
                    <option value="2026">Año 2026</option>
                    <option value="2025">Año 2025</option>
                    <option value="2024">Año 2024</option>
                    <option value="Historico">Histórico</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="docBovedaSubfolder">Subcarpeta Bóveda</label>
                  <select id="docBovedaSubfolder" value={bovedaSubfolder} onChange={(e) => setBovedaSubfolder(e.target.value)}>
                    <option value="consejo">Consejo Directivo</option>
                    <option value="financiero">Financiero & Contable</option>
                    <option value="legal">Resoluciones & Legal</option>
                    <option value="contratos">Contratos & Nómina</option>
                    <option value="pei_soporte">Soportes PEI</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {folder !== 'boveda' && grade !== 'General' && grade !== 'Directivo' && (() => {
            const printInfo = gradesService.getPrintingCopiesSuggestion(grade);
            return (
              <div style={{ marginBottom: '1rem', padding: '0.65rem 0.9rem', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: '0.78rem', color: '#5b21b6' }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                  <i className="ph-bold ph-printer"></i> Sugerencia de Impresión Institucional (N + 1):
                </strong>
                <span>
                  <strong>{printInfo.suggestedCopies} copias sugeridas</strong> para {grade} ({printInfo.activeStudents} alumnos activos en roster + 1 copia docente calificador).
                </span>
              </div>
            );
          })()}

          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="docPeriod">Periodo</label>
              <select id="docPeriod" value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="1° Periodo">1° Periodo</option>
                <option value="2° Periodo">2° Periodo</option>
                <option value="3° Periodo">3° Periodo</option>
                <option value="4° Periodo">4° Periodo</option>
                <option value="Anual / Permanente">Anual / Permanente</option>
              </select>
            </div>

            {folder === 'boveda' ? (
              <div className="form-group-boveda-security">
                <div className="boveda-security-icon">
                  <i className="ph-bold ph-shield-check"></i>
                </div>
                <div className="boveda-security-info">
                  <strong>Estrictamente Confidencial</strong>
                  <small>Exclusivo Rectoría y Administración (No visible para cuerpo docente • Para comunicación docente usar Módulo 2: Recursos Pedagógicos & Circulares)</small>
                </div>
              </div>
            ) : (
              <div className="form-group-checkbox">
                <label className="checkbox-container">
                  <input 
                    type="checkbox" 
                    checked={isPublic} 
                    onChange={(e) => setIsPublic(e.target.checked)} 
                  />
                  <span className="checkbox-label">
                    <strong>Compartir públicamente</strong>
                    <small>Visible para todo el cuerpo docente</small>
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Selector de Archivo */}
          <div className="form-group">
            <label>Archivo Adjunto *</label>
            {!selectedFile ? (
              <div 
                className={`file-dropzone ${isStorageFull ? 'dropzone-disabled' : ''}`} 
                tabIndex={isStorageFull ? -1 : 0}
              >
                <i className={`ph-bold ${isStorageFull ? 'ph-lock-key' : 'ph-cloud-arrow-up'}`}></i>
                <div className="drop-text">
                  {isStorageFull 
                    ? 'Subidas bloqueadas: Capacidad de 2 GB agotada' 
                    : 'Haga clic o arrastre su archivo aquí'}
                </div>
                <div className="file-hint">
                  {isStorageFull ? (
                    <span style={{ color: '#b91c1c', fontWeight: 600 }}>Límite de almacenamiento de prueba alcanzado</span>
                  ) : (
                    <>
                      Límite perfil: <strong>{currentUser.maxUploadLabel}</strong> • Espacio restante: <strong>{formatBytes(remainingBytes)}</strong>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  className="file-hidden-input" 
                  onChange={handleFileChange} 
                  required
                  disabled={isStorageFull}
                />
              </div>
            ) : (
              <div className="file-selected-badge">
                <div className="file-badge-info">
                  <i className="ph-bold ph-file-text"></i>
                  <div>
                    <strong>{selectedFile.name}</strong>
                    <span className="compression-stats">
                      {formatBytes(selectedFile.size)}
                      {compressedInfo?.isCompressed && ` → ${formatBytes(compressedInfo.compressedBytes)} (Ahorro ${compressedInfo.ratio})`}
                    </span>
                  </div>
                </div>
                <button type="button" className="btn-remove-file" onClick={handleRemoveFile} title="Quitar archivo">
                  <i className="ph-bold ph-trash"></i>
                </button>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="docNotes">Observaciones / Notas (Opcional)</label>
            <textarea 
              id="docNotes" 
              rows="3" 
              placeholder="Detalles sobre el contenido del documento o justificación..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={isProcessing}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isProcessing || isStorageFull}>
              <i className="ph-bold ph-check"></i>
              {isProcessing ? 'Procesando...' : (isStorageFull ? 'Límite de 2 GB Alcanzado' : 'Guardar y Radicar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
