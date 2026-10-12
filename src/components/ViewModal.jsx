export default function ViewModal({ doc, isOpen, onClose, onDownload }) {
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

  return (
    <div className="modal-backdrop show" onClick={onClose}>
      <div className="modal modal-preview" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon">
              <i className="ph-bold ph-file-text"></i>
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

        <div className="modal-body-view">
          <div className="view-document-card">
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

            <div className="file-attachment-badge" style={{ marginTop: '0.5rem' }}>
              <div className="file-attachment-badge-left">
                <i className="ph-bold ph-file-pdf"></i>
                <div>
                  <span style={{ display: 'block', fontWeight: 600 }}>{doc.fileName || 'documento_adjunto.pdf'}</span>
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

            {doc.notes && (
              <div style={{ marginTop: '1rem' }}>
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

        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => onDownload(doc)}
          >
            <i className="ph-bold ph-download-simple"></i> Descargar Archivo
          </button>
        </div>
      </div>
    </div>
  );
}
