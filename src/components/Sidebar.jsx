export default function Sidebar({ currentUser, currentFolder, onFolderSelect, currentTeacher, onTeacherSelect }) {
  const isPrivileged = ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);

  return (
    <aside className="sidebar">
      {/* Cabecera para móvil dentro del menú */}
      <div className="sidebar-top-mobile">
        <span>Menú de Navegación</span>
      </div>

      {/* Sección de Carpetas Principales */}
      <div className="sidebar-section">
        <div className="sidebar-header">
          <i className="ph-bold ph-folders"></i>
          <span>Gestión Documental</span>
        </div>
        <div className="folder-list">
          <button 
            className={`folder-btn folder-all ${currentFolder === 'all' ? 'active' : ''}`}
            onClick={() => onFolderSelect('all')}
          >
            <i className="ph-bold ph-stack"></i>
            <span>Todos los Archivos</span>
          </button>

          <button 
            className={`folder-btn folder-publico ${currentFolder === 'publico' ? 'active' : ''}`}
            onClick={() => onFolderSelect('publico')}
          >
            <i className="ph-bold ph-globe"></i>
            <span>Públicos / Compartidos</span>
            <span className="count-badge badge-pub">Docentes</span>
          </button>

          <button 
            className={`folder-btn folder-institucional ${currentFolder === 'institucional' ? 'active' : ''}`}
            onClick={() => onFolderSelect('institucional')}
          >
            <i className="ph-bold ph-bank"></i>
            <span>Institucional & Circulares</span>
          </button>

          <button 
            className={`folder-btn folder-planeaciones ${currentFolder === 'planeaciones' ? 'active' : ''}`}
            onClick={() => onFolderSelect('planeaciones')}
          >
            <i className="ph-bold ph-calendar-check"></i>
            <span>Planeaciones</span>
          </button>

          <button 
            className={`folder-btn folder-calificaciones ${currentFolder === 'calificaciones' ? 'active' : ''}`}
            onClick={() => onFolderSelect('calificaciones')}
          >
            <i className="ph-bold ph-table"></i>
            <span>Planillas de Notas</span>
          </button>

          <button 
            className={`folder-btn folder-talleres ${currentFolder === 'talleres' ? 'active' : ''}`}
            onClick={() => onFolderSelect('talleres')}
          >
            <i className="ph-bold ph-file-text"></i>
            <span>Guías & Talleres</span>
          </button>

          <button 
            className={`folder-btn folder-observador ${currentFolder === 'observador' ? 'active' : ''}`}
            onClick={() => onFolderSelect('observador')}
          >
            <i className="ph-bold ph-address-book"></i>
            <span>Observador & Actas</span>
          </button>

          {/* Bóveda protegida (Solo Rectora/Admin) */}
          {isPrivileged && (
            <button 
              className={`folder-btn folder-boveda ${currentFolder === 'boveda' ? 'active' : ''}`}
              onClick={() => onFolderSelect('boveda')}
            >
              <i className="ph-bold ph-vault"></i>
              <span>Bóveda de Archivos</span>
              <i className="ph-bold ph-lock-key boveda-lock-icon"></i>
            </button>
          )}
        </div>
      </div>

      {/* Tarjeta resumen de almacenamiento local / sistema */}
      <div className="db-summary-card">
        <div className="summary-title">
          <i className="ph-bold ph-hard-drives"></i>
          <span>Almacenamiento Local</span>
        </div>
        <div className="storage-bar-wrapper">
          <div className="storage-bar-progress" style={{ width: '12%' }}></div>
        </div>
        <div className="storage-labels">
          <span>12.4 MB usados</span>
          <span>Base Supabase</span>
        </div>
        <p className="summary-reminder">
          Sincronización activa con indexedDB y compresión ZIP integrada.
        </p>
      </div>
    </aside>
  );
}