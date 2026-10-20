import { useState, useMemo, useEffect } from 'react';
import PortalNavbar from './PortalNavbar';
import FinalExamsSidebar from './FinalExamsSidebar';
import EvaluationCalendarModal from './EvaluationCalendarModal';
import finalExamsService from '../services/finalExamsService';
import { getUserAvatar } from '../services/avatarService';
import './FinalExamsModule.css';

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

export default function FinalExamsModule({
  currentUser,
  onBackToModules,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineMap = {},
  onlineCount = 0,
  circularesCount = 0,
  onOpenCirculares,
  onOpenTour,
  onLogout
}) {
  const isRectora = currentUser?.role === 'rectora' || currentUser?.role === 'induccion_rectora';
  const isAdmin = currentUser?.role === 'admin';
  const isCoordinador = currentUser?.role === 'coordinador';
  const isPrivileged = isRectora || isAdmin || isCoordinador;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [curriculumTick, setCurriculumTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => {
      setCurriculumTick(t => t + 1);
    };
    window.addEventListener('gmg_final_exams_updated', handleUpdate);
    return () => window.removeEventListener('gmg_final_exams_updated', handleUpdate);
  }, []);

  const availableInstances = useMemo(() => finalExamsService.getInstances(), []);
  const availableGrades = useMemo(() => {
    return finalExamsService.getGradesForUser(currentUser);
  }, [currentUser, curriculumTick]);

  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedInstance, setSelectedInstance] = useState(availableInstances[0] || 'Convocatoria Ordinaria Final (100%)');
  const [selectedGrade, setSelectedGrade] = useState(availableGrades[0] || '1° Primaria');
  const [activeSheetType, setActiveSheetType] = useState('subject');

  const availableSubjects = useMemo(() => {
    return finalExamsService.getSubjectsForGradeAndUser(selectedGrade, currentUser);
  }, [selectedGrade, currentUser, curriculumTick]);

  const [selectedSubject, setSelectedSubject] = useState(availableSubjects[0] || 'Lengua Castellana');
  const [toastMessage, setToastMessage] = useState(null);

  const handleTeacherSelect = (teacherName) => {
    setSelectedTeacher(teacherName);
    if (teacherName !== 'all') {
      const teacherGradeMap = {
        'Profe 1': 'Transición',
        'Jessica': '1° Primaria',
        'Yuri': '2° Primaria',
        'Profe 2': '3° Primaria',
        'Elcy': '4° Primaria',
        'Profe 3': '5° Primaria'
      };
      const targetGrade = teacherGradeMap[teacherName];
      if (targetGrade && availableGrades.includes(targetGrade)) {
        setSelectedGrade(targetGrade);
        setActiveSheetType('subject');
      }
    }
  };

  useEffect(() => {
    if (!availableGrades.includes(selectedGrade)) {
      setSelectedGrade(availableGrades[0] || '1° Primaria');
    }
  }, [availableGrades, selectedGrade]);

  useEffect(() => {
    if (!availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0] || 'Lengua Castellana');
    }
  }, [availableSubjects, selectedSubject]);

  const branchData = useMemo(() => {
    return finalExamsService.getBranch(selectedYear, selectedInstance, selectedGrade, selectedSubject);
  }, [selectedYear, selectedInstance, selectedGrade, selectedSubject, curriculumTick]);

  const [students, setStudents] = useState(branchData.students || []);

  useEffect(() => {
    const freshBranch = finalExamsService.getBranch(selectedYear, selectedInstance, selectedGrade, selectedSubject);
    setStudents(freshBranch.students || []);
  }, [selectedYear, selectedInstance, selectedGrade, selectedSubject, curriculumTick]);

  const consolidatedData = useMemo(() => {
    return finalExamsService.getConsolidatedGradeSheet(selectedYear, selectedInstance, selectedGrade);
  }, [selectedYear, selectedInstance, selectedGrade, curriculumTick, branchData, students]);

  const gradeDirector = useMemo(() => {
    return finalExamsService.getGradeDirector(selectedGrade);
  }, [selectedGrade, curriculumTick]);

  const teacherInfo = useMemo(() => {
    return finalExamsService.getTeacherAssignment(selectedGrade, selectedSubject);
  }, [selectedGrade, selectedSubject, curriculumTick]);

  const isViewingAsGradeDirector = useMemo(() => {
    return finalExamsService.isViewingAsGradeDirector(currentUser, selectedGrade, selectedSubject);
  }, [currentUser, selectedGrade, selectedSubject, curriculumTick]);

  const canEditScores = useMemo(() => {
    return finalExamsService.canEditScores(currentUser, selectedGrade, selectedSubject);
  }, [currentUser, selectedGrade, selectedSubject, curriculumTick]);

  const canEditFeedback = useMemo(() => {
    return finalExamsService.canEditFeedback(currentUser, selectedGrade, selectedSubject);
  }, [currentUser, selectedGrade, selectedSubject, curriculumTick]);

  const canEditDirective = useMemo(() => {
    return finalExamsService.canEditDirectiveSuggestion(currentUser);
  }, [currentUser]);

  const canEditCoordinacion = useMemo(() => {
    return finalExamsService.canEditCoordinacionObservation(currentUser);
  }, [currentUser]);

  const canManageCalendar = useMemo(() => {
    return finalExamsService.canManageCalendar(currentUser);
  }, [currentUser]);

  // Manejo de notas numéricas del examen final
  const handleScoreChange = (id, field, value) => {
    if (!canEditScores) return;

    let num = parseFloat(value);
    if (isNaN(num)) num = '';
    else if (num > 5.0) num = 5.0;
    else if (num < 0) num = 0;

    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        const updated = { ...student, [field]: num };
        const t = Number(updated.notaTeorico) || 0;
        const p = Number(updated.notaPractico) || 0;
        const a = Number(updated.notaAcumulativo) || 0;
        const def = Number(((t * 0.4) + (p * 0.4) + (a * 0.2)).toFixed(1));

        let est = 'Promovido';
        if (def < 3.0) est = 'En Nivelación';
        if (def < 2.0) est = 'Reprobado';

        return {
          ...updated,
          definitiva: def,
          estadoPromocion: est
        };
      }
      return student;
    }));
  };

  const handleTeacherFeedbackChange = (id, value) => {
    if (!canEditFeedback) return;
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, retroalimentacionDocente: value };
      }
      return student;
    }));
  };

  const handleDirectiveSuggestionChange = (id, value) => {
    if (!canEditDirective) return;
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, sugerenciaDirectiva: value };
      }
      return student;
    }));
  };

  const handleCoordinacionObservationChange = (id, value) => {
    if (!canEditCoordinacion) return;
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, observacionCoordinacion: value };
      }
      return student;
    }));
  };

  const getDesempeno = (score) => {
    const s = Number(score);
    if (s >= 4.6) return { label: 'Superior', className: 'tag-pastel-superior', icon: 'ph-trophy' };
    if (s >= 4.0) return { label: 'Alto', className: 'tag-pastel-alto', icon: 'ph-check-circle' };
    if (s >= 3.0) return { label: 'Básico', className: 'tag-pastel-basico', icon: 'ph-check' };
    return { label: 'Bajo', className: 'tag-pastel-bajo', icon: 'ph-warning' };
  };

  // Métricas agregadas
  const classAverage = useMemo(() => {
    if (!students.length) return '0.0';
    const total = students.reduce((acc, curr) => acc + (Number(curr.definitiva) || 0), 0);
    return (total / students.length).toFixed(1);
  }, [students]);

  const passRate = useMemo(() => {
    if (!students.length) return 0;
    const passed = students.filter(s => Number(s.definitiva) >= 3.0).length;
    return Math.round((passed / students.length) * 100);
  }, [students]);

  const handleSaveAction = () => {
    try {
      finalExamsService.saveBranch(selectedYear, selectedInstance, selectedGrade, selectedSubject, students, currentUser);
      
      let msg = '✓ Evaluaciones finales guardadas y sincronizadas exitosamente.';
      if (canEditCoordinacion && !canEditScores) {
        msg = '✓ Observaciones de Coordinación Académica registradas en la nube.';
      } else if (canEditDirective && !canEditScores) {
        msg = '✓ Sugerencias de auditoría directiva registradas con éxito.';
      }
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 3800);
    } catch (e) {
      alert(`Error al guardar: ${e.message}`);
    }
  };

  return (
    <div className="final-exams-module-wrapper" id="finalExamsModule">
      {/* Barra de Navegación Institucional */}
      <PortalNavbar 
        currentUser={currentUser}
        moduleTitle="Evaluaciones Finales"
        moduleSubtitle="Evaluaciones Acumulativas & Cierres SIEE"
        onBackToModules={onBackToModules}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      {/* Layout de Panel Lateral + Contenido */}
      <div className="final-exams-body-layout">
        <div className={`sidebar-container ${isSidebarOpen ? 'mobile-open' : ''}`}>
          <FinalExamsSidebar 
            currentUser={currentUser}
            selectedGrade={selectedGrade}
            onSelectGrade={(g) => {
              setSelectedGrade(g);
              setIsSidebarOpen(false);
            }}
            selectedSubject={selectedSubject}
            onSelectSubject={(s) => {
              setSelectedSubject(s);
              setIsSidebarOpen(false);
            }}
            activeSheetType={activeSheetType}
            onSelectSheetType={(t) => {
              setActiveSheetType(t);
              setIsSidebarOpen(false);
            }}
            selectedInstance={selectedInstance}
            onSelectInstance={(i) => {
              setSelectedInstance(i);
              setIsSidebarOpen(false);
            }}
            selectedTeacher={selectedTeacher}
            onSelectTeacher={handleTeacherSelect}
            availableGrades={availableGrades}
            availableSubjects={availableSubjects}
            availableInstances={availableInstances}
            onlineMap={onlineMap}
            onlineCount={onlineCount}
            onOpenConnectionsModal={onOpenConnectionsModal}
            onOpenProfile={onOpenProfile}
            onBackToModules={onBackToModules}
          />
        </div>

        {isSidebarOpen && (
          <div className="mobile-backdrop" onClick={() => setIsSidebarOpen(false)}></div>
        )}

        {/* Área de Contenido Principal */}
        <main className="final-exams-content-area">
          {/* Encabezado Superior Compacto */}
          <section className="final-exams-header-compact">
            <div className="final-exams-header-left">
              <h2 className="final-exams-main-title">
                <i className={`ph-bold ${activeSheetType === 'consolidated' ? 'ph-seal-check' : 'ph-certificate'}`}></i>
                {activeSheetType === 'consolidated' 
                  ? `Sábana Consolidada de Evaluación Final & Promoción • ${selectedGrade}` 
                  : `Planilla: ${selectedSubject} • ${selectedGrade} (Examen Final)`
                }
              </h2>
              <div className="final-exams-pills-row">
                {activeSheetType === 'consolidated' ? (
                  <span className="final-role-pill mode-consolidada">
                    <i className="ph-bold ph-squares-four"></i>
                    Vista de Promoción del Grado
                  </span>
                ) : canEditScores ? (
                  <span className="final-role-pill mode-docente">
                    <i className="ph-bold ph-pencil-simple-line"></i>
                    Modo Calificación Final Docente ({currentUser?.name || teacherInfo.teacherName})
                  </span>
                ) : isViewingAsGradeDirector ? (
                  <span className="final-role-pill mode-director-curso">
                    <i className="ph-bold ph-shield-star"></i>
                    Supervisión: Dir. de Curso ({gradeDirector.teacherName})
                  </span>
                ) : isRectora ? (
                  <span className="final-role-pill mode-rectora">
                    <i className="ph-bold ph-lock-key"></i>
                    Supervisión Directiva • Cierre SIEE
                  </span>
                ) : (
                  <span className="final-role-pill mode-admin">
                    <i className="ph-bold ph-shield-check"></i>
                    Consola de Control & Auditoría Final
                  </span>
                )}

                <span className="final-metric-pill" title="Promedio general actual">
                  <i className="ph-bold ph-chart-line-up"></i> Prom: <strong>{activeSheetType === 'consolidated' ? consolidatedData.stats.gradeAverage : classAverage}</strong>
                </span>
                <span className="final-metric-pill" title="Porcentaje de aprobación">
                  <i className="ph-bold ph-check-circle"></i> Aprob: <strong>{activeSheetType === 'consolidated' ? `${consolidatedData.stats.gradePassRate}%` : `${passRate}%`}</strong>
                </span>
                <span className="final-metric-pill" title="Estudiantes evaluados">
                  <i className="ph-bold ph-student"></i> Alumnos: <strong>{activeSheetType === 'consolidated' ? consolidatedData.stats.totalStudents : students.length}</strong>
                </span>
                <span className="final-metric-pill" title="Docente titular">
                  <i className="ph-bold ph-chalkboard-teacher"></i> {activeSheetType === 'consolidated' ? `Dir: ${gradeDirector.teacherName}` : `Docente: ${teacherInfo.teacherName}`}
                </span>
              </div>
            </div>

            {canManageCalendar && (
              <div className="final-exams-header-right">
                <button 
                  type="button" 
                  className="btn-header-calendar-control" 
                  onClick={() => setIsCalendarModalOpen(true)}
                  title="Gestión de Fechas, Cierres SIEE y Habilitación de Prórrogas Extemporáneas (Control de Coordinación)"
                >
                  <i className="ph-bold ph-calendar-check"></i>
                  <span>Fechas & Prórrogas</span>
                </button>
              </div>
            )}
          </section>

          {/* =====================================================================
              VISTA 1: SÁBANA CONSOLIDADA DE EVALUACIÓN FINAL & PROMOCIÓN DEL GRADO
              ===================================================================== */}
          {activeSheetType === 'consolidated' ? (
            <section className="final-sheet-card final-consolidated-sheet-card">
              <div className="final-consolidated-stats-banner">
                <div className="final-stat-metric-box">
                  <span className="stat-label">Promedio Acumulado</span>
                  <strong className="stat-val stat-val-avg">{consolidatedData.stats.gradeAverage}</strong>
                  <span className="stat-hint">Transición a 5°</span>
                </div>
                <div className="final-stat-metric-box">
                  <span className="stat-label">Índice de Promoción</span>
                  <strong className="stat-val stat-val-pass">{consolidatedData.stats.gradePassRate}%</strong>
                  <span className="stat-hint">{consolidatedData.stats.passedCount} de {consolidatedData.stats.totalStudents} estudiantes</span>
                </div>
                <div className="final-stat-metric-box">
                  <span className="stat-label">En Nivelación / Comisión</span>
                  <strong className="stat-val stat-val-warn">{consolidatedData.stats.failedCount}</strong>
                  <span className="stat-hint">Pendientes por dictamen final</span>
                </div>
                <div className="final-stat-metric-box">
                  <span className="stat-label">Dirección de Curso</span>
                  <strong className="stat-val stat-val-director">{consolidatedData.stats.director.teacherName}</strong>
                  <span className="stat-hint">Acompañamiento SIEE</span>
                </div>
              </div>

              <div className="final-table-wrapper">
                <table className="final-data-table final-consolidated-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45px', textAlign: 'center' }}>Puesto</th>
                      <th style={{ minWidth: '190px' }}>Estudiante</th>
                      {consolidatedData.subjects.map(subj => (
                        <th key={subj} style={{ textAlign: 'center', minWidth: '85px' }} title={`Evaluación Final de ${subj}`}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                            <i className={`ph-bold ${getSubjectIcon(subj)}`} style={{ fontSize: '1rem', color: '#6d28d9' }}></i>
                            <span style={{ fontSize: '0.68rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85px' }}>
                              {subj.split(' ')[0]}
                            </span>
                          </div>
                        </th>
                      ))}
                      <th style={{ width: '75px', textAlign: 'center', backgroundColor: '#f5f3ff' }}>Promedio</th>
                      <th style={{ width: '85px', textAlign: 'center' }}>Reprobadas</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>Dictamen de Promoción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consolidatedData.students.map((st) => (
                      <tr key={st.id}>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`ranking-badge ${st.ranking === 1 ? 'rank-1' : (st.ranking === 2 ? 'rank-2' : (st.ranking === 3 ? 'rank-3' : ''))}`}>
                            {st.ranking}°
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="final-student-avatar-mini">
                              <i className="ph-bold ph-student"></i>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{st.name}</strong>
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{st.id}</span>
                            </div>
                          </div>
                        </td>
                        {consolidatedData.subjects.map(subj => {
                          const score = st.subjectScores[subj] || 0;
                          const isLow = score > 0 && score < 3.0;
                          return (
                            <td key={subj} style={{ textAlign: 'center', fontWeight: 600 }}>
                              <span className={`consolidated-score-pill ${isLow ? 'score-low' : (score >= 4.6 ? 'score-sup' : '')}`}>
                                {score > 0 ? score.toFixed(1) : '-'}
                              </span>
                            </td>
                          );
                        })}
                        <td style={{ textAlign: 'center', fontWeight: 800, backgroundColor: '#faf5ff', color: '#4c1d95', fontSize: '0.92rem' }}>
                          {st.average.toFixed(1)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`failed-count-chip ${st.failedSubjects > 0 ? 'has-failed' : 'clean'}`}>
                            {st.failedSubjects}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`promotion-status-pill ${st.dictamen === 'Promovido' ? 'status-promoted' : (st.dictamen === 'Nivelación Pendiente' ? 'status-recovery' : 'status-commission')}`}>
                            <i className={`ph-bold ${st.dictamen === 'Promovido' ? 'ph-check-circle' : 'ph-warning'}`}></i>
                            {st.dictamen}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="final-table-footer">
                <div className="final-footer-hint">
                  <i className="ph-bold ph-info"></i>
                  <span>Sábana consolidada de fin de año lectivo. Conforme al Decreto 1290 y SIEE del Gimnasio Martin Galeano.</span>
                </div>
                <button 
                  type="button" 
                  className="grades-btn-secondary" 
                  onClick={() => alert(`Exportando Sábana Consolidada de Evaluación Final de ${selectedGrade} a Excel...`)}
                >
                  <i className="ph-bold ph-file-xls"></i>
                  <span>Exportar Consolidado Excel</span>
                </button>
              </div>
            </section>
          ) : (
            /* =====================================================================
                VISTA 2: PLANILLA DE EVALUACIÓN FINAL POR ASIGNATURA
                ===================================================================== */
            <section className="final-sheet-card">
              <div className="final-table-wrapper">
                <table className="final-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                      <th style={{ width: '80px' }}>Código</th>
                      <th style={{ minWidth: '180px' }}>Estudiante</th>
                      <th style={{ width: '90px', textAlign: 'center' }} title="Examen Escrito / Teórico (40%)">
                        Teórico <br/><small>(40%)</small>
                      </th>
                      <th style={{ width: '90px', textAlign: 'center' }} title="Sustentación / Práctica (40%)">
                        Práctico <br/><small>(40%)</small>
                      </th>
                      <th style={{ width: '90px', textAlign: 'center' }} title="Prueba Acumulativa Saber (20%)">
                        Saber <br/><small>(20%)</small>
                      </th>
                      <th style={{ width: '85px', textAlign: 'center', backgroundColor: '#f5f3ff' }}>
                        Nota Final <br/><small>(SIEE)</small>
                      </th>
                      <th style={{ width: '95px', textAlign: 'center' }}>Desempeño</th>
                      <th style={{ width: '105px', textAlign: 'center' }}>Estado</th>
                      <th style={{ minWidth: '180px' }}>Retroalimentación Docente</th>
                      <th style={{ minWidth: '180px', backgroundColor: '#eef2ff' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#4338ca' }}>
                          <i className="ph-bold ph-clipboard-text"></i>
                          <span>Obs. Coordinación</span>
                        </div>
                      </th>
                      <th style={{ minWidth: '180px', backgroundColor: '#fefce8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#b45309' }}>
                          <i className="ph-bold ph-crown"></i>
                          <span>Sugerencia Rectora</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((st, index) => {
                      const desemp = getDesempeno(st.definitiva);
                      return (
                        <tr key={st.id}>
                          <td style={{ textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>{index + 1}</td>
                          <td style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 600 }}>{st.id}</td>
                          <td>
                            <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>{st.name}</strong>
                          </td>
                          {/* Nota Teórico */}
                          <td style={{ textAlign: 'center' }}>
                            {canEditScores ? (
                              <input 
                                type="number" 
                                min="0" 
                                max="5" 
                                step="0.1" 
                                value={st.notaTeorico} 
                                onChange={(e) => handleScoreChange(st.id, 'notaTeorico', e.target.value)} 
                                className="final-score-input"
                              />
                            ) : (
                              <span className="final-score-readonly">{st.notaTeorico !== undefined && st.notaTeorico !== '' ? Number(st.notaTeorico).toFixed(1) : '-'}</span>
                            )}
                          </td>
                          {/* Nota Práctico */}
                          <td style={{ textAlign: 'center' }}>
                            {canEditScores ? (
                              <input 
                                type="number" 
                                min="0" 
                                max="5" 
                                step="0.1" 
                                value={st.notaPractico} 
                                onChange={(e) => handleScoreChange(st.id, 'notaPractico', e.target.value)} 
                                className="final-score-input"
                              />
                            ) : (
                              <span className="final-score-readonly">{st.notaPractico !== undefined && st.notaPractico !== '' ? Number(st.notaPractico).toFixed(1) : '-'}</span>
                            )}
                          </td>
                          {/* Nota Acumulativo */}
                          <td style={{ textAlign: 'center' }}>
                            {canEditScores ? (
                              <input 
                                type="number" 
                                min="0" 
                                max="5" 
                                step="0.1" 
                                value={st.notaAcumulativo} 
                                onChange={(e) => handleScoreChange(st.id, 'notaAcumulativo', e.target.value)} 
                                className="final-score-input"
                              />
                            ) : (
                              <span className="final-score-readonly">{st.notaAcumulativo !== undefined && st.notaAcumulativo !== '' ? Number(st.notaAcumulativo).toFixed(1) : '-'}</span>
                            )}
                          </td>
                          {/* Definitiva Calculada */}
                          <td style={{ textAlign: 'center', backgroundColor: '#faf5ff', fontWeight: 800, color: '#4c1d95', fontSize: '0.92rem' }}>
                            {st.definitiva !== undefined ? Number(st.definitiva).toFixed(1) : '-'}
                          </td>
                          {/* Desempeño */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`tag-pastel ${desemp.className}`}>
                              <i className={`ph-bold ${desemp.icon}`}></i>
                              {desemp.label}
                            </span>
                          </td>
                          {/* Estado */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`promotion-status-pill ${st.estadoPromocion === 'Promovido' ? 'status-promoted' : (st.estadoPromocion === 'En Nivelación' ? 'status-recovery' : 'status-commission')}`}>
                              {st.estadoPromocion}
                            </span>
                          </td>
                          {/* Retroalimentación Docente */}
                          <td>
                            {canEditFeedback ? (
                              <textarea 
                                rows="2" 
                                value={st.retroalimentacionDocente || ''} 
                                onChange={(e) => handleTeacherFeedbackChange(st.id, e.target.value)} 
                                placeholder="Logros y recomendaciones finales..." 
                                className="final-textarea-input"
                              />
                            ) : (
                              <p className="final-text-readonly">{st.retroalimentacionDocente || 'Sin retroalimentación docente.'}</p>
                            )}
                          </td>
                          {/* Observación Coordinación Académica */}
                          <td style={{ backgroundColor: '#f8fafc' }}>
                            {canEditCoordinacion ? (
                              <textarea 
                                rows="2" 
                                value={st.observacionCoordinacion || ''} 
                                onChange={(e) => handleCoordinacionObservationChange(st.id, e.target.value)} 
                                placeholder="Observación oficial de Coordinación..." 
                                className="final-textarea-input final-textarea-coord"
                              />
                            ) : (
                              <p className="final-text-readonly" style={{ color: '#4338ca' }}>
                                {st.observacionCoordinacion || 'Sin observaciones de Coordinación.'}
                              </p>
                            )}
                          </td>
                          {/* Sugerencia Rectora */}
                          <td style={{ backgroundColor: '#fffbeb' }}>
                            {canEditDirective ? (
                              <textarea 
                                rows="2" 
                                value={st.sugerenciaDirectiva || ''} 
                                onChange={(e) => handleDirectiveSuggestionChange(st.id, e.target.value)} 
                                placeholder="Sugerencia de auditoría directiva..." 
                                className="final-textarea-input final-textarea-dir"
                              />
                            ) : (
                              <p className="final-text-readonly" style={{ color: '#b45309' }}>
                                {st.sugerenciaDirectiva || 'Sin sugerencia directiva.'}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pie de tabla con leyenda y acciones */}
              <div className="final-table-footer">
                <div className="final-footer-hint">
                  <i className="ph-bold ph-scales"></i>
                  <span>
                    Ponderación SIEE Evaluación Final: Teórico (40%) + Práctico (40%) + Saber (20%).
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    type="button" 
                    className="grades-btn-secondary" 
                    onClick={() => alert(`Exportando calificaciones de evaluación final de ${selectedSubject} en Excel...`)}
                  >
                    <i className="ph-bold ph-file-xls"></i>
                    <span>Consolidado Excel</span>
                  </button>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Botón Flotante para Guardar Planilla de Evaluaciones Finales (FAB) */}
      {activeSheetType === 'subject' && (
        <button
          type="button"
          className="btn-floating-upload final-floating-save-btn"
          onClick={handleSaveAction}
          title={
            canEditScores 
              ? "Guardar calificaciones finales y observaciones" 
              : isViewingAsGradeDirector 
              ? `Supervisión de Director(a) de Curso (Notas de ${teacherInfo.teacherName})` 
              : canEditCoordinacion
              ? "Guardar observaciones de Coordinación Académica"
              : (canEditDirective ? "Guardar sugerencias de auditoría directiva" : "Guardar auditoría final")
          }
          style={{
            background: canEditScores
              ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              : canEditCoordinacion
              ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
              : canEditDirective
              ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
              : isViewingAsGradeDirector
              ? 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)'
              : 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
            boxShadow: canEditScores
              ? '0 10px 25px -5px rgba(5, 150, 105, 0.45), 0 8px 10px -6px rgba(5, 150, 105, 0.25)'
              : canEditCoordinacion
              ? '0 10px 25px -5px rgba(99, 102, 241, 0.45), 0 8px 10px -6px rgba(99, 102, 241, 0.25)'
              : canEditDirective
              ? '0 10px 25px -5px rgba(217, 119, 6, 0.45), 0 8px 10px -6px rgba(217, 119, 6, 0.25)'
              : '0 10px 25px -5px rgba(30, 41, 59, 0.45), 0 8px 10px -6px rgba(30, 41, 59, 0.25)',
            cursor: isViewingAsGradeDirector ? 'default' : 'pointer'
          }}
        >
          <i className={`ph-bold ${
            canEditScores 
              ? 'ph-floppy-disk' 
              : isViewingAsGradeDirector 
              ? 'ph-eye' 
              : canEditCoordinacion
              ? 'ph-clipboard-text'
              : (canEditDirective ? 'ph-crown' : 'ph-shield-check')
          }`}></i>
          <span>
            {canEditScores 
              ? 'Guardar Evaluaciones' 
              : isViewingAsGradeDirector 
              ? 'Modo Director de Curso' 
              : canEditCoordinacion
              ? 'Guardar Observaciones'
              : (canEditDirective ? 'Guardar Sugerencias' : 'Guardar Auditoría')
            }
          </span>
        </button>
      )}

      {/* Modal de Control de Fechas, Cierres SIEE y Prórrogas */}
      <EvaluationCalendarModal 
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentUser={currentUser}
        onCalendarUpdated={() => setCurriculumTick(t => t + 1)}
      />

      {/* Notificación Toast Flotante */}
      {toastMessage && (
        <div className="grades-toast">
          <i className="ph-bold ph-check-circle" style={{ fontSize: '1.25rem', color: '#34d399' }}></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
