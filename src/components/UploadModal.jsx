import { useState } from 'react';
import { formatBytes, formatDateTime, generateRadicado } from '../utils/format';
import { compressFileIfNeeded } from '../utils/compression';
import { uploadDocumentFile } from '../services/storageService';

export default function UploadModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  onUploadSuccess, 
  existingCount = 0,
  initialFolder = 'planeaciones'
}) {
  const isPrivileged = currentUser && ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);

  const defaultFolder = (initialFolder && initialFolder !== 'all' && initialFolder !== 'publico')
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

    // Validar límite de peso según el rol
    if (file.size > currentUser.maxUploadBytes) {
      setErrorMessage(`El archivo pesa ${formatBytes(file.size)}, superando el límite de ${currentUser.maxUploadLabel} asignado a tu perfil.`);
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

    if (!selectedFile) {
      setErrorMessage('Por favor seleccione un archivo para adjuntar.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Por favor ingrese el título del documento.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const radicado = generateRadicado(existingCount);
      const rawBytes = selectedFile.size;
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
        isPublic: Boolean(isPublic) || folder === 'institucional',
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

      onUploadSuccess(newDoc);
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
                <option value="planeaciones">Planeaciones</option>
                <option value="calificaciones">Planillas de Notas</option>
                <option value="talleres">Guías & Talleres</option>
                <option value="observador">Observador & Actas</option>
                {isPrivileged && <option value="institucional">Institucional & Circulares</option>}
                {isPrivileged && <option value="boveda">Bóveda Directiva</option>}
              </select>
            </div>

            {folder !== 'boveda' ? (
              <>
                <div className="form-group">
                  <label htmlFor="docGrade">Grado</label>
                  <select id="docGrade" value={grade} onChange={(e) => setGrade(e.target.value)}>
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
          </div>

          {/* Selector de Archivo */}
          <div className="form-group">
            <label>Archivo Adjunto *</label>
            {!selectedFile ? (
              <div className="file-dropzone" tabIndex="0">
                <i className="ph-bold ph-cloud-arrow-up"></i>
                <div className="drop-text">Haga clic o arrastre su archivo aquí</div>
                <div className="file-hint">
                  Límite para tu perfil: <strong>{currentUser.maxUploadLabel}</strong> por archivo.
                </div>
                <input 
                  type="file" 
                  className="file-hidden-input" 
                  onChange={handleFileChange} 
                  required
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
            <button type="submit" className="btn btn-primary" disabled={isProcessing}>
              <i className="ph-bold ph-check"></i>
              {isProcessing ? 'Procesando...' : 'Guardar y Radicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
