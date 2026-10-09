export default function Sidebar({ currentUser, currentFolder, onFolderSelect, currentTeacher, onTeacherSelect, onBovedaClick }) {
  const isPrivileged = ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);

  return (
    <aside className="sidebar" id="mainSidebar">
      {/* Sección de Auditoría por Docente (Solo Rectora/Admin) */}
      {isPrivileged && (
        <div className="sidebar-section" id="adminTeacherSection">
          <div className="sidebar-header">
            <i className="ph-bold ph-users"></i>
            <span>Ver por Docente</span>
          </div>
          <nav className="teacher-list">
            <button 
              className={`teacher-btn ${currentTeacher === 'all' ? 'active' : ''}`}
              onClick={() => onTeacherSelect('all')}
            >
              <i className="ph-fill ph-users-three"></i>
              <span>Todos los docentes</span>
            </button>
            <button 
              className={`teacher-btn ${currentTeacher === 'Jessica' ? 'active' : ''}`}
              onClick={() => onTeacherSelect('Jessica')}
            >
              <i className="ph-bold ph-user"></i>
              <span>Jessica</span>
            </button>
            <button 
              className={`teacher-btn ${currentTeacher === 'Yuri' ? 'active' : ''}`}
              onClick={() => onTeacherSelect('Yuri')}
            >
              <i className="ph-bold ph-user"></i>
              <span>Yuri</span>
            </button>
            <button 
              className={`teacher-btn ${currentTeacher === 'Elcy' ? 'active' : ''}`}
              onClick={() => onTeacherSelect('Elcy')}
            >
              <i className="ph-bold ph-user"></i>
              <span>Elcy</span>
            </button>
            <button 
              className={`teacher-btn ${currentTeacher === 'Claudia (Rectora)' ? 'active' : ''}`}
              onClick={() => onTeacherSelect('Claudia (Rectora)')}
            >
              <i className="ph-bold ph-crown"></i>
              <span>Claudia (Rectora)</span>
            </button>
          </nav>
        </div>
      )}

      {/* Categorías de Carpetas */}
      <div className="sidebar-section" id="sidebarFoldersSection">
        <div className="sidebar-header">
          <i className="ph-bold ph-folder"></i>
          <span>Ubicación / Rutas</span>
        </div>
        <nav className="folder-list">
          <button 
            className={`folder-btn folder-all ${currentFolder === 'all' ? 'active' : ''}`}
            onClick={() => onFolderSelect('all')}
          >
            <i className="ph-fill ph-folders"></i>
            <span>{isPrivileged ? "Todos los Documentos" : `Mis Documentos (${currentUser.name})`}</span>
          </button>
          
          <button 
            className={`folder-btn folder-publico ${currentFolder === 'publico' ? 'active' : ''}`}
            onClick={() => onFolderSelect('publico')}
          >
            <i className="ph-bold ph-globe"></i>
            <span>Compartidos con Todos</span>
          </button>

          <button 
            className={`folder-btn folder-institucional ${currentFolder === 'institucional' ? 'active' : ''}`}
            onClick={() => onFolderSelect('institucional')}
          >
            <i className="ph-duotone ph-buildings"></i>
            <span>Institucional & Circulares</span>
          </button>
          
          <button 
            className={`folder-btn folder-planeaciones ${currentFolder === 'planeaciones' ? 'active' : ''}`}
            onClick={() => onFolderSelect('planeaciones')}
          >
            <i className="ph-duotone ph-notebook"></i>
            <span>Planeaciones</span>
          </button>

          <button 
            className={`folder-btn folder-calificaciones ${currentFolder === 'calificaciones' ? 'active' : ''}`}
            onClick={() => onFolderSelect('calificaciones')}
          >
            <i className="ph-duotone ph-table"></i>
            <span>Planillas de Notas</span>
          </button>

          <button 
            className={`folder-btn folder-talleres ${currentFolder === 'talleres' ? 'active' : ''}`}
            onClick={() => onFolderSelect('talleres')}
          >
            <i className="ph-duotone ph-pencil-line"></i>
            <span>Guías & Talleres</span>
          </button>

          <button 
            className={`folder-btn folder-observador ${currentFolder === 'observador' ? 'active' : ''}`}
            onClick={() => onFolderSelect('observador')}
          >
            <i className="ph-duotone ph-user-list"></i>
            <span>Observador & Actas</span>
          </button>

          {/* Bóveda protegida (Solo Rectora/Admin) */}
          {isPrivileged && (
            <button 
              className={`folder-btn folder-boveda ${currentFolder === 'boveda' ? 'active' : ''}`}
              onClick={onBovedaClick}
            >
              <i className="ph-bold ph-vault"></i>
              <span>Bóveda de Archivos</span>
              <i className="ph-bold ph-lock-key boveda-lock-icon"></i>
            </button>
          )}
        </nav>
      </div>

      {/* Almacenamiento */}
      <div className="db-summary-card" id="sidebarStorageCard">
        <div className="summary-title">
          <i className="ph-bold ph-hard-drive"></i>
          <span>Almacenamiento del Sistema</span>
        </div>
        <div className="storage-bar-wrapper">
          <div className="storage-bar-progress" style={{ width: '2%' }}></div>
        </div>
        <div className="storage-labels">
          <span>0 MB usados</span>
          <span>{currentUser.maxUploadLabel} disponibles</span>
        </div>
        <p className="summary-reminder">
          Límite por subida: <strong>{currentUser.maxUploadLabel}</strong> por archivo.
        </p>
      </div>
    </aside>
  );
}