import './ModulesDashboard.css';

/**
 * Segunda Capa: Panel Principal / Dashboard Estructural
 * Módulos integrados con Phosphor Icons y paletas pastel armonizadas.
 */
export default function ModulesDashboard({ 
  currentUser, 
  onSelectModule, 
  onLogout,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount
}) {
  const userName = currentUser?.name || 'Usuario';
  const userRole = currentUser?.label || currentUser?.role || 'Personal Institucional';
  const userInitial = currentUser?.initial || (userName ? userName.charAt(0).toUpperCase() : 'U');
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role);

  return (
    <div className="portal-container" id="view-dashboard">
      {/* Navbar Superior */}
      <header className="portal-navbar">
        <div className="portal-navbar-left">
          <div className="portal-shield-badge" title="Portal Institucional Gimnasio Martin Galeano">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 6V12C3 17.5 6.8 22.3 12 23.5C17.2 22.3 21 17.5 21 12V6L12 2Z" fill="#15803d" />
              <path d="M12 3.8L4.5 7.2V12C4.5 16.5 7.6 20.6 12 21.8C16.4 20.6 19.5 16.5 19.5 12V7.2L12 3.8Z" fill="#16a34a" fillOpacity="0.85" />
              <text x="12" y="15.2" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" fontFamily="'Plus Jakarta Sans', sans-serif" letterSpacing="-0.5">MG</text>
            </svg>
          </div>
          <div>
            <span className="portal-system-title">Gimnasio Martin Galeano</span>
            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', fontWeight: 500, lineHeight: 1 }}>
              Portal Institucional de Módulos
            </span>
          </div>
        </div>

        <div className="portal-navbar-right">
          {/* Botón de Supervisión de Conexiones en Vivo (Exclusivo Rectora y Admin) */}
          {isPrivileged && onOpenConnectionsModal && (
            <button 
              type="button"
              className="btn-presence-nav" 
              onClick={onOpenConnectionsModal}
              title="Supervisión en vivo: Ver quién está conectado y a qué horas se conectaron"
              aria-label="Ver control de conexiones del personal"
            >
              <span className="live-status-pulse"></span>
              <span className="live-status-nav-label">
                <strong>{onlineCount || 1}</strong> en línea
              </span>
              <i className="ph-bold ph-shield-check"></i>
            </button>
          )}

          {/* Chip de Usuario Interactivo y Configuración (Admin y Docentes) */}
          <div 
            className="user-chip user-chip-clickable portal-user-chip" 
            onClick={onOpenProfile}
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

          <button 
            type="button" 
            id="btn-logout" 
            className="portal-btn portal-btn-outline portal-btn-sm"
            onClick={onLogout}
            title="Cerrar sesión"
          >
            <i className="ph-bold ph-sign-out"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </header>

      {/* Layout: Sidebar + Área Principal */}
      <div className="portal-dashboard-body">
        {/* Sidebar Izquierda */}
        <aside className="portal-sidebar">
          <div className="portal-sidebar-section">
            <p className="portal-sidebar-label">MÓDULOS ACTIVOS</p>
            <nav className="portal-sidebar-nav">
              {/* Módulo 1 Activo: Gestión Documental */}
              <button 
                type="button"
                className="portal-nav-item portal-nav-item-active"
                onClick={() => onSelectModule && onSelectModule('docs')}
                title="Acceder a Gestión Documental y Archivo Central"
              >
                <i className="ph-bold ph-folder-notch-open" style={{ fontSize: '1.25rem' }}></i>
                <span className="portal-nav-text">Gestión Documental</span>
              </button>

              {/* Módulo 2 Activo: Notas y Calificaciones */}
              <button 
                type="button"
                className="portal-nav-item portal-nav-item-amber"
                onClick={() => onSelectModule && onSelectModule('grades')}
                title="Acceder a Notas y Calificaciones"
                style={{ marginTop: '0.25rem' }}
              >
                <i className="ph-bold ph-chart-line-up" style={{ fontSize: '1.25rem' }}></i>
                <span className="portal-nav-text">Notas y Calificaciones</span>
              </button>

              {/* Módulo Exclusivo Admin: Novedades & Reemplazos Docentes */}
              {currentUser?.role === 'admin' && (
                <button 
                  type="button"
                  className="portal-nav-item portal-nav-item-cyan"
                  onClick={() => onSelectModule && onSelectModule('reemplazos')}
                  title="Consola de Reasignación y Novedades Docentes"
                  style={{ marginTop: '0.25rem' }}
                >
                  <i className="ph-bold ph-arrows-clockwise" style={{ fontSize: '1.25rem' }}></i>
                  <span className="portal-nav-text">Novedades & Reemplazos</span>
                </button>
              )}
            </nav>
          </div>

          <div className="portal-sidebar-section">
            <p className="portal-sidebar-label">FUTUROS MÓDULOS</p>
            <nav className="portal-sidebar-nav">
              <div className="portal-nav-item portal-nav-item-disabled">
                <div className="portal-nav-item-disabled-left">
                  <i className="ph-bold ph-user-list portal-text-muted" style={{ fontSize: '1.2rem' }}></i>
                  <span className="portal-nav-text">Observador & Actas</span>
                </div>
                <span className="portal-pill-gray">Próximamente</span>
              </div>
              <div className="portal-nav-item portal-nav-item-disabled">
                <div className="portal-nav-item-disabled-left">
                  <i className="ph-bold ph-receipt portal-text-muted" style={{ fontSize: '1.2rem' }}></i>
                  <span className="portal-nav-text">Matrículas & Pagos</span>
                </div>
                <span className="portal-pill-gray">Próximamente</span>
              </div>
            </nav>
          </div>

          <div className="portal-sidebar-footer">
            <div className="portal-badge-status">
              <span className="portal-status-dot"></span> Modo Prototipo Activo
            </div>
          </div>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="portal-main-content">
          <section className="portal-welcome-banner">
            <h2>Panel de Control Principal</h2>
            <p>Selecciona un módulo activo o planifica la expansión de futuros servicios institucionales.</p>
          </section>

          {/* Cuadrícula de Tarjetas de Módulos */}
          <section className="portal-modules-grid">
            {/* MÓDULO 1: ACTIVO (Gestión Documental y Archivo Central - Verde Pastel / Bosque) */}
            <article 
              className="portal-module-card portal-module-card-active"
              onClick={() => onSelectModule && onSelectModule('docs')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onSelectModule) onSelectModule('docs');
                }
              }}
            >
              <div className="portal-card-header-bar">
                <div className="portal-card-icon-container">
                  <i className="ph-bold ph-folder-notch-open" style={{ fontSize: '1.75rem', color: '#064e3b' }}></i>
                </div>
                <span className="portal-badge-active">Activo</span>
              </div>

              <div className="portal-card-body">
                <h3>Gestión Documental y Archivo Central</h3>
                <p>Módulo central para radicación, resguardo, consulta y auditoría de circulares, planillas, planeaciones y archivos institucionales.</p>
              </div>

              <div className="portal-card-footer">
                <span className="portal-link-label">Acceder al módulo &rarr;</span>
              </div>
            </article>

            {/* MÓDULO 2: ACTIVO (Notas y Calificaciones - Ámbar Pastel) */}
            <article 
              className="portal-module-card portal-module-card-amber"
              onClick={() => onSelectModule && onSelectModule('grades')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (onSelectModule) onSelectModule('grades');
                }
              }}
            >
              <div className="portal-card-header-bar">
                <div className="portal-card-icon-container">
                  <i className="ph-bold ph-chart-line-up" style={{ fontSize: '1.75rem', color: '#b45309' }}></i>
                </div>
                <span className="portal-badge-amber">Activo</span>
              </div>

              <div className="portal-card-body">
                <h3 style={{ color: '#0f172a' }}>Notas y Calificaciones</h3>
                <p>Planilla interactiva de registro de calificaciones, ponderaciones por período (Cognitivo, Procedimental, Actitudinal) y cálculo de promedios.</p>
              </div>

              <div className="portal-card-footer">
                <span className="portal-link-label-amber">Acceder al módulo &rarr;</span>
              </div>
            </article>

            {/* MÓDULO EXCLUSIVO ADMIN: Novedades & Reemplazos Docentes */}
            {currentUser?.role === 'admin' && (
              <article 
                className="portal-module-card portal-module-card-cyan"
                onClick={() => onSelectModule && onSelectModule('reemplazos')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onSelectModule) onSelectModule('reemplazos');
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container portal-cyan-icon">
                    <i className="ph-bold ph-arrows-clockwise" style={{ fontSize: '1.75rem', color: '#0f766e' }}></i>
                  </div>
                  <span className="portal-badge-cyan">Admin Exclusivo</span>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: '#0f172a' }}>Novedades & Reemplazos Docentes</h3>
                  <p>Consola integral de contingencia para reasignación inmediata de direcciones de curso, cobertura por incapacidad médica y registro de actas.</p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label-cyan">Gestionar Reemplazos &rarr;</span>
                </div>
              </article>
            )}

            {/* MÓDULO 3: EN DESARROLLO (Observador & Actas) */}
            <article className="portal-module-card portal-module-card-disabled">
              <div className="portal-card-header-bar">
                <div className="portal-card-icon-container portal-gray-icon">
                  <i className="ph-bold ph-user-list" style={{ fontSize: '1.75rem' }}></i>
                </div>
                <span className="portal-badge-gray">En desarrollo</span>
              </div>
              <div className="portal-card-body">
                <h3 className="portal-text-gray-title">Observador & Actas</h3>
                <p className="portal-text-gray-desc">Espacio reservado para el seguimiento pedagógico y disciplinario de estudiantes, citaciones a padres y compromisos.</p>
              </div>
              <div className="portal-card-footer portal-footer-disabled">
                <span className="portal-label-muted">Próximamente disponible</span>
              </div>
            </article>

            {/* MÓDULO 4: EN DESARROLLO (Matrículas & Pagos) */}
            <article className="portal-module-card portal-module-card-disabled">
              <div className="portal-card-header-bar">
                <div className="portal-card-icon-container portal-gray-icon">
                  <i className="ph-bold ph-receipt" style={{ fontSize: '1.75rem' }}></i>
                </div>
                <span className="portal-badge-gray">En desarrollo</span>
              </div>
              <div className="portal-card-body">
                <h3 className="portal-text-gray-title">Matrículas & Tesorería</h3>
                <p className="portal-text-gray-desc">Espacio reservado para control de pensiones, paz y salvos digitales y legalización de matrículas del colegio.</p>
              </div>
              <div className="portal-card-footer portal-footer-disabled">
                <span className="portal-label-muted">Próximamente disponible</span>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
