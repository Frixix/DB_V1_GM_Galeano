export default function DocumentCard({ doc, onView, onDownload, onDelete, canEdit, canDelete }) {
  
  // Mapeo de clases pastel según la carpeta
  const getFolderClass = (folder) => {
    const map = {
      boveda: "tag-pastel-boveda",
      institucional: "tag-pastel-institucional",
      planeaciones: "tag-pastel-planeaciones",
      calificaciones: "tag-pastel-calificaciones",
      talleres: "tag-pastel-talleres",
      observador: "tag-pastel-observador"
    };
    return map[folder] || "tag-pastel-institucional";
  };

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
    <article className="doc-card">
      <div className="doc-card-header">
        <div className="badges-group">
          <span className={getFolderClass(doc.folder)}>{formatFolderLabel(doc.folder)}</span>
          <span className="tag-pastel-grade">{doc.grade}</span>
          {doc.isPublic && <span className="tag-pastel-public"><i className="ph-bold ph-globe"></i> Público</span>}
        </div>
        <div className="doc-meta-subtle">
          <span>{doc.uploadedAt}</span>
          <span className="dot-separator">•</span>
          <code>{doc.id}</code>
        </div>
      </div>

      <h4 className="doc-card-title">{doc.title}</h4>

      <div className="doc-meta">
        <div className="doc-meta-item">
          <i className="ph-bold ph-user"></i>
          <span><strong>Docente / Cargo:</strong> {doc.teacher}</span>
        </div>
        <div className="doc-meta-item">
          <i className="ph-bold ph-folder-notch"></i>
          <span><strong>Sección:</strong> {doc.subject} • {doc.period}</span>
        </div>
        
        <div className="file-attachment-badge">
          <div className="file-attachment-badge-left">
            <i className="ph-bold ph-file-pdf"></i>
            <span>{doc.fileName}</span>
          </div>
          <span className="savings-pill"><i className="ph-bold ph-file-zip"></i> -{doc.ratio}</span>
        </div>

        {doc.notes && (
          <div className="doc-meta-item" style={{ marginTop: '4px', fontStyle: 'italic' }}>
            <i className="ph-bold ph-note"></i>
            <span>{doc.notes}</span>
          </div>
        )}
      </div>

      <div className="doc-card-footer">
        <div className="main-actions-group">
          <button onClick={() => onView(doc.id)} className="btn-view-action" title="Ver documento">
            <i className="ph-bold ph-eye"></i> Ver
          </button>
          <button onClick={() => onDownload(doc.id)} className="btn-download-action" title="Descargar archivo original">
            <i className="ph-bold ph-download-simple"></i> Descargar
          </button>
        </div>
        
        <div className="action-buttons">
          {canDelete && (
            <button className="btn-icon btn-icon-danger" onClick={() => onDelete(doc.id)} title="Eliminar">
              <i className="ph-bold ph-trash"></i>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}