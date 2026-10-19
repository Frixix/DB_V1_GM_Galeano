import { useState, useEffect, useMemo } from 'react';
import PortalNavbar from './PortalNavbar';
import GradesSidebar from './GradesSidebar';
import './GradesModule.css';
import gradesService from '../services/gradesService';
import { STUDENTS_BY_GRADE } from '../data/gradesTreeData';

// Clases pastel para los avatares circulares de estudiantes
const PASTEL_AVATAR_CLASSES = [
  'avatar-pastel-mint',
  'avatar-pastel-sky',
  'avatar-pastel-lavender',
  'avatar-pastel-amber',
  'avatar-pastel-rose',
  'avatar-pastel-teal'
];

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

export default function GradesModule({ 
  currentUser, 
  onBackToModules, 
  onNavigateToReemplazos,
  onLogout,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineMap = {},
  onlineCount,
  circularesCount = 0,
  onOpenCirculares,
  onOpenTour
}) {
  // Identificación del Rol RBAC
  const userKey = currentUser?.key || currentUser?.role || 'jessica';
  const isDocente = currentUser?.role === 'docente' || currentUser?.role === 'induccion';
  const isRectora = currentUser?.role === 'rectora' || currentUser?.role === 'induccion_rectora';
  const isAdmin = currentUser?.role === 'admin';
  const isPrivileged = isRectora || isAdmin;

  // Estados de control lateral (Sidebar) y docente activa
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('all');

  // Sincronización en tiempo real de novedades y reemplazos
  const [curriculumTick, setCurriculumTick] = useState(0);

  useEffect(() => {
    const handleCurriculumUpdate = () => {
      setCurriculumTick(t => t + 1);
    };
    window.addEventListener('gmg_curriculum_updated', handleCurriculumUpdate);
    return () => window.removeEventListener('gmg_curriculum_updated', handleCurriculumUpdate);
  }, []);

  // 1. Niveles de la Jerarquía de Datos
  const availableYears = useMemo(() => gradesService.getAcademicYears(), []);
  const availablePeriods = useMemo(() => gradesService.getAcademicPeriods(), []);
  
  // Grados disponibles filtrados por rol, asignación curricular y dirección de curso
  const availableGrades = useMemo(() => {
    return gradesService.getGradesForUser(currentUser);
  }, [currentUser, curriculumTick]);

  // Estados de navegación en el árbol relacional
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedPeriod, setSelectedPeriod] = useState(availablePeriods[0] || '1° Periodo (25%)');
  const [selectedGrade, setSelectedGrade] = useState(availableGrades[0] || '1° Primaria');

  // Tipo de sábana activa: 'subject' (materia detallada) o 'consolidated' (vista general del grado)
  const [activeSheetType, setActiveSheetType] = useState('subject');

  // Materias disponibles para el grado seleccionado:
  const availableSubjects = useMemo(() => {
    return gradesService.getSubjectsForGradeAndUser(selectedGrade, currentUser);
  }, [selectedGrade, currentUser, curriculumTick]);

  const [selectedSubject, setSelectedSubject] = useState(availableSubjects[0] || 'Lengua Castellana');
  const [searchFilter, setSearchFilter] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Manejador cuando se selecciona una docente en el panel de control lateral
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

  // Asegurar consistencia del árbol cuando cambia el usuario o el grado
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

  // Carga de la rama actual del árbol: Año -> Periodo -> Grado -> Materia
  const branchData = useMemo(() => {
    return gradesService.getBranch(selectedYear, selectedPeriod, selectedGrade, selectedSubject);
  }, [selectedYear, selectedPeriod, selectedGrade, selectedSubject, curriculumTick]);

  const [students, setStudents] = useState(branchData.students || []);

  // Sincronizar roster al cambiar de rama en el árbol o al registrarse un reemplazo
  useEffect(() => {
    const freshBranch = gradesService.getBranch(selectedYear, selectedPeriod, selectedGrade, selectedSubject);
    setStudents(freshBranch.students || []);
  }, [selectedYear, selectedPeriod, selectedGrade, selectedSubject, curriculumTick]);

  // Carga del Consolidado General del Grado (Vista General)
  const consolidatedData = useMemo(() => {
    return gradesService.getConsolidatedGradeSheet(selectedYear, selectedPeriod, selectedGrade);
  }, [selectedYear, selectedPeriod, selectedGrade, curriculumTick, branchData, students]);

  // Información del Director de Curso Oficial del Grado
  const gradeDirector = useMemo(() => {
    return gradesService.getGradeDirector(selectedGrade);
  }, [selectedGrade, curriculumTick]);

  // Información del Docente Titular de la Materia
  const teacherInfo = useMemo(() => {
    return gradesService.getTeacherAssignment(selectedGrade, selectedSubject);
  }, [selectedGrade, selectedSubject, curriculumTick]);

  // ¿El usuario actual está actuando como Director de Curso supervisando la materia de otra docente?
  const isViewingAsGradeDirector = useMemo(() => {
    return gradesService.isViewingAsGradeDirector(currentUser, selectedGrade, selectedSubject);
  }, [currentUser, selectedGrade, selectedSubject, curriculumTick]);

  // Permisos granulares de edición en la rama activa
  const canEditScores = useMemo(() => {
    return gradesService.canEditScores(currentUser, selectedGrade, selectedSubject);
  }, [currentUser, selectedGrade, selectedSubject, curriculumTick]);

  const canEditFeedback = useMemo(() => {
    return gradesService.canEditTeacherFeedback(currentUser, selectedGrade, selectedSubject);
  }, [currentUser, selectedGrade, selectedSubject, curriculumTick]);

  const canEditDirective = useMemo(() => {
    return gradesService.canEditDirectiveSuggestion(currentUser);
  }, [currentUser]);

  // Manejo de cambio en notas numéricas (Exclusivo Docente Titular de la materia)
  const handleScoreChange = (id, field, value) => {
    if (!canEditScores) return;

    let num = parseFloat(value);
    if (isNaN(num)) num = '';
    else if (num > 5.0) num = 5.0;
    else if (num < 0) num = 0;

    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, [field]: num };
      }
      return student;
    }));
  };

  // Manejo de observaciones pedagógicas (Docente Titular de la materia)
  const handleTeacherFeedbackChange = (id, value) => {
    if (!canEditFeedback) return;
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, retroalimentacionDocente: value };
      }
      return student;
    }));
  };

  // Manejo de sugerencias directivas de auditoría (Exclusivo Rectora)
  const handleDirectiveSuggestionChange = (id, value) => {
    if (!canEditDirective) return;
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { ...student, sugerenciaDirectiva: value };
      }
      return student;
    }));
  };

  // Cálculo de definitiva ponderada
  const calculateDefinitive = (c1, c2, c3) => {
    const val1 = Number(c1) || 0;
    const val2 = Number(c2) || 0;
    const val3 = Number(c3) || 0;
    const def = (val1 * 0.4) + (val2 * 0.4) + (val3 * 0.2);
    return def.toFixed(1);
  };

  // Escala valorativa nacional institucional (SIEE)
  const getDesempeno = (score) => {
    const s = Number(score);
    if (s >= 4.6) return { label: 'Superior', className: 'tag-pastel-superior', icon: 'ph-trophy' };
    if (s >= 4.0) return { label: 'Alto', className: 'tag-pastel-alto', icon: 'ph-check-circle' };
    if (s >= 3.0) return { label: 'Básico', className: 'tag-pastel-basico', icon: 'ph-minus-circle' };
    return { label: 'Bajo', className: 'tag-pastel-bajo', icon: 'ph-warning-circle' };
  };

  const getDefinitiveBadgeClass = (score) => {
    const s = Number(score);
    if (s >= 4.6) return 'def-pill-superior';
    if (s >= 4.0) return 'def-pill-alto';
    if (s >= 3.0) return 'def-pill-basico';
    return 'def-pill-bajo';
  };

  // Métricas estadísticas del grupo actual (Materia)
  const averagesList = students.map(s => Number(calculateDefinitive(s.c1, s.c2, s.c3)));
  const classAverage = averagesList.length 
    ? (averagesList.reduce((acc, curr) => acc + curr, 0) / averagesList.length).toFixed(2)
    : '0.00';
  const passingCount = averagesList.filter(avg => avg >= 3.0).length;
  const passRate = students.length 
    ? Math.round((passingCount / students.length) * 100)
    : 0;

  // Filtrado de estudiantes por nombre o código en la búsqueda
  const filteredStudents = useMemo(() => {
    if (!searchFilter.trim()) return students;
    const term = searchFilter.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
    );
  }, [students, searchFilter]);

  // Filtrado de estudiantes en la Sábana General Consolidada
  const filteredConsolidatedStudents = useMemo(() => {
    const list = consolidatedData.students || [];
    if (!searchFilter.trim()) return list;
    const term = searchFilter.toLowerCase();
    return list.filter(s => 
      s.name.toLowerCase().includes(term) || s.id.toLowerCase().includes(term)
    );
  }, [consolidatedData.students, searchFilter]);

  // Guardado en la persistencia del árbol
  const handleSaveAction = () => {
    if (activeSheetType === 'consolidated') {
      setToastMessage(`Sábana General Consolidada de ${selectedGrade} actualizada con éxito.`);
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    if (isViewingAsGradeDirector) {
      setToastMessage(`Modo Director de Curso: Supervisión integral de ${selectedSubject}. Calificaciones registradas por ${teacherInfo.teacherName}.`);
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    gradesService.saveBranchStudents(selectedYear, selectedPeriod, selectedGrade, selectedSubject, students, currentUser);

    if (canEditScores) {
      setToastMessage(`¡Planilla guardada! Notas y retroalimentación de ${selectedSubject} registradas por ${currentUser?.name || 'la docente'}.`);
    } else if (canEditDirective) {
      setToastMessage(`¡Sugerencias registradas! Auditoría directiva de Rectoría guardada exitosamente.`);
    } else {
      setToastMessage(`¡Registro de auditoría técnica guardado exitosamente!`);
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="grades-module-container">
      {/* Navbar Superior Unificado */}
      <PortalNavbar
        currentUser={currentUser}
        moduleTitle="Notas & Calificaciones"
        moduleSubtitle="Sistema Integral de Evaluación Académica (SIEE)"
        onBackToModules={onBackToModules}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenConnectionsModal={onOpenConnectionsModal}
        onlineCount={onlineCount}
        circularesCount={circularesCount}
        onOpenCirculares={onOpenCirculares}
        onOpenTour={onOpenTour}
        onOpenProfile={onOpenProfile}
        onLogout={onLogout}
      />

      {/* Contenedor Principal con Panel de Control Lateral Unificado */}
      <div className="grades-body-layout">
        <div className={`sidebar-container ${isSidebarOpen ? 'mobile-open' : ''}`}>
          <GradesSidebar
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
            onSelectSheetType={(type) => {
              setActiveSheetType(type);
              setIsSidebarOpen(false);
            }}
            selectedPeriod={selectedPeriod}
            onSelectPeriod={(p) => {
              setSelectedPeriod(p);
              setIsSidebarOpen(false);
            }}
            selectedTeacher={selectedTeacher}
            onSelectTeacher={handleTeacherSelect}
            availableGrades={availableGrades}
            availableSubjects={availableSubjects}
            availablePeriods={availablePeriods}
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

        {/* Contenido Principal */}
        <main className="grades-content-area">
        {/* Banner de Bienvenida y Métricas Unificado en Paleta Pastel Institucional */}
        <section className="grades-banner-card">
          <div className="grades-banner-info">
            <div className="grades-banner-title-row">
              <h2>
                <i className={`ph-bold ${activeSheetType === 'consolidated' ? 'ph-chart-bar' : 'ph-book-open'}`}></i>
                {activeSheetType === 'consolidated' 
                  ? `Sábana General Consolidada • ${selectedGrade}` 
                  : `Planilla de Calificaciones: ${selectedSubject} (${selectedGrade})`
                }
              </h2>

              {/* Badge Dinámico RBAC del Rol Activo */}
              {activeSheetType === 'consolidated' ? (
                <span className="grades-role-mode-pill mode-consolidada">
                  <i className="ph-bold ph-squares-four"></i>
                  Vista General del Grado • Todas las Materias
                </span>
              ) : canEditScores ? (
                <span className="grades-role-mode-pill mode-docente">
                  <i className="ph-bold ph-pencil-simple-line"></i>
                  Modo Calificación Docente • Planilla Abierta
                </span>
              ) : isViewingAsGradeDirector ? (
                <span className="grades-role-mode-pill mode-director-curso">
                  <i className="ph-bold ph-shield-star"></i>
                  Modo Director(a) de Curso ({selectedGrade}) • Solo Lectura de Acompañamiento
                </span>
              ) : isRectora ? (
                <span className="grades-role-mode-pill mode-rectora">
                  <i className="ph-bold ph-lock-key"></i>
                  Modo Supervisión Directiva • Notas Protegidas (SIEE)
                </span>
              ) : (
                <span className="grades-role-mode-pill mode-admin">
                  <i className="ph-bold ph-shield-check"></i>
                  Modo Auditoría Técnica • Solo Lectura
                </span>
              )}
            </div>

            <p>
              {activeSheetType === 'consolidated' ? (
                <span>
                  Sábana general con el consolidado ponderado de todas las asignaturas para <strong>{selectedGrade}</strong> durante el <strong>{selectedPeriod}</strong>. Permite auditar el promedio general, puestos y asignaturas reprobadas.
                </span>
              ) : (
                <span>
                  Estructura ponderada SIEE: <strong>Cognitivo (40%)</strong>, <strong>Procedimental (40%)</strong> y <strong>Actitudinal (20%)</strong>.
                  {isViewingAsGradeDirector ? (
                    <span className="grades-banner-director-notice">
                      {' '}Como <strong>Director(a) de Curso de {selectedGrade}</strong>, supervisas las notas y retroalimentaciones de la docente <strong>{teacherInfo.teacherName}</strong>.
                    </span>
                  ) : !canEditScores && (
                    <span className="grades-banner-security-notice">
                      {' '}Por normativa SIEE, las notas solo pueden ser modificadas por el docente titular asignado.
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>

          {/* Métricas Unificadas en Paleta Pastel */}
          <div className="grades-banner-metrics">
            <div className="grades-metric-badge">
              <span className="grades-metric-label">
                <i className="ph-bold ph-chart-line-up"></i> Promedio
              </span>
              <span className="grades-metric-val">
                {activeSheetType === 'consolidated' ? consolidatedData.stats.gradeAverage : classAverage}
              </span>
            </div>

            <div className="grades-metric-badge">
              <span className="grades-metric-label">
                <i className="ph-bold ph-check-circle"></i> Aprobación
              </span>
              <span className="grades-metric-val">
                {activeSheetType === 'consolidated' ? `${consolidatedData.stats.gradePassRate}%` : `${passRate}%`}
              </span>
            </div>

            <div className="grades-metric-badge">
              <span className="grades-metric-label">
                <i className="ph-bold ph-student"></i> Roster
              </span>
              <span className="grades-metric-val">
                {activeSheetType === 'consolidated' ? consolidatedData.stats.totalStudents : students.length}
              </span>
            </div>

            <div className="grades-metric-badge">
              <span className="grades-metric-label">
                <i className="ph-bold ph-shield-star"></i> Dir. Curso
              </span>
              <span className="grades-metric-val grades-metric-titular-name" title={`Director(a) de Curso de ${selectedGrade}: ${gradeDirector.teacherName}`}>
                {gradeDirector.teacherName}
              </span>
            </div>

            {activeSheetType === 'consolidated' ? (
              <div className="grades-metric-badge">
                <span className="grades-metric-label">
                  <i className="ph-bold ph-trophy"></i> Puesto 1°
                </span>
                <span className="grades-metric-val grades-metric-titular-name" title={`Mejor estudiante del grado: ${consolidatedData.stats.topStudent?.name || '—'}`}>
                  {consolidatedData.stats.topStudent ? consolidatedData.stats.topStudent.name.split(' ')[0] : '—'}
                </span>
              </div>
            ) : (
              <div className="grades-metric-badge">
                <span className="grades-metric-label">
                  <i className="ph-bold ph-chalkboard-teacher"></i> Docente
                </span>
                <span className="grades-metric-val grades-metric-titular-name" title={`Docente de ${selectedSubject}: ${teacherInfo.teacherName}`}>
                  {teacherInfo.teacherName}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* =====================================================================
            SECCIÓN 1: NAVEGACIÓN DE CARPETAS / CARDS DE GRADOS ACADÉMICOS
            "pasar de carpeta a carpeta, o de cards a cards"
            ===================================================================== */}
        <section className="grades-nav-section">
          <div className="grades-nav-section-header">
            <div className="section-title-wrap">
              <i className="ph-bold ph-folder-notch-open"></i>
              <h3>Carpetas de Grados Académicos</h3>
            </div>
            <div className="grades-period-pills-wrap">
              <span className="period-label">Periodo Académico:</span>
              {availablePeriods.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`grades-period-pill ${selectedPeriod === p ? 'active' : ''}`}
                  onClick={() => setSelectedPeriod(p)}
                  title={`Cambiar a ${p}`}
                >
                  <i className="ph-bold ph-clock"></i>
                  <span>{p.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grades-cards-grid grades-folder-grid">
            {availableGrades.map((g) => {
              const isSelected = selectedGrade === g;
              const dir = gradesService.getGradeDirector(g);
              const isUserDir = gradesService.isGradeDirector(currentUser, g);
              const studentCount = (STUDENTS_BY_GRADE[g]?.length) || 6;

              return (
                <button
                  key={g}
                  type="button"
                  className={`grades-nav-card grade-folder-card ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedGrade(g)}
                  title={`Seleccionar carpeta de ${g}`}
                >
                  <div className="card-icon-wrap">
                    <i className="ph-bold ph-folder"></i>
                  </div>
                  <div className="card-text-wrap">
                    <div className="card-title-row">
                      <span className="card-title">{g}</span>
                      {isUserDir && (
                        <span className="card-mini-pill dir-pill" title="Eres el(la) Director(a) de Curso de este grado">
                          <i className="ph-bold ph-shield-star"></i> Dir. Curso
                        </span>
                      )}
                    </div>
                    <span className="card-subtitle">
                      Dir: {dir.teacherName} • {studentCount} estudiantes
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            SECCIÓN 2: NAVEGACIÓN DE SÁBANAS DE NOTAS (CARDS A CARDS)
            Sábana General Consolidada + Sábanas por Materia
            ===================================================================== */}
        <section className="grades-nav-section">
          <div className="grades-nav-section-header">
            <div className="section-title-wrap">
              <i className="ph-bold ph-files"></i>
              <h3>Sábanas de Notas Disponibles • {selectedGrade}</h3>
            </div>
            <span className="section-meta-pill">
              {availableSubjects.length + 1} sábanas en {selectedGrade}
            </span>
          </div>

          <div className="grades-cards-grid sabanas-cards-grid">
            {/* Card 1: Sábana General Consolidada (Vista General del Grado) */}
            <button
              type="button"
              className={`grades-nav-card sabana-card sabana-consolidated-card ${activeSheetType === 'consolidated' ? 'active' : ''}`}
              onClick={() => setActiveSheetType('consolidated')}
              title="Ver la sábana general consolidada con todas las materias del grado"
            >
              <div className="card-icon-wrap icon-consolidada">
                <i className="ph-bold ph-chart-bar"></i>
              </div>
              <div className="card-text-wrap">
                <div className="card-title-row">
                  <span className="card-title">Sábana General (Vista General)</span>
                  <span className="card-general-badge">Todas las Asignaturas</span>
                </div>
                <span className="card-subtitle">
                  Consolidado general, puestos, promedios y reprobadas
                </span>
              </div>
            </button>

            {/* Cards 2..N: Asignaturas individuales */}
            {availableSubjects.map((subj) => {
              const isSelected = activeSheetType === 'subject' && selectedSubject === subj;
              const teacher = gradesService.getTeacherAssignment(selectedGrade, subj);
              const isMySubject = gradesService.canEditScores(currentUser, selectedGrade, subj);
              const iconClass = getSubjectIcon(subj);

              return (
                <button
                  key={subj}
                  type="button"
                  className={`grades-nav-card sabana-card ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSubject(subj);
                    setActiveSheetType('subject');
                  }}
                  title={`Abrir planilla de notas de ${subj}`}
                >
                  <div className="card-icon-wrap">
                    <i className={`ph-bold ${iconClass}`}></i>
                  </div>
                  <div className="card-text-wrap">
                    <div className="card-title-row">
                      <span className="card-title">{subj}</span>
                      {isMySubject && (
                        <span className="card-mini-pill editable-pill" title="Materia a tu cargo (Editable)">
                          <i className="ph-bold ph-pencil-simple"></i> Mi Asignatura
                        </span>
                      )}
                    </div>
                    <span className="card-subtitle">
                      Docente: {teacher.teacherName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Visualización Visual de la Jerarquía de Datos Relacional (RBAC) */}
        <section className="grades-tree-path-card">
          <div className="grades-tree-path-header">
            <div className="tree-badge">
              <i className="ph-bold ph-tree-structure"></i>
              <span>Jerarquía de Datos Relacional (RBAC)</span>
            </div>
            <div className="tree-path-meta">
              <span className="tree-security-pill">
                <i className={`ph-bold ${
                  activeSheetType === 'consolidated' 
                    ? 'ph-chart-bar' 
                    : (canEditScores ? 'ph-check-circle' : (isViewingAsGradeDirector ? 'ph-shield-star' : 'ph-shield-check'))
                }`}></i>
                {activeSheetType === 'consolidated'
                  ? `Consolidado General de ${selectedGrade} • Supervisión integral`
                  : canEditScores 
                  ? `Docente autorizado: ${currentUser?.name || teacherInfo.teacherName}`
                  : isViewingAsGradeDirector
                  ? `Supervisión: Dir. de Curso ${gradeDirector.teacherName} (Docente: ${teacherInfo.teacherName})`
                  : `Auditoría: Notas a cargo de ${teacherInfo.teacherName}`
                }
              </span>
            </div>
          </div>

          <div className="grades-tree-breadcrumbs">
            {/* Nivel 1: Año Lectivo */}
            <div className="tree-crumb">
              <span className="crumb-level">Año Lectivo</span>
              <span className="crumb-val">
                <i className="ph-bold ph-calendar-blank"></i> {selectedYear}
              </span>
            </div>

            <i className="ph-bold ph-caret-right tree-crumb-divider"></i>

            {/* Nivel 2: Período */}
            <div className="tree-crumb">
              <span className="crumb-level">Periodo</span>
              <span className="crumb-val">
                <i className="ph-bold ph-clock"></i> {selectedPeriod.split(' ')[0]}
              </span>
            </div>

            <i className="ph-bold ph-caret-right tree-crumb-divider"></i>

            {/* Nivel 3: Grado */}
            <div className="tree-crumb">
              <span className="crumb-level">Grado</span>
              <span className="crumb-val">
                <i className="ph-bold ph-student"></i> {selectedGrade}
              </span>
            </div>

            <i className="ph-bold ph-caret-right tree-crumb-divider"></i>

            {/* Director(a) de Curso Oficial por Grado */}
            <div className="tree-crumb">
              <span className="crumb-level">Director de Curso</span>
              <span className="crumb-val">
                <i className="ph-bold ph-shield-star"></i> {gradeDirector.teacherName}
              </span>
            </div>

            <i className="ph-bold ph-caret-right tree-crumb-divider"></i>

            {/* Nivel 4: Sábana Activa */}
            <div className="tree-crumb crumb-active-leaf">
              <span className="crumb-level">{activeSheetType === 'consolidated' ? 'Modo de Sábana' : 'Asignatura'}</span>
              <span className="crumb-val">
                <i className={`ph-bold ${activeSheetType === 'consolidated' ? 'ph-chart-bar' : getSubjectIcon(selectedSubject)}`}></i>
                {activeSheetType === 'consolidated' ? 'Sábana General Consolidada' : selectedSubject}
              </span>
            </div>
          </div>
        </section>

        {/* Barra de Filtros Rápidos y Acciones */}
        <section className="grades-filter-bar">
          <div className="grades-filter-group">
            {/* Selector Año Lectivo */}
            <div className="grades-select-item">
              <label><i className="ph-bold ph-calendar"></i> Año Lectivo</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                title="Seleccione el Año Lectivo"
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Búsqueda rápida de estudiante */}
            <div className="grades-select-item grades-search-item">
              <label><i className="ph-bold ph-magnifying-glass"></i> Filtrar Alumno</label>
              <input 
                type="text" 
                placeholder="Buscar alumno por nombre o código..." 
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="grades-search-input"
              />
            </div>
          </div>

          <div className="grades-filter-actions">
            {isAdmin && (
              <button 
                type="button" 
                className="grades-btn-secondary btn-novedades-admin" 
                onClick={() => {
                  if (onNavigateToReemplazos) {
                    onNavigateToReemplazos();
                  } else if (onOpenProfile) {
                    onOpenProfile(null, 'reemplazos');
                  }
                }}
                title="Consola de Administrador: Novedades & Reemplazos Docentes Inmediatos"
              >
                <i className="ph-bold ph-arrows-left-right"></i>
                <span>Novedades & Reemplazos</span>
              </button>
            )}

            <button 
              type="button" 
              className="grades-btn-secondary" 
              onClick={() => alert(`Generando boletín PDF oficial de ${activeSheetType === 'consolidated' ? 'Sábana General' : selectedSubject} - ${selectedGrade} (${selectedPeriod})...`)}
              title="Descargar boletín de calificaciones en formato PDF"
            >
              <i className="ph-bold ph-file-arrow-down"></i>
              <span>Boletín PDF</span>
            </button>

            {activeSheetType === 'subject' && (
              <button 
                type="button" 
                className={`grades-btn-primary ${isViewingAsGradeDirector ? 'btn-view-only' : ''}`} 
                onClick={handleSaveAction}
                title={
                  canEditScores 
                    ? "Guardar notas y observaciones docentes" 
                    : isViewingAsGradeDirector 
                    ? `Supervisión de Director(a) de Curso (Notas de ${teacherInfo.teacherName})` 
                    : "Guardar observaciones de auditoría directiva"
                }
              >
                <i className={`ph-bold ${
                  canEditScores 
                    ? 'ph-floppy-disk' 
                    : isViewingAsGradeDirector 
                    ? 'ph-eye' 
                    : (canEditDirective ? 'ph-crown' : 'ph-shield-check')
                }`}></i>
                <span>
                  {canEditScores 
                    ? 'Guardar Planilla' 
                    : isViewingAsGradeDirector 
                    ? 'Modo Director de Curso' 
                    : (canEditDirective ? 'Guardar Sugerencias' : 'Guardar Auditoría')
                  }
                </span>
              </button>
            )}
          </div>
        </section>

        {/* =====================================================================
            VISTA 1: SÁBANA GENERAL CONSOLIDADA DEL GRADO (VISTA GENERAL)
            Muestra todas las materias lado a lado, promedios, puestos y reprobadas
            ===================================================================== */}
        {activeSheetType === 'consolidated' ? (
          <section className="grades-sheet-card grades-consolidated-sheet-card">
            <div className="consolidated-header-bar">
              <div className="consolidated-header-title">
                <i className="ph-bold ph-table"></i>
                <div>
                  <h4>Matriz General de Calificaciones • {selectedGrade}</h4>
                  <p>Haga clic en el encabezado de cualquier asignatura para abrir su planilla detallada SIEE.</p>
                </div>
              </div>
              <div className="consolidated-header-actions">
                <button
                  type="button"
                  className="grades-btn-secondary"
                  onClick={() => alert(`Exportando sábana general consolidada de ${selectedGrade} a Excel...`)}
                  title="Exportar sábana completa a Excel"
                >
                  <i className="ph-bold ph-file-xls"></i>
                  <span>Exportar Matriz Excel</span>
                </button>
              </div>
            </div>

            <div className="grades-table-wrapper">
              <table className="grades-table grades-consolidated-table">
                <thead>
                  <tr>
                    <th style={{ width: '45px', textAlign: 'center' }}>Puesto</th>
                    <th style={{ minWidth: '220px' }}>Estudiante</th>
                    
                    {/* Columnas dinámicas de todas las materias del grado */}
                    {consolidatedData.subjects.map(subj => {
                      const iconClass = getSubjectIcon(subj);
                      return (
                        <th key={subj} className="th-consolidated-subject" style={{ textAlign: 'center', minWidth: '105px' }}>
                          <button
                            type="button"
                            className="btn-header-subject-jump"
                            onClick={() => {
                              setSelectedSubject(subj);
                              setActiveSheetType('subject');
                            }}
                            title={`Abrir planilla detallada de ${subj}`}
                          >
                            <i className={`ph-bold ${iconClass}`}></i>
                            <span>{subj}</span>
                          </button>
                        </th>
                      );
                    })}

                    <th style={{ textAlign: 'center', minWidth: '100px' }} className="th-consolidated-avg">
                      Promedio
                    </th>
                    <th style={{ textAlign: 'center', minWidth: '95px' }} className="th-consolidated-failed">
                      Reprobadas
                    </th>
                    <th style={{ textAlign: 'center', minWidth: '110px' }}>
                      Nivel SIEE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsolidatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={consolidatedData.subjects.length + 5} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        No se encontraron estudiantes para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredConsolidatedStudents.map((st, idx) => {
                      const des = getDesempeno(st.average);
                      const defBadgeClass = getDefinitiveBadgeClass(st.average);
                      const avatarColorClass = PASTEL_AVATAR_CLASSES[idx % PASTEL_AVATAR_CLASSES.length];

                      return (
                        <tr key={st.id}>
                          {/* Puesto en el grado */}
                          <td style={{ textAlign: 'center' }}>
                            <div className={`rank-pill rank-${st.rank}`}>
                              {st.rank === 1 && <i className="ph-bold ph-trophy"></i>}
                              {st.rank === 2 && <i className="ph-bold ph-medal"></i>}
                              {st.rank === 3 && <i className="ph-bold ph-medal"></i>}
                              <span>{st.rank}°</span>
                            </div>
                          </td>

                          {/* Estudiante con Avatar Pastel */}
                          <td>
                            <div className="grades-student-cell">
                              <div className={`grades-student-avatar ${avatarColorClass}`}>
                                {st.name.charAt(0)}
                              </div>
                              <div className="grades-student-info">
                                <span className="grades-student-name">{st.name}</span>
                                <span className="grades-student-code">{st.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Notas definitivas en cada materia */}
                          {consolidatedData.subjects.map(subj => {
                            const score = st.subjectGrades[subj] || 0;
                            const isPassing = score >= 3.0;
                            return (
                              <td key={subj} style={{ textAlign: 'center' }} className="td-consolidated-score">
                                <span 
                                  className={`consolidated-score-pill ${isPassing ? 'score-pass' : 'score-fail'}`}
                                  onClick={() => {
                                    setSelectedSubject(subj);
                                    setActiveSheetType('subject');
                                  }}
                                  title={`Ver planilla de ${subj} de ${st.name}`}
                                >
                                  {score > 0 ? score.toFixed(1) : '—'}
                                </span>
                              </td>
                            );
                          })}

                          {/* Promedio General del Estudiante */}
                          <td style={{ textAlign: 'center' }} className="td-consolidated-avg">
                            <span className={`definitiva-pill ${defBadgeClass}`}>
                              {st.average.toFixed(2)}
                            </span>
                          </td>

                          {/* Materias Reprobadas */}
                          <td style={{ textAlign: 'center' }}>
                            {st.failedCount === 0 ? (
                              <span className="failed-zero-pill">
                                <i className="ph-bold ph-check"></i> 0
                              </span>
                            ) : (
                              <span className="failed-alert-pill">
                                <i className="ph-bold ph-warning"></i> {st.failedCount}
                              </span>
                            )}
                          </td>

                          {/* Desempeño SIEE */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`tag-desempeno ${des.className}`}>
                              <i className={`ph-bold ${des.icon}`}></i>
                              {des.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer de la Sábana General */}
            <div className="grades-sheet-footer">
              <div className="grades-footer-legend">
                <span className="footer-legend-item">
                  <span className="legend-dot dot-c3"></span> Materias Aprobadas (≥ 3.0)
                </span>
                <span className="footer-legend-item">
                  <span className="legend-dot dot-fail"></span> Reprobadas (&lt; 3.0)
                </span>
                <span className="footer-legend-rbac">
                  <i className="ph-bold ph-shield-check"></i>
                  Consolidado Oficial de Calificaciones SIEE • Institución Educativa Galeano
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="grades-btn-secondary" 
                  onClick={() => alert(`Generando reporte impreso de la sábana de notas de ${selectedGrade}...`)}
                >
                  <i className="ph-bold ph-printer"></i>
                  <span>Imprimir Sábana</span>
                </button>
              </div>
            </div>
          </section>
        ) : (
          /* =====================================================================
             VISTA 2: PLANILLA DETALLADA DE LA ASIGNATURA SELECCIONADA
             Estructura 3 componentes: Cognitivo 40%, Procedimental 40%, Actitudinal 20%
             ===================================================================== */
          <section className="grades-sheet-card">
            <div className="subject-sheet-header-bar">
              <div className="subject-sheet-info">
                <div className="subject-icon-box">
                  <i className={`ph-bold ${getSubjectIcon(selectedSubject)}`}></i>
                </div>
                <div>
                  <h4>Planilla Oficial de {selectedSubject} • {selectedGrade}</h4>
                  <p>Docente a cargo: <strong>{teacherInfo.teacherName}</strong> • {selectedPeriod}</p>
                </div>
              </div>
              <button
                type="button"
                className="grades-btn-secondary btn-return-consolidated"
                onClick={() => setActiveSheetType('consolidated')}
                title="Volver a la sábana general consolidada del grado"
              >
                <i className="ph-bold ph-chart-bar"></i>
                <span>Ver Sábana General</span>
              </button>
            </div>

            <div className="grades-table-wrapper">
              <table className="grades-table">
                <thead>
                  <tr>
                    <th style={{ width: '38px', textAlign: 'center' }}>#</th>
                    <th style={{ minWidth: '200px' }}>Estudiante</th>
                    
                    {/* Componente 1: Cognitivo (40%) */}
                    <th className="th-pastel-component" style={{ textAlign: 'center', minWidth: '95px' }}>
                      <div className="th-component-header">
                        <span>Cognitivo</span>
                        <span className="th-badge-weight">40%</span>
                        {!canEditScores && (
                          <i 
                            className="ph-bold ph-lock-key th-lock-icon" 
                            title={isViewingAsGradeDirector ? `Solo Lectura (Director de Curso): Asignatura a cargo de ${teacherInfo.teacherName}` : "Calificación bloqueada: Solo docente titular"}
                          ></i>
                        )}
                      </div>
                    </th>

                    {/* Componente 2: Procedimental (40%) */}
                    <th className="th-pastel-component" style={{ textAlign: 'center', minWidth: '95px' }}>
                      <div className="th-component-header">
                        <span>Procedimental</span>
                        <span className="th-badge-weight">40%</span>
                        {!canEditScores && (
                          <i 
                            className="ph-bold ph-lock-key th-lock-icon" 
                            title={isViewingAsGradeDirector ? `Solo Lectura (Director de Curso): Asignatura a cargo de ${teacherInfo.teacherName}` : "Calificación bloqueada: Solo docente titular"}
                          ></i>
                        )}
                      </div>
                    </th>

                    {/* Componente 3: Actitudinal (20%) */}
                    <th className="th-pastel-component" style={{ textAlign: 'center', minWidth: '95px' }}>
                      <div className="th-component-header">
                        <span>Actitudinal</span>
                        <span className="th-badge-weight">20%</span>
                        {!canEditScores && (
                          <i 
                            className="ph-bold ph-lock-key th-lock-icon" 
                            title={isViewingAsGradeDirector ? `Solo Lectura (Director de Curso): Asignatura a cargo de ${teacherInfo.teacherName}` : "Calificación bloqueada: Solo docente titular"}
                          ></i>
                        )}
                      </div>
                    </th>

                    {/* Definitiva */}
                    <th className="th-pastel-definitiva" style={{ textAlign: 'center', minWidth: '85px' }}>
                      <div className="th-component-header">
                        <span>Definitiva</span>
                        <span className="th-badge-def">100%</span>
                      </div>
                    </th>

                    {/* Desempeño */}
                    <th className="th-pastel-desempeno" style={{ textAlign: 'center', minWidth: '110px' }}>
                      Nivel SIEE
                    </th>

                    {/* Rama Árbol: Retroalimentación Docente */}
                    <th className="th-pastel-docente-col" style={{ minWidth: '220px' }}>
                      <div className="th-component-header">
                        <i className="ph-bold ph-chalkboard-teacher"></i>
                        <span>Retroalimentación Docente</span>
                        {canEditFeedback ? (
                          <span className="th-badge-editable">Editable</span>
                        ) : isViewingAsGradeDirector ? (
                          <span className="th-badge-director" title="Visible para seguimiento del Director de Curso">Dir. de Curso</span>
                        ) : null}
                      </div>
                    </th>

                    {/* Rama Árbol: Sugerencia Directiva (Rectoría) */}
                    <th className="th-pastel-directiva-col" style={{ minWidth: '220px' }}>
                      <div className="th-component-header">
                        <i className="ph-bold ph-crown"></i>
                        <span>Sugerencia Directiva (Rectoría)</span>
                        {canEditDirective && <span className="th-badge-rectora">Auditoría</span>}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No se encontraron estudiantes para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const def = calculateDefinitive(student.c1, student.c2, student.c3);
                      const des = getDesempeno(def);
                      const defBadgeClass = getDefinitiveBadgeClass(def);
                      const avatarColorClass = PASTEL_AVATAR_CLASSES[idx % PASTEL_AVATAR_CLASSES.length];

                      return (
                        <tr key={student.id}>
                          <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                            {idx + 1}
                          </td>

                          {/* Estudiante con Avatar Pastel */}
                          <td>
                            <div className="grades-student-cell">
                              <div className={`grades-student-avatar ${avatarColorClass}`}>
                                {student.name.charAt(0)}
                              </div>
                              <div className="grades-student-info">
                                <span className="grades-student-name">{student.name}</span>
                                <span className="grades-student-code">{student.id}</span>
                              </div>
                            </div>
                          </td>

                          {/* Nota Cognitivo (40%) */}
                          <td style={{ textAlign: 'center' }} className="td-score-c1">
                            <div className="score-input-wrap">
                              <input 
                                type="number" 
                                step="0.1" 
                                min="1.0" 
                                max="5.0"
                                value={student.c1}
                                onChange={(e) => handleScoreChange(student.id, 'c1', e.target.value)}
                                className={`grades-input-score input-c1 ${!canEditScores ? 'grades-input-locked' : ''}`}
                                readOnly={!canEditScores}
                                title={
                                  !canEditScores 
                                    ? (isViewingAsGradeDirector 
                                        ? `Solo Lectura (Director de Curso): Calificada por ${teacherInfo.teacherName}` 
                                        : "Solo Lectura: Los directivos no pueden alterar notas docentes por seguridad institucional (SIEE)") 
                                    : "Calificar componente cognitivo"
                                }
                              />
                              {!canEditScores && (
                                <i 
                                  className="ph-bold ph-lock-key input-mini-lock" 
                                  title={isViewingAsGradeDirector ? `Solo lectura para Director de Curso` : "Calificación protegida por SIEE"}
                                ></i>
                              )}
                            </div>
                          </td>

                          {/* Nota Procedimental (40%) */}
                          <td style={{ textAlign: 'center' }} className="td-score-c2">
                            <div className="score-input-wrap">
                              <input 
                                type="number" 
                                step="0.1" 
                                min="1.0" 
                                max="5.0"
                                value={student.c2}
                                onChange={(e) => handleScoreChange(student.id, 'c2', e.target.value)}
                                className={`grades-input-score input-c2 ${!canEditScores ? 'grades-input-locked' : ''}`}
                                readOnly={!canEditScores}
                                title={
                                  !canEditScores 
                                    ? (isViewingAsGradeDirector 
                                        ? `Solo Lectura (Director de Curso): Calificada por ${teacherInfo.teacherName}` 
                                        : "Solo Lectura: Los directivos no pueden alterar notas docentes por seguridad institucional (SIEE)") 
                                    : "Calificar componente procedimental"
                                }
                              />
                              {!canEditScores && (
                                <i 
                                  className="ph-bold ph-lock-key input-mini-lock" 
                                  title={isViewingAsGradeDirector ? `Solo lectura para Director de Curso` : "Calificación protegida por SIEE"}
                                ></i>
                              )}
                            </div>
                          </td>

                          {/* Nota Actitudinal (20%) */}
                          <td style={{ textAlign: 'center' }} className="td-score-c3">
                            <div className="score-input-wrap">
                              <input 
                                type="number" 
                                step="0.1" 
                                min="1.0" 
                                max="5.0"
                                value={student.c3}
                                onChange={(e) => handleScoreChange(student.id, 'c3', e.target.value)}
                                className={`grades-input-score input-c3 ${!canEditScores ? 'grades-input-locked' : ''}`}
                                readOnly={!canEditScores}
                                title={
                                  !canEditScores 
                                    ? (isViewingAsGradeDirector 
                                        ? `Solo Lectura (Director de Curso): Calificada por ${teacherInfo.teacherName}` 
                                        : "Solo Lectura: Los directivos no pueden alterar notas docentes por seguridad institucional (SIEE)") 
                                    : "Calificar componente actitudinal"
                                }
                              />
                              {!canEditScores && (
                                <i 
                                  className="ph-bold ph-lock-key input-mini-lock" 
                                  title={isViewingAsGradeDirector ? `Solo lectura para Director de Curso` : "Calificación protegida por SIEE"}
                                ></i>
                              )}
                            </div>
                          </td>

                          {/* Definitiva con Pill Pastel */}
                          <td className="grades-definitiva-cell td-score-def">
                            <span className={`definitiva-pill ${defBadgeClass}`}>
                              {def}
                            </span>
                          </td>

                          {/* Desempeño SIEE */}
                          <td style={{ textAlign: 'center' }}>
                            <span className={`tag-desempeno ${des.className}`}>
                              <i className={`ph-bold ${des.icon}`}></i>
                              {des.label}
                            </span>
                          </td>

                          {/* Rama: Retroalimentación Docente */}
                          <td>
                            {canEditFeedback ? (
                              <div className="obs-input-wrap">
                                <input 
                                  type="text"
                                  value={student.retroalimentacionDocente || ''}
                                  onChange={(e) => handleTeacherFeedbackChange(student.id, e.target.value)}
                                  placeholder="Observación pedagógica al estudiante..."
                                  className="grades-input-obs obs-docente-input"
                                />
                              </div>
                            ) : (
                              <div className="obs-readonly-box obs-docente-readonly">
                                <i className="ph-bold ph-chat-circle-dots"></i>
                                <span>
                                  {student.retroalimentacionDocente 
                                    ? student.retroalimentacionDocente 
                                    : (isViewingAsGradeDirector 
                                        ? `Sin retroalimentación de ${teacherInfo.teacherName} aún` 
                                        : 'Sin retroalimentación docente aún'
                                      )
                                  }
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Rama: Sugerencia Directiva (Rectoría) */}
                          <td>
                            {canEditDirective ? (
                              <div className="obs-input-wrap">
                                <input 
                                  type="text"
                                  value={student.sugerenciaDirectiva || ''}
                                  onChange={(e) => handleDirectiveSuggestionChange(student.id, e.target.value)}
                                  placeholder="Sugerencia / Nota de auditoría de Rectoría..."
                                  className="grades-input-obs obs-rectora-input"
                                />
                                <span className="obs-directiva-indicator" title="Sugerencia registrada por Rectoría">
                                  <i className="ph-bold ph-crown"></i>
                                </span>
                              </div>
                            ) : (
                              student.sugerenciaDirectiva ? (
                                <div className="obs-readonly-box obs-rectora-readonly" title="Sugerencia oficial emitida por Rectoría">
                                  <span className="obs-crown-badge">👑 Rectoría:</span>
                                  <span>{student.sugerenciaDirectiva}</span>
                                </div>
                              ) : (
                                <span className="obs-empty-dash" title="Sin sugerencias directivas registradas">—</span>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer de la Planilla */}
            <div className="grades-sheet-footer">
              <div className="grades-footer-legend">
                <span className="footer-legend-item">
                  <span className="legend-dot dot-c3"></span> Cognitivo 40%
                </span>
                <span className="footer-legend-item">
                  <span className="legend-dot dot-c3"></span> Procedimental 40%
                </span>
                <span className="footer-legend-item">
                  <span className="legend-dot dot-c3"></span> Actitudinal 20%
                </span>
                <span className="footer-legend-rbac">
                  <i className={`ph-bold ${canEditScores ? 'ph-check-circle' : (isViewingAsGradeDirector ? 'ph-shield-star' : 'ph-shield-check')}`}></i>
                  {canEditScores 
                    ? 'Planilla abierta para calificar y retroalimentar' 
                    : isViewingAsGradeDirector
                    ? `Supervisión de Director(a) de Curso (${gradeDirector.teacherName}) • Calificación por ${teacherInfo.teacherName}`
                    : `Supervisión institucional: notas protegidas de ${teacherInfo.teacherName}`}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="grades-btn-secondary" 
                  onClick={() => alert(`Exportando consolidado de calificaciones de ${selectedSubject} en Excel...`)}
                >
                  <i className="ph-bold ph-file-xls"></i>
                  <span>Consolidado Excel</span>
                </button>
                <button 
                  type="button" 
                  className={`grades-btn-primary ${isViewingAsGradeDirector ? 'btn-view-only' : ''}`} 
                  onClick={handleSaveAction}
                >
                  <i className={`ph-bold ${
                    canEditScores 
                      ? 'ph-floppy-disk' 
                      : isViewingAsGradeDirector 
                      ? 'ph-eye' 
                      : (canEditDirective ? 'ph-crown' : 'ph-shield-check')
                  }`}></i>
                  <span>
                    {canEditScores 
                      ? 'Confirmar y Guardar' 
                      : isViewingAsGradeDirector 
                      ? 'Modo Director de Curso' 
                      : (canEditDirective ? 'Guardar Sugerencias' : 'Guardar Auditoría')
                    }
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
      </div>

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
