import { useState } from 'react';
import { USERS, SYSTEM_STORAGE_CAPACITY_BYTES } from '../data/users.js';
import { getUserAvatar } from '../services/avatarService.js';

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
  onOpenConnectionsModal,
  onBackToModules
}) {
  const isPrivileged = ["admin", "rectora", "induccion_rectora", "coordinador"].includes(currentUser.role);
  const SYSTEM_CAPACITY = SYSTEM_STORAGE_CAPACITY_BYTES; // 2 GB
  const totalUsedBytes = documents.reduce((sum, doc) => sum + (doc.rawBytes || 0), 0);
  const usedMB = (totalUsedBytes / (1024 * 1024)).toFixed(1);
  const percentUsed = Math.min(100, Math.max(1, ((totalUsedBytes / SYSTEM_CAPACITY) * 100))).toFixed(1);
  const isStorageFull = totalUsedBytes >= SYSTEM_CAPACITY;
  const isStorageNearFull = !isStorageFull && (totalUsedBytes / SYSTEM_CAPACITY) >= 0.85;

  const teachersList = [
    { key: 'profe1', name: 'Profe 1', label: 'Dir. Transición', icon: 'ph-user' },
    { key: 'jessica', name: 'Jessica', label: 'Español • Dir. 1° Primaria', icon: 'ph-user' },
    { key: 'yuri', name: 'Yuri', label: 'Ciencias Sociales • Dir. 2° Primaria', icon: 'ph-user' },
    { key: 'profe2', name: 'Profe 2', label: 'Matemáticas • Dir. 3° Primaria', icon: 'ph-user' },
    { key: 'elcy', name: 'Elcy', label: 'Inglés • Dir. 4° Primaria', icon: 'ph-user' },
    { key: 'profe3', name: 'Profe 3', label: 'Ciencias Naturales • Dir. 5° Primaria', icon: 'ph-user' },
    { key: 'claudia', name: 'Claudia (Rectora)', label: 'Rectoría', isRectora: true }
  ];

  const currentUserKey = currentUser?.key || currentUser?.role || (currentUser?.name ? currentUser.name.toLowerCase().replace(/\s+/g, '') : null);
  const currentUserAvatar = (currentUserKey ? getUserAvatar(currentUserKey) : null) || currentUser?.avatar || null;

  // Estado del acordeón para desplegar / ocultar docentes (flechita subir/bajar)
  const [isTeacherExpanded, setIsTeacherExpanded] = useState(false);
  const selectedTeacher = currentTeacher !== 'all'
    ? teachersList.find((t) => t.name === currentTeacher || t.key === currentTeacher)
    : null;

  return (
    <aside className="sidebar" id="mainSidebar">
      {/* Botón para retornar al área de módulos */}
      {onBackToModules && (
        <div className="sidebar-section sidebar-section-modules-back">
          <button 
            type="button" 
            className="btn-sidebar-back-modules" 
            onClick={onBackToModules}
            title="Volver al Panel Principal de Módulos"
          >
            <i className="ph-bold ph-squares-four"></i>
            <span>Volver a Módulos</span>
          </button>
        </div>
      )}

      {/* Sección de Auditoría por Docente (Solo Rectora/Admin) o Rol Propio Docente */}
      {isPrivileged ? (
        <div className="sidebar-section" id="adminTeacherSection">
          <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn-header-teacher-accordion"
              onClick={() => setIsTeacherExpanded((prev) => !prev)}
              title={isTeacherExpanded ? "Ocultar docentes (subir)" : "Desplegar docentes (bajar)"}
            >
              <i className="ph-bold ph-users"></i>
              <span>Ver por Docente</span>
              <i className={`ph-bold ${isTeacherExpanded ? 'ph-caret-up' : 'ph-caret-down'} teacher-accordion-caret`}></i>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {currentTeacher !== 'all' && (
                <button
                  type="button"
                  className="btn-teacher-reset-chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTeacherSelect('all');
                    setIsTeacherExpanded(false);
                  }}
                  title="Restablecer a todos los docentes"
                >
                  <i className="ph-bold ph-x"></i>
                  <span>Todos</span>
                </button>
              )}
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
          </div>

          {/* Si está contraído: mostramos solo el estado compacto o la docente seleccionada */}
          {!isTeacherExpanded ? (
            <nav className="teacher-list">
              {selectedTeacher ? (
                /* Cuando hay una docente seleccionada: SOLO se muestra ella */
                <button
                  type="button"
                  className={`teacher-btn active ${selectedTeacher.isRectora ? 'teacher-rectora-btn' : ''}`}
                  onClick={() => setIsTeacherExpanded(true)}
                  title="Clic para cambiar de docente o ver todas"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                    <div className="teacher-avatar-mini">
                      {getUserAvatar(selectedTeacher.key) ? (
                        <img
                          src={getUserAvatar(selectedTeacher.key)}
                          alt={selectedTeacher.name}
                          className="teacher-avatar-img"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const f = e.currentTarget.nextSibling;
                            if (f) f.style.display = 'inline-block';
                          }}
                        />
                      ) : null}
                      <i
                        className={`ph-bold ${selectedTeacher.isRectora ? 'ph-crown' : 'ph-user'}`}
                        style={{
                          display: getUserAvatar(selectedTeacher.key) ? 'none' : 'inline-block',
                          color: selectedTeacher.isRectora ? '#d97706' : 'inherit'
                        }}
                      ></i>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedTeacher.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{selectedTeacher.label}</span>
                    </div>
                  </div>

                  <span
                    className={`teacher-status-indicator ${onlineMap[selectedTeacher.key] || onlineMap[selectedTeacher.name] ? 'online' : 'offline'}`}
                    title={onlineMap[selectedTeacher.key] || onlineMap[selectedTeacher.name] ? 'En línea ahora' : 'Desconectado'}
                  ></span>

                  {onOpenProfile && (
                    <span
                      className="sidebar-profile-badge"
                      title={`Personalizar perfil de ${selectedTeacher.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile(selectedTeacher.key);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <i className="ph-bold ph-sliders"></i>
                    </span>
                  )}

                  <span className="teacher-fold-caret-btn" title="Desplegar docentes (bajar)">
                    <i className="ph-bold ph-caret-down"></i>
                  </span>
                </button>
              ) : (
                /* Vista general: Todos los docentes con botón desplegable */
                <button 
                  type="button"
                  className="teacher-btn active"
                  onClick={() => setIsTeacherExpanded(true)}
                  title="Clic para desplegar y filtrar por docente (bajar)"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <i className="ph-bold ph-users-three"></i>
                    <span>Todos los docentes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="teacher-badge-count">{teachersList.length}</span>
                    <span className="teacher-fold-caret-btn">
                      <i className="ph-bold ph-caret-down"></i>
                    </span>
                  </div>
                </button>
              )}
            </nav>
          ) : (
            /* Lista desplegada completa (bajar) */
            <nav className="teacher-list teacher-list-dropdown">
              <button 
                type="button"
                className={`teacher-btn ${currentTeacher === 'all' ? 'active' : ''}`}
                onClick={() => {
                  onTeacherSelect('all');
                  setIsTeacherExpanded(false);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <i className="ph-bold ph-users-three"></i>
                  <span>Todos los docentes</span>
                </div>
                {currentTeacher === 'all' && (
                  <i className="ph-bold ph-check" style={{ color: '#059669', fontSize: '0.9rem' }}></i>
                )}
              </button>

              {teachersList.map((t) => {
                const avatarUrl = getUserAvatar(t.key);
                const isOnline = onlineMap[t.key] || onlineMap[t.name];
                const isSelected = currentTeacher === t.name;

                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`teacher-btn ${t.isRectora ? 'teacher-rectora-btn' : ''} ${
                      isSelected ? 'active' : ''
                    }`}
                    onClick={() => {
                      onTeacherSelect(t.name);
                      setIsTeacherExpanded(false);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                      <div className="teacher-avatar-mini">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={t.name}
                            className="teacher-avatar-img"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const f = e.currentTarget.nextSibling;
                              if (f) f.style.display = 'inline-block';
                            }}
                          />
                        ) : null}
                        <i
                          className={`ph-bold ${t.isRectora ? 'ph-crown' : 'ph-user'}`}
                          style={{
                            display: avatarUrl ? 'none' : 'inline-block',
                            color: t.isRectora ? '#d97706' : 'inherit'
                          }}
                        ></i>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {t.name}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{t.label}</span>
                      </div>
                    </div>

                    <span
                      className={`teacher-status-indicator ${isOnline ? 'online' : 'offline'}`}
                      title={isOnline ? 'En línea ahora' : 'Desconectado'}
                    ></span>

                    {onOpenProfile && (
                      <span
                        className="sidebar-profile-badge"
                        title={`Personalizar perfil de ${t.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenProfile(t.key);
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <i className="ph-bold ph-sliders"></i>
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      ) : (
        /* Para la docente conectada: vista de su propia dirección de curso y acceso a su perfil */
        <div className="sidebar-section teacher-own-card obs-teacher-own-card">
          <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph-bold ph-identification-card"></i>
              <span>Mi Rol & Dirección de Aula</span>
            </div>
            {onOpenProfile && (
              <span
                className="sidebar-profile-badge"
                title="Personalizar mi perfil y foto"
                onClick={() => onOpenProfile(currentUserKey)}
                role="button"
                tabIndex={0}
              >
                <i className="ph-bold ph-sliders"></i>
              </span>
            )}
          </div>
          <div className="teacher-badge-box obs-teacher-badge-box">
            <div className="teacher-badge-icon obs-teacher-badge-icon">
              {currentUserAvatar ? (
                <img
                  src={currentUserAvatar}
                  alt={currentUser.name}
                  className="teacher-avatar-img"
                  style={{ width: '100%', height: '100%', borderRadius: '6px', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const f = e.currentTarget.nextSibling;
                    if (f) f.style.display = 'inline-block';
                  }}
                />
              ) : null}
              <i
                className="ph-bold ph-chalkboard-teacher"
                style={{ display: currentUserAvatar ? 'none' : 'inline-block' }}
              ></i>
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.name}
              </strong>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#0f766e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.label || 'Docente de Básica Primaria'}
              </p>
            </div>
          </div>
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
            <i className="ph-bold ph-folders"></i>
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
            <i className="ph-bold ph-buildings"></i>
            <span>Institucional & Circulares</span>
            {circularesCount > 0 && <span className="whatsapp-badge">{circularesCount}</span>}
          </button>
          
          <button 
            className={`folder-btn folder-planeaciones ${currentFolder === 'planeaciones' ? 'active' : ''}`}
            onClick={() => onFolderSelect('planeaciones')}
          >
            <i className="ph-bold ph-notebook"></i>
            <span>Planeaciones</span>
          </button>

          <button 
            className={`folder-btn folder-talleres ${currentFolder === 'talleres' ? 'active' : ''}`}
            onClick={() => onFolderSelect('talleres')}
          >
            <i className="ph-bold ph-pencil-line"></i>
            <span>Guías & Talleres</span>
          </button>
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
            {isStorageFull ? '2 GB Lleno' : 'Versión Institucional'}
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
          <span>2 GB disponibles</span>
        </div>

        {isStorageFull ? (
          <div className="summary-alert-full">
            <div className="summary-alert-header">
              <i className="ph-bold ph-warning-octagon"></i>
              <strong>Capacidad Agotada (2 GB)</strong>
            </div>
            <p>
              Has alcanzado el límite de 2 GB de la <strong>cuota institucional</strong>. Para continuar almacenando documentos, contacte al administrador.
            </p>
          </div>
        ) : (
          <p className="summary-reminder">
            {isStorageNearFull ? (
              <>⚠️ <strong>Cerca del límite:</strong> 85%+ de capacidad utilizada de los 2 GB institucionales.</>
            ) : (
              <>Plan Institucional: <strong>2 GB asignados</strong> para gestión académica.</>
            )}
          </p>
        )}
      </div>
    </aside>
  );
}