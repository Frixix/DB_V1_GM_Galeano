import { isUserCommitteeMember } from '../data/initialObservador.js';
import BaseSidebar from './common/BaseSidebar.jsx';

export default function ObservadorSidebar({
  currentUser,
  currentRoute = 'all',
  onRouteChange,
  currentTeacher = 'all',
  onTeacherSelect,
  records = [],
  onOpenProfile,
  onlineMap = {},
  onlineCount = 0,
  onOpenConnectionsModal,
  onBackToModules
}) {
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(currentUser.role);

  // Contadores por ruta para mostrar badges informativos
  const counts = {
    all: records.length,
    observador: records.filter((r) => r.route === 'observador').length,
    citaciones: records.filter((r) => r.route === 'citaciones').length,
    piar: records.filter((r) => r.route === 'piar').length,
    comite_convivencia: records.filter((r) => r.route === 'comite_convivencia').length,
    comision_evaluacion: records.filter((r) => r.route === 'comision_evaluacion').length,
    consejo_academico: records.filter((r) => r.route === 'consejo_academico').length,
    reuniones_docentes: records.filter((r) => r.route === 'reuniones_docentes').length,
    en_seguimiento: records.filter((r) => r.status === 'en_seguimiento').length,
    actas_firmadas: records.filter((r) => r.status === 'acta_aprobada' || r.status === 'compromiso_firmado').length
  };

  return (
    <BaseSidebar
      currentModule="observador"
      currentUser={currentUser}
      isPrivileged={isPrivileged}
      selectedTeacher={currentTeacher}
      onSelectTeacher={onTeacherSelect}
      onBackToModules={onBackToModules}
      onlineMap={onlineMap}
      onlineCount={onlineCount}
      onOpenConnectionsModal={onOpenConnectionsModal}
      onOpenProfile={onOpenProfile}
      defaultExpanded={false}
      sectionId="obsTeacherSection"
      accentColor="#0f766e"
      id="observadorSidebar"
      counts={counts}
    >
      {/* Sección 2: Ubicación y Rutas (Estructura de Observador y Actas) */}
      <div className="sidebar-section" id="obsRoutesSection">
        <div className="sidebar-header">
          <i className="ph-bold ph-folder"></i>
          <span>Ubicación / Rutas</span>
        </div>

        <nav className="folder-list">
          {/* 1. Vista General */}
          <button
            type="button"
            className={`folder-btn folder-all ${currentRoute === 'all' ? 'active' : ''}`}
            onClick={() => onRouteChange('all')}
          >
            <i className="ph-bold ph-folders"></i>
            <span>{isPrivileged ? 'Todos los Registros' : `Mis Registros (${currentUser.name})`}</span>
            <span className="obs-route-count-badge">{counts.all}</span>
          </button>

          {/* Subgrupo: Observador y Seguimiento a Estudiantes */}
          <div className="obs-folder-subgroup-label">
            <i className="ph-bold ph-student"></i>
            <span>SEGUIMIENTO A ESTUDIANTES</span>
          </div>

          <button
            type="button"
            className={`folder-btn folder-observador ${currentRoute === 'observador' ? 'active' : ''}`}
            onClick={() => onRouteChange('observador')}
          >
            <i className="ph-bold ph-user-list"></i>
            <span>Observador del Estudiante</span>
            {counts.observador > 0 && <span className="obs-route-count-badge">{counts.observador}</span>}
          </button>

          <button
            type="button"
            className={`folder-btn folder-citaciones ${currentRoute === 'citaciones' ? 'active' : ''}`}
            onClick={() => onRouteChange('citaciones')}
          >
            <i className="ph-bold ph-users-three"></i>
            <span>Citaciones & Acudientes</span>
            {counts.citaciones > 0 && <span className="obs-route-count-badge">{counts.citaciones}</span>}
          </button>

          <button
            type="button"
            className={`folder-btn folder-piar ${currentRoute === 'piar' ? 'active' : ''}`}
            onClick={() => onRouteChange('piar')}
          >
            <i className="ph-bold ph-brain"></i>
            <span>Seguimiento Pedagógico & PIAR</span>
            {counts.piar > 0 && <span className="obs-route-count-badge">{counts.piar}</span>}
          </button>

          {/* Subgrupo: Actas de Comités Internos Institucionales */}
          <div className="obs-folder-subgroup-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph-bold ph-scales"></i>
              <span>COMITÉS INTERNOS</span>
            </div>
            <span style={{ fontSize: '0.62rem', color: '#0f766e', fontWeight: 600, textTransform: 'none' }}>
              Convoca: Rectoría
            </span>
          </div>

          <button
            type="button"
            className={`folder-btn folder-convivencia ${currentRoute === 'comite_convivencia' ? 'active' : ''}`}
            onClick={() => onRouteChange('comite_convivencia')}
            title="Comité de Convivencia Escolar (Ley 1620)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
              <i className="ph-bold ph-scales"></i>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>C. Convivencia</span>
              {!isPrivileged && isUserCommitteeMember('comite_convivencia', currentUser) && (
                <span className="obs-member-tag-mini" title="Eres miembro asignado de este comité">
                  Miembro
                </span>
              )}
            </div>
            {counts.comite_convivencia > 0 && (
              <span className="obs-route-count-badge">{counts.comite_convivencia}</span>
            )}
          </button>

          <button
            type="button"
            className={`folder-btn folder-evaluacion ${currentRoute === 'comision_evaluacion' ? 'active' : ''}`}
            onClick={() => onRouteChange('comision_evaluacion')}
            title="Comisión de Evaluación y Promoción (Decreto 1290)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
              <i className="ph-bold ph-chart-pie-slice"></i>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>C. Evaluación</span>
              {!isPrivileged && isUserCommitteeMember('comision_evaluacion', currentUser) && (
                <span className="obs-member-tag-mini" title="Eres miembro asignado de este comité">
                  Miembro
                </span>
              )}
            </div>
            {counts.comision_evaluacion > 0 && (
              <span className="obs-route-count-badge">{counts.comision_evaluacion}</span>
            )}
          </button>

          <button
            type="button"
            className={`folder-btn folder-academico ${currentRoute === 'consejo_academico' ? 'active' : ''}`}
            onClick={() => onRouteChange('consejo_academico')}
            title="Consejo Académico (Ley 115)"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
              <i className="ph-bold ph-graduation-cap"></i>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>C. Académico</span>
              {!isPrivileged && isUserCommitteeMember('consejo_academico', currentUser) && (
                <span className="obs-member-tag-mini" title="Eres miembro asignado de este comité">
                  Miembro
                </span>
              )}
            </div>
            {counts.consejo_academico > 0 && (
              <span className="obs-route-count-badge">{counts.consejo_academico}</span>
            )}
          </button>

          <button
            type="button"
            className={`folder-btn folder-docentes ${currentRoute === 'reuniones_docentes' ? 'active' : ''}`}
            onClick={() => onRouteChange('reuniones_docentes')}
            title="Reuniones Generales de Docentes & Asambleas"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, overflow: 'hidden' }}>
              <i className="ph-bold ph-chalkboard-teacher"></i>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Reunión Docente</span>
              {!isPrivileged && isUserCommitteeMember('reuniones_docentes', currentUser) && (
                <span className="obs-member-tag-mini" title="Eres miembro asignado de este comité">
                  Docente
                </span>
              )}
            </div>
            {counts.reuniones_docentes > 0 && (
              <span className="obs-route-count-badge">{counts.reuniones_docentes}</span>
            )}
          </button>
        </nav>
      </div>
    </BaseSidebar>
  );
}
