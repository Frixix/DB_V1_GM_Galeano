import gradesService from '../services/gradesService.js';
import BaseSidebar from './common/BaseSidebar.jsx';

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

// Helper para clases pastel temáticas de materias idénticas a Recursos Pedagógicos & Circulares
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

export default function GradesSidebar({
  currentUser,
  selectedGrade,
  onSelectGrade,
  selectedSubject,
  onSelectSubject,
  activeSheetType,
  onSelectSheetType,
  selectedPeriod,
  onSelectPeriod,
  selectedTeacher = 'all',
  onSelectTeacher,
  availableGrades = [],
  availableSubjects = [],
  availablePeriods = [],
  onlineMap = {},
  onlineCount = 0,
  onOpenConnectionsModal,
  onOpenProfile,
  onBackToModules
}) {
  const isPrivileged = currentUser && ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(currentUser.role);

  const handleSelectGradeTeacher = (name, t) => {
    if (t?.grade && onSelectGrade) {
      onSelectGrade(t.grade);
    }
    if (onSelectTeacher) {
      onSelectTeacher(t ? t.name : name);
    }
  };

  const handleResetAll = () => {
    if (onSelectTeacher) onSelectTeacher('all');
    if (onSelectGrade && availableGrades.length > 0) {
      onSelectGrade(availableGrades[0]);
    }
  };

  return (
    <BaseSidebar
      currentModule="calificaciones"
      currentUser={currentUser}
      isPrivileged={isPrivileged}
      selectedTeacher={selectedTeacher}
      selectedGrade={selectedGrade}
      onSelectTeacher={handleSelectGradeTeacher}
      onResetTeacher={handleResetAll}
      onBackToModules={onBackToModules}
      onlineMap={onlineMap}
      onlineCount={onlineCount}
      onOpenConnectionsModal={onOpenConnectionsModal}
      onOpenProfile={onOpenProfile}
      defaultExpanded={true}
      sectionId="gradesTeacherSection"
      ownCardTitle="Mi Grado & Rol"
      accentColor="#d97706"
      id="gradesSidebar"
    >
      {/* Sección 2: Selector de Periodo Académico Activo */}
      <div className="sidebar-section" id="gradesPeriodSection">
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
              >
                <i className="ph-bold ph-calendar-blank"></i>
                <span>{p.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sección 4: Sábanas de Notas del Grado Activo */}
      <div className="sidebar-section" id="gradesSheetsSection">
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="ph-bold ph-files"></i>
            <span>{isPrivileged ? `Sábanas • ${selectedGrade}` : `Sábanas • Mi Grado (${selectedGrade})`}</span>
          </div>
          <span style={{ fontSize: '0.65rem', color: '#b45309', fontWeight: 700 }}>
            {availableSubjects.length + (isPrivileged ? 1 : 0)}
          </span>
        </div>

        <nav className="folder-list">
          {/* Card: Sábana General Consolidada (Exclusiva para Directivos y Auditoría) */}
          {isPrivileged && (
            <button
              type="button"
              className={`folder-btn folder-consolidada ${activeSheetType === 'consolidated' ? 'active' : ''}`}
              onClick={() => onSelectSheetType('consolidated')}
              title={`Ver Sábana General Consolidada de ${selectedGrade}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                <i className="ph-bold ph-chart-bar"></i>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: activeSheetType === 'consolidated' ? 700 : 600 }}>Sábana General</span>
                  <span style={{ fontSize: '0.68rem', color: activeSheetType === 'consolidated' ? '#92400e' : '#64748b' }}>Consolidado de Grado</span>
                </div>
              </div>
            </button>
          )}

          {/* Subgrupo: Asignaturas Individuales */}
          <div className="obs-folder-subgroup-label" style={{ marginTop: '0.45rem', marginBottom: '0.2rem' }}>
            <i className="ph-bold ph-book-open"></i>
            <span>{isPrivileged ? `MATERIAS (${selectedGrade})` : `MATERIAS A TU CARGO (${selectedGrade})`}</span>
          </div>

          {availableSubjects.map((subj) => {
            const isSelected = activeSheetType === 'subject' && selectedSubject === subj;
            const teacher = gradesService.getTeacherAssignment(selectedGrade, subj);
            const isMySubject = gradesService.canEditScores(currentUser, selectedGrade, subj);
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
                title={`Planilla de notas de ${subj} (Docente: ${teacher.teacherName})`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}>
                  <i className={`ph-bold ${iconClass}`}></i>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                    <span style={{ fontSize: '0.83rem', fontWeight: isSelected ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {subj}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: isSelected ? 'inherit' : (isMySubject ? '#b45309' : '#64748b'), opacity: isSelected ? 0.9 : 1 }}>
                      {isMySubject ? '★ A tu cargo' : teacher.teacherName}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </BaseSidebar>
  );
}
