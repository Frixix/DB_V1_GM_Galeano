import { useState } from 'react';
import { getUserAvatar } from '../services/avatarService.js';
import finalExamsService from '../services/finalExamsService.js';

// Helper para iconos temáticos de materias
const getSubjectIcon = (subj) => {
  if (!subj) return 'ph-book-bookmark';
  const s = subj.toLowerCase();
  if (s.includes('lengua') || s.includes('español')) return 'ph-book-open';
  if (s.includes('mate')) return 'ph-calculator';
  if (s.includes('natural')) return 'ph-leaf';
  if (s.includes('social')) return 'ph-globe';
  if (s.includes('inglés') || s.includes('ingles')) return 'ph-translate';
  if (s.includes('art')) return 'ph-palette';
  if (s.includes('física') || s.includes('fisica')) return 'ph-barbell';
  if (s.includes('ética') || s.includes('etica') || s.includes('valor')) return 'ph-heart';
  if (s.includes('tecno') || s.includes('inform')) return 'ph-laptop';
  if (s.includes('relig')) return 'ph-cross';
  return 'ph-book-bookmark';
};

// Helper para clases pastel temáticas de materias
const getSubjectFolderClass = (subj) => {
  if (!subj) return 'folder-subject-default';
  const s = subj.toLowerCase();
  if (s.includes('lengua') || s.includes('español') || s.includes('castell')) return 'folder-subject-lengua';
  if (s.includes('mate') || s.includes('geom') || s.includes('estad')) return 'folder-subject-mate';
  if (s.includes('natural') || s.includes('biol') || s.includes('cienc')) return 'folder-subject-naturales';
  if (s.includes('social') || s.includes('hist') || s.includes('geog')) return 'folder-subject-sociales';
  if (s.includes('inglés') || s.includes('ingles') || s.includes('idiom')) return 'folder-subject-ingles';
  if (s.includes('art') || s.includes('danza') || s.includes('teatr') || s.includes('music')) return 'folder-subject-arte';
  if (s.includes('física') || s.includes('fisica') || s.includes('depor')) return 'folder-subject-fisica';
  if (s.includes('ética') || s.includes('etica') || s.includes('valor')) return 'folder-subject-etica';
  if (s.includes('tecno') || s.includes('inform') || s.includes('sistem')) return 'folder-subject-tecno';
  if (s.includes('relig')) return 'folder-subject-religion';
  return 'folder-subject-default';
};

