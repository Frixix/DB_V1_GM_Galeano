import { useState } from 'react';
import { getUserAvatar } from '../services/avatarService.js';
import { COMMITTEE_MEMBERS, isUserCommitteeMember } from '../data/initialObservador.js';

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

  const teachersList = [
    { key: 'profe1', name: 'Profe 1', label: 'Dir. Transición', icon: 'ph-user' },
    { key: 'jessica', name: 'Jessica', label: 'Dir. 1° Primaria', icon: 'ph-user' },
    { key: 'yuri', name: 'Yuri', label: 'Dir. 2° Primaria', icon: 'ph-user' },
    { key: 'profe2', name: 'Profe 2', label: 'Dir. 3° Primaria', icon: 'ph-user' },
    { key: 'elcy', name: 'Elcy', label: 'Dir. 4° Primaria', icon: 'ph-user' },
    { key: 'profe3', name: 'Profe 3', label: 'Dir. 5° Primaria', icon: 'ph-user' },
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
    <aside className="sidebar obs-sidebar" id="observadorSidebar">
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

      {/* Sección 1: Panel de las Docentes (Auditoría Convivencial / Rectoría y Admin) */}
      {isPrivileged ? (
        <div className="sidebar-section" id="obsTeacherSection">
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
        <div className="sidebar-section obs-teacher-own-card teacher-own-card">
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
          <div className="obs-teacher-badge-box teacher-badge-box">
            <div className="obs-teacher-badge-icon teacher-badge-icon">
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

      {/* Sección 3: Tarjeta de Resumen Normativo e Institucional */}
      <div className="obs-summary-card" id="obsSummaryCard">
        <div className="obs-summary-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-seal-check" style={{ color: '#0f766e', fontSize: '1.1rem' }}></i>
            <span style={{ fontWeight: 700, fontSize: '0.825rem', color: '#0f172a' }}>
              Marco Convivencial & SIEE
            </span>
          </div>
          <span className="obs-norm-pill">Ley 1620 / Dec. 1290</span>
        </div>

        <div className="obs-stat-grid">
          <div className="obs-stat-item">
            <span className="obs-stat-number">{counts.en_seguimiento}</span>
            <span className="obs-stat-label">En Seguimiento</span>
          </div>
          <div className="obs-stat-item">
            <span className="obs-stat-number">{counts.actas_firmadas}</span>
            <span className="obs-stat-label">Actas Firmadas</span>
          </div>
          <div className="obs-stat-item">
            <span className="obs-stat-number">{counts.all}</span>
            <span className="obs-stat-label">Total Radicados</span>
          </div>
        </div>

        <p className="obs-summary-note">
          Trazabilidad legal de observadores, citaciones de acudientes y actas institucionales.
        </p>
      </div>
    </aside>
  );
}
