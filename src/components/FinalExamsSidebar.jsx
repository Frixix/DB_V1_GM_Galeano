import BaseSidebar from './common/BaseSidebar.jsx';

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

  const handleSelectGradeTeacher = (name, t) => {
    if (onSelectTeacher) {
      onSelectTeacher(t ? t.name : name);
    }
  };

  const handleResetTeacher = () => {
    if (onSelectTeacher) onSelectTeacher('all');
  };

  return (
    <BaseSidebar
      currentModule="evaluaciones"
      currentUser={currentUser}
      isPrivileged={isPrivileged}
      selectedTeacher={selectedTeacher}
      onSelectTeacher={handleSelectGradeTeacher}
      onResetTeacher={handleResetTeacher}
      onBackToModules={onBackToModules}
      onlineMap={onlineMap}
      onlineCount={onlineCount}
      onOpenConnectionsModal={onOpenConnectionsModal}
      onOpenProfile={onOpenProfile}
      defaultExpanded={true}
      sectionId="finalTeacherSection"
      ownCardTitle="Mi Perfil Docente"
      accentColor="#6366f1"
      id="finalExamsSidebar"
      stats={stats}
    >
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
    </BaseSidebar>
  );
}