export default function FinalExamsSidebar({
  currentUser,
  selectedGrade,
  onSelectGrade,
  selectedSubject,
  onSelectSubject,
  activeSheetType,
  onSelectSheetType,
  selectedInstance,
  onSelectInstance,
  selectedTeacher = 'all',
  onSelectTeacher,
  availableGrades = [],
  availableSubjects = [],
  availableInstances = [],
  onlineMap = {},
  onlineCount = 0,
  onOpenConnectionsModal,
  onOpenProfile,
  onBackToModules
}) {
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(currentUser.role);

  const teachersList = [
    { key: 'profe1', name: 'Profe 1', label: 'Dir. Transición', grade: 'Transición', icon: 'ph-user' },
    { key: 'jessica', name: 'Jessica', label: 'Dir. 1° Primaria', grade: '1° Primaria', icon: 'ph-user' },
    { key: 'yuri', name: 'Yuri', label: 'Dir. 2° Primaria', grade: '2° Primaria', icon: 'ph-user' },
    { key: 'profe2', name: 'Profe 2', label: 'Dir. 3° Primaria', grade: '3° Primaria', icon: 'ph-user' },
    { key: 'elcy', name: 'Elcy', label: 'Dir. 4° Primaria', grade: '4° Primaria', icon: 'ph-user' },
    { key: 'profe3', name: 'Profe 3', label: 'Dir. 5° Primaria', grade: '5° Primaria', icon: 'ph-user' },
    { key: 'claudia', name: 'Claudia (Rectora)', label: 'Rectoría', isRectora: true }
  ];

  const currentUserKey = currentUser?.key || currentUser?.role || (currentUser?.name ? currentUser.name.toLowerCase().replace(/\s+/g, '') : null);
  const currentUserAvatar = (currentUserKey ? getUserAvatar(currentUserKey) : null) || currentUser?.avatar || null;

  // Acordeón desplegado por defecto para máxima visibilidad de los cursos
  const [isTeacherExpanded, setIsTeacherExpanded] = useState(true);
  const selectedTeacherObj = selectedTeacher !== 'all'
    ? teachersList.find((t) => t.name === selectedTeacher || t.key === selectedTeacher)
    : teachersList.find((t) => t.grade === selectedGrade) || null;

  const handleSelectGradeTeacher = (t) => {
    if (t.grade && onSelectGrade) {
      onSelectGrade(t.grade);
    }
    if (onSelectTeacher) {
      onSelectTeacher(t.name);
    }
  };

  const handleResetAll = () => {
    if (onSelectTeacher) onSelectTeacher('all');
    if (onSelectGrade && availableGrades.length > 0) {
      onSelectGrade(availableGrades[0]);
    }
  };

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
              <span>Mi Grado & Rol</span>
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
                  Dir
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#4338ca', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedGrade} • {currentUser.label || 'Directora de Curso'}
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
                    handleResetAll();
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
                  title="Clic para desplegar y ver todos los cursos"
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

                  <span className="teacher-fold-caret-btn" title="Desplegar docentes (bajar)">
                    <i className="ph-bold ph-caret-down"></i>
                  </span>
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
                    <span className="teacher-fold-caret-btn">
                      <i className="ph-bold ph-caret-down"></i>
                    </span>
                  </div>
                </button>
              )}
            </nav>
          ) : (
            <nav className="teacher-list teacher-list-dropdown">
              <button
                type="button"
                className={`teacher-btn ${selectedTeacher === 'all' ? 'active' : ''}`}
                onClick={handleResetAll}
                title="Supervisión general de todos los docentes y cursos"
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
                const isSelected = (selectedTeacher === t.name) || (selectedTeacher === 'all' && t.grade === selectedGrade);

                return (
                  <button
                    key={t.key}
                    type="button"
                    className={`teacher-btn ${t.isRectora ? 'teacher-rectora-btn' : ''} ${
                      isSelected ? 'active' : ''
                    }`}
                    onClick={() => handleSelectGradeTeacher(t)}
                    title={`Seleccionar ${t.name} (${t.label})`}
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

      {/* SECCIÓN 2: Instancia / Convocatoria de Evaluación Final */}
      <div className="sidebar-section" id="finalInstanceSection">
        <div className="sidebar-header">
          <i className="ph-bold ph-calendar-check"></i>
          <span>Convocatoria de Cierre</span>
        </div>
        <div className="grades-sidebar-period-pills">
          {availableInstances.map((inst) => {
            const isInstActive = selectedInstance === inst;
            const shortLabel = inst.includes('Ordinaria') ? 'Ordinaria' : (inst.includes('Nivelaciones') ? 'Nivelación' : 'Comisión');
            return (
              <button
                key={inst}
                type="button"
                className={`grades-sidebar-period-btn ${isInstActive ? 'active' : ''}`}
                onClick={() => onSelectInstance(inst)}
                title={`Cambiar a ${inst}`}
                style={isInstActive ? { borderColor: '#6366f1', color: '#4338ca', background: '#eef2ff' } : {}}
              >
                <i className="ph-bold ph-certificate"></i>
                <span>{shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 3: Sábanas de Evaluación Final y Promoción */}
      <div className="sidebar-section" id="finalSheetsSection">
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-files"></i>
            <span>{isPrivileged ? `Sábanas • ${selectedGrade}` : `Sábanas • Mi Grado (${selectedGrade})`}</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#6d28d9', fontWeight: 700 }}>
            {availableSubjects.length + 1}
          </span>
        </div>

        <nav className="folder-list">
          {/* Card: Sábana Consolidada Final y Promoción */}
          <button
            type="button"
            className={`folder-btn folder-consolidada ${activeSheetType === 'consolidated' ? 'active' : ''}`}
            onClick={() => onSelectSheetType('consolidated')}
            title={`Ver Sábana Consolidada de Evaluación Final y Promoción de ${selectedGrade}`}
            style={activeSheetType === 'consolidated' ? { borderLeftColor: '#7c3aed', background: '#f5f3ff' } : {}}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
              <i className="ph-bold ph-seal-check" style={{ color: activeSheetType === 'consolidated' ? '#6d28d9' : '#8b5cf6' }}></i>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: activeSheetType === 'consolidated' ? 700 : 600, color: activeSheetType === 'consolidated' ? '#4c1d95' : 'inherit' }}>
                  Sábana Consolidada Final
                </span>
                <span style={{ fontSize: '0.68rem', color: activeSheetType === 'consolidated' ? '#6d28d9' : '#64748b' }}>
                  Promedios, Puestos y Promoción
                </span>
              </div>
            </div>
          </button>

          {/* Subgrupo: Asignaturas Individuales */}
          <div className="obs-folder-subgroup-label" style={{ marginTop: '0.5rem', marginBottom: '0.2rem' }}>
            <i className="ph-bold ph-book-open"></i>
            <span>{isPrivileged ? `EVALUACIONES (${selectedGrade})` : `A TU CARGO (${selectedGrade})`}</span>
          </div>

          {availableSubjects.map((subj) => {
            const isSelected = activeSheetType === 'subject' && selectedSubject === subj;
            const teacher = finalExamsService.getTeacherAssignment(selectedGrade, subj);
            const isMySubject = finalExamsService.canEditScores(currentUser, selectedGrade, subj);
            const iconClass = getSubjectIcon(subj);
            const subjectClass = getSubjectFolderClass(subj);

            return (
              <button
                key={subj}
                type="button"
                className={`folder-btn ${subjectClass} ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onSelectSubject(subj);
                  onSelectSheetType('subject');
                }}
                title={`Evaluación final de ${subj} (Docente: ${teacher.teacherName})`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                  <i className={`ph-bold ${iconClass}`}></i>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                    <span style={{ fontSize: '0.83rem', fontWeight: isSelected ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {subj}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: isSelected ? 'inherit' : (isMySubject ? '#059669' : '#64748b'), opacity: isSelected ? 0.9 : 1 }}>
                      {isMySubject ? '★ A tu cargo' : teacher.teacherName}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* SECCIÓN 4: Ponderación de Evaluación Final */}
      <div className="db-summary-card" id="finalExamsSieeSummary" style={{ marginTop: 'auto' }}>
        <div className="summary-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-graduation-cap" style={{ color: '#6d28d9' }}></i>
            <span>Ponderación Examen</span>
          </div>
          <span className="storage-plan-pill" style={{ background: '#ede9fe', color: '#5b21b6', border: '1px solid #ddd6fe' }}>
            100%
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.73rem', color: '#475569', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Prueba Escrita / Teórica:</span> <strong>40%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Sustentación / Práctica:</span> <strong>40%</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Prueba Acumulativa Saber:</span> <strong>20%</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}
