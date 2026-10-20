import { memo } from 'react';

function DocumentCard({ doc, onView, onDownload, onDelete, canDelete, isUnread = false }) {
  
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
    <article className={`doc-card ${isUnread ? 'card-unread' : ''}`}>
      <div className="doc-card-header">
        <div className="badges-group">
          <span className={getFolderClass(doc.folder)}>{formatFolderLabel(doc.folder)}</span>
          <span className="tag-pastel-grade">{doc.grade}</span>
          {doc.isPublic && <span className="tag-pastel-public"><i className="ph-bold ph-globe"></i> Público</span>}
          {isUnread && (
            <span className="tag-unread-dot" title="Circular pendiente de lectura">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
              Sin leer
            </span>
          )}
        </div>
        <div className="doc-meta-subtle">
          <span className="doc-meta-date" title={`Fecha de registro: ${doc.uploadedAt}`}>
            <i className="ph-bold ph-calendar-blank"></i> {doc.uploadedAt}
          </span>
          <span className="doc-radicado-chip" title={`Radicado institucional único: ${doc.id}`}>
            <code>{doc.id}</code>
          </span>
        </div>
      </div>

      <h4 className="doc-card-title" onClick={() => onView(doc.id)} style={{ cursor: 'pointer' }} title="Clic para ver">{doc.title}</h4>

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
            <i className={`ph-bold ${/\.(jpe?g|png|gif|webp|svg|bmp|jfif|pjpeg|pjp|avif|ico|tiff?)$/i.test(doc.fileName || '') ? 'ph-file-image' : 'ph-file-pdf'}`}></i>
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

export default memo(DocumentCard);
