export default function DocumentTable({ documents, onView, onDownload, onDelete, canDelete }) {
  
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
          {documents.map(doc => (
            <tr key={doc.id}>
              <td><code>{doc.id}</code></td>
              <td>
                <strong>{doc.title}</strong>
                {doc.isPublic && ' <span class="tag-pastel-public"><i class="ph-bold ph-globe"></i> Público</span>'}
              </td>
              <td><i className="ph ph-user"></i> {doc.teacher}</td>
              <td><span className="tag-pastel-grade">{doc.folder === 'boveda' ? (doc.bovedaYear || '2026') : doc.grade}</span></td>
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
          ))}
        </tbody>
      </table>
    </section>
  );
}