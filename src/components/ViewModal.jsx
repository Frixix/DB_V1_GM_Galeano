import { useState, useEffect } from 'react';
import { downloadDocumentBlob } from '../services/storageService';

export default function ViewModal({ 
  doc, 
  isOpen, 
  onClose, 
  onDownload, 
  isUnread = false, 
  onConfirmRead = null 
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLocallyConfirmed, setIsLocallyConfirmed] = useState(false);

  const fileName = doc?.fileName || '';
  const isImage = /\.(jpe?g|png|gif|webp|svg|bmp|jfif|pjpeg|pjp|avif|ico|tiff?)$/i.test(fileName) || fileName.toLowerCase().endsWith('.jfif');
  const isPdf = /\.pdf$/i.test(fileName);

  // Reiniciar estado local de confirmación cuando cambia el documento
  useEffect(() => {
    setIsLocallyConfirmed(false);
  }, [doc?.id, isOpen]);

  const effectivelyUnread = isUnread && !isLocallyConfirmed;

  const handleConfirmReadClick = () => {
    setIsLocallyConfirmed(true);
    if (onConfirmRead && doc?.id) {
      onConfirmRead(doc.id);
    }
  };

  // Cerrar lightbox si se cierra el modal o cambia el documento
  useEffect(() => {
    if (!isOpen) {
      setIsLightboxOpen(false);
    }
  }, [isOpen, doc?.id]);

  // Manejo de la tecla Escape para cerrar el lightbox sin cerrar el modal principal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isLightboxOpen) {
        e.stopPropagation();
        setIsLightboxOpen(false);
      }
    };
    if (isLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    let active = true;
    let createdUrl = null;

    if (!isOpen || !doc) {
      setBlobUrl(null);
      setLoadingPreview(false);
      setPreviewError(false);
      return;
    }

    // Si ya existe un Blob en memoria (subido en la sesión actual)
    if (doc.fileBlob instanceof Blob) {
      createdUrl = URL.createObjectURL(doc.fileBlob);
      setBlobUrl(createdUrl);
      return () => {
        if (createdUrl) URL.revokeObjectURL(createdUrl);
      };
    }

    // Si el archivo está en la nube (R2 o Supabase) y es previsualizable (imagen o PDF)
    if (doc.storageKey && (isImage || isPdf)) {
      setLoadingPreview(true);
      setPreviewError(false);

      downloadDocumentBlob(doc.storageKey)
        .then((blob) => {
          if (!active) return;
          if (blob instanceof Blob) {
            createdUrl = URL.createObjectURL(blob);
            setBlobUrl(createdUrl);
          } else {
            setPreviewError(true);
          }
        })
        .catch((err) => {
          console.warn('[ViewModal] Error cargando vista previa:', err);
          if (active) setPreviewError(true);
        })
        .finally(() => {
          if (active) setLoadingPreview(false);
        });
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [isOpen, doc?.id, doc?.storageKey, isImage, isPdf]);

  if (!isOpen || !doc) return null;

  const formatFolderLabel = (key) => {
    const map = {
      boveda: "Bóveda Directiva",
      institucional: "Institucional & Circulares",
      planeaciones: "Planeaciones",
      calificaciones: "Planillas de Notas",
      talleres: "Guías & Talleres",
      observador: "Observador & Actas"
    };
    return map[key] || key;
  };

  const getFileIcon = () => {
    if (isImage) return "ph-bold ph-file-image";
    if (isPdf) return "ph-bold ph-file-pdf";
    if (/\.(docx?|odt)$/i.test(fileName)) return "ph-bold ph-file-doc";
    if (/\.(xlsx?|csv)$/i.test(fileName)) return "ph-bold ph-file-xls";
    return "ph-bold ph-file-text";
  };

  return (
    <>
      <div className="modal-backdrop show" onClick={onClose}>
      <div 
        className="modal modal-preview" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon">
              <i className={getFileIcon()}></i>
            </div>
            <div>
              <h3>{doc.title}</h3>
              <p>Radicado: <code>{doc.id}</code> • {doc.uploadedAt || "Reciente"}</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Cerrar modal">
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        <div className="modal-body-view" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }}>
          {effectivelyUnread && (
            <div className="view-modal-unread-alert">
              <div className="view-modal-unread-alert-left">
                <i className="ph-bold ph-bell-ringing"></i>
                <div>
                  <strong>Comunicado pendiente de confirmación de lectura</strong>
                  <p>Al confirmar lectura, se registrará formalmente tu revisión en la plataforma.</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-confirm-read-action"
                onClick={handleConfirmReadClick}
                title="Confirmar lectura oficial de este documento"
              >
                <i className="ph-bold ph-check-circle"></i> Confirmar lectura
              </button>
            </div>
          )}

          <div className="view-document-card">
            
            {/* Metadatos principales */}
            <div className="form-grid-3" style={{ marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Docente / Responsable</label>
                <strong>{doc.teacher}</strong>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Grado / Área</label>
                <span>{doc.grade} — {doc.subject}</span>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Ubicación</label>
                <span className="tag-pastel-institucional" style={{ display: 'inline-block', marginTop: '2px' }}>
                  {formatFolderLabel(doc.folder)}
                </span>
              </div>
            </div>

            {doc.period && (
              <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Periodo lectivo:</span> <strong>{doc.period}</strong>
              </div>
            )}

            {/* Ficha del Archivo Adjunto */}
            <div className="file-attachment-badge" style={{ marginTop: '0.5rem' }}>
              <div className="file-attachment-badge-left">
                <i className={getFileIcon()} style={{ fontSize: '1.25rem', color: 'var(--primary-light)' }}></i>
                <div>
                  <span style={{ display: 'block', fontWeight: 600 }}>{doc.fileName || 'documento_adjunto'}</span>
                  <small style={{ color: 'var(--text-muted)' }}>
                    {doc.fileSize || 'N/A'} {doc.compressedSize ? `(Comprimido: ${doc.compressedSize})` : ''}
                  </small>
                </div>
              </div>
              {doc.ratio && (
                <span className="savings-pill">
                  <i className="ph-bold ph-file-zip"></i> -{doc.ratio}
                </span>
              )}
            </div>

            {/* PREVISUALIZADOR EN VIVO (IMÁGENES) */}
            {isImage && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="ph-bold ph-eye"></i> Vista Previa de la Imagen (Cloudflare R2):
                  </label>
                  {blobUrl && (
                    <button 
                      type="button" 
                      onClick={() => setIsLightboxOpen(true)}
                      className="btn-preview-lightbox-trigger"
                      title="Ver imagen en tamaño completo dentro de la app"
                    >
                      <i className="ph-bold ph-arrows-out-simple"></i> Ver completo
                    </button>
                  )}
                </div>

                {loadingPreview ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <i className="ph-bold ph-spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '1.35rem', display: 'block', margin: '0 auto 8px' }}></i>
                    Cargando vista previa desde Cloudflare R2...
                  </div>
                ) : blobUrl ? (
                  <div 
                    className="image-preview-thumbnail-wrapper"
                    onClick={() => setIsLightboxOpen(true)}
                    title="Haga clic para ampliar en tamaño completo"
                  >
                    <img 
                      src={blobUrl} 
                      alt={doc.title} 
                      className="image-preview-thumbnail" 
                    />
                    <div className="image-preview-thumbnail-overlay">
                      <i className="ph-bold ph-magnifying-glass-plus"></i> Clic para ver en tamaño completo
                    </div>
                  </div>
                ) : previewError ? (
                  <div style={{ padding: '1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No se pudo cargar la vista previa directa. Puedes descargarla con el botón inferior.
                  </div>
                ) : null}
              </div>
            )}

            {/* PREVISUALIZADOR EN VIVO (PDF) */}
            {isPdf && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="ph-bold ph-file-pdf"></i> Visor de Documento PDF (Cloudflare R2):
                  </label>
                  {blobUrl && (
                    <button 
                      type="button" 
                      onClick={() => setIsLightboxOpen(true)}
                      className="btn-preview-lightbox-trigger"
                      title="Maximizar visor en pantalla completa dentro de la app"
                    >
                      <i className="ph-bold ph-arrows-out-simple"></i> Maximizar visor
                    </button>
                  )}
                </div>

                {loadingPreview ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <i className="ph-bold ph-spinner" style={{ animation: 'spin 1s linear infinite', fontSize: '1.35rem', display: 'block', margin: '0 auto 8px' }}></i>
                    Cargando visor PDF desde Cloudflare R2...
                  </div>
                ) : blobUrl ? (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', height: '420px', background: '#f8fafc' }}>
                    <iframe 
                      src={blobUrl} 
                      title={doc.title} 
                      style={{ width: '100%', height: '100%', border: 'none' }} 
                    />
                  </div>
                ) : previewError ? (
                  <div style={{ padding: '1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Vista previa de PDF no disponible directamente. Puedes descargarlo abajo.
                  </div>
                ) : null}
              </div>
            )}

            {/* Notas y observaciones */}
            {doc.notes && (
              <div style={{ marginTop: '1.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ph-bold ph-note"></i> Notas y Descripción del Registro:
                </label>
                <div className="view-document-text">
                  {doc.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {effectivelyUnread ? (
              <button 
                type="button" 
                className="btn btn-confirm-read-footer"
                onClick={handleConfirmReadClick}
                title="Marcar este comunicado como revisado y confirmar lectura"
              >
                <i className="ph-bold ph-check-circle"></i> Marcar como revisada
              </button>
            ) : (
              <span className="badge-read-confirmed" title="Has confirmado la revisión de este comunicado">
                <i className="ph-bold ph-check"></i> Lectura confirmada
              </span>
            )}
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => onDownload(doc)}
            >
              <i className="ph-bold ph-download-simple"></i> Descargar Copia
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* VISOR EN TAMAÑO COMPLETO (LIGHTBOX IN-TAB SIN SALIR DE LA PÁGINA) */}
    {isLightboxOpen && blobUrl && (
      <div 
        className="image-lightbox-overlay" 
        onClick={() => setIsLightboxOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Visor a pantalla completa"
      >
        {/* Barra superior con radicado, nombre y botón X de cierre a la derecha */}
        <div className="lightbox-topbar" onClick={(e) => e.stopPropagation()}>
          <div className="lightbox-info">
            <span className="lightbox-badge">{doc.id}</span>
            <span className="lightbox-title" title={doc.title}>{doc.title}</span>
            {fileName && <small className="lightbox-filename">({fileName})</small>}
          </div>
          <button 
            type="button" 
            className="lightbox-close-btn"
            onClick={() => setIsLightboxOpen(false)}
            title="Cerrar vista completa (o presiona Esc)"
            aria-label="Cerrar vista completa"
          >
            <span>Cerrar</span>
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Área central: Clic afuera en el fondo oscuro cierra la vista */}
        <div className="lightbox-content" onClick={() => setIsLightboxOpen(false)}>
          {isImage && (
            <img 
              src={blobUrl} 
              alt={doc.title} 
              className="lightbox-image" 
              onClick={(e) => e.stopPropagation()} 
            />
          )}
          {isPdf && (
            <div 
              className="lightbox-pdf-container"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe 
                src={blobUrl} 
                title={doc.title} 
                className="lightbox-iframe" 
              />
            </div>
          )}
        </div>

        {/* Guía inferior para las profesoras */}
        <div className="lightbox-bottom-hint" onClick={(e) => e.stopPropagation()}>
          <i className="ph-bold ph-info"></i>
          <span>Haz clic en la <strong>X</strong> de la esquina derecha o <strong>afuera de la imagen</strong> para regresar.</span>
        </div>
      </div>
    )}
  </>
  );
}
