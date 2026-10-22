import './PortalNavbar.css';

/**
 * PortalNavbar: Barra Superior Institucional Unificada
 * Idéntica en todas las vistas: Panel Principal, Recursos Pedagógicos & Circulares, Notas & Calificaciones, Bóveda Directiva.
 * Paridad 100%: Presencia en vivo, Notificaciones, Guía de Sistema, Chip de Usuario/Rol y Cerrar Sesión.
 */
export default function PortalNavbar({
  currentUser,
  moduleTitle = null,
  moduleSubtitle = null,
  onBackToModules = null,
  onToggleSidebar = null,
  onOpenConnectionsModal = null,
  onlineCount = 0,
  circularesCount = 0,
  onOpenCirculares = null,
  isNotificationsOpen = false,
  onOpenTour = null,
  onOpenProfile = null,
  onLogout = null,
  extraLeftActions = null
}) {
  const userName = currentUser?.name || 'Usuario';
  const userRole = currentUser?.label || currentUser?.role || 'Personal Institucional';
  const userInitial = currentUser?.initial || (userName ? userName.charAt(0).toUpperCase() : 'U');
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role);
  const isInduccionProfile = currentUser && (
    currentUser.role === 'induccion' || 
    currentUser.role === 'induccion_rectora' || 
    currentUser.key === 'induccion' || 
    currentUser.key === 'induccion_rectora'
  );

  return (
    <header className="portal-navbar">
      {/* Zona Izquierda: Navegación, Escudo y Marca Institucional */}
      <div className="portal-navbar-left">
        {onToggleSidebar && (
          <button 
            type="button" 
            className="btn-mobile-toggle" 
            onClick={onToggleSidebar} 
            aria-label="Abrir Menú Lateral"
          >
            <i className="ph-bold ph-list"></i>
          </button>
        )}

        {onBackToModules && (
          <button 
            type="button" 
            className="btn-portal-back-modules" 
            onClick={onBackToModules}
            title="Volver al Portal Principal de Módulos"
          >
            <i className="ph-bold ph-arrow-left"></i>
            <span>Volver a Módulos</span>
          </button>
        )}

        {extraLeftActions}

        <div className="portal-shield-badge" title="Portal Institucional Gimnasio Martin Galeano">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L3 6V12C3 17.5 6.8 22.3 12 23.5C17.2 22.3 21 17.5 21 12V6L12 2Z" fill="#15803d" />
            <path d="M12 3.8L4.5 7.2V12C4.5 16.5 7.6 20.6 12 21.8C16.4 20.6 19.5 16.5 19.5 12V7.2L12 3.8Z" fill="#16a34a" fillOpacity="0.85" />
            <text x="12" y="15.2" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letterSpacing="-0.5">MG</text>
          </svg>
        </div>

        <div className="portal-brand-text">
          <div className="portal-brand-row">
            <span className="portal-system-title">Gimnasio Martin Galeano</span>
            {moduleTitle && (
              <span className="portal-module-tag-pill">{moduleTitle}</span>
            )}
          </div>
          <span className="portal-system-subtitle">
            {moduleSubtitle || "Portal Institucional de Módulos"}
          </span>
        </div>
      </div>

      {/* Zona Derecha: Presencia, Notificaciones, Guía de Sistema, Chip y Logout */}
      <div className="portal-navbar-right">
        {/* 1. Control de Presencia / En Línea (Supervisión Exclusiva Rectora y Admin) */}
        {isPrivileged && onOpenConnectionsModal && (
          <button 
            type="button"
            id="tour-navbar-presence"
            className="btn-presence-nav" 
            onClick={onOpenConnectionsModal}
            title="Supervisión en vivo: Ver quién está conectado y horarios de ingreso"
            aria-label="Ver control de conexiones del personal"
          >
            <span className="live-status-pulse"></span>
            <span className="live-status-nav-label">
              <strong>{onlineCount || 1}</strong> en línea
            </span>
            <i className="ph-bold ph-shield-check"></i>
          </button>
        )}

        {/* 2. Campanita de Notificaciones Institucionales (Circulares & Comunicados) */}
        <div 
          id="tour-navbar-notifications"
          className={`nav-notification-bell ${isNotificationsOpen ? 'active' : ''}`}
          title={circularesCount > 0 ? `${circularesCount} comunicado(s) pendiente(s) por revisar` : "Centro de notificaciones institucionales"}
          onClick={onOpenCirculares}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
          aria-label="Abrir centro de notificaciones institucionales"
          aria-expanded={isNotificationsOpen}
        >
          <i className="ph-bold ph-bell"></i>
          {circularesCount > 0 && <span className="whatsapp-badge">{circularesCount}</span>}
        </div>

        {/* 3. Guía de Inducción Paso a Paso (Exclusivo para perfiles de Inducción) */}
        {onOpenTour && isInduccionProfile && (
          <button 
            type="button" 
            className="btn-nav-guide" 
            onClick={onOpenTour}
            title="Abrir Guía Interactiva Paso a Paso"
          >
            <i className="ph-bold ph-compass"></i>
            <span>Guía de Inducción</span>
          </button>
        )}

        {/* 4. Chip Interactivo de Usuario y Rol (Admin, Rectora, Docentes) */}
        <div 
          id="tour-navbar-user-chip"
          className="user-chip user-chip-clickable portal-user-chip" 
          onClick={() => onOpenProfile && onOpenProfile()}
          role="button"
          tabIndex={0}
          title={isPrivileged ? "Configuración de administrador y ajustes de personal" : `Configuración de perfil de ${userName}`}
          aria-label={isPrivileged ? "Configuración de administrador" : `Configuración de perfil de ${userName}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (onOpenProfile) onOpenProfile();
            }
          }}
        >
          <div className={`user-avatar ${isPrivileged ? 'avatar-rectora-chip' : ''}`}>
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={userName} 
                className="user-avatar-img" 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none'; 
                  const sibling = e.currentTarget.nextSibling;
                  if (sibling) sibling.style.display = 'flex';
                }} 
              />
            ) : null}
            <span className="user-avatar-initial" style={{ display: currentUser?.avatar ? 'none' : 'flex' }}>
              {userInitial}
            </span>
            {isPrivileged && <span className="avatar-chip-crown">👑</span>}
          </div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role">{userRole}</span>
          </div>
          <div className="user-chip-icon-hint" title="Configurar cuenta y avatar">
            <i className="ph-bold ph-gear"></i>
          </div>
        </div>

        {/* 5. Cerrar Sesión */}
        <button 
          type="button" 
          className="portal-btn-logout"
          onClick={onLogout}
          title="Cerrar sesión"
        >
          <i className="ph-bold ph-sign-out"></i>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
