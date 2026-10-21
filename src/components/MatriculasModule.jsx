import { useState, useEffect, useMemo } from 'react';
import PortalNavbar from './PortalNavbar';
import EnrollStudentModal from './EnrollStudentModal';
import RetireStudentModal from './RetireStudentModal';
import StudentAuditDetailModal from './StudentAuditDetailModal';
import gradesService from '../services/gradesService';
import { GRADES_LIST, normalizeGrade } from '../data/gradesTreeData';
import './MatriculasModule.css';

/**
 * FASE 5: GESTIÓN DE MATRÍCULA E HISTÓRICO BLINDADO (NO ELIMINACIÓN)
 * Panel de Matriculados (Acceso: Solo Admin, Rectora y Coordinación)
 * 
 * Reglas de Negocio:
 * 1. Modal interactivo para inscribir nuevos estudiantes extemporáneos (Nombre, Código, Grado, Acudiente, Fecha de Ingreso).
 * 2. Regla de oro de Auditoría (Soft-Disable): Queda estrictamente prohibido eliminar (DELETE) un estudiante.
 * 3. En caso de retiro o traslado, se habilita la acción Inhabilitar / Marcar Retirado.
 * 4. El estudiante permanece visible en la lista histórica.
 * 5. Sus notas previas se conservan para auditoría y los periodos futuros o evaluaciones no presentadas se registran con 1.0 por defecto para el cómputo del consolidado anual.
 * 6. Su registro no altera el conteo de la fórmula de copias (N+1) de la Fase 4.
 */
