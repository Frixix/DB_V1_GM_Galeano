import './ModulesDashboard.css';

/**
 * Segunda Capa: Panel Principal / Dashboard Estructural
 * Extraído de 'Ideas y modulos' (Vista 2) e integrado como capa intermedia
 * entre el Login y la aplicación creada.
 */
export default function ModulesDashboard({ currentUser, onSelectModule, onLogout }) {
  const userName = currentUser?.name || 'Usuario';
  const userRole = currentUser?.label || currentUser?.role || 'Personal Institucional';
  const userInitial = currentUser?.initial || (userName ? userName.charAt(0).toUpperCase() : 'U');

  return (
    <div className="portal-container" id="view-dashboard">
      {/* Navbar Superior */}
      <header className="portal-navbar">
        <div className="portal-navbar-left">
          <div className="portal-brand-symbol" title="Portal Institucional">
            <svg className="portal-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <span className="portal-system-title">Sistema de Gestión Académica</span>
        </div>

        <div className="portal-navbar-right">
          <div className="portal-user-profile">
            <div className="portal-avatar-placeholder" title={userName}>
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={userName} 
                  className="portal-avatar-img" 
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none'; 
                    const sibling = e.currentTarget.nextSibling;
                    if (sibling) sibling.style.display = 'inline';
                  }} 
                />
              ) : null}
              <span style={{ display: currentUser?.avatar ? 'none' : 'inline' }}>{userInitial}</span>
            </div>
            <div className="portal-user-meta">
              <span className="portal-user-name">{userName}</span>
              <span className="portal-user-role">{userRole}</span>
            </div>
          </div>
          <button 
            type="button" 
            id="btn-logout" 
            className="portal-btn portal-btn-outline portal-btn-sm"
            onClick={onLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Layout: Sidebar + Área Principal */}
      <div className="portal-dashboard-body">
        {/* Sidebar Izquierda */}
        <aside className="portal-sidebar">
          <div className="portal-sidebar-section">
            <p className="portal-sidebar-label">MÓDULO PRINCIPAL</p>
            <nav className="portal-sidebar-nav">
              {/* Módulo Activo */}
              <button 
                type="button"
                className="portal-nav-item portal-nav-item-active"
                onClick={() => onSelectModule && onSelectModule('grades')}
                title="Acceder a Notas y Calificaciones"
              >
                <svg className="portal-nav-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span className="portal-nav-text">Notas y Calificaciones</span>
              </button>
            </nav>
          </div>

          <div className="portal-sidebar-section">
            <p className="portal-sidebar-label">FUTUROS MÓDULOS</p>
            <nav className="portal-sidebar-nav">
              <div className="portal-nav-item portal-nav-item-disabled">
                <div className="portal-nav-item-disabled-left">
                  <svg className="portal-nav-icon-svg portal-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="portal-nav-text">En desarrollo</span>
                </div>
                <span className="portal-pill-gray">Próximamente</span>
              </div>
              <div className="portal-nav-item portal-nav-item-disabled">
                <div className="portal-nav-item-disabled-left">
                  <svg className="portal-nav-icon-svg portal-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="portal-nav-text">En desarrollo</span>
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
            <p>Explora la vista estructural del módulo de Notas y Calificaciones o planifica la expansión de futuros módulos.</p>
          </section>

          {/* Cuadrícula de Tarjetas de Módulos */}
          <section className="portal-modules-grid">
            {/* MÓDULO 1: ACTIVO (Notas y Calificaciones) */}
            <article 
              className="portal-module-card portal-module-card-active"
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
                  <svg className="portal-card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <span className="portal-badge-active">Activo</span>
              </div>

              <div className="portal-card-body">
                <h3>Notas y Calificaciones</h3>
                <p>Módulo central para captura de notas, ponderaciones por período, generación de boletines y seguimiento académico.</p>
              </div>

              <div className="portal-card-footer">
                <span className="portal-link-label">Acceder al módulo &rarr;</span>
              </div>
            </article>

            {/* MÓDULOS EN DESARROLLO (EN COLOR GRIS) */}
            <article className="portal-module-card portal-module-card-disabled">
              <div className="portal-card-header-bar">
                <div className="portal-card-icon-container portal-gray-icon">
                  <svg className="portal-card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="9" y1="21" x2="9" y2="9"/>
                  </svg>
                </div>
                <span className="portal-badge-gray">En desarrollo</span>
              </div>
              <div className="portal-card-body">
                <h3 className="portal-text-gray-title">Módulo en Desarrollo</h3>
                <p className="portal-text-gray-desc">Espacio reservado para una funcionalidad que se extraerá o integrará gradualmente según la necesidad de la app.</p>
              </div>
              <div className="portal-card-footer portal-footer-disabled">
                <span className="portal-label-muted">No disponible en esta fase</span>
              </div>
            </article>

            <article className="portal-module-card portal-module-card-disabled">
              <div className="portal-card-header-bar">
                <div className="portal-card-icon-container portal-gray-icon">
                  <svg className="portal-card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.2z"/>
                  </svg>
                </div>
                <span className="portal-badge-gray">En desarrollo</span>
              </div>
              <div className="portal-card-body">
                <h3 className="portal-text-gray-title">Módulo en Desarrollo</h3>
                <p className="portal-text-gray-desc">Espacio reservado para una funcionalidad que se extraerá o integrará gradualmente según la necesidad de la app.</p>
              </div>
              <div className="portal-card-footer portal-footer-disabled">
                <span className="portal-label-muted">No disponible en esta fase</span>
              </div>
            </article>

            <article className="portal-module-card portal-module-card-disabled">
              <div className="portal-card-header-bar">
                <div className="portal-card-icon-container portal-gray-icon">
                  <svg className="portal-card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </div>
                <span className="portal-badge-gray">En desarrollo</span>
              </div>
              <div className="portal-card-body">
                <h3 className="portal-text-gray-title">Módulo en Desarrollo</h3>
                <p className="portal-text-gray-desc">Espacio reservado para una funcionalidad que se extraerá o integrará gradualmente según la necesidad de la app.</p>
              </div>
              <div className="portal-card-footer portal-footer-disabled">
                <span className="portal-label-muted">No disponible en esta fase</span>
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
