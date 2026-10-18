import { useState } from 'react';
import PortalNavbar from './PortalNavbar';
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
  onlineCount,
  circularesCount = 0,
  onOpenCirculares,
  onOpenTour
}) {
  const [selectedNavModule, setSelectedNavModule] = useState(null);
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role);

  return (
    <div className="portal-container" id="view-dashboard">
      {/* Navbar Superior Unificado */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle={null}
        moduleSubtitle="Portal Institucional de Módulos"
        onBackToModules={null}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

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
                className={`portal-nav-item portal-nav-item-docs ${selectedNavModule === 'docs' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedNavModule('docs');
                  if (onSelectModule) onSelectModule('docs');
                }}
                title="Acceder a Gestión Documental y Archivo Central"
              >
                <i className="ph-bold ph-folder-notch-open"></i>
                <span className="portal-nav-text">Gestión Documental</span>
              </button>

              {/* Módulo 2 Activo: Notas y Calificaciones */}
              <button 
                type="button"
                className={`portal-nav-item portal-nav-item-grades ${selectedNavModule === 'grades' ? 'active' : ''}`}
                onClick={() => {
                  setSelectedNavModule('grades');
                  if (onSelectModule) onSelectModule('grades');
                }}
                title="Acceder a Notas y Calificaciones"
                style={{ marginTop: '0.25rem' }}
              >
                <i className="ph-bold ph-chart-line-up"></i>
                <span className="portal-nav-text">Notas y Calificaciones</span>
              </button>

              {/* Módulo Exclusivo Admin: Novedades & Reemplazos Docentes */}
              {currentUser?.role === 'admin' && (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-reemplazos ${selectedNavModule === 'reemplazos' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNavModule('reemplazos');
                    if (onSelectModule) onSelectModule('reemplazos');
                  }}
                  title="Consola de Reasignación y Novedades Docentes"
                  style={{ marginTop: '0.25rem' }}
                >
                  <i className="ph-bold ph-arrows-clockwise"></i>
                  <span className="portal-nav-text">Novedades & Reemplazos</span>
                </button>
              )}

              {/* Módulo Activo: Bóveda Directiva */}
              {isPrivileged && (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-boveda ${selectedNavModule === 'boveda' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedNavModule('boveda');
                    if (onSelectModule) onSelectModule('boveda');
                  }}
                  title="Acceder a Bóveda Directiva & Archivo Confidencial"
                  style={{ marginTop: '0.25rem' }}
                >
                  <i className="ph-bold ph-vault"></i>
                  <span className="portal-nav-text">Bóveda Directiva</span>
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

            {/* MÓDULO ACTIVO: BÓVEDA DIRECTIVA (Gris pastel con texto negro formal) */}
            {isPrivileged ? (
              <article 
                className="portal-module-card portal-module-card-slate"
                onClick={() => onSelectModule && onSelectModule('boveda')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onSelectModule) onSelectModule('boveda');
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container portal-slate-icon">
                    <i className="ph-bold ph-vault" style={{ fontSize: '1.75rem', color: '#0f172a' }}></i>
                  </div>
                  <span className="portal-badge-slate">Activo · Directivo</span>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: '#0f172a' }}>Bóveda Directiva & Resguardo</h3>
                  <p style={{ color: '#0f172a' }}>
                    Resguardo de alta capacidad y máxima seguridad para actas de consejo directivo, información contable, resoluciones y contratos.
                  </p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label-slate">Acceder a la Bóveda &rarr;</span>
                </div>
              </article>
            ) : (
              <article className="portal-module-card portal-module-card-disabled">
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container portal-gray-icon">
                    <i className="ph-bold ph-vault" style={{ fontSize: '1.75rem' }}></i>
                  </div>
                  <span className="portal-badge-gray">Directivo Exclusivo</span>
                </div>
                <div className="portal-card-body">
                  <h3 className="portal-text-gray-title">Bóveda Directiva</h3>
                  <p className="portal-text-gray-desc">
                    Módulo reservado para Rectoría y Administración para custodia de actas y contratos confidenciales.
                  </p>
                </div>
                <div className="portal-card-footer portal-footer-disabled">
                  <span className="portal-label-muted">Requiere Acceso Directivo</span>
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
