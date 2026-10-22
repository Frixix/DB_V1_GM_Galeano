import { useState, useEffect } from 'react';
import PortalNavbar from './PortalNavbar';
import './ModulesDashboard.css';

/**
 * Segunda Capa: Panel Principal / Dashboard Estructural
 * Módulos integrados con Phosphor Icons y paletas pastel armonizadas.
 * Soporte de bloqueo temporal "En Desarrollo · Fase N° 1" para Rectora y docentes,
 * permitiendo interacción exclusiva al Administrador para pruebas en la nube.
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
  isNotificationsOpen = false,
  onOpenTour
}) {
  const [selectedNavModule, setSelectedNavModule] = useState(null);
  const [devModalInfo, setDevModalInfo] = useState(null);

  const isAdmin = currentUser?.role === 'admin';
  const isCoordinador = currentUser?.role === 'coordinador';
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora'].includes(currentUser.role);
  const canManageDocentes = isPrivileged || isCoordinador;
  const canManageMatriculas = isPrivileged || isCoordinador;
  const isDocente = !isPrivileged && !isCoordinador;

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && devModalInfo) {
        setDevModalInfo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [devModalInfo]);

  // Manejo de clic en módulos con control de fase de desarrollo
  const handleModuleClick = (moduleId) => {
    if (moduleId === 'matriculas' && !canManageMatriculas) {
      setDevModalInfo({
        moduleId,
        moduleName: 'Panel de Matriculados (Fase 5)',
        icon: 'ph-bold ph-identification-badge',
        canEnter: false,
        customMessage: 'El Panel de Matriculados e Histórico Blindado está reservado exclusivamente para Administrador, Rectora y Coordinación Académica.'
      });
      return;
    }

    if (moduleId === 'docentes' && !canManageDocentes) {
      setDevModalInfo({
        moduleId,
        moduleName: 'Gestión Docente & Malla Curricular',
        icon: 'ph-bold ph-chalkboard-teacher',
        canEnter: false,
        customMessage: 'El módulo de Gestión Docente está reservado exclusivamente para Coordinación, Rectoría y Administración Institucional.'
      });
      return;
    }

    if (moduleId === 'reemplazos') {
      return; // Módulo clausurado por directiva
    }

    if (moduleId === 'boveda' && isCoordinador) {
      setDevModalInfo({
        moduleId: 'boveda',
        moduleName: 'Bóveda Directiva & Resguardo',
        icon: 'ph-bold ph-vault',
        canEnter: false,
        isBovedaRestricted: true,
        customMessage: 'El acceso a la Bóveda Directiva está reservado para Rectoría y Administración. Como Coordinador(a), requiere autorización y clave oficial suministrada directamente por la Rectora.'
      });
      return;
    }

    if (moduleId === 'observador' && isDocente) {
      setDevModalInfo({
        moduleId: 'observador',
        moduleName: 'Observador & Actas',
        icon: 'ph-bold ph-user-list',
        canEnter: true
      });
      return;
    }

    setSelectedNavModule(moduleId);
    if (onSelectModule) {
      onSelectModule(moduleId);
    }
  };

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
        isNotificationsOpen={isNotificationsOpen}
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
            <p className="portal-sidebar-label">MÓDULOS DEL SISTEMA</p>
            <nav className="portal-sidebar-nav">
              {/* Módulo 1 (Destacado SIEE): Control Académico para Coordinador o Notas para Admin/Docente */}
              {isCoordinador ? (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-coordinacion ${selectedNavModule === 'grades' ? 'active' : ''}`}
                  onClick={() => handleModuleClick('grades')}
                  title="Consola de Control Académico y Evaluaciones (SIEE)"
                >
                  <i className="ph-bold ph-clipboard-text"></i>
                  <span className="portal-nav-text">Control Académico y Evaluaciones</span>
                  <span className="portal-sidebar-active-tag">Activo</span>
                </button>
              ) : (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-grades ${selectedNavModule === 'grades' ? 'active' : ''}`}
                  onClick={() => handleModuleClick('grades')}
                  title="Acceder a Notas & Calificaciones (SIEE)"
                >
                  <i className="ph-bold ph-chart-line-up"></i>
                  <span className="portal-nav-text">Notas & Calificaciones</span>
                  <span className="portal-sidebar-active-tag" style={{ background: '#ffedd5', color: '#c2410c', borderColor: '#fed7aa' }}>Activo</span>
                </button>
              )}

              {/* Módulo 2 Activo: Recursos Pedagógicos & Circulares */}
              <button 
                type="button"
                className={`portal-nav-item portal-nav-item-docs ${selectedNavModule === 'docs' ? 'active' : ''}`}
                onClick={() => handleModuleClick('docs')}
                title="Acceder a Recursos Pedagógicos & Circulares"
                style={{ marginTop: '0.25rem' }}
              >
                <i className="ph-bold ph-folder-notch-open"></i>
                <span className="portal-nav-text">Recursos Pedagógicos & Circulares</span>
              </button>



              {/* Módulo Activo: Bóveda Directiva */}
              {isPrivileged && (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-boveda ${selectedNavModule === 'boveda' ? 'active' : ''}`}
                  onClick={() => handleModuleClick('boveda')}
                  title="Acceder a Bóveda Directiva & Archivo Confidencial"
                  style={{ marginTop: '0.25rem' }}
                >
                  <i className="ph-bold ph-vault"></i>
                  <span className="portal-nav-text">Bóveda Directiva</span>
                </button>
              )}

              {/* Módulo: Gestión de Matrícula & Censo (Fase 5) */}
              {canManageMatriculas && (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-matriculas ${selectedNavModule === 'matriculas' ? 'active' : ''}`}
                  onClick={() => handleModuleClick('matriculas')}
                  title="Panel de Matriculados e Histórico Blindado (Fase 5)"
                  style={{ marginTop: '0.25rem' }}
                >
                  <i className="ph-bold ph-identification-badge"></i>
                  <span className="portal-nav-text">Matrículas & Censo</span>
                  <span className="portal-sidebar-active-tag" style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}>Fase 5</span>
                </button>
              )}

              {/* Módulo: Observador & Actas */}
              <button 
                type="button"
                className={`portal-nav-item portal-nav-item-observador ${selectedNavModule === 'observador' ? 'active' : ''}`}
                onClick={() => handleModuleClick('observador')}
                title={isDocente ? "Módulo en desarrollo • Fase N° 1 (Clic para echar un vistazo)" : "Acceder a Observador del Estudiante y Actas de Comités"}
                style={{ marginTop: '0.25rem' }}
              >
                <i className="ph-bold ph-user-list"></i>
                <span className="portal-nav-text">Observador & Actas</span>
                {isDocente && (
                  <span className="portal-sidebar-dev-tag">En desarrollo</span>
                )}
              </button>

              {/* Módulo: Gestión Docente & Malla Curricular */}
              {canManageDocentes && (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-docentes ${selectedNavModule === 'docentes' ? 'active' : ''}`}
                  onClick={() => handleModuleClick('docentes')}
                  title="Gestión de Planta Docente, Directores de Curso y Malla Curricular"
                  style={{ marginTop: '0.25rem' }}
                >
                  <i className="ph-bold ph-chalkboard-teacher"></i>
                  <span className="portal-nav-text">Gestión Docente</span>
                  <span className="portal-sidebar-active-tag" style={{ background: '#e0e7ff', color: '#4338ca', borderColor: '#c7d2fe' }}>Directivo</span>
                </button>
              )}

              {/* Módulo: Evaluaciones Finales */}
              <button 
                type="button"
                className={`portal-nav-item portal-nav-item-evaluaciones ${selectedNavModule === 'evaluaciones' ? 'active' : ''}`}
                onClick={() => handleModuleClick('evaluaciones')}
                title="Acceder a Evaluaciones Finales & Cierres SIEE"
                style={{ marginTop: '0.25rem' }}
              >
                <i className="ph-bold ph-graduation-cap"></i>
                <span className="portal-nav-text">Evaluaciones Finales</span>
              </button>
            </nav>
          </div>

          <div className="portal-sidebar-section">
            <p className="portal-sidebar-label">FUTUROS MÓDULOS</p>
            <nav className="portal-sidebar-nav">
              <div className="portal-nav-item portal-nav-item-disabled">
                <div className="portal-nav-item-disabled-left">
                  <i className="ph-bold ph-receipt portal-text-muted" style={{ fontSize: '1.2rem' }}></i>
                  <span className="portal-nav-text">Tesorería & Pagos</span>
                </div>
                <span className="portal-pill-gray">Próximamente</span>
              </div>
            </nav>
          </div>

          <div className="portal-sidebar-footer">
            <div className="portal-badge-status">
              <span className="portal-status-dot"></span> Fase N° 1 en Pruebas de Nube
            </div>
          </div>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="portal-main-content">
          <section className="portal-welcome-banner">
            <h2>Panel de Control Principal</h2>
            <p>Selecciona un módulo activo o consulta los avances en los módulos institucionales de la institución.</p>
          </section>

          {/* Cuadrícula de Tarjetas de Módulos */}
          <section className="portal-modules-grid">
            {/* MÓDULO 1: CONTROL ACADÉMICO Y EVALUACIONES (COORDINACIÓN) O NOTAS & CALIFICACIONES (ADMIN / DOCENTES) */}
            {isCoordinador ? (
              <article 
                className="portal-module-card portal-module-card-indigo"
                onClick={() => handleModuleClick('grades')}
                role="button"
                tabIndex={0}
                title="Acceder a Control Académico y Evaluaciones (SIEE)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick('grades');
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container portal-indigo-icon">
                    <i className="ph-bold ph-clipboard-text" style={{ fontSize: '1.75rem', color: '#4338ca' }}></i>
                  </div>
                  <span className="portal-badge-indigo">Activo · Coordinación</span>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: '#0f172a' }}>Control Académico y Evaluaciones</h3>
                  <p>
                    Consola de supervisión curricular: consulta global de sábanas consolidadas y rankings de Transición a 5°, radicación de observaciones de coordinación, control del calendario de evaluaciones y habilitación de prórrogas extemporáneas.
                  </p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label-indigo">Gestionar Control Académico &rarr;</span>
                </div>
              </article>
            ) : (
              <article 
                className="portal-module-card portal-module-card-amber"
                onClick={() => handleModuleClick('grades')}
                role="button"
                tabIndex={0}
                title={isAdmin ? "Acceder a Notas & Calificaciones (SIEE)" : "Módulo en desarrollo · Fase N° 1"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick('grades');
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container">
                    <i className="ph-bold ph-chart-line-up" style={{ fontSize: '1.75rem', color: '#b45309' }}></i>
                  </div>
                  <span className="portal-badge-amber">Activo Institucional</span>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: '#0f172a' }}>Notas & Calificaciones</h3>
                  <p>Planilla interactiva de registro de calificaciones, ponderaciones SIEE (80% Aula Continua, 20% Evaluación Final), sábanas consolidadas y cálculo automático de promedios.</p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label-amber">Acceder al módulo &rarr;</span>
                </div>
              </article>
            )}

            {/* MÓDULO 2: RECURSOS PEDAGÓGICOS & CIRCULARES */}
            <article 
              className="portal-module-card portal-module-card-active"
              onClick={() => handleModuleClick('docs')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleModuleClick('docs');
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
                <h3>Recursos Pedagógicos & Circulares</h3>
                <p>Módulo central para radicación, resguardo, consulta y auditoría de circulares oficiales, planeaciones curriculares, guías y talleres pedagógicos.</p>
              </div>

              <div className="portal-card-footer">
                <span className="portal-link-label">Acceder al módulo &rarr;</span>
              </div>
            </article>



            {/* MÓDULO ACTIVO: BÓVEDA DIRECTIVA */}
            {isPrivileged ? (
              <article 
                className="portal-module-card portal-module-card-slate"
                onClick={() => handleModuleClick('boveda')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick('boveda');
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
            ) : isCoordinador ? (
              <article 
                className="portal-module-card portal-module-card-disabled"
                onClick={() => handleModuleClick('boveda')}
                role="button"
                tabIndex={0}
                title="Módulo con acceso restringido para Coordinación (Requiere autorización de Rectoría)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick('boveda');
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container portal-gray-icon">
                    <i className="ph-bold ph-vault" style={{ fontSize: '1.75rem' }}></i>
                  </div>
                  <span className="portal-badge-gray">Acceso con Permiso de Rectoría</span>
                </div>
                <div className="portal-card-body">
                  <h3 className="portal-text-gray-title">Bóveda Directiva & Resguardo</h3>
                  <p className="portal-text-gray-desc">
                    Custodia confidencial reservada. La Coordinación solo puede acceder previa autorización y suministro de clave por parte de Rectoría.
                  </p>
                </div>
                <div className="portal-card-footer portal-footer-disabled">
                  <span className="portal-label-muted">
                    <i className="ph-bold ph-lock-key"></i> Solo con Permiso de la Rectora
                  </span>
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

            {/* MÓDULO: GESTIÓN DE MATRÍCULA E HISTÓRICO BLINDADO (FASE 5) */}
            <article 
              className={`portal-module-card ${canManageMatriculas ? 'portal-module-card-emerald' : 'portal-module-card-disabled'}`}
              onClick={() => handleModuleClick('matriculas')}
              role="button"
              tabIndex={0}
              title={canManageMatriculas ? "Acceder al Panel de Matriculados e Histórico Blindado (Fase 5)" : "Módulo reservado para Rectoría, Coordinación y Administración"}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleModuleClick('matriculas');
                }
              }}
            >
              <div className="portal-card-header-bar">
                <div className={`portal-card-icon-container ${canManageMatriculas ? 'portal-emerald-icon' : 'portal-gray-icon'}`}>
                  <i className="ph-bold ph-identification-badge" style={{ fontSize: '1.75rem', color: canManageMatriculas ? '#059669' : undefined }}></i>
                </div>
                {canManageMatriculas ? (
                  <span className="portal-badge-emerald">Activo · Fase 5</span>
                ) : (
                  <span className="portal-badge-gray">Directivo & Coord.</span>
                )}
              </div>

              <div className="portal-card-body">
                <h3 style={{ color: canManageMatriculas ? '#0f172a' : undefined }} className={!canManageMatriculas ? 'portal-text-gray-title' : undefined}>
                  Gestión de Matrícula & Censo
                </h3>
                <p style={{ color: canManageMatriculas ? '#0f172a' : undefined }} className={!canManageMatriculas ? 'portal-text-gray-desc' : undefined}>
                  Inscripción extemporánea de estudiantes, auditoría de censo escolar, inhabilitación por traslado o retiro (sin eliminación física) y fórmula de copias N+1.
                </p>
              </div>

              <div className={`portal-card-footer ${!canManageMatriculas ? 'portal-footer-disabled' : ''}`}>
                {canManageMatriculas ? (
                  <span className="portal-link-label-emerald">Gestionar Matrícula & Histórico &rarr;</span>
                ) : (
                  <span className="portal-label-muted">
                    <i className="ph-bold ph-lock-key"></i> Reservado para Coordinación y Rectoría
                  </span>
                )}
              </div>
            </article>

            {/* MÓDULO: OBSERVADOR & ACTAS */}
            <article 
              className="portal-module-card portal-module-card-teal"
              onClick={() => handleModuleClick('observador')}
              role="button"
              tabIndex={0}
              title={isDocente ? "Módulo en desarrollo • Fase N° 1 (Clic para ver estado o echar un vistazo)" : "Acceder a Observador del Estudiante y Actas de Comités"}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleModuleClick('observador');
                }
              }}
            >
              <div className="portal-card-header-bar">
                <div className="portal-card-icon-container portal-teal-icon">
                  <i className="ph-bold ph-user-list" style={{ fontSize: '1.75rem', color: '#0f766e' }}></i>
                </div>
                {isDocente ? (
                  <span className="portal-badge-teal">En desarrollo • Fase N° 1</span>
                ) : (
                  <span className="portal-badge-teal">Activo</span>
                )}
              </div>

              <div className="portal-card-body">
                <h3 style={{ color: '#0f172a' }}>Observador & Actas</h3>
                <p style={{ color: '#0f172a' }}>
                  Seguimiento convivencial y pedagógico de estudiantes, citaciones con acudientes, PIAR y actas de comités internos (Convivencia, Evaluación y Consejo Académico).
                </p>
              </div>

              <div className="portal-card-footer">
                {isDocente ? (
                  <span 
                    className="portal-link-label-teal"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectModule) onSelectModule('observador');
                    }}
                    title="Acceso directo: Echar un vistazo y entrar al módulo"
                  >
                    <i className="ph-bold ph-eye" style={{ marginRight: '5px' }}></i>
                    Echar un vistazo &rarr;
                  </span>
                ) : (
                  <span className="portal-link-label-teal">Acceder al módulo &rarr;</span>
                )}
              </div>
            </article>

            {/* MÓDULO: GESTIÓN DOCENTE & PLANTA CURRICULAR */}
            <article 
              className={`portal-module-card ${canManageDocentes ? 'portal-module-card-cyan' : 'portal-module-card-disabled'}`}
              onClick={() => handleModuleClick('docentes')}
              role="button"
              tabIndex={0}
              title={canManageDocentes ? "Acceder a Gestión Docente, Directores de Curso y Malla Curricular" : "Módulo reservado para Coordinación y Dirección"}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleModuleClick('docentes');
                }
              }}
            >
              <div className="portal-card-header-bar">
                <div className={`portal-card-icon-container ${canManageDocentes ? 'portal-cyan-icon' : 'portal-gray-icon'}`}>
                  <i className="ph-bold ph-chalkboard-teacher" style={{ fontSize: '1.75rem', color: canManageDocentes ? '#0f766e' : undefined }}></i>
                </div>
                {canManageDocentes ? (
                  <span className="portal-badge-cyan">Activo · Directivo & Coord.</span>
                ) : (
                  <span className="portal-badge-gray">Directivo Exclusivo</span>
                )}
              </div>

              <div className="portal-card-body">
                <h3 style={{ color: canManageDocentes ? '#0f172a' : undefined }} className={!canManageDocentes ? 'portal-text-gray-title' : undefined}>
                  Gestión Docente & Malla Curricular
                </h3>
                <p style={{ color: canManageDocentes ? '#0f172a' : undefined }} className={!canManageDocentes ? 'portal-text-gray-desc' : undefined}>
                  Administración de planta docente, directores de curso oficiales, asignaciones académicas por grado, novedades laborales y reemplazos de emergencia.
                </p>
              </div>

              <div className={`portal-card-footer ${!canManageDocentes ? 'portal-footer-disabled' : ''}`}>
                {canManageDocentes ? (
                  <span className="portal-link-label-cyan">Gestionar Planta & Asignaciones &rarr;</span>
                ) : (
                  <span className="portal-label-muted">
                    <i className="ph-bold ph-lock-key"></i> Reservado para Coordinación y Rectoría
                  </span>
                )}
              </div>
            </article>

            {/* MÓDULO: EVALUACIONES FINALES */}
            <article 
              className="portal-module-card portal-module-card-violet"
              onClick={() => handleModuleClick('evaluaciones')}
              role="button"
              tabIndex={0}
              title="Acceder a Evaluaciones Finales, Nivelaciones y Comisiones de Promoción (SIEE)"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleModuleClick('evaluaciones');
                }
              }}
            >
              <div className="portal-card-header-bar">
                <div className="portal-card-icon-container portal-violet-icon">
                  <i className="ph-bold ph-graduation-cap" style={{ fontSize: '1.75rem', color: '#6d28d9' }}></i>
                </div>
                <span className="portal-badge-violet">Activo · SIEE</span>
              </div>

              <div className="portal-card-body">
                <h3 style={{ color: '#0f172a' }}>Evaluaciones Finales</h3>
                <p style={{ color: '#0f172a' }}>
                  Consola de exámenes acumulativos, sustentaciones finales, actas de nivelación, sábanas de comisiones de promoción y cierre oficial de año lectivo.
                </p>
              </div>

              <div className="portal-card-footer">
                <span className="portal-link-label-violet">Gestionar Evaluaciones Finales &rarr;</span>
              </div>
            </article>
          </section>
        </main>
      </div>

      {/* =====================================================================
          MODAL AGRADECIMIENTO FASE N° 1 (EN DESARROLLO)
          Se abre cuando la Rectora o un Docente hace clic en un módulo en pruebas
          ===================================================================== */}
      {devModalInfo && (
        <div className="dev-modal-overlay" onClick={() => setDevModalInfo(null)}>
          <div className="dev-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dev-modal-header">
              <div className="dev-modal-icon-badge">
                <i className="ph-bold ph-hand-heart"></i>
              </div>
              <button 
                type="button" 
                className="dev-modal-close-btn"
                onClick={() => setDevModalInfo(null)}
                aria-label="Cerrar ventana"
                title="Cerrar"
              >
                <i className="ph-bold ph-x"></i>
              </button>
            </div>

            <div className="dev-modal-body">
              <span className="dev-modal-pill">
                <i className="ph-bold ph-sparkle"></i> Fase N° 1 Culminada
              </span>
              <h3>
                {devModalInfo.customMessage ? devModalInfo.moduleName : devModalInfo.moduleId === 'observador'
                  ? 'Observador & Actas • En Desarrollo'
                  : 'Módulo en Desarrollo'}
              </h3>
              <p className="dev-modal-intro">
                Estimada <strong>{currentUser?.name || 'Docente'}</strong> y comunidad educativa:
              </p>
              <p className="dev-modal-thankyou">
                {devModalInfo.customMessage ? (
                  <span>{devModalInfo.customMessage}</span>
                ) : devModalInfo.moduleId === 'observador' ? (
                  <>
                    ¡Queremos darle las <strong>gracias por validar la Fase N° 1</strong> de este módulo! Su acompañamiento y aportes son fundamentales para consolidar el sistema institucional de seguimiento convivencial, citaciones y actas de comités.
                  </>
                ) : (
                  <>
                    ¡Queremos darle las <strong>gracias por probar la Fase N° 1</strong> de este módulo! Su acompañamiento y validación durante este período han sido fundamentales para consolidar la arquitectura de notas y calificaciones de la institución.
                  </>
                )}
              </p>

              <div className="dev-modal-highlight-box">
                <div className="dev-modal-highlight-icon">
                  <i className={`ph-bold ${devModalInfo.icon || (devModalInfo.moduleId === 'observador' ? 'ph-user-list' : 'ph-cloud-check')}`}></i>
                </div>
                <div className="dev-modal-highlight-text">
                  {devModalInfo.customMessage ? (
                    <>
                      <strong>Protocolo de Seguridad & Autorización Directiva</strong>
                      <p>
                        Los documentos en Bóveda incluyen reservas legales y contables. La Coordinación Académica puede auditar los archivos pedagógicos y actas de comités directamente en sus respectivos módulos autorizados.
                      </p>
                    </>
                  ) : devModalInfo.moduleId === 'observador' ? (
                    <>
                      <strong>Validación Pedagógica & Seguimiento Activo</strong>
                      <p>
                        El módulo cuenta con radicación de observaciones pedagógicas, citaciones con acudientes y actas institucionales. Hemos habilitado el acceso para que puedas echar un vistazo y explorar los registros de tu grado.
                      </p>
                    </>
                  ) : (
                    <>
                      <strong>Pruebas de Sincronización en la Nube</strong>
                      <p>
                        Actualmente este módulo se encuentra en pruebas de rendimiento y seguridad en la nube (Supabase y Cloudflare R2), garantizando que las calificaciones y registros queden blindados contra cualquier alteración o pérdida.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <p className="dev-modal-footer-note">
                {devModalInfo.customMessage ? (
                  'Para acceder a actas o contratos confidenciales, solicite la autorización correspondiente directamente en el despacho de Rectoría.'
                ) : devModalInfo.canEnter
                  ? 'Haz clic en "Echar un vistazo y entrar" para acceder y explorar todas las secciones del módulo.'
                  : 'Durante esta fase en la nube, el módulo permanecerá bajo auditoría técnica exclusiva del Administrador. Muy pronto estará habilitado en producción para toda la institución.'}
              </p>
            </div>

            <div className="dev-modal-actions">
              {devModalInfo.canEnter ? (
                <>
                  <button 
                    type="button" 
                    className="dev-modal-btn-cancel"
                    onClick={() => setDevModalInfo(null)}
                  >
                    <span>Volver al panel</span>
                  </button>
                  <button 
                    type="button" 
                    className="dev-modal-btn-enter"
                    onClick={() => {
                      const targetModule = devModalInfo.moduleId;
                      setDevModalInfo(null);
                      if (onSelectModule) {
                        onSelectModule(targetModule);
                      }
                    }}
                  >
                    <i className="ph-bold ph-eye"></i>
                    <span>Echar un vistazo y entrar</span>
                  </button>
                </>
              ) : (
                <button 
                  type="button" 
                  className="dev-modal-btn-confirm"
                  onClick={() => setDevModalInfo(null)}
                >
                  <i className="ph-bold ph-check-circle"></i>
                  <span>Entendido, volver al panel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
