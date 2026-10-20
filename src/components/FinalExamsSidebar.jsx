import finalExamsService from '../services/finalExamsService.js';
import TeacherAccordion, { SidebarBackBtn } from './TeacherAccordion.jsx';

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
      <SidebarBackBtn onBackToModules={onBackToModules} />

      {/* Sección Unificada de Docentes (Acordeón para Directivos o Tarjeta para Docente Titular) */}
      <TeacherAccordion
        currentUser={currentUser}
        isPrivileged={isPrivileged}
        selectedTeacher={selectedTeacher}
        onSelectTeacher={(name) => handleSelectGradeTeacher({ name })}
        onTeacherSelect={onSelectTeacher}
        onReset={handleResetTeacher}
        defaultExpanded={true}
        onlineMap={onlineMap}
        onlineCount={onlineCount}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onOpenProfile={onOpenProfile}
        sectionId="finalTeacherSection"
        ownCardTitle="Mi Perfil Docente"
        accentColor="#6366f1"
        getTeacherTitle={(t) => `Ver exámenes a cargo de ${t.name}`}
      />

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
