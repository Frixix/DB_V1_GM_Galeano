import { memo } from 'react';
import gradesService from '../services/gradesService';

function DocumentTable({ documents, onView, onDownload, onDelete, canDelete, readCircularIds = [], currentUserName = '' }) {
  
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

  return (
    <section className="table-wrapper">
      <table className="db-table">
        <thead>
          <tr>
            <th>ID Ref</th>
            <th>Documento</th>
            <th>Docente / Cargo</th>
            <th>Grado / Año</th>
            <th>Materia / Subcarpeta</th>
            <th>Categoría</th>
            <th>Fecha y Hora</th>
            <th>Tamaño</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => {
            const isUnread = (Boolean(doc.isPublic) || doc.folder === 'institucional') && doc.teacher !== currentUserName && !readCircularIds.includes(doc.id);
            return (
              <tr key={doc.id} className={isUnread ? 'row-unread' : ''}>
                <td><code>{doc.id}</code></td>
                <td>
                  <strong>{doc.title}</strong>
                  {isUnread && (
                    <span className="tag-unread-dot" style={{ marginLeft: '8px' }} title="Documento o circular pendiente de revisión">
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }}></span>
                      Sin leer
                    </span>
                  )}
                  {doc.isPublic && (
                    <span className="tag-pastel-public" style={{ marginLeft: '8px' }}>
                      <i className="ph-bold ph-globe"></i> Público
                    </span>
                  )}
                </td>
              <td><i className="ph ph-user"></i> {doc.teacher}</td>
              <td>
                <span className="tag-pastel-grade">{doc.folder === 'boveda' ? (doc.bovedaYear || '2026') : doc.grade}</span>
                {doc.grade && doc.grade !== 'General' && doc.grade !== 'Directivo' && (
                  <span 
                    className="tag-pastel-copies-mini"
                    title={`Sugerencia de Impresión automatizada N+1: ${gradesService.getPrintingCopiesSuggestion(doc.grade).formulaText}`}
                    style={{ display: 'block', marginTop: '3px', fontSize: '0.68rem', color: '#6d28d9', fontWeight: 600 }}
                  >
                    <i className="ph-bold ph-printer"></i> {gradesService.getPrintingCopiesSuggestion(doc.grade).suggestedCopies} copias
                  </span>
                )}
              </td>
              <td>{doc.folder === 'boveda' ? doc.bovedaSubfolder : doc.subject}</td>
              <td><span className={getFolderClass(doc.folder)}>{formatFolderLabel(doc.folder)}</span></td>
              <td><small><i className="ph-bold ph-clock"></i> {doc.uploadedAt || "Reciente"}</small></td>
              <td>
                <small><i className="ph-bold ph-file"></i> {doc.compressedSize || doc.fileSize}</small>
              </td>
              <td>
                <div className="action-buttons">
                  <button className="btn-icon" onClick={() => onView(doc.id)} title="Ver documento">
                    <i className="ph-bold ph-eye"></i>
                  </button>
                  <button className="btn-icon" onClick={() => onDownload(doc.id)} title="Descargar">
                    <i className="ph-bold ph-download-simple"></i>
                  </button>
                  {canDelete && (
                    <button className="btn-icon btn-icon-danger" onClick={() => onDelete(doc.id)} title="Eliminar">
                      <i className="ph-bold ph-trash"></i>
                    </button>
                  )}
                </div>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default memo(DocumentTable);
