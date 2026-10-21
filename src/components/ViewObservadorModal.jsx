import { useState, useEffect } from 'react';
import { RECORD_STATUSES, RECORD_TYPES, SEMAFORO_CONFIG } from '../data/initialObservador';
import { getDeadlineMeta } from '../utils/observadorDates';
import { committeeService } from '../services/committeeService.js';
import { downloadDocumentBlob, uploadDocumentFile } from '../services/storageService.js';

export default function ViewObservadorModal({
  isOpen,
  record,
  onClose,
  onDownload,
  onUpdateStatus,
  currentUser,
  isUnread = false,
  onConfirmRead = null
}) {
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionImage, setResolutionImage] = useState(null);
  const [resolveError, setResolveError] = useState('');
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [evidenceSuccessMsg, setEvidenceSuccessMsg] = useState('');

  // Resetear estados al abrir o cambiar de registro
  useEffect(() => {
    setIsResolving(false);
    setResolutionText('');
    setResolutionImage(null);
    setResolveError('');
    setIsUploadingEvidence(false);
    setEvidenceSuccessMsg('');
  }, [record?.id, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const deadlineMeta = getDeadlineMeta(record);
  // Escalamiento visual a rojo si el plazo venció y no está resuelto
  const effectiveSemaforoKey = (deadlineMeta.autoEscalateToRed && record.semaforo !== 'verde' && record.status !== 'resuelto')
    ? 'rojo'
    : record.semaforo;
  const currentSemaforo = SEMAFORO_CONFIG[effectiveSemaforoKey] || SEMAFORO_CONFIG.amarillo;
  const isStudentRoute = ['observador', 'citaciones', 'piar'].includes(record.route);
  const canEditThisRecord = committeeService.canUserEditRecord(record, currentUser);

  const formatRouteTitle = (route) => {
    const map = {
      observador: 'Observador del Estudiante',
      citaciones: 'Acta de Citación & Compromiso con Acudiente',
      piar: 'Plan Individual de Ajustes Razonables (PIAR)',
      comite_convivencia: 'Acta del Comité de Convivencia Escolar',
      comision_evaluacion: 'Acta de la Comisión de Evaluación y Promoción',
      consejo_academico: 'Acta de Sesión del Consejo Académico',
      reuniones_docentes: 'Acta de Reunión de Docentes & Jornada Pedagógica'
    };
    return map[route] || 'Registro Institucional';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setResolveError('El archivo seleccionado debe ser una imagen (JPG, PNG, WebP).');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setResolutionImage(reader.result);
        setResolveError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmResolve = (e) => {
    e.preventDefault();
    setResolveError('');

    if (!resolutionText.trim() || resolutionText.trim().length < 8) {
      setResolveError('⚠️ Obligatorio: Debe explicar detalladamente cómo se arregló la situación o qué acuerdos se cumplieron antes de marcarla como resuelta.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })}, ${now.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })}`;

    onUpdateStatus(record.id, {
      semaforo: 'verde',
      status: 'resuelto',
      resolutionNotes: resolutionText.trim(),
      resolutionImage: resolutionImage || null,
      resolvedAt: formattedDate,
      resolvedBy: currentUser?.name || record.teacher || 'Docente Responsable'
    });

    setIsResolving(false);
  };

  const handleReopen = (targetSemaforo = 'amarillo') => {
    onUpdateStatus(record.id, {
      semaforo: targetSemaforo,
      status: 'en_seguimiento',
      resolvedAt: null,
      resolvedBy: null
    });
  };

  const handleUploadEvidenceDirect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !record) return;

    try {
      setIsUploadingEvidence(true);
      setEvidenceSuccessMsg('');
      const res = await uploadDocumentFile(file, 'observador', record.id);
      if (res && res.storageKey) {
        onUpdateStatus(record.id, {
          fileName: file.name,
          storageKey: res.storageKey,
          notes: record.notes ? `${record.notes} • Acta escaneada: ${file.name}` : `Acta escaneada: ${file.name}`
        });
        setEvidenceSuccessMsg(`¡Soporte "${file.name}" cargado con éxito en Cloudflare R2!`);
        setTimeout(() => setEvidenceSuccessMsg(''), 4500);
      } else {
        alert('No se pudo completar la subida a Cloudflare R2.');
      }
    } catch (err) {
      alert(`Error al subir evidencia a Cloudflare R2: ${err.message}`);
    } finally {
      setIsUploadingEvidence(false);
      e.target.value = '';
    }
  };

  return (
    <div className="obs-modal-overlay" onClick={onClose}>
      <div
        className="obs-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado Institucional Oficial */}
        <div className="obs-modal-header">
          <div className="obs-modal-brand-box">
            <div className="obs-modal-shield">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L3 6V12C3 17.5 6.8 22.3 12 23.5C17.2 22.3 21 17.5 21 12V6L12 2Z" fill="#0f766e" />
                <text x="12" y="15" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="800">MG</text>
              </svg>
            </div>
            <div>
              <h3 className="obs-modal-institution">GIMNASIO MARTÍN GALEANO</h3>
              <p className="obs-modal-subinstitution">
                Sistema Institucional de Convivencia & Actas de Comités • Básica Primaria
              </p>
            </div>
          </div>

          <button
            type="button"
            className="obs-modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Barra de Radicado y Semáforo */}
        <div className="obs-modal-banner">
          <div className="obs-modal-banner-left">
            <span className="obs-radicado-large">
              RADICADO: <strong>{record.id}</strong>
            </span>
            <span className="obs-modal-route-pill">{formatRouteTitle(record.route)}</span>
          </div>

          <div className="obs-modal-banner-right">
            {/* Chip del Semáforo Institucional Mejorado */}
            <span className={`obs-semaforo-chip ${currentSemaforo.badgeClass}`} title={currentSemaforo.description}>
              <i className={`ph-bold ${currentSemaforo.icon || 'ph-circle'}`} style={{ fontSize: '0.95rem' }}></i>
              <span className={`obs-semaforo-dot ${effectiveSemaforoKey}`}></span>
              <strong>{currentSemaforo.label}</strong>
            </span>
          </div>
        </div>

        {/* Alerta de Lectura Pendiente si fue abierto desde Notificaciones */}
        {isUnread && (
          <div className="view-modal-unread-alert" style={{ margin: '1rem 1.5rem 0' }}>
            <div className="view-modal-unread-alert-left">
              <i className="ph-bold ph-bell-ringing"></i>
              <div>
                <strong>Alerta institucional pendiente de confirmación de revisión</strong>
                <p>Al confirmar revisión, constará formalmente tu conocimiento de este caso o acta en el sistema.</p>
              </div>
            </div>
            {onConfirmRead && (
              <button
                type="button"
                className="btn-confirm-read-action"
                onClick={() => onConfirmRead(record.id)}
                title="Confirmar revisión oficial"
              >
                <i className="ph-bold ph-check-circle"></i> Confirmar lectura
              </button>
            )}
          </div>
        )}

        {/* Título Principal del Registro */}
        <div className="obs-modal-title-section">
          <h2>{record.title}</h2>
          <div className="obs-modal-quick-meta">
            <span>
              <i className="ph-bold ph-calendar"></i> <strong>Fecha:</strong> {record.date}
            </span>
            <span>
              <i className="ph-bold ph-graduation-cap"></i> <strong>Grado:</strong> {record.grade}
            </span>
            {record.period && (
              <span>
                <i className="ph-bold ph-hourglass-medium"></i> <strong>Periodo:</strong> {record.period}
              </span>
            )}
            <span>
              <i className="ph-bold ph-chalkboard-teacher"></i> <strong>Reportado por:</strong> {record.teacher}
            </span>
          </div>
        </div>

        {/* Banner Institucional de Alertas y Plazos de Cumplimiento */}
        {record.followUpDate && (
          <div className={`obs-deadline-banner ${deadlineMeta.badgeClass}`}>
            <div className="obs-deadline-banner-icon">
              <i className={`ph-bold ${deadlineMeta.icon || 'ph-bell-ringing'}`}></i>
            </div>
            <div className="obs-deadline-banner-content">
              <div className="obs-deadline-banner-header">
                <strong className="obs-deadline-title">{deadlineMeta.statusText}</strong>
                <span className="obs-deadline-pill">
                  Fecha límite fijada: <strong>{record.followUpDate}</strong>
                </span>
              </div>
              <p className="obs-deadline-desc">{deadlineMeta.fullText}</p>
            </div>
          </div>
        )}

        {/* Cuerpo Principal del Registro */}
        <div className="obs-modal-body">
          {/* Ficha Técnica: Estudiante o Participantes */}
          {isStudentRoute ? (
            <div className="obs-info-panel">
              <div className="obs-info-panel-title">
                <i className="ph-bold ph-student"></i>
                <span>DATOS DEL ESTUDIANTE & ACUDIENTE</span>
              </div>
              <div className="obs-info-grid">
                <div>
                  <span className="obs-info-label">Nombre del Estudiante:</span>
                  <span className="obs-info-value">{record.studentName || 'No especificado'}</span>
                </div>
                <div>
                  <span className="obs-info-label">Código / Matrícula:</span>
                  <span className="obs-info-value">{record.studentId || 'N/A'}</span>
                </div>
                <div>
                  <span className="obs-info-label">Grado & Aula:</span>
                  <span className="obs-info-value">{record.grade}</span>
                </div>
                <div>
                  <span className="obs-info-label">Docente que Reporta:</span>
                  <span className="obs-info-value">{record.teacher}</span>
                </div>
                {record.guardianName && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span className="obs-info-label">Acudiente Citado / Presente:</span>
                    <span className="obs-info-value">{record.guardianName}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="obs-info-panel">
              <div className="obs-info-panel-title">
                <i className="ph-bold ph-users-three"></i>
                <span>DATOS DE LA SESIÓN & ASISTENCIA AL COMITÉ</span>
              </div>
              <div className="obs-info-grid">
                <div>
                  <span className="obs-info-label">Tipo de Sesión:</span>
                  <span className="obs-info-value">{record.sessionType || 'Ordinaria'}</span>
                </div>
                <div>
                  <span className="obs-info-label">Convocante / Preside:</span>
                  <span className="obs-info-value">{record.teacher}</span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span className="obs-info-label">Miembros Asistentes:</span>
                  <span className="obs-info-value">{record.attendees || 'Cuerpo Docente y Directivo'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Sección 1: Descripción de los Hechos o Deliberación */}
          <div className="obs-section-block">
            <h4 className="obs-section-title">
              <i className="ph-bold ph-article"></i>
              {isStudentRoute
                ? 'Descripción de la Situación o Hechos Observados'
                : 'Orden del Día & Deliberación de la Sesión'}
            </h4>
            <div className="obs-section-content">
              {record.description ? (
                record.description.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))
              ) : (
                <p>Sin descripción detallada registrada.</p>
              )}
            </div>
          </div>

          {/* Sección 2: Acuerdos, Compromisos o Correctivos */}
          <div className="obs-section-block obs-agreements-highlight">
            <h4 className="obs-section-title">
              <i className="ph-bold ph-handshake"></i>
              {isStudentRoute
                ? 'Compromisos de Convivencia, Acuerdos & Plan de Acompañamiento'
                : 'Acuerdos, Decisiones & Tareas Aprobadas por el Comité'}
            </h4>
            <div className="obs-section-content">
              {record.agreements ? (
                record.agreements.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))
              ) : (
                <p>No se pactaron compromisos específicos.</p>
              )}
            </div>
            {record.followUpDate && (
              <div className="obs-followup-badge">
                <i className="ph-bold ph-calendar-check"></i>
                <span>
                  <strong>Fecha límite para seguimiento / verificación:</strong> {record.followUpDate}
                </span>
              </div>
            )}
          </div>

          {/* SECCIÓN CRÍTICA: EVIDENCIA Y EXPLICACIÓN DE CÓMO SE ARREGLÓ (SI ESTÁ RESUELTO) */}
          {(record.semaforo === 'verde' || record.resolutionNotes) && (
            <div className="obs-section-block obs-resolution-card-success">
              <div className="obs-resolution-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ph-bold ph-check-circle" style={{ fontSize: '1.25rem', color: '#16a34a' }}></i>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#14532d', fontWeight: 800 }}>
                      SITUACIÓN SUPERADA & ACUERDOS RESUELTOS
                    </h4>
                    <span style={{ fontSize: '0.725rem', color: '#166534' }}>
                      Resuelto por <strong>{record.resolvedBy || record.teacher}</strong> {record.resolvedAt ? `el ${record.resolvedAt}` : ''}
                    </span>
                  </div>
                </div>
                <span className="obs-pill-green">🟢 Caso en Verde</span>
              </div>

              <div className="obs-resolution-notes-body">
                <strong style={{ display: 'block', fontSize: '0.75rem', color: '#15803d', marginBottom: '4px' }}>
                  ¿Cómo se arregló / Solución aplicada:
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#14532d', lineHeight: '1.45' }}>
                  {record.resolutionNotes || 'El caso fue evaluado y cumplió a cabalidad con los compromisos fijados.'}
                </p>
              </div>

              {/* Imagen de evidencia si se anexó */}
              {record.resolutionImage && (
                <div className="obs-resolution-image-box">
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <i className="ph-bold ph-image"></i> Evidencia fotográfica / soporte del acuerdo:
                  </span>
                  <div className="obs-image-preview-wrapper">
                    <img
                      src={record.resolutionImage}
                      alt="Evidencia del acuerdo"
                      className="obs-resolution-img"
                      onClick={() => window.open(record.resolutionImage, '_blank')}
                      title="Clic para ver en tamaño completo"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CASILLA DESPLEGABLE PARA RESOLVER (CUANDO SE HACE CLIC EN MARCAR COMO RESUELTO) */}
          {isResolving && (
            <div className="obs-resolving-form-box">
              <div className="obs-resolving-header">
                <i className="ph-bold ph-seal-check"></i>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.925rem', color: '#0f766e', fontWeight: 800 }}>
                    REGISTRAR CÓMO SE ARREGLÓ EL CASO (PASAR A 🟢 VERDE)
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                    Completa la explicación obligatoria y anexa una imagen opcional de evidencia para mover el caso al fondo como resuelto.
                  </p>
                </div>
              </div>

              {resolveError && (
                <div className="obs-form-error" role="alert" style={{ margin: '0.75rem 0' }}>
                  <i className="ph-bold ph-warning-circle"></i>
                  <span>{resolveError}</span>
                </div>
              )}

              <div className="obs-form-group" style={{ marginTop: '0.75rem' }}>
                <label htmlFor="obsResolutionTextInput">
                  <i className="ph-bold ph-note-pencil"></i> ¿Cómo se arregló / resolvió la situación o compromiso? *
                </label>
                <textarea
                  id="obsResolutionTextInput"
                  className="obs-textarea-field"
                  rows={3}
                  placeholder="Detalla qué compromisos cumplió el estudiante, qué habló el acudiente o qué medida formativa cerró el caso..."
                  value={resolutionText}
                  onChange={(e) => {
                    setResolutionText(e.target.value);
                    if (resolveError) setResolveError('');
                  }}
                  required
                  autoFocus
                />
              </div>

              <div className="obs-form-group" style={{ marginTop: '0.75rem' }}>
                <label htmlFor="obsResolutionImageInput">
                  <i className="ph-bold ph-camera"></i> Anexar Foto o Evidencia del Acuerdo (Opcional)
                </label>
                <input
                  type="file"
                  id="obsResolutionImageInput"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="obs-file-input"
                />
                {resolutionImage && (
                  <div className="obs-image-preview-mini">
                    <img src={resolutionImage} alt="Vista previa de evidencia" />
                    <button
                      type="button"
                      className="obs-btn-remove-img"
                      onClick={() => setResolutionImage(null)}
                      title="Quitar imagen"
                    >
                      <i className="ph-bold ph-trash"></i> Quitar
                    </button>
                  </div>
                )}
              </div>

              <div className="obs-resolving-actions">
                <button
                  type="button"
                  className="obs-btn-outline"
                  onClick={() => setIsResolving(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="obs-btn-confirm-resolve"
                  onClick={handleConfirmResolve}
                >
                  <i className="ph-bold ph-check"></i>
                  <span>Confirmar y Pasar a 🟢 Verde (Resuelto)</span>
                </button>
              </div>
            </div>
          )}

          {/* Sección 3: Observaciones Complementarias */}
          {record.notes && (
            <div className="obs-section-block">
              <h4 className="obs-section-title">
                <i className="ph-bold ph-note-pencil"></i>
                Observaciones Complementarias
              </h4>
              <p className="obs-section-content">{record.notes}</p>
            </div>
          )}

          {/* Soporte / Archivo Adjunto en Cloudflare R2 o Supabase */}
          <div className="obs-section-block">
            <h4 className="obs-section-title">
              <i className="ph-bold ph-paperclip"></i>
              Documento de Soporte / Acta Escaneada (Cloudflare R2)
            </h4>

            {evidenceSuccessMsg && (
              <div style={{ marginBottom: '0.65rem', padding: '0.45rem 0.75rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', fontSize: '0.75rem', color: '#065f46', fontWeight: 600 }}>
                <i className="ph-bold ph-check-circle" style={{ marginRight: '5px' }}></i>
                {evidenceSuccessMsg}
              </div>
            )}

            {(record.storageKey || record.fileName) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0.95rem', background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <i className="ph-bold ph-file-text" style={{ fontSize: '1.3rem', color: '#0f766e', flexShrink: 0 }}></i>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ fontSize: '0.82rem', color: '#0f172a', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {record.fileName || 'Acta_Soporte.pdf'}
                    </strong>
                    <span style={{ fontSize: '0.68rem', color: '#0f766e' }}>
                      {record.storageKey ? 'Almacenado seguro en Cloudflare R2 / Supabase' : 'Archivo registrado institucionalmente'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {record.storageKey && (
                    <button
                      type="button"
                      onClick={async () => {
                        const blob = await downloadDocumentBlob(record.storageKey);
                        if (blob) {
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = record.fileName || 'soporte_observador.pdf';
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        } else {
                          alert('No se pudo descargar el archivo desde el almacenamiento en la nube.');
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 12px',
                        background: '#0f766e',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <i className="ph-bold ph-download-simple"></i>
                      <span>Descargar Soporte</span>
                    </button>
                  )}

                  <label className="obs-btn-replace-r2" title="Reemplazar o subir nueva versión escaneada">
                    <i className="ph-bold ph-arrows-clockwise"></i>
                    <span>{isUploadingEvidence ? 'Subiendo...' : 'Actualizar'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      disabled={isUploadingEvidence}
                      onChange={handleUploadEvidenceDirect}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="obs-empty-attach-card">
                <div className="obs-empty-attach-info">
                  <i className="ph-bold ph-cloud-arrow-up obs-cloud-icon"></i>
                  <div>
                    <strong>Sin evidencia o acta escaneada adjunta</strong>
                    <span>Puedes adjuntar el acta firmada o soporte en PDF/imagen a Cloudflare R2 en cualquier momento.</span>
                  </div>
                </div>
                <label className="obs-btn-upload-direct-r2">
                  <i className="ph-bold ph-upload-simple"></i>
                  <span>{isUploadingEvidence ? 'Subiendo a R2...' : 'Adjuntar Evidencia a R2'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    disabled={isUploadingEvidence}
                    onChange={handleUploadEvidenceDirect}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Sección 4: Bloque de Firmas Institucionales */}
          <div className="obs-signatures-container">
            <div className="obs-signature-box">
              <div className="obs-signature-line"></div>
              <span className="obs-signature-name">{record.teacher}</span>
              <span className="obs-signature-role">
                {isStudentRoute ? 'Docente / Director(a) de Curso' : 'Presidencia del Comité / Rectoría'}
              </span>
            </div>

            <div className="obs-signature-box">
              <div className="obs-signature-line"></div>
              <span className="obs-signature-name">
                {isStudentRoute
                  ? record.guardianName || record.studentName || 'Acudiente / Estudiante'
                  : 'Secretaría de Comité / Representante'}
              </span>
              <span className="obs-signature-role">
                {isStudentRoute ? 'Firma de Enterado & Aceptación' : 'Firma de Validación y Conformidad'}
              </span>
            </div>
          </div>
        </div>

        {/* Pie de Modal y Acciones */}
        <div className="obs-modal-footer">
          <div className="obs-modal-footer-left">
            {onUpdateStatus && canEditThisRecord ? (
              record.semaforo === 'verde' || record.status === 'resuelto' ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="obs-btn-toggle-status reabrir"
                    onClick={() => handleReopen('amarillo')}
                    title="Reabrir caso y pasar a Semáforo Amarillo (En seguimiento)"
                  >
                    <i className="ph-bold ph-clock-countdown"></i>
                    <span>Pasar a Amarillo (Reabrir)</span>
                  </button>
                  <button
                    type="button"
                    className="obs-btn-toggle-status alerta"
                    onClick={() => handleReopen('rojo')}
                    title="Pasar a Semáforo Rojo (Alerta Crítica)"
                  >
                    <i className="ph-bold ph-warning-octagon"></i>
                    <span>Pasar a Rojo</span>
                  </button>
                </div>
              ) : (
                !isResolving && (
                  <button
                    type="button"
                    className="obs-btn-toggle-status resolver"
                    onClick={() => setIsResolving(true)}
                    title="Desplegar casilla para documentar cómo se arregló y pasar a Verde"
                  >
                    <i className="ph-bold ph-check-circle"></i>
                    <span>Marcar como Cumplido / Resuelto</span>
                  </button>
                )
              )
            ) : (
              <div className="obs-readonly-committee-banner" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#64748b', fontSize: '0.74rem' }}>
                <i className="ph-bold ph-lock-key" style={{ color: '#0f766e' }}></i>
                <span>
                  {['comite_convivencia', 'comision_evaluacion', 'consejo_academico'].includes(record?.route)
                    ? `Acta restringida: solo miembros del comité asignados por Rectoría.`
                    : `Solo lectura: anotación a cargo de ${record?.teacher || 'docente titular'}.`}
                </span>
              </div>
            )}
          </div>

          <div className="obs-modal-footer-right">
            {isUnread && onConfirmRead ? (
              <button
                type="button"
                className="btn btn-confirm-read-footer"
                onClick={() => onConfirmRead(record.id)}
                title="Confirmar revisión oficial de esta alerta"
              >
                <i className="ph-bold ph-check-circle"></i> Confirmar lectura
              </button>
            ) : (
              <span className="badge-read-confirmed" title="Has confirmado la revisión de esta alerta">
                <i className="ph-bold ph-check"></i> Revisión confirmada
              </span>
            )}

            <button
              type="button"
              className="obs-btn-secondary"
              onClick={handlePrint}
              title="Imprimir formato o guardar en PDF"
            >
              <i className="ph-bold ph-printer"></i>
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              className="obs-btn-primary"
              onClick={() => onDownload(record)}
              title="Descargar acta o registro en formato de texto formal"
            >
              <i className="ph-bold ph-download-simple"></i>
              <span>Descargar Acta</span>
            </button>

            <button
              type="button"
              className="obs-btn-outline"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