export default function MatriculasModule({
  currentUser,
  onBackToModules,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineCount = 0,
  circularesCount = 0,
  onOpenCirculares,
  isNotificationsOpen = false,
  onOpenTour,
  onLogout
}) {
  // Verificación estricta de permisos RBAC: Solo Admin, Rectora y Coordinación
  const canAccess = gradesService.canManageMatricula(currentUser);

  // Estados de navegación y filtros
  const [selectedGrade, setSelectedGrade] = useState('all'); // 'all' o grado específico
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'retired'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'annual'
  const [annualGrade, setAnnualGrade] = useState('1° Primaria');

  // Modales interactivos
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState(null);

  // Notificaciones Toast flotantes
  const [toastMessage, setToastMessage] = useState(null);

  // Tick de reactividad ante cambios de matrícula o currículo
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setTick(t => t + 1);
    };
    window.addEventListener('gmg_roster_updated', handleUpdate);
    window.addEventListener('gmg_curriculum_updated', handleUpdate);
    return () => {
      window.removeEventListener('gmg_roster_updated', handleUpdate);
      window.removeEventListener('gmg_curriculum_updated', handleUpdate);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(curr => (curr === msg ? null : curr));
    }, 4500);
  };

  // Carga de todos los estudiantes históricos registrados
  const allStudents = useMemo(() => {
    return gradesService.getAllStudents('2026');
  }, [tick]);

  // Métricas globales del censo institucional
  const metrics = useMemo(() => {
    const total = allStudents.length;
    const active = allStudents.filter(s => s.active).length;
    const retired = allStudents.filter(s => !s.active).length;

    // Conteo N+1 por grado o general
    let printCopiesCount = 0;
    if (selectedGrade === 'all') {
      // Suma del tiraje N+1 de cada grado oficial
      GRADES_LIST.forEach(g => {
        const info = gradesService.getPrintingCopiesSuggestion(g);
        printCopiesCount += info.suggestedCopies;
      });
    } else {
      const info = gradesService.getPrintingCopiesSuggestion(selectedGrade);
      printCopiesCount = info.suggestedCopies;
    }

    return { total, active, retired, printCopiesCount };
  }, [allStudents, selectedGrade]);

  // Filtrado reactivo de estudiantes
  const filteredStudents = useMemo(() => {
    return allStudents.filter(s => {
      if (selectedGrade !== 'all' && s.grade !== selectedGrade) {
        return false;
      }
      if (statusFilter === 'active' && !s.active) {
        return false;
      }
      if (statusFilter === 'retired' && s.active) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesId = s.id.toLowerCase().includes(q);
        const matchesGuardian = s.acudiente && s.acudiente.toLowerCase().includes(q);
        const matchesGrade = s.grade && s.grade.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesGuardian && !matchesGrade) {
          return false;
        }
      }
      return true;
    });
  }, [allStudents, selectedGrade, statusFilter, searchTerm]);

  // Consolidado anual SIEE para la pestaña de consolidado
  const annualConsolidated = useMemo(() => {
    return gradesService.getAnnualConsolidatedGradeSheet('2026', annualGrade);
  }, [annualGrade, tick]);

  // Manejadores de acciones
  const handleOpenRetire = (student) => {
    setSelectedStudentForAction(student);
    setIsRetireModalOpen(true);
  };

  const handleOpenAudit = (student) => {
    setSelectedStudentForAction(student);
    setIsAuditModalOpen(true);
  };

  const handleReactivate = (student) => {
    if (!window.confirm(`¿Desea reactivar al estudiante "${student.name}" en el censo oficial?\nVolverá a ser contabilizado en la fórmula de copias N+1.`)) {
      return;
    }
    try {
      gradesService.reactivateStudent(student.grade, student.id, currentUser);
      showToast(`¡Estudiante ${student.name} reactivado con éxito! El tiraje N+1 se ha recalculado.`);
    } catch (err) {
      alert(`Error al reactivar estudiante: ${err.message}`);
    }
  };

  // Si no tiene permisos, mostrar pantalla de restricción
  if (!canAccess) {
    return (
      <div className="matriculas-denied-container">
        <PortalNavbar
          currentUser={currentUser}
          moduleTitle="Panel de Matriculados (Fase 5)"
          moduleSubtitle="Gestión de Matrícula e Histórico Blindado"
          onBackToModules={onBackToModules}
          onOpenProfile={onOpenProfile}
          onOpenConnectionsModal={onOpenConnectionsModal}
          onlineCount={onlineCount}
          circularesCount={circularesCount}
          isNotificationsOpen={isNotificationsOpen}
          onOpenCirculares={onOpenCirculares}
          onOpenTour={onOpenTour}
          onLogout={onLogout}
        />
        <div className="matriculas-denied-card">
          <div className="denied-icon">
            <i className="ph-bold ph-lock-key"></i>
          </div>
          <h2>Acceso Restringido · Panel de Matriculados (Fase 5)</h2>
          <p>
            Por mandato institucional y directivas de auditoría SIEE, el módulo de <strong>Gestión de Matrícula, Inscripción Extemporánea e Histórico Blindado</strong> está reservado exclusivamente para la <strong>Rectora</strong>, el <strong>Administrador General</strong> y la <strong>Coordinación Académica</strong>.
          </p>
          <div className="denied-actions">
            <button type="button" className="btn-matriculas-back" onClick={onBackToModules}>
              <i className="ph-bold ph-arrow-left"></i> Volver al Portal de Módulos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="matriculas-module-container">
      {/* Navbar Superior Unificado */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle="Panel de Matriculados"
        moduleSubtitle="Fase 5 · Gestión de Matrícula e Histórico Blindado (SIEE)"
        onBackToModules={onBackToModules}
        onOpenProfile={onOpenProfile}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        isNotificationsOpen={isNotificationsOpen}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onLogout={onLogout}
      />

      <div className="matriculas-content-wrapper">
        {/* Banner Institucional Superior */}
        <section className="matriculas-header-banner">
          <div className="banner-left">
            <div className="banner-badge-fase">
              <i className="ph-bold ph-shield-check"></i> FASE 5 · HISTÓRICO BLINDADO (NO ELIMINACIÓN)
            </div>
            <h2>Panel Oficial de Matrícula & Censo Estudiantil</h2>
            <p>
              Inscripción de nuevos estudiantes extemporáneos, censo escolar perpetuo y regla de oro de auditoría: 
              <strong> prohibición estricta de eliminación</strong> con soporte de inhabilitación por traslado o retiro.
            </p>
          </div>
          <div className="banner-right">
            <button
              type="button"
              className="btn-open-enroll"
              onClick={() => setIsEnrollModalOpen(true)}
              title="Inscribir nuevo estudiante extemporáneo al colegio"
            >
              <i className="ph-bold ph-user-plus"></i>
              <span>+ Inscribir Estudiante Extemporáneo</span>
            </button>
          </div>
        </section>

        {/* 4 Tarjetas de Métricas KPI */}
        <section className="matriculas-metrics-grid">
          <div className="metric-kpi-card kpi-total">
            <div className="kpi-icon-wrap icon-total">
              <i className="ph-bold ph-student"></i>
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Censo Total Registrado</span>
              <strong className="kpi-value">{metrics.total} Alumnos</strong>
              <span className="kpi-sub">100% visible en histórico blindado</span>
            </div>
          </div>

          <div className="metric-kpi-card kpi-active">
            <div className="kpi-icon-wrap icon-active">
              <i className="ph-bold ph-check-circle"></i>
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Estudiantes Activos en Aula</span>
              <strong className="kpi-value">{metrics.active} Alumnos</strong>
              <span className="kpi-sub">Población oficial cursando SIEE</span>
            </div>
          </div>

          <div className="metric-kpi-card kpi-retired">
            <div className="kpi-icon-wrap icon-retired">
              <i className="ph-bold ph-user-minus"></i>
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Retirados / Traslados</span>
              <strong className="kpi-value">{metrics.retired} Inhabilitados</strong>
              <span className="kpi-sub">Notas previas intactas para auditoría</span>
            </div>
          </div>

          <div className="metric-kpi-card kpi-print">
            <div className="kpi-icon-wrap icon-print">
              <i className="ph-bold ph-printer"></i>
            </div>
            <div className="kpi-info">
              <span className="kpi-label">
                Tiraje N+1 {selectedGrade !== 'all' ? `(${selectedGrade})` : 'Institucional'}
              </span>
              <strong className="kpi-value">{metrics.printCopiesCount} Copias</strong>
              <span className="kpi-sub">Alumnos activos + 1 copia docente</span>
            </div>
          </div>
        </section>

        {/* Banner Informativo de la Regla de Oro */}
        <div className="matriculas-golden-rule-banner">
          <div className="rule-badge">
            <i className="ph-bold ph-lock-key"></i> Regla de Oro Institucional
          </div>
          <div className="rule-desc">
            <strong>Prohibición Estricta de Eliminación Física (NO DELETE):</strong> Los estudiantes nunca se borran del sistema. Si se presenta un traslado o retiro, se inhabilitan para excluir su conteo de la fórmula de copias ($N+1$). Sus notas previas se conservan intactas para auditoría, y las evaluaciones o periodos no cursados se computan con <strong>1.0 por defecto</strong> en el consolidado anual.
          </div>
        </div>

        {/* Barra de Filtros y Selector de Pestañas */}
        <div className="matriculas-toolbar-card">
          <div className="toolbar-left">
            {/* Selector de Pestaña */}
            <div className="tab-switcher">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
                onClick={() => setActiveTab('roster')}
              >
                <i className="ph-bold ph-list-dashes"></i> Censo & Roster de Matrícula
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'annual' ? 'active' : ''}`}
                onClick={() => setActiveTab('annual')}
              >
                <i className="ph-bold ph-chart-bar"></i> Consolidado Anual SIEE (Auditoría 1.0)
              </button>
            </div>
          </div>

          <div className="toolbar-right">
            {activeTab === 'roster' ? (
              <>
                {/* Selector de Grado */}
                <div className="filter-select-wrap">
                  <label htmlFor="filter-grade-select">Grado:</label>
                  <select
                    id="filter-grade-select"
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="toolbar-select"
                  >
                    <option value="all">Todos los Grados</option>
                    {GRADES_LIST.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Selector de Estado */}
                <div className="filter-select-wrap">
                  <label htmlFor="filter-status-select">Estado:</label>
                  <select
                    id="filter-status-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="toolbar-select"
                  >
                    <option value="all">Todos (Histórico Completo)</option>
                    <option value="active">Solo Activos en Aula</option>
                    <option value="retired">Solo Retirados / Inhabilitados</option>
                  </select>
                </div>

                {/* Buscador Interactivo */}
                <div className="toolbar-search-wrap">
                  <i className="ph-bold ph-magnifying-glass search-icon"></i>
                  <input
                    type="text"
                    placeholder="Buscar estudiante, código, acudiente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="toolbar-search-input"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSearchTerm('')}
                    >
                      ×
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="filter-select-wrap">
                <label htmlFor="annual-grade-select">Grado Académico:</label>
                <select
                  id="annual-grade-select"
                  value={annualGrade}
                  onChange={(e) => setAnnualGrade(e.target.value)}
                  className="toolbar-select"
                >
                  {GRADES_LIST.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* CONTENIDO DE LA PESTAÑA 1: ROSTER DE MATRÍCULA E HISTÓRICO */}
        {activeTab === 'roster' && (
          <section className="matriculas-table-card">
            <div className="table-card-header">
              <div className="header-meta">
                <h4>
                  {selectedGrade === 'all' ? 'Censo General de Estudiantes' : `Roster de ${selectedGrade}`}
                </h4>
                <span className="count-pill">
                  {filteredStudents.length} estudiantes listados
                </span>
              </div>
              <div className="header-badges">
                <span className="badge-nplusone-live">
                  <i className="ph-bold ph-printer"></i> Tiraje N+1 Activo: {metrics.printCopiesCount} copias
                </span>
              </div>
            </div>

            <div className="matriculas-table-wrap">
              <table className="matriculas-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th style={{ minWidth: '220px' }}>Estudiante</th>
                    <th style={{ minWidth: '110px' }}>Grado</th>
                    <th style={{ minWidth: '220px' }}>Acudiente & Contacto</th>
                    <th style={{ minWidth: '120px' }}>Fecha Ingreso</th>
                    <th style={{ minWidth: '130px', textAlign: 'center' }}>Estado Oficial</th>
                    <th style={{ minWidth: '110px', textAlign: 'center' }}>Impacto N+1</th>
                    <th style={{ minWidth: '200px', textAlign: 'center' }}>Acciones Institucionales</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="td-empty-table">
                        <i className="ph-bold ph-user-focus empty-icon"></i>
                        <p>No se encontraron estudiantes con los filtros seleccionados.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st, idx) => (
                      <tr key={st.id} className={!st.active ? 'row-retired' : ''}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                          {idx + 1}
                        </td>

                        {/* Estudiante con avatar pastel y código */}
                        <td>
                          <div className="student-profile-cell">
                            <div className={`student-avatar ${st.active ? 'avatar-cell-active' : 'avatar-cell-retired'}`}>
                              {st.name.charAt(0)}
                            </div>
                            <div className="student-text">
                              <span className={`student-name ${!st.active ? 'name-retired' : ''}`}>
                                {st.name}
                              </span>
                              <div className="student-sub-row">
                                <span className="student-code-tag">{st.id}</span>
                                {st.tipoIngreso && st.tipoIngreso !== 'Matrícula Regular' && (
                                  <span className="tag-extemp" title="Modalidad de matrícula extemporánea">
                                    {st.tipoIngreso}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Grado */}
                        <td>
                          <span className="badge-grade-pastel">{st.grade}</span>
                        </td>

                        {/* Acudiente */}
                        <td>
                          <div className="acudiente-cell">
                            <i className="ph-bold ph-users icon-guardian"></i>
                            <span>{st.acudiente || 'Acudiente registrado en secretaría'}</span>
                          </div>
                        </td>

                        {/* Fecha de Ingreso */}
                        <td>
                          <span className="date-cell">
                            <i className="ph-bold ph-calendar-blank"></i> {st.fechaIngreso || '2026-02-02'}
                          </span>
                        </td>

                        {/* Estado Oficial */}
                        <td style={{ textAlign: 'center' }}>
                          {st.active ? (
                            <span className="pill-status-active">
                              <span className="status-dot-active"></span> Activo
                            </span>
                          ) : (
                            <div className="pill-status-retired" title={`Motivo: ${st.motivoRetiro || 'Retiro escolar'} (${st.fechaRetiro || '2026'})`}>
                              <i className="ph-bold ph-user-minus"></i>
                              <span>Retirado</span>
                            </div>
                          )}
                        </td>

                        {/* Impacto N+1 */}
                        <td style={{ textAlign: 'center' }}>
                          {st.active ? (
                            <span className="nplus-pill nplus-included" title="Contabilizado en el tiraje institucional de fotocopias">
                              +1 Copia
                            </span>
                          ) : (
                            <span className="nplus-pill nplus-excluded" title="Excluido de la fórmula de copias por retiro">
                              Excluido
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td style={{ textAlign: 'center' }}>
                          <div className="actions-cell">
                            {st.active ? (
                              <button
                                type="button"
                                className="btn-action-retire"
                                onClick={() => handleOpenRetire(st)}
                                title="Inhabilitar o marcar como retirado (No elimina de BD)"
                              >
                                <i className="ph-bold ph-user-minus"></i>
                                <span>Marcar Retirado</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-action-reactivate"
                                onClick={() => handleReactivate(st)}
                                title="Reactivar estudiante en el censo activo"
                              >
                                <i className="ph-bold ph-arrows-clockwise"></i>
                                <span>Reactivar</span>
                              </button>
                            )}

                            <button
                              type="button"
                              className="btn-action-audit"
                              onClick={() => handleOpenAudit(st)}
                              title="Ver ficha histórica completa y notas en los 4 periodos"
                            >
                              <i className="ph-bold ph-eye"></i>
                              <span>Ficha SIEE</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* CONTENIDO DE LA PESTAÑA 2: CONSOLIDADO ANUAL SIEE (AUDITORÍA 1.0) */}
        {activeTab === 'annual' && (
          <section className="matriculas-table-card">
            <div className="table-card-header">
              <div className="header-meta">
                <h4>Consolidado Histórico Anual SIEE • {annualGrade}</h4>
                <span className="count-pill">
                  {annualConsolidated.students.length} estudiantes • Año Lectivo 2026
                </span>
              </div>
              <div className="header-badges">
                <span className="badge-audit-formula">
                  <i className="ph-bold ph-calculator"></i> Ponderación: 25% por periodo lectivo (P1 a P4)
                </span>
              </div>
            </div>

            <div className="annual-legend-bar">
              <div className="legend-item">
                <span className="legend-box score-high">3.0 - 5.0</span>
                <span>Aprobado</span>
              </div>
              <div className="legend-item">
                <span className="legend-box score-low">1.0 - 2.9</span>
                <span>Reprobado</span>
              </div>
              <div className="legend-item">
                <span className="legend-box score-retired-default">1.0*</span>
                <span>Periodo no cursado tras retiro (1.0 por defecto SIEE)</span>
              </div>
            </div>

            <div className="matriculas-table-wrap">
              <table className="matriculas-table annual-matrix-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>Puesto</th>
                    <th style={{ minWidth: '200px' }}>Estudiante</th>
                    <th style={{ minWidth: '100px', textAlign: 'center' }}>Estado</th>
                    {annualConsolidated.subjects.map((subj) => (
                      <th key={subj} style={{ textAlign: 'center', minWidth: '110px' }}>
                        {subj}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', minWidth: '100px' }}>Promedio Anual</th>
                    <th style={{ textAlign: 'center', minWidth: '90px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {annualConsolidated.students.map((st) => (
                    <tr key={st.id} className={!st.active ? 'row-retired' : ''}>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: '#64748b' }}>
                        {st.rank}°
                      </td>
                      <td>
                        <div className="student-profile-cell">
                          <div className={`student-avatar ${st.active ? 'avatar-cell-active' : 'avatar-cell-retired'}`}>
                            {st.name.charAt(0)}
                          </div>
                          <div>
                            <strong className={`student-name ${!st.active ? 'name-retired' : ''}`}>
                              {st.name}
                            </strong>
                            <span className="student-code-tag">{st.id}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {st.active ? (
                          <span className="pill-status-active">Activo</span>
                        ) : (
                          <span className="pill-status-retired" title={`Retirado: ${st.motivoRetiro || 'Novedad'}`}>
                            Retirado
                          </span>
                        )}
                      </td>
                      {annualConsolidated.subjects.map((subj) => {
                        const note = st.subjectAnnuals[subj] || 1.0;
                        return (
                          <td key={subj} style={{ textAlign: 'center' }}>
                            <span className={`annual-cell-pill ${note >= 3.0 ? 'score-high' : 'score-low'}`}>
                              {note.toFixed(2)}
                            </span>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: 'center' }}>
                        <strong className={`annual-prom-overall ${st.annualAverage >= 3.0 ? 'score-high-text' : 'score-low-text'}`}>
                          {st.annualAverage.toFixed(2)}
                        </strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-action-audit"
                          onClick={() => handleOpenAudit(st)}
                          title="Ver desglose detallado de periodos"
                        >
                          <i className="ph-bold ph-eye"></i> Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {/* Modal 1: Inscribir Estudiante Extemporáneo */}
      <EnrollStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        initialGrade={selectedGrade !== 'all' ? selectedGrade : '1° Primaria'}
        currentUser={currentUser}
        onStudentEnrolled={(newStudent) => {
          showToast(`¡Estudiante ${newStudent.name} matriculado con éxito! Tiraje N+1 actualizado.`);
        }}
      />

      {/* Modal 2: Inhabilitar / Marcar Retirado (Soft-Disable) */}
      <RetireStudentModal
        isOpen={isRetireModalOpen}
        onClose={() => {
          setIsRetireModalOpen(false);
          setSelectedStudentForAction(null);
        }}
        student={selectedStudentForAction}
        grade={selectedStudentForAction?.grade || selectedGrade}
        currentUser={currentUser}
        onStudentRetired={(result) => {
          showToast(`Estudiante ${result.studentName} marcado como Retirado. Notas previas preservadas y cálculo N+1 ajustado.`);
        }}
      />

      {/* Modal 3: Ficha Histórica y Auditoría SIEE */}
      <StudentAuditDetailModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setSelectedStudentForAction(null);
        }}
        student={selectedStudentForAction}
        grade={selectedStudentForAction?.grade || selectedGrade}
        currentUser={currentUser}
        onOpenRetireModal={(st) => {
          setSelectedStudentForAction(st);
          setIsRetireModalOpen(true);
        }}
        onReactivateStudent={handleReactivate}
      />

      {/* Toast Flotante de Notificaciones */}
      {toastMessage && (
        <div className="matriculas-toast">
          <i className="ph-bold ph-check-circle toast-check-icon"></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
