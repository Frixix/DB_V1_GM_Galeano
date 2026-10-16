export default function Sidebar({ 
  currentUser, 
  currentFolder, 
  onFolderSelect, 
  currentTeacher, 
  onTeacherSelect, 
  documents = [], 
  circularesCount = 0, 
  unreadSharedCount = 0,
  onOpenProfile,
  onlineMap = {},
  onlineCount = 0,
  onOpenConnectionsModal
}) {
  const isPrivileged = ["admin", "rectora", "induccion_rectora"].includes(currentUser.role);
  const SYSTEM_CAPACITY = 3 * 1024 * 1024 * 1024; // 3 GB
  const totalUsedBytes = documents.reduce((sum, doc) => sum + (doc.rawBytes || 0), 0);
  const usedMB = (totalUsedBytes / (1024 * 1024)).toFixed(1);
  const percentUsed = Math.min(100, Math.max(1, ((totalUsedBytes / SYSTEM_CAPACITY) * 100))).toFixed(1);
  const isStorageFull = totalUsedBytes >= SYSTEM_CAPACITY;
  const isStorageNearFull = !isStorageFull && (totalUsedBytes / SYSTEM_CAPACITY) >= 0.85;

  return (
    <aside className="sidebar" id="mainSidebar">
      {/* Sección de Auditoría por Docente (Solo Rectora/Admin) */}
      {isPrivileged && (
        <div className="sidebar-section" id="adminTeacherSection">
          <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph-bold ph-users"></i>
              <span>Ver por Docente</span>
            </div>
            {onOpenConnectionsModal && (
              <button 
                type="button" 
                className="btn-header-presence-pill"
                onClick={onOpenConnectionsModal}
                title="Abrir panel de horarios y conexiones"
              >
                <span className="live-status-pulse"></span>
                <span>{onlineCount} en línea</span>
              </button>
            )}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <i className="ph-bold ph-user"></i>
                <span>Jessica</span>
              </div>
              <span 
                className={`teacher-status-indicator ${onlineMap['jessica'] || onlineMap['Jessica'] ? 'online' : 'offline'}`}
                title={onlineMap['jessica'] || onlineMap['Jessica'] ? "En línea ahora" : "Desconectado"}
              ></span>
            </button>
            <button 
              className={`teacher-btn ${currentTeacher === 'Yuri' ? 'active' : ''}`}
              onClick={() => onTeacherSelect('Yuri')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <i className="ph-bold ph-user"></i>
                <span>Yuri</span>
              </div>
              <span 
                className={`teacher-status-indicator ${onlineMap['yuri'] || onlineMap['Yuri'] ? 'online' : 'offline'}`}
                title={onlineMap['yuri'] || onlineMap['Yuri'] ? "En línea ahora" : "Desconectado"}
              ></span>
            </button>
            <button 
              className={`teacher-btn ${currentTeacher === 'Elcy' ? 'active' : ''}`}
              onClick={() => onTeacherSelect('Elcy')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <i className="ph-bold ph-user"></i>
                <span>Elcy</span>
              </div>
              <span 
                className={`teacher-status-indicator ${onlineMap['elcy'] || onlineMap['Elcy'] ? 'online' : 'offline'}`}
                title={onlineMap['elcy'] || onlineMap['Elcy'] ? "En línea ahora" : "Desconectado"}
              ></span>
            </button>
            <button 
              className={`teacher-btn teacher-rectora-btn ${currentTeacher === 'Claudia (Rectora)' ? 'active' : ''}`}
              onClick={() => onTeacherSelect('Claudia (Rectora)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <div className="teacher-avatar-mini">
                  <img 
                    src="/images/avatars/rectora.svg" 
                    alt="Claudia" 
                    className="teacher-avatar-img"
                    onError={(e) => { e.currentTarget.style.display = 'none'; const f = e.currentTarget.nextSibling; if (f) f.style.display = 'inline-block'; }}
                  />
                  <i className="ph-bold ph-crown" style={{ color: '#d97706', display: 'none' }}></i>
                </div>
                <span>Claudia (Rectora)</span>
              </div>
              <span 
                className={`teacher-status-indicator ${onlineMap['claudia'] || onlineMap['Claudia (Rectora)'] ? 'online' : 'offline'}`}
                title={onlineMap['claudia'] || onlineMap['Claudia (Rectora)'] ? "En línea ahora" : "Desconectado"}
              ></span>
              {onOpenProfile && (
                <span 
                  className="sidebar-profile-badge"
                  title="Abrir perfil institucional y ajustes de la Rectora"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProfile();
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <i className="ph-bold ph-sliders"></i>
                </span>
              )}
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
            {unreadSharedCount > 0 && <span className="whatsapp-badge">{unreadSharedCount}</span>}
          </button>

          <button 
            className={`folder-btn folder-institucional ${currentFolder === 'institucional' ? 'active' : ''}`}
            onClick={() => onFolderSelect('institucional')}
          >
            <i className="ph-duotone ph-buildings"></i>
            <span>Institucional & Circulares</span>
            {circularesCount > 0 && <span className="whatsapp-badge">{circularesCount}</span>}
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
              id="btnBovedaFolder"
              className={`folder-btn folder-boveda ${currentFolder === 'boveda' ? 'active' : ''}`}
              onClick={() => onFolderSelect('boveda')}
            >
              <i className="ph-bold ph-vault"></i>
              <span>Bóveda de Archivos</span>
              <i className="ph-bold ph-lock-key boveda-lock-icon"></i>
            </button>
          )}
        </nav>
      </div>

      {/* Almacenamiento en la parte inferior */}
      <div 
        className={`db-summary-card ${isStorageFull ? 'storage-card-full' : (isStorageNearFull ? 'storage-card-warning' : '')}`} 
        id="sidebarStorageCard"
      >
        <div className="summary-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-hard-drive"></i>
            <span>Almacenamiento</span>
          </div>
          <span className={`storage-plan-pill ${isStorageFull ? 'full' : (isStorageNearFull ? 'warning' : '')}`}>
            {isStorageFull ? '3 GB Lleno' : 'Fase de Prueba'}
          </span>
        </div>

        <div className="storage-bar-wrapper">
          <div 
            className={`storage-bar-progress ${isStorageFull ? 'progress-full' : (isStorageNearFull ? 'progress-warning' : '')}`} 
            style={{ width: `${percentUsed}%` }}
          ></div>
        </div>

        <div className="storage-labels">
          <span>{usedMB} MB usados ({percentUsed}%)</span>
          <span>3 GB disponibles</span>
        </div>

        {isStorageFull ? (
          <div className="summary-alert-full">
            <div className="summary-alert-header">
              <i className="ph-bold ph-warning-octagon"></i>
              <strong>Capacidad Agotada (3 GB)</strong>
            </div>
            <p>
              Has alcanzado el límite de 3 GB de la <strong>fase de prueba</strong>. Para continuar almacenando documentos, contacte al administrador.
            </p>
          </div>
        ) : (
          <p className="summary-reminder">
            {isStorageNearFull ? (
              <>⚠️ <strong>Cerca del límite:</strong> 85%+ de capacidad utilizada de los 3 GB de prueba.</>
            ) : (
              <>Fase de prueba: <strong>3 GB asignados</strong> para evaluación institucional.</>
            )}
          </p>
        )}
      </div>
    </aside>
  );
}