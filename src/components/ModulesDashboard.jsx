import { useState, useEffect } from 'react';
import PortalNavbar from './PortalNavbar';
import { DECRETO_1075_PILLARS } from '../constants/decreto1075Categories';
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
  const handleModuleClick = (moduleId, options) => {
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

    setSelectedNavModule(moduleId);
    if (onSelectModule) {
      onSelectModule(moduleId, options);
    }
  };

  return (
    <div className="portal-container" id="view-dashboard">
      {/* Navbar Superior Unificado */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle={null}
        moduleSubtitle="Sistema Integral de Archivo Institucional & Custodia de Actas"
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
            <p className="portal-sidebar-label">MÓDULOS PRINCIPALES</p>
            <nav className="portal-sidebar-nav" id="tour-sidebar-nav">
              {/* Módulo Protagonista 1: Bóveda Confidencial (Rectoría & Admin) */}
              {isPrivileged && (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-boveda ${selectedNavModule === 'boveda' ? 'active' : ''}`}
                  onClick={() => handleModuleClick('boveda')}
                  title="Acceso exclusivo Rectoría y Administrador: archivos ultraconfidenciales, financieros y contratos"
                >
                  <i className="ph-bold ph-vault"></i>
                  <span className="portal-nav-text">Bóveda Confidencial</span>
                  <span className="portal-sidebar-active-tag" style={{ background: '#f1f5f9', color: '#0f172a', borderColor: '#cbd5e1' }}>Exclusivo</span>
                </button>
              )}

              {/* Módulo Protagonista 2: Circulares Oficiales */}
              <button 
                type="button"
                className={`portal-nav-item portal-nav-item-docs ${selectedNavModule === 'circulares' ? 'active' : ''}`}
                onClick={() => handleModuleClick('docs', { folder: 'institucional' })}
                title="Acceder a Circulares Institucionales y Comunicados Oficiales"
                style={{ marginTop: '0.25rem' }}
              >
                <i className="ph-bold ph-newspaper"></i>
                <span className="portal-nav-text">Circulares Oficiales</span>
                {circularesCount > 0 ? (
                  <span className="portal-sidebar-active-tag" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}>
                    {circularesCount} nueva{circularesCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="portal-sidebar-active-tag">Activo</span>
                )}
              </button>

              {/* Módulo Protagonista 3: Comités & Actas Oficiales */}
              <button 
                type="button"
                className={`portal-nav-item portal-nav-item-comites ${selectedNavModule === 'comites' ? 'active' : ''}`}
                onClick={() => handleModuleClick('comites')}
                title="Módulo institucional de Actas de Comités: Convivencia Escolar, Comisión de Evaluación y Consejo Académico"
                style={{
                  marginTop: '0.25rem',
                  color: selectedNavModule === 'comites' ? '#334155' : undefined,
                  fontWeight: selectedNavModule === 'comites' ? 700 : undefined,
                  background: selectedNavModule === 'comites' ? '#f8fafc' : undefined,
                  borderColor: selectedNavModule === 'comites' ? '#cbd5e1' : undefined
                }}
              >
                <i className="ph-bold ph-scales" style={{ color: selectedNavModule === 'comites' ? '#475569' : '#64748b' }}></i>
                <span className="portal-nav-text">Comités & Actas</span>
                <span className="portal-sidebar-active-tag" style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>Gobierno</span>
              </button>

              {/* Módulo Protagonista 4: Módulo Oficial Decreto 1075 de 2015 */}
              <button 
                type="button"
                className={`portal-nav-item portal-nav-item-decreto ${selectedNavModule === 'decreto1075' ? 'active' : ''}`}
                onClick={() => handleModuleClick('decreto1075')}
                title="Acceder al Módulo Oficial Decreto 1075 de 2015: 9 Pilares de Inspección y Vigilancia"
                style={{
                  marginTop: '0.25rem',
                  color: selectedNavModule === 'decreto1075' ? '#1e3a8a' : undefined,
                  fontWeight: selectedNavModule === 'decreto1075' ? 700 : undefined,
                  background: selectedNavModule === 'decreto1075' ? '#eff6ff' : undefined,
                  borderColor: selectedNavModule === 'decreto1075' ? '#bfdbfe' : undefined
                }}
              >
                <i className="ph-bold ph-scales" style={{ color: selectedNavModule === 'decreto1075' ? '#1e3a8a' : '#2563eb' }}></i>
                <span className="portal-nav-text">Decreto 1075 de 2015</span>
                <span className="portal-sidebar-active-tag" style={{ background: '#dbeafe', color: '#1e40af', borderColor: '#bfdbfe' }}>9 Pilares</span>
              </button>

              {/* Módulo Protagonista 5: Gestión Docente & Planta Curricular */}
              {canManageDocentes && (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-docentes ${selectedNavModule === 'docentes' ? 'active' : ''}`}
                  onClick={() => handleModuleClick('docentes')}
                  title="Gestión de Planta Docente, Novedades, Bajas, Reemplazos y Malla Curricular"
                  style={{
                    marginTop: '0.25rem',
                    color: selectedNavModule === 'docentes' ? '#0f766e' : undefined,
                    fontWeight: selectedNavModule === 'docentes' ? 700 : undefined,
                    background: selectedNavModule === 'docentes' ? '#f0fdfa' : undefined,
                    borderColor: selectedNavModule === 'docentes' ? '#99f6e4' : undefined
                  }}
                >
                  <i className="ph-bold ph-chalkboard-teacher" style={{ color: selectedNavModule === 'docentes' ? '#0f766e' : '#0d9488' }}></i>
                  <span className="portal-nav-text">Gestión Docente</span>
                  <span className="portal-sidebar-active-tag" style={{ background: '#ccfbf1', color: '#0f766e', borderColor: '#99f6e4' }}>Directivo</span>
                </button>
              )}
            </nav>
          </div>

          <div className="portal-sidebar-section">
            <p className="portal-sidebar-label">GESTIÓN & SIEE</p>
            <nav className="portal-sidebar-nav">
              {/* Control Académico para Coordinador o Notas para Admin/Docente */}
              {isCoordinador ? (
                <button 
                  type="button"
                  className={`portal-nav-item portal-nav-item-coordinacion ${selectedNavModule === 'grades' ? 'active' : ''}`}
                  onClick={() => handleModuleClick('grades')}
                  title="Consola de Control Académico y Evaluaciones (SIEE)"
                >
                  <i className="ph-bold ph-clipboard-text"></i>
                  <span className="portal-nav-text">Control Académico (SIEE)</span>
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
                </button>
              )}

              {/* Recursos Pedagógicos & Repositorio General */}
              <button 
                type="button"
                className={`portal-nav-item portal-nav-item-docs ${selectedNavModule === 'docs' ? 'active' : ''}`}
                onClick={() => handleModuleClick('docs')}
                title="Acceder a Recursos Pedagógicos, Planeaciones y Talleres"
                style={{ marginTop: '0.25rem' }}
              >
                <i className="ph-bold ph-folder-notch-open"></i>
                <span className="portal-nav-text">Recursos Pedagógicos</span>
              </button>

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
                </button>
              )}

              {/* Módulo: Observador del Estudiante */}
              <button 
                type="button"
                className={`portal-nav-item portal-nav-item-observador ${selectedNavModule === 'observador' ? 'active' : ''}`}
                onClick={() => handleModuleClick('observador')}
                title="Acceder a Observador del Estudiante (Seguimiento, Citaciones y PIAR)"
                style={{ marginTop: '0.25rem' }}
              >
                <i className="ph-bold ph-user-list"></i>
                <span className="portal-nav-text">Observador del Estudiante</span>
              </button>

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
              <span className="portal-status-dot"></span> Plataforma Institucional Activa
            </div>
          </div>
        </aside>

        {/* Área de Contenido Principal */}
        <main className="portal-main-content">
          <section className="portal-welcome-banner">
            <h2>Sistema de Archivo Institucional & Radicación</h2>
            <p>Ecosistema centralizado de custodia legal de actas de consejo, circulares oficiales, resguardo en bóveda y gestión académica institucional.</p>
          </section>

          {/* ===================================================================
              SECCIÓN HERO: MÓDULOS PROTAGONISTAS
              1. Bóveda Directiva
              2. Circulares Institucionales
              3. Actas de Consejo
              =================================================================== */}
          <section className="portal-section-featured">
            <div className="portal-section-header">
              <div className="portal-section-title-wrap">
                <i className="ph-bold ph-star"></i>
                <h3 className="portal-section-title">Módulos Protagonistas</h3>
              </div>
              <span className="portal-section-badge">Acceso Prioritario</span>
            </div>

            <div className="portal-featured-grid">
              {/* PROTAGONISTA 1: BÓVEDA CONFIDENCIAL (SOLO RECTORA Y ADMIN) */}
              {isPrivileged ? (
                <article 
                  id="tour-card-boveda"
                  className="portal-module-card portal-module-card-slate portal-module-card-hero"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
                    borderColor: '#cbd5e1'
                  }}
                  onClick={() => handleModuleClick('boveda')}
                  role="button"
                  tabIndex={0}
                  title="Acceso ultra confidencial exclusivo para Rectoría y Administrador"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleModuleClick('boveda');
                    }
                  }}
                >
                  <div className="portal-card-header-bar">
                    <div className="portal-card-icon-container portal-slate-icon">
                      <i className="ph-bold ph-vault" style={{ fontSize: '1.85rem', color: '#0f172a' }}></i>
                    </div>
                    <div className="portal-card-header-right">
                      <span className="portal-badge-slate">Rectoría & Admin</span>
                    </div>
                  </div>

                  <div className="portal-card-body">
                    <h3 style={{ color: '#0f172a', fontSize: '1.25rem' }}>Bóveda Confidencial</h3>
                    <p style={{ color: '#334155' }}>
                      Espacio blindado exclusivo de Rectoría con clave maestra y almacenamiento de hasta 15 GB. Reservado para información sensible que ningún otro usuario puede ver: balances financieros privados, nómina, contratos docentes y expedientes de máxima reserva.
                    </p>
                  </div>

                  <div className="portal-card-footer">
                    <span className="portal-link-label-slate" style={{ fontWeight: 700 }}>Abrir Bóveda Confidencial &rarr;</span>
                  </div>
                </article>
              ) : isCoordinador ? (
                <article 
                  id="tour-card-boveda"
                  className="portal-module-card portal-module-card-disabled portal-module-card-hero"
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
                      <i className="ph-bold ph-vault" style={{ fontSize: '1.85rem' }}></i>
                    </div>
                    <div className="portal-card-header-right">
                      <span className="portal-badge-gray">Despacho de Rectoría</span>
                    </div>
                  </div>
                  <div className="portal-card-body">
                    <h3 className="portal-text-gray-title" style={{ fontSize: '1.25rem' }}>Bóveda Confidencial</h3>
                    <p className="portal-text-gray-desc">
                      Custodia privada y confidencial de la Rectora. Archivos contables, contratos y resoluciones directivas no accesibles a otros roles sin autorización formal.
                    </p>
                  </div>
                  <div className="portal-card-footer portal-footer-disabled">
                    <span className="portal-label-muted">
                      <i className="ph-bold ph-lock-key"></i> Clave Autorizada por Rectora
                    </span>
                  </div>
                </article>
              ) : (
                <article 
                  id="tour-card-boveda" 
                  className="portal-module-card portal-module-card-disabled portal-module-card-hero"
                >
                  <div className="portal-card-header-bar">
                    <div className="portal-card-icon-container portal-gray-icon">
                      <i className="ph-bold ph-vault" style={{ fontSize: '1.85rem' }}></i>
                    </div>
                    <div className="portal-card-header-right">
                      <span className="portal-badge-gray">Rectoría & Admin</span>
                    </div>
                  </div>
                  <div className="portal-card-body">
                    <h3 className="portal-text-gray-title" style={{ fontSize: '1.25rem' }}>Bóveda Confidencial</h3>
                    <p className="portal-text-gray-desc">
                      Módulo de resguardo confidencial exclusivo para la Rectora y el Administrador. Ningún otro usuario tiene acceso a este espacio.
                    </p>
                  </div>
                  <div className="portal-card-footer portal-footer-disabled">
                    <span className="portal-label-muted">Exclusivo Rectora & Admin</span>
                  </div>
                </article>
              )}

              {/* PROTAGONISTA 2: CIRCULARES INSTITUCIONALES */}
              <article 
                id="tour-card-circulares"
                className="portal-module-card portal-module-card-active portal-module-card-hero"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)',
                  borderColor: '#a7f3d0'
                }}
                onClick={() => handleModuleClick('docs', { folder: 'institucional' })}
                role="button"
                tabIndex={0}
                title="Acceder a Circulares Institucionales y Comunicados Oficiales"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick('docs', { folder: 'institucional' });
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container" style={{ background: '#d1fae5', borderColor: '#a7f3d0' }}>
                    <i className="ph-bold ph-newspaper" style={{ fontSize: '1.85rem', color: '#064e3b' }}></i>
                  </div>
                  <div className="portal-card-header-right">
                    {circularesCount > 0 ? (
                      <span className="portal-badge-active" style={{ background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }}>
                        {circularesCount} pendiente{circularesCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="portal-badge-active">Oficial Rectoría</span>
                    )}
                  </div>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ fontSize: '1.25rem' }}>Circulares Institucionales</h3>
                  <p style={{ color: '#334155' }}>
                    Tablón oficial de anuncios y circulares emitidas por Rectoría. Radicación formal con confirmación de lectura para docentes, trazabilidad por radicado y repositorio histórico.
                  </p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label" style={{ color: '#047857', fontWeight: 700 }}>Consultar Circulares Oficiales &rarr;</span>
                </div>
              </article>

              {/* PROTAGONISTA 3: MÓDULO DE COMITÉS & ACTAS OFICIALES */}
              <article 
                id="tour-card-actas-consejo"
                className="portal-module-card portal-module-card-comites portal-module-card-hero"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  borderColor: '#cbd5e1'
                }}
                onClick={() => handleModuleClick('comites')}
                role="button"
                tabIndex={0}
                title="Acceder al Módulo de Comités y Actas Oficiales (Convivencia, Evaluación y Consejo Académico)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick('comites');
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container" style={{ background: '#f1f5f9', borderColor: '#e2e8f0' }}>
                    <i className="ph-bold ph-scales" style={{ fontSize: '1.85rem', color: '#334155' }}></i>
                  </div>
                  <div className="portal-card-header-right">
                    <span className="portal-badge-comites" style={{ background: '#334155', color: '#ffffff', borderColor: '#334155' }}>Actas Oficiales</span>
                  </div>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: '#0f172a', fontSize: '1.25rem' }}>Comités & Actas Oficiales</h3>
                  <p style={{ color: '#334155' }}>
                    Módulo de alta custodia para la radicación, deliberación y consulta de actas del gobierno escolar: Comité de Convivencia Escolar (Ley 1620), Comisión de Evaluación y Promoción (Decreto 1290), Consejo Académico (Ley 115) y Asambleas de Claustro Docente.
                  </p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label" style={{ color: '#334155', fontWeight: 700 }}>
                    Entrar al Módulo de Comités & Actas &rarr;
                  </span>
                </div>
              </article>
              {/* PROTAGONISTA 4: MÓDULO OFICIAL DECRETO 1075 DE 2015 */}
              <article 
                id="tour-card-decreto"
                className="portal-module-card portal-module-card-decreto portal-module-card-hero"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)',
                  borderColor: '#93c5fd'
                }}
                onClick={() => handleModuleClick('decreto1075')}
                role="button"
                tabIndex={0}
                title="Acceder al Módulo Oficial del Decreto 1075 de 2015 (9 Pilares de Inspección y Vigilancia)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick('decreto1075');
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container" style={{ background: '#dbeafe', borderColor: '#bfdbfe' }}>
                    <i className="ph-bold ph-scales" style={{ fontSize: '1.85rem', color: '#1e3a8a' }}></i>
                  </div>
                  <div className="portal-card-header-right">
                    <span className="portal-badge-decreto" style={{ background: '#1e3a8a', color: '#ffffff', borderColor: '#1e3a8a' }}>9 Pilares SED</span>
                  </div>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: '#0f172a', fontSize: '1.25rem' }}>Decreto 1075 de 2015</h3>
                  <p style={{ color: '#334155' }}>
                    Sistema integral de archivo institucional y radicación oficial bajo los 9 pilares del Decreto Único Reglamentario del Sector Educación: PEI, SIEE, Manual de Convivencia, Gobierno Escolar, Malla Curricular, Organización del Servicio, Evaluación Docente, Inclusión (PIAR) y Proyectos Transversales.
                  </p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label" style={{ color: '#1e3a8a', fontWeight: 700 }}>
                    Consultar los 9 Pilares Normativos &rarr;
                  </span>
                </div>
              </article>

              {/* PROTAGONISTA 5: GESTIÓN DOCENTE & PLANTA CURRICULAR */}
              <article 
                id="tour-card-docentes"
                className={`portal-module-card portal-module-card-hero ${canManageDocentes ? 'portal-module-card-cyan' : 'portal-module-card-disabled'}`}
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f0fdfa 100%)',
                  borderColor: '#99f6e4'
                }}
                onClick={() => handleModuleClick('docentes')}
                role="button"
                tabIndex={0}
                title={canManageDocentes ? "Acceder a Gestión Docente, Bajas, Reemplazos y Malla Curricular" : "Módulo reservado para Coordinación y Dirección"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick('docentes');
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className={`portal-card-icon-container ${canManageDocentes ? 'portal-cyan-icon' : 'portal-gray-icon'}`}>
                    <i className="ph-bold ph-chalkboard-teacher" style={{ fontSize: '1.85rem', color: canManageDocentes ? '#0f766e' : undefined }}></i>
                  </div>
                  <div className="portal-card-header-right">
                    {canManageDocentes ? (
                      <span className="portal-badge-cyan" style={{ background: '#0f766e', color: '#ffffff', borderColor: '#0f766e' }}>Planta Docente</span>
                    ) : (
                      <span className="portal-badge-gray">Directivo Exclusivo</span>
                    )}
                  </div>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: canManageDocentes ? '#0f172a' : undefined, fontSize: '1.25rem' }} className={!canManageDocentes ? 'portal-text-gray-title' : undefined}>
                    Gestión Docente & Malla Curricular
                  </h3>
                  <p style={{ color: canManageDocentes ? '#334155' : undefined }} className={!canManageDocentes ? 'portal-text-gray-desc' : undefined}>
                    Administración de planta docente, asignaciones de aula, directores de curso, novedades laborales, bajas de personal con reemplazo obligatorio y traspaso blindado de responsabilidades.
                  </p>
                </div>

                <div className={`portal-card-footer ${!canManageDocentes ? 'portal-footer-disabled' : ''}`}>
                  {canManageDocentes ? (
                    <span className="portal-link-label-cyan" style={{ fontWeight: 700 }}>Gestionar Planta & Novedades &rarr;</span>
                  ) : (
                    <span className="portal-label-muted">
                      <i className="ph-bold ph-lock-key"></i> Reservado para Coordinación y Rectoría
                    </span>
                  )}
                </div>
              </article>
            </div>
          </section>

          <hr className="portal-section-divider" />

          {/* ===================================================================
              SECCIÓN SECUNDARIA: GESTIÓN ACADÉMICA, DOCENTE & INSTITUCIONAL
              =================================================================== */}
          <section className="portal-section-other">
            <div className="portal-section-header">
              <div className="portal-section-title-wrap">
                <i className="ph-bold ph-squares-four"></i>
                <h3 className="portal-section-title">Gestión Académica & Operativa</h3>
              </div>
              <span className="portal-section-badge">SIEE & Comités</span>
            </div>

            <div className="portal-modules-grid">
              {/* MÓDULO: CONTROL ACADÉMICO (COORDINACIÓN) O NOTAS & CALIFICACIONES (ADMIN / DOCENTES) */}
              {isCoordinador ? (
                <article 
                  id="tour-card-grades"
                  className="portal-module-card portal-module-card-indigo"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #eef2ff 100%)',
                    borderColor: '#c7d2fe'
                  }}
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
                    <div className="portal-card-icon-container portal-indigo-icon" style={{ background: '#e0e7ff', borderColor: '#c7d2fe' }}>
                      <i className="ph-bold ph-clipboard-text" style={{ fontSize: '1.75rem', color: '#4338ca' }}></i>
                    </div>
                    <span className="portal-badge-indigo" style={{ background: '#4338ca', color: '#ffffff', borderColor: '#4338ca' }}>Activo · Coordinación</span>
                  </div>

                  <div className="portal-card-body">
                    <h3 style={{ color: '#0f172a' }}>Control Académico y Evaluaciones</h3>
                    <p style={{ color: '#334155' }}>
                      Consola de supervisión curricular: consulta global de sábanas consolidadas y rankings de Transición a 5°, radicación de observaciones de coordinación y control del calendario SIEE.
                    </p>
                  </div>

                  <div className="portal-card-footer">
                    <span className="portal-link-label-indigo" style={{ color: '#4338ca', fontWeight: 700 }}>Gestionar Control Académico &rarr;</span>
                  </div>
                </article>
              ) : (
                <article 
                  id="tour-card-grades"
                  className="portal-module-card portal-module-card-amber"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #fefce8 100%)',
                    borderColor: '#fef08a'
                  }}
                  onClick={() => handleModuleClick('grades')}
                  role="button"
                  tabIndex={0}
                  title="Acceder a Notas & Calificaciones (SIEE)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleModuleClick('grades');
                    }
                  }}
                >
                  <div className="portal-card-header-bar">
                    <div className="portal-card-icon-container" style={{ background: '#fef3c7', borderColor: '#fde68a' }}>
                      <i className="ph-bold ph-chart-line-up" style={{ fontSize: '1.75rem', color: '#b45309' }}></i>
                    </div>
                    <span className="portal-badge-amber" style={{ background: '#b45309', color: '#ffffff', borderColor: '#b45309' }}>Activo SIEE</span>
                  </div>

                  <div className="portal-card-body">
                    <h3 style={{ color: '#0f172a' }}>Notas & Calificaciones</h3>
                    <p style={{ color: '#334155' }}>Planilla interactiva de registro de calificaciones, ponderaciones SIEE (80% Aula Continua, 20% Evaluación Final), sábanas consolidadas y cálculo automático de promedios.</p>
                  </div>

                  <div className="portal-card-footer">
                    <span className="portal-link-label-amber" style={{ color: '#b45309', fontWeight: 700 }}>Acceder a Calificaciones &rarr;</span>
                  </div>
                </article>
              )}

              {/* MÓDULO: RECURSOS PEDAGÓGICOS (PLANEACIONES, GUÍAS Y TALLERES) */}
              <article 
                id="tour-card-docs"
                className="portal-module-card portal-module-card-active"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%)',
                  borderColor: '#bbf7d0'
                }}
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
                  <div className="portal-card-icon-container" style={{ background: '#dcfce7', borderColor: '#bbf7d0' }}>
                    <i className="ph-bold ph-folder-notch-open" style={{ fontSize: '1.75rem', color: '#064e3b' }}></i>
                  </div>
                  <span className="portal-badge-active" style={{ background: '#059669', color: '#ffffff', borderColor: '#059669' }}>Activo</span>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: '#0f172a' }}>Recursos Pedagógicos & Repositorio</h3>
                  <p style={{ color: '#334155' }}>Módulo central para radicación, planeaciones curriculares semanales, guías de aprendizaje y talleres pedagógicos organizados por grado y área.</p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label" style={{ color: '#059669', fontWeight: 700 }}>Acceder a Recursos Pedagógicos &rarr;</span>
                </div>
              </article>

              {/* MÓDULO: OBSERVADOR DEL ESTUDIANTE */}
              <article 
                id="tour-card-observador"
                className="portal-module-card portal-module-card-teal"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f0fdfa 100%)',
                  borderColor: '#99f6e4'
                }}
                onClick={() => handleModuleClick('observador')}
                role="button"
                tabIndex={0}
                title="Acceder a Observador del Estudiante (Seguimiento, Citaciones y PIAR)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModuleClick('observador');
                  }
                }}
              >
                <div className="portal-card-header-bar">
                  <div className="portal-card-icon-container portal-teal-icon" style={{ background: '#ccfbf1', borderColor: '#99f6e4' }}>
                    <i className="ph-bold ph-user-list" style={{ fontSize: '1.75rem', color: '#0f766e' }}></i>
                  </div>
                  <span className="portal-badge-teal" style={{ background: '#0f766e', color: '#ffffff', borderColor: '#0f766e' }}>Convivencial</span>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: '#0f172a' }}>Observador del Estudiante</h3>
                  <p style={{ color: '#334155' }}>
                    Seguimiento convivencial y pedagógico individual de estudiantes: llamados de atención, compromisos formativos, citaciones oficiales a acudientes y planes PIAR.
                  </p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label-teal" style={{ color: '#0f766e', fontWeight: 700 }}>Acceder a Observador del Estudiante &rarr;</span>
                </div>
              </article>

              {/* MÓDULO: GESTIÓN DE MATRÍCULA E HISTÓRICO BLINDADO (FASE 5) */}
              <article 
                id="tour-card-matriculas"
                className={`portal-module-card ${canManageMatriculas ? 'portal-module-card-emerald' : 'portal-module-card-disabled'}`}
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)',
                  borderColor: '#a7f3d0'
                }}
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
                  <div className={`portal-card-icon-container ${canManageMatriculas ? 'portal-emerald-icon' : 'portal-gray-icon'}`} style={{ background: '#d1fae5', borderColor: '#a7f3d0' }}>
                    <i className="ph-bold ph-identification-badge" style={{ fontSize: '1.75rem', color: canManageMatriculas ? '#059669' : undefined }}></i>
                  </div>
                  {canManageMatriculas ? (
                    <span className="portal-badge-emerald" style={{ background: '#059669', color: '#ffffff', borderColor: '#059669' }}>Activo · Fase 5</span>
                  ) : (
                    <span className="portal-badge-gray">Directivo & Coord.</span>
                  )}
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: canManageMatriculas ? '#0f172a' : undefined }} className={!canManageMatriculas ? 'portal-text-gray-title' : undefined}>
                    Matrículas & Censo Escolar
                  </h3>
                  <p style={{ color: canManageMatriculas ? '#334155' : undefined }} className={!canManageMatriculas ? 'portal-text-gray-desc' : undefined}>
                    Inscripción extemporánea, censo escolar, inhabilitación sin borrado físico (soft-disable) y cálculo automatizado de tiraje para copias N+1.
                  </p>
                </div>

                <div className={`portal-card-footer ${!canManageMatriculas ? 'portal-footer-disabled' : ''}`}>
                  {canManageMatriculas ? (
                    <span className="portal-link-label-emerald" style={{ color: '#059669', fontWeight: 700 }}>Gestionar Matrícula & Histórico &rarr;</span>
                  ) : (
                    <span className="portal-label-muted">
                      <i className="ph-bold ph-lock-key"></i> Reservado para Coordinación y Rectoría
                    </span>
                  )}
                </div>
              </article>

              {/* MÓDULO: EVALUACIONES FINALES */}
              <article 
                id="tour-card-evaluaciones"
                className="portal-module-card portal-module-card-violet"
                style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #faf5ff 100%)',
                  borderColor: '#e9d5ff'
                }}
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
                  <div className="portal-card-icon-container portal-violet-icon" style={{ background: '#f3e8ff', borderColor: '#e9d5ff' }}>
                    <i className="ph-bold ph-graduation-cap" style={{ fontSize: '1.75rem', color: '#6d28d9' }}></i>
                  </div>
                  <span className="portal-badge-violet" style={{ background: '#6d28d9', color: '#ffffff', borderColor: '#6d28d9' }}>Activo · SIEE</span>
                </div>

                <div className="portal-card-body">
                  <h3 style={{ color: '#0f172a' }}>Evaluaciones Finales</h3>
                  <p style={{ color: '#334155' }}>
                    Consola de exámenes acumulativos, sustentaciones finales, actas de nivelación, sábanas de comisiones de promoción y cierre oficial de año lectivo.
                  </p>
                </div>

                <div className="portal-card-footer">
                  <span className="portal-link-label-violet" style={{ color: '#6d28d9', fontWeight: 700 }}>Gestionar Evaluaciones Finales &rarr;</span>
                </div>
              </article>
            </div>
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
