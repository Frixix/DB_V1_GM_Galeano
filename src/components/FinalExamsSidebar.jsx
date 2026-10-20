import { useState, useEffect } from 'react';
import { getUserAvatar } from '../services/avatarService.js';
import teacherService from '../services/teacherService.js';
import finalExamsService from '../services/finalExamsService.js';

export default function FinalExamsSidebar({
  currentUser,
  selectedGrade = 'all',
  onSelectGrade,
  selectedPeriod,
  onSelectPeriod,
  statusFilter = 'all',
  onSelectStatusFilter,
  selectedTeacher = 'all',
  onSelectTeacher,
  availableGrades = [],
  availablePeriods = [],
  stats = {},
  onlineMap = {},
  onlineCount = 0,
  onOpenConnectionsModal,
  onOpenProfile,
  onBackToModules
}) {
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(currentUser.role);

  const [teachersList, setTeachersList] = useState(() => teacherService.getSidebarTeachers());

  useEffect(() => {
    const unsubscribe = teacherService.subscribe(() => {
      setTeachersList(teacherService.getSidebarTeachers());
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const currentUserKey = currentUser?.key || currentUser?.role || (currentUser?.name ? currentUser.name.toLowerCase().replace(/\s+/g, '') : null);
  const currentUserAvatar = (currentUserKey ? getUserAvatar(currentUserKey) : null) || currentUser?.avatar || null;

  // Acordeón desplegado por defecto para máxima visibilidad de los cursos
  const [isTeacherExpanded, setIsTeacherExpanded] = useState(true);
  const selectedTeacherObj = selectedTeacher !== 'all'
    ? teachersList.find((t) => t.name === selectedTeacher || t.key === selectedTeacher)
    : teachersList.find((t) => t.grade === selectedGrade) || null;

  const handleSelectGradeTeacher = (t) => {
    if (onSelectTeacher) {
      onSelectTeacher(t.name);
    }
  };

  const handleResetTeacher = () => {
    if (onSelectTeacher) onSelectTeacher('all');
  };

  const progressPercent = stats?.progressPercent || 0;
  const deadlineInfo = stats?.deadlineInfo || {};

  return (
    <aside className="sidebar final-exams-sidebar" id="finalExamsSidebar">
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

      {/* Para docente titular: Solo ella y su grado asignado */}
      {!isPrivileged && (
        <div className="sidebar-section teacher-own-card obs-teacher-own-card">
          <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph-bold ph-chalkboard-teacher"></i>
              <span>Mi Perfil Docente</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.name}
                </strong>
                <span style={{ fontSize: '0.62rem', background: '#f5f3ff', color: '#6d28d9', padding: '1px 4px', borderRadius: '4px', fontWeight: 700 }}>
                  Docente
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#4338ca', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.label || 'Docente Titular'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 1: Ver por Docente & Cursos (Solo Admin, Rectora y Coordinador) */}
      {isPrivileged && (
        <div className="sidebar-section" id="finalTeacherSection">
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
              {selectedTeacher !== 'all' && (
                <button
                  type="button"
                  className="btn-teacher-reset-chip"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetTeacher();
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

          {!isTeacherExpanded ? (
            <nav className="teacher-list">
              {selectedTeacher !== 'all' && selectedTeacherObj ? (
                <button
                  type="button"
                  className={`teacher-btn active ${selectedTeacherObj.isRectora ? 'teacher-rectora-btn' : ''}`}
                  onClick={() => setIsTeacherExpanded(true)}
                  title="Clic para desplegar y ver todos los docentes"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                    <div className="teacher-avatar-mini">
                      {getUserAvatar(selectedTeacherObj.key) ? (
                        <img
                          src={getUserAvatar(selectedTeacherObj.key)}
                          alt={selectedTeacherObj.name}
                          className="teacher-avatar-img"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const f = e.currentTarget.nextSibling;
                            if (f) f.style.display = 'inline-block';
                          }}
                        />
                      ) : null}
                      <i
                        className={`ph-bold ${selectedTeacherObj.isRectora ? 'ph-crown' : 'ph-user'}`}
                        style={{
                          display: getUserAvatar(selectedTeacherObj.key) ? 'none' : 'inline-block',
                          color: selectedTeacherObj.isRectora ? '#d97706' : 'inherit'
                        }}
                      ></i>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {selectedTeacherObj.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{selectedTeacherObj.label}</span>
                    </div>
                  </div>

                  <span
                    className={`teacher-status-indicator ${onlineMap[selectedTeacherObj.key] || onlineMap[selectedTeacherObj.name] ? 'online' : 'offline'}`}
                    title={onlineMap[selectedTeacherObj.key] || onlineMap[selectedTeacherObj.name] ? 'En línea ahora' : 'Desconectado'}
                  ></span>

                  {onOpenProfile && (
                    <span
                      className="sidebar-profile-badge"
                      title={`Personalizar perfil de ${selectedTeacherObj.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenProfile(selectedTeacherObj.key);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <i className="ph-bold ph-sliders"></i>
                    </span>
                  )}
                </button>
              ) : (
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
                    <i className="ph-bold ph-caret-down"></i>
                  </div>
                </button>
              )}
            </nav>
          ) : (
            <nav className="teacher-list teacher-list-dropdown">
              <button
                type="button"
                className={`teacher-btn ${selectedTeacher === 'all' ? 'active' : ''}`}
                onClick={handleResetTeacher}
                title="Supervisión general de todos los docentes"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <i className="ph-bold ph-users-three"></i>
                  <span>Todos los docentes</span>
                </div>
                {selectedTeacher === 'all' && (
                  <i className="ph-bold ph-check" style={{ color: '#6366f1', fontSize: '0.9rem' }}></i>
                )}
              </button>

              {teachersList.map((t) => {
                const avatarUrl = getUserAvatar(t.key);
                const isOnline = onlineMap[t.key] || onlineMap[t.name];
                const isSelected = selectedTeacher === t.name;

                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`teacher-btn ${t.isRectora ? 'teacher-rectora-btn' : ''} ${
                      isSelected ? 'active' : ''
                    }`}
                    onClick={() => handleSelectGradeTeacher(t)}
                    title={`Ver exámenes a cargo de ${t.name}`}
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
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
      )}

      {/* SECCIÓN 2: Grados Escolares */}
      <div className="sidebar-section" id="finalGradesSection">
        <div className="sidebar-header">
          <i className="ph-bold ph-graduation-cap"></i>
          <span>Grados Escolares</span>
        </div>
        <nav className="folder-list">
          <button
            type="button"
            className={`folder-btn folder-all ${selectedGrade === 'all' ? 'active' : ''}`}
            onClick={() => onSelectGrade('all')}
            title="Ver materias de todos los grados escolares"
          >
            <i className="ph-bold ph-squares-four"></i>
            <span>Todos los Grados</span>
          </button>

          {availableGrades.map((g) => {
            const isGradeActive = selectedGrade === g;
            return (
              <button
                key={g}
                type="button"
                className={`folder-btn folder-institucional ${isGradeActive ? 'active' : ''}`}
                onClick={() => onSelectGrade(g)}
                title={`Filtrar por ${g}`}
              >
                <i className="ph-bold ph-chalkboard"></i>
                <span>{g}</span>
                {isGradeActive && (
                  <i className="ph-bold ph-check" style={{ marginLeft: 'auto', color: '#6366f1', fontSize: '0.85rem' }}></i>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* SECCIÓN 3: Periodo Académico */}
      <div className="sidebar-section" id="finalPeriodSection">
        <div className="sidebar-header">
          <i className="ph-bold ph-clock"></i>
          <span>Periodo Académico</span>
        </div>
        <div className="grades-sidebar-period-pills">
          {availablePeriods.map((p) => {
            const isPeriodActive = selectedPeriod === p;
            return (
              <button
                key={p}
                type="button"
                className={`grades-sidebar-period-btn ${isPeriodActive ? 'active' : ''}`}
                onClick={() => onSelectPeriod(p)}
                title={`Cambiar a ${p}`}
                style={isPeriodActive ? { borderColor: '#6366f1', color: '#4338ca', background: '#eef2ff' } : {}}
              >
                <i className="ph-bold ph-calendar-blank"></i>
                <span>{p.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 4: Filtro de Estado de Impresión */}
      <div className="sidebar-section" id="finalFilterStatusSection">
        <div className="sidebar-header">
          <i className="ph-bold ph-funnel"></i>
          <span>Filtro de Estado</span>
        </div>
        <nav className="folder-list">
          <button
            type="button"
            className={`folder-btn folder-all ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => onSelectStatusFilter('all')}
          >
            <i className="ph-bold ph-folders"></i>
            <span>Todas las Materias</span>
            <span className="teacher-badge-count">{stats?.totalSubjects || 0}</span>
          </button>

          <button
            type="button"
            className={`folder-btn folder-institucional ${statusFilter === 'uploaded' ? 'active' : ''}`}
            onClick={() => onSelectStatusFilter('uploaded')}
          >
            <i className="ph-bold ph-check-circle" style={{ color: '#059669' }}></i>
            <span>Listas para Impresión</span>
            <span className="teacher-badge-count" style={{ background: '#dcfce7', color: '#15803d' }}>
              {stats?.uploadedCount || 0}
            </span>
          </button>

          <button
            type="button"
            className={`folder-btn folder-talleres ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => onSelectStatusFilter('pending')}
          >
            <i className="ph-bold ph-clock-countdown" style={{ color: '#d97706' }}></i>
            <span>Pendientes de Subida</span>
            {stats?.pendingCount > 0 && (
              <span className="teacher-badge-count" style={{ background: '#fef3c7', color: '#92400e' }}>
                {stats.pendingCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* SECCIÓN 5: Control de Impresión & Copias */}
      <div className="db-summary-card" id="finalPrintSummaryCard" style={{ marginTop: 'auto' }}>
        <div className="summary-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-printer" style={{ color: '#6d28d9' }}></i>
            <span>Control de Impresión</span>
          </div>
          <span className="storage-plan-pill" style={{ background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe' }}>
            {progressPercent}% Listo
          </span>
        </div>

        <div className="storage-bar-wrapper" style={{ marginTop: '0.65rem' }}>
          <div 
            className="storage-bar-progress" 
            style={{ 
              width: `${progressPercent}%`,
              background: progressPercent === 100 ? '#059669' : 'linear-gradient(90deg, #6366f1, #7c3aed)'
            }}
          ></div>
        </div>

        <div className="storage-labels" style={{ marginTop: '0.35rem' }}>
          <span>{stats?.uploadedCount || 0} de {stats?.totalSubjects || 0} materias</span>
          <span>{stats?.totalCopiesNeeded || 0} copias requeridas</span>
        </div>

        <div style={{ marginTop: '0.65rem', padding: '0.55rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#475569' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6d28d9', fontWeight: 700, marginBottom: '2px' }}>
            <i className="ph-bold ph-calendar-check"></i>
            <span>Fecha Límite:</span>
          </div>
          <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
            {deadlineInfo.deadlineDate || '27 de Marzo 2026'} ({deadlineInfo.deliveryTime || '17:00'})
          </p>
        </div>
      </div>
    </aside>
  );
}
