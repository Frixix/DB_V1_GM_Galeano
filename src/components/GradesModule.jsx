import { useState, useEffect, useMemo } from 'react';
import PortalNavbar from './PortalNavbar';
import GradesSidebar from './GradesSidebar';
import EvaluationCalendarModal from './EvaluationCalendarModal';
import MobileMicroRegistryModal from './MobileMicroRegistryModal';
import RetireStudentModal from './RetireStudentModal';
import StudentAuditDetailModal from './StudentAuditDetailModal';
import './GradesModule.css';
import { gradesService, calculateGrade80_20 } from '../services/gradesService';

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
  onLogout,
  onOpenProfile,
  onOpenConnectionsModal,
  onlineMap = {},
  onlineCount,
  circularesCount = 0,
  onOpenCirculares,
  isNotificationsOpen = false,
  onOpenTour
}) {
  // Identificación del Rol RBAC
  const userKey = currentUser?.key || currentUser?.role || 'jessica';
  const isDocente = currentUser?.role === 'docente' || currentUser?.role === 'induccion';
  const isRectora = currentUser?.role === 'rectora' || currentUser?.role === 'induccion_rectora';
  const isAdmin = currentUser?.role === 'admin';
  const isCoordinador = currentUser?.role === 'coordinador';
  const isPrivileged = isRectora || isAdmin || isCoordinador;

  // Estados de control lateral (Sidebar) y docente activa
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

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
  const [activities, setActivities] = useState(() => {
    return branchData.activities || [
      { id: 'act_1', name: 'Taller 1', type: 'Taller' },
      { id: 'act_2', name: 'Quiz Rápido', type: 'Quiz' },
      { id: 'act_3', name: 'Trabajo en Clase', type: 'Clase' }
    ];
  });
  const [isMobileMicroOpen, setIsMobileMicroOpen] = useState(false);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState(null);

  // Asegurar que usuarios docentes solo visualicen la sábana de sus materias y no la consolidada
  useEffect(() => {
    if (!isPrivileged && activeSheetType === 'consolidated') {
      setActiveSheetType('subject');
    }
  }, [isPrivileged, activeSheetType]);

  // Sincronizar roster y actividades al cambiar de rama en el árbol o al registrarse un reemplazo
  useEffect(() => {
    let isMounted = true;
    const freshBranch = gradesService.getBranch(selectedYear, selectedPeriod, selectedGrade, selectedSubject);
    setStudents(freshBranch.students || []);
    setActivities(freshBranch.activities || [
      { id: 'act_1', name: 'Taller 1', type: 'Taller' },
      { id: 'act_2', name: 'Quiz Rápido', type: 'Quiz' },
      { id: 'act_3', name: 'Trabajo en Clase', type: 'Clase' }
    ]);

    // Consultar y sincronizar con Supabase en la nube
    gradesService.fetchBranchFromSupabase(selectedYear, selectedPeriod, selectedGrade, selectedSubject)
      .then(remoteBranch => {
        if (!isMounted || !remoteBranch) return;
        if (remoteBranch.students && remoteBranch.students.length > 0) {
          setStudents(remoteBranch.students);
          if (remoteBranch.activities && remoteBranch.activities.length > 0) {
            setActivities(remoteBranch.activities);
          }
          gradesService.updateBranchFromRemote(selectedYear, selectedPeriod, selectedGrade, selectedSubject, remoteBranch);
        }
      })
      .catch(err => {
        console.warn('[GradesModule] Información de nube no disponible, operando local:', err);
      });

    return () => {
      isMounted = false;
    };
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

  const canEditCoordinacion = useMemo(() => {
    return gradesService.canEditCoordinacionObservation(currentUser);
  }, [currentUser]);

  const canManageCalendar = useMemo(() => {
    return gradesService.canManageCalendarAndDeadlines(currentUser);
  }, [currentUser]);

  const canManageMatricula = useMemo(() => {
    return gradesService.canManageMatricula(currentUser);
  }, [currentUser]);

  // Manejo de cambio en nota de actividad continua de aula (80%)
  const handleActivityScoreChange = (studentId, activityId, value) => {
    if (!canEditScores) return;

    let num = value;
    if (value !== '') {
      num = parseFloat(String(value).replace(',', '.'));
      if (isNaN(num)) num = '';
      else if (num > 5.0) num = 5.0;
      else if (num < 0) num = 0;
    }

    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        const nextScores = { ...(student.scores || {}), [activityId]: num };
        return {
          ...student,
          scores: nextScores,
          [activityId]: num,
          c1: nextScores.act_1 !== undefined ? nextScores.act_1 : student.c1,
          c2: nextScores.act_2 !== undefined ? nextScores.act_2 : student.c2
        };
      }
      return student;
    }));
  };

  // Manejo de cambio en nota de Evaluación Final (20%)
  const handleFinalExamChange = (studentId, value) => {
    if (!canEditScores) return;

    let num = value;
    if (value !== '') {
      num = parseFloat(String(value).replace(',', '.'));
      if (isNaN(num)) num = '';
      else if (num > 5.0) num = 5.0;
      else if (num < 0) num = 0;
    }

    setStudents(prev => prev.map(student => {
      if (student.id === studentId) {
        return {
          ...student,
          evaluacionFinal: num,
          c3: num
        };
      }
      return student;
    }));
  };

  // Handler unificado para MobileMicroRegistryModal
  const handleMobileScoreUpdate = (studentId, activityOrFinalId, value) => {
    if (activityOrFinalId === 'evaluacionFinal') {
      handleFinalExamChange(studentId, value);
    } else {
      handleActivityScoreChange(studentId, activityOrFinalId, value);
    }
  };

  // Agregar nueva actividad continua de aula (hasta 10)
  const handleAddActivity = () => {
    if (!canEditScores) return;
    if (activities.length >= 10) {
      alert('Se ha alcanzado el límite máximo de 10 actividades continuas por periodo.');
      return;
    }

    const nextIndex = activities.length + 1;
    const inputName = window.prompt(
      'Ingresa el nombre o título para la nueva actividad de aula (ej: Taller 2, Quiz, Tarea, Exposición):',
      `Actividad ${nextIndex}`
    );
    if (inputName === null) return; // Cancelado por la docente

    const trimmedName = inputName.trim() || `Actividad ${nextIndex}`;
    const newAct = {
      id: `act_${Date.now()}`,
      name: trimmedName,
      type: 'Aula'
    };

    const nextActivities = [...activities, newAct];
    setActivities(nextActivities);
    gradesService.saveBranchStudents(selectedYear, selectedPeriod, selectedGrade, selectedSubject, students, currentUser, nextActivities);
    setToastMessage(`¡Nueva actividad "${trimmedName}" creada con éxito! El 80% se consolida automáticamente.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Renombrar actividad existente
  const handleRenameActivity = (activityId) => {
    if (!canEditScores) return;
    const act = activities.find(a => a.id === activityId);
    if (!act) return;

    const currentName = act.name || act.label || 'Actividad';
    const newName = window.prompt(`Modificar nombre de la actividad:`, currentName);
    if (newName === null) return;

    const trimmed = newName.trim();
    if (!trimmed || trimmed === currentName) return;

    const nextActivities = activities.map(a => a.id === activityId ? { ...a, name: trimmed } : a);
    setActivities(nextActivities);
    gradesService.saveBranchStudents(selectedYear, selectedPeriod, selectedGrade, selectedSubject, students, currentUser, nextActivities);
    setToastMessage(`Actividad renombrada a "${trimmed}".`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Eliminar actividad continua de aula (mínimo 1)
  const handleRemoveActivity = (activityId) => {
    if (!canEditScores) return;
    if (activities.length <= 1) {
      alert('Debe conservar al menos 1 actividad continua de aula.');
      return;
    }

    const targetAct = activities.find(a => a.id === activityId);
    if (!window.confirm(`¿Deseas eliminar la actividad "${targetAct?.name || activityId}"?`)) {
      return;
    }

    const nextActivities = activities.filter(a => a.id !== activityId);
    setActivities(nextActivities);
    gradesService.saveBranchStudents(selectedYear, selectedPeriod, selectedGrade, selectedSubject, students, currentUser, nextActivities);
    setToastMessage(`Actividad eliminada. Promedio de aula recalculado.`);
    setTimeout(() => setToastMessage(null), 3000);
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

  // Manejo de observaciones exclusivas de Coordinación
  const handleCoordinacionObservationChange = (id, value) => {
    if (!canEditCoordinacion) return;
    setStudents(prev => prev.map(student => {
      if (student.id === id) {
        return { 
          ...student, 
          observacion_coordinacion: value, 
          observacionCoordinacion: value 
        };
      }
      return student;
    }));
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

  // Cálculo de alumnos activos y copias institucionales recomendadas (N + 1)
  const activeStudentsCount = useMemo(() => {
    return students.filter(s => s.active !== false && s.status !== 'inactivo' && !s.inhabilitado).length;
  }, [students]);
  const suggestedCopies = activeStudentsCount + 1;

  // FASE 5: Abrir modal interactivo de inhabilitación / retiro (Soft-Disable)
  const handleOpenRetireModal = (student) => {
    if (!canManageMatricula) {
      alert('Solo Administrador, Rectora o Coordinación pueden inhabilitar estudiantes.');
      return;
    }
    setSelectedStudentForAction(student);
    setIsRetireModalOpen(true);
  };

  // FASE 5: Reactivar a un estudiante previamente retirado
  const handleReactivateStudent = (student) => {
    if (!canManageMatricula) {
      alert('Solo Administrador, Rectora o Coordinación pueden reactivar estudiantes.');
      return;
    }
    if (!window.confirm(`¿Está seguro de reactivar a "${student.name}" en el roster oficial?\nEl cálculo de copias N+1 se actualizará automáticamente en toda la plataforma.`)) {
      return;
    }

    try {
      gradesService.reactivateStudent(selectedGrade, student.id, currentUser, selectedYear);
      setStudents(prev => prev.map(s => {
        if (s.id === student.id) {
          return {
            ...s,
            active: true,
            status: 'activo',
            inhabilitado: false,
            motivoRetiro: null,
            fechaRetiro: null
          };
        }
        return s;
      }));

      const nextCount = activeStudentsCount + 1;
      setToastMessage(`${student.name} reactivado. Sugerencia N+1 recalculada a ${nextCount + 1} copias.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err) {
      alert(`Error al reactivar estudiante: ${err.message}`);
    }
  };

  const handleOpenAuditModal = (student) => {
    setSelectedStudentForAction(student);
    setIsAuditModalOpen(true);
  };

  // Cálculos SIEE 80/20 y predicciones de cada estudiante
  const studentCalculations = useMemo(() => {
    const map = {};
    students.forEach(st => {
      map[st.id] = calculateGrade80_20(st, activities);
    });
    return map;
  }, [students, activities]);

  // Métricas estadísticas del grupo actual (Materia)
  const averagesList = useMemo(() => {
    return students.map(s => studentCalculations[s.id]?.definitivaNum || 1.0);
  }, [students, studentCalculations]);

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

    gradesService.saveBranchStudents(selectedYear, selectedPeriod, selectedGrade, selectedSubject, students, currentUser, activities);

    if (canEditScores) {
      setToastMessage(`¡Planilla guardada! Notas y retroalimentación de ${selectedSubject} registradas por ${currentUser?.name || 'la docente'}.`);
    } else if (canEditDirective) {
      setToastMessage(`¡Sugerencias registradas! Auditoría directiva de Rectoría guardada exitosamente.`);
    } else if (canEditCoordinacion) {
      setToastMessage(`¡Observaciones registradas! Observaciones de Coordinación Académica guardadas exitosamente.`);
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
        isNotificationsOpen={isNotificationsOpen}
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
        {/* Encabezado Superior Compacto de la Planilla */}
        <section className="grades-table-header-compact">
          <div className="grades-table-header-left">
            <h2 className="grades-table-main-title">
              <i className={`ph-bold ${activeSheetType === 'consolidated' ? 'ph-chart-bar' : 'ph-book-open'}`}></i>
              {activeSheetType === 'consolidated' 
                ? `Sábana General Consolidada • ${selectedGrade}` 
                : `Planilla: ${selectedSubject} • ${selectedGrade}`
              }
            </h2>
            <div className="grades-table-pills-row">
              {/* Badge de Rol / Modo */}
              {activeSheetType === 'consolidated' ? (
                <span className="grades-role-mode-pill mode-consolidada">
                  <i className="ph-bold ph-squares-four"></i>
                  Vista General del Grado
                </span>
              ) : canEditScores ? (
                <span className="grades-role-mode-pill mode-docente">
                  <i className="ph-bold ph-pencil-simple-line"></i>
                  Modo Calificador ({currentUser?.name || teacherInfo.teacherName})
                </span>
              ) : isRectora ? (
                <span className="grades-role-mode-pill mode-rectora">
                  <i className="ph-bold ph-eye"></i>
                  Supervisión Directiva • Modo Visual
                </span>
              ) : isCoordinador ? (
                <span className="grades-role-mode-pill mode-coordinador">
                  <i className="ph-bold ph-eye"></i>
                  Supervisión Coordinación • Modo Visual
                </span>
              ) : isAdmin ? (
                <span className="grades-role-mode-pill mode-admin">
                  <i className="ph-bold ph-eye"></i>
                  Auditoría Administrativa • Modo Visual
                </span>
              ) : (
                <span className="grades-role-mode-pill mode-observador">
                  <i className="ph-bold ph-eye"></i>
                  Modo Visual (Solo Lectura)
                </span>
              )}

              {/* Métricas Clave Compactas */}
              <span className="grades-compact-metric-pill" title="Promedio general actual">
                <i className="ph-bold ph-chart-line-up"></i> Prom: <strong>{activeSheetType === 'consolidated' ? consolidatedData.stats.gradeAverage : classAverage}</strong>
              </span>
              <span className="grades-compact-metric-pill" title="Porcentaje de aprobación">
                <i className="ph-bold ph-check-circle"></i> Aprob: <strong>{activeSheetType === 'consolidated' ? `${consolidatedData.stats.gradePassRate}%` : `${passRate}%`}</strong>
              </span>
              <span className="grades-compact-metric-pill" title="Estudiantes en roster">
                <i className="ph-bold ph-student"></i> Alumnos: <strong>{activeSheetType === 'consolidated' ? consolidatedData.stats.totalStudents : students.length}</strong>
              </span>
              <span className="grades-compact-metric-pill" title="Docente titular / Director">
                <i className="ph-bold ph-chalkboard-teacher"></i> {activeSheetType === 'consolidated' ? `Dir: ${gradeDirector.teacherName}` : `Docente: ${teacherInfo.teacherName}`}
              </span>
            </div>
          </div>

          {canManageCalendar && (
            <div className="grades-table-header-right">
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
                                  {Number(score) > 0 ? Number(score).toFixed(1) : '—'}
                                </span>
                              </td>
                            );
                          })}

                          {/* Promedio General del Estudiante */}
                          <td style={{ textAlign: 'center' }} className="td-consolidated-avg">
                            <span className={`definitiva-pill ${defBadgeClass}`}>
                              {Number(st.average || 0).toFixed(2)}
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
             Modelo Flexible 80% Aula Continua / 20% Evaluación Final
             ===================================================================== */
          <section className="grades-sheet-card">
            <div className="subject-sheet-header-bar">
              <div className="subject-sheet-info">
                <div className="subject-icon-box">
                  <i className={`ph-bold ${getSubjectIcon(selectedSubject)}`}></i>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h4>Planilla Oficial de {selectedSubject} • {selectedGrade}</h4>
                    {/* Bombillo Informativo Sutil SIEE & Tiraje N+1 */}
                    <div className="grades-siee-bulb-wrapper" title="Información del Modelo SIEE y Tiraje N+1">
                      <button 
                        type="button" 
                        className="grades-siee-bulb-btn"
                        aria-label="Información del Modelo SIEE y Tiraje N+1"
                      >
                        <i className="ph-fill ph-lightbulb"></i>
                      </button>
                      <div className="grades-siee-bulb-tooltip">
                        <div className="bulb-tooltip-title">
                          <i className="ph-fill ph-lightbulb"></i>
                          <span>Modelo SIEE & Impresión N+1</span>
                        </div>
                        <div className="bulb-tooltip-content">
                          <p><strong>Aula Continua ({activities.length} activas):</strong> 80% (talleres, quices y tareas sin rigidez).</p>
                          <p><strong>Evaluación Final:</strong> 20%.</p>
                          <p><strong>Tiraje N+1:</strong> {suggestedCopies} copias sugeridas ({activeStudentsCount} alumnos activos + 1 docente).</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p>Docente a cargo: <strong>{teacherInfo.teacherName}</strong> • {selectedPeriod}</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="grades-sheet-metric-pill" title="Sugerencia de impresión automatizada institucional (N + 1): Alumnos Activos + 1 Copia Docente Calificador">
                  <i className="ph-bold ph-printer"></i>
                  <span>Impresión N+1: <strong>{suggestedCopies} copias</strong> ({activeStudentsCount} act + 1 doc)</span>
                </div>
                {/* Micro-registro Rápido Móvil (comentado temporalmente por requerimiento, adaptado exclusivamente para dispositivos celulares)
                {canEditScores && (
                  <button
                    type="button"
                    className="btn-mobile-micro"
                    onClick={() => setIsMobileMicroOpen(true)}
                    title="Micro-registro rápido desde el móvil (teclado táctil en menos de 5 min)"
                  >
                    <i className="ph-bold ph-device-mobile"></i>
                    <span>Micro-registro Móvil</span>
                  </button>
                )}
                */}
                {canEditScores && (
                  <button
                    type="button"
                    className="btn-add-activity"
                    onClick={handleAddActivity}
                    disabled={activities.length >= 10}
                    title={activities.length >= 10 ? 'Límite de 10 actividades alcanzado' : 'Crear nueva actividad de aula (hasta 10)'}
                  >
                    <i className="ph-bold ph-plus-circle"></i>
                    <span>+ Actividad ({activities.length}/10)</span>
                  </button>
                )}
                {isPrivileged && (
                  <button
                    type="button"
                    className="grades-btn-secondary btn-return-consolidated"
                    onClick={() => setActiveSheetType('consolidated')}
                    title="Volver a la sábana general consolidada del grado"
                  >
                    <i className="ph-bold ph-chart-bar"></i>
                    <span>Ver Sábana General</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grades-table-wrapper">
              <table className="grades-table">
                <thead>
                  <tr>
                    <th style={{ width: '38px', textAlign: 'center' }}>#</th>
                    <th style={{ minWidth: '190px' }}>Estudiante</th>
                    
                    {/* Columnas dinámicas de Actividades de Aula Continua (80%) */}
                    {activities.map((act, actIdx) => (
                      <th key={act.id} className="th-pastel-component th-activity-col" style={{ textAlign: 'center', minWidth: '100px' }}>
                        <div className="th-component-header" style={{ position: 'relative' }}>
                          <span 
                            className={canEditScores ? "th-activity-name-editable" : ""}
                            onClick={() => canEditScores && handleRenameActivity(act.id)}
                            title={canEditScores ? `Clic para renombrar actividad "${act.name || `Actividad ${actIdx + 1}`}"` : (act.name || `Actividad ${actIdx + 1}`)}
                            style={canEditScores ? { cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px' } : {}}
                          >
                            <span>{act.name || act.label || `Act. ${actIdx + 1}`}</span>
                            {canEditScores && <i className="ph-bold ph-pencil-simple" style={{ fontSize: '0.72rem', opacity: 0.65 }}></i>}
                          </span>
                          <span className="th-badge-weight">Aula</span>
                          {canEditScores && activities.length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-activity"
                              onClick={() => handleRemoveActivity(act.id)}
                              title={`Eliminar actividad ${act.name || act.id}`}
                            >
                              ×
                            </button>
                          )}
                          {!canEditScores && (
                            <i 
                              className="ph-bold ph-lock-key th-lock-icon" 
                              title={isViewingAsGradeDirector ? `Solo Lectura (Director de Curso): Asignatura a cargo de ${teacherInfo.teacherName}` : "Calificación bloqueada: Solo docente titular"}
                            ></i>
                          )}
                        </div>
                      </th>
                    ))}

                    {/* Promedio Ponderado Aula (80%) */}
                    <th className="th-pastel-prom-aula" style={{ textAlign: 'center', minWidth: '95px' }}>
                      <div className="th-component-header">
                        <span>Prom. Aula</span>
                        <span className="th-badge-weight">80%</span>
                      </div>
                    </th>

                    {/* Evaluación Final / Bimestral (20%) */}
                    <th className="th-pastel-final-exam" style={{ textAlign: 'center', minWidth: '110px' }}>
                      <div className="th-component-header">
                        <span>Eval. Final</span>
                        <span className="th-badge-weight">20%</span>
                        {!canEditScores && (
                          <i 
                            className="ph-bold ph-lock-key th-lock-icon" 
                            title={isViewingAsGradeDirector ? `Solo Lectura: Asignatura a cargo de ${teacherInfo.teacherName}` : "Calificación bloqueada: Solo docente titular"}
                          ></i>
                        )}
                      </div>
                    </th>

                    {/* Definitiva SIEE (100%) */}
                    <th className="th-pastel-definitiva" style={{ textAlign: 'center', minWidth: '95px' }}>
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
                    <th className="th-pastel-docente-col" style={{ minWidth: '200px' }}>
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

                    {/* Rama Árbol: Observación de Coordinación (Exclusivo Coordinación y Admin) */}
                    <th className="th-pastel-coordinacion-col" style={{ minWidth: '200px' }}>
                      <div className="th-component-header">
                        <i className="ph-bold ph-clipboard-text"></i>
                        <span>Observación de Coordinación</span>
                        {canEditCoordinacion && <span className="th-badge-coordinador">Coordinación</span>}
                      </div>
                    </th>

                    {/* Rama Árbol: Sugerencia Directiva (Rectoría) */}
                    <th className="th-pastel-directiva-col" style={{ minWidth: '200px' }}>
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
                      <td colSpan={activities.length + 7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                        No se encontraron estudiantes para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => {
                      const gradeData = calculateGrade80_20(student, activities);
                      const defVal = gradeData.definitivaNum !== undefined && gradeData.definitivaNum !== null
                        ? Number(gradeData.definitivaNum)
                        : (gradeData.definitiva !== null && gradeData.definitiva !== undefined ? Number(gradeData.definitiva) : null);
                      const des = getDesempeno(defVal);
                      const defBadgeClass = getDefinitiveBadgeClass(defVal);
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span 
                                    className="grades-student-name"
                                    style={{ opacity: student.inhabilitado || student.active === false ? 0.6 : 1 }}
                                  >
                                    {student.name}
                                  </span>
                                  {student.inhabilitado || student.active === false ? (
                                    <span className="tag-inhabilitado" title="Estudiante inhabilitado (excluido de copias N+1)">
                                      Inhabilitado
                                    </span>
                                  ) : (
                                    <span className="dot-active-student" title="Estudiante Activo"></span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                  <span className="grades-student-code">{student.id}</span>
                                  {canManageMatricula && (
                                    <>
                                      {student.inhabilitado || student.active === false ? (
                                        <button
                                          type="button"
                                          className="btn-toggle-student-status"
                                          style={{ background: '#ecfdf5', color: '#047857', borderColor: '#a7f3d0' }}
                                          onClick={() => handleReactivateStudent(student)}
                                          title="Reactivar estudiante en el roster oficial (ajusta tiraje N+1)"
                                        >
                                          Reactivar
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn-toggle-student-status"
                                          style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}
                                          onClick={() => handleOpenRetireModal(student)}
                                          title="Inhabilitar / Marcar Retirado (Fase 5 - Soft Disable)"
                                        >
                                          Marcar Retirado
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="btn-toggle-student-status"
                                        style={{ background: '#f8fafc', color: '#475569', borderColor: '#cbd5e1' }}
                                        onClick={() => handleOpenAuditModal(student)}
                                        title="Ver ficha histórica y notas de auditoría SIEE"
                                      >
                                        Ficha
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Celdas dinámicas de Actividades de Aula */}
                          {activities.map((act) => {
                            const val = student.scores ? student.scores[act.id] : student[act.id];
                            const isRetiredStudent = student.inhabilitado || student.active === false;
                            const isUnpresented = isRetiredStudent && (val === undefined || val === null || val === '');
                            return (
                              <td key={act.id} style={{ textAlign: 'center' }} className="td-score-c1">
                                <div className="score-input-wrap">
                                  <input 
                                    type="number" 
                                    step="0.1" 
                                    min="1.0" 
                                    max="5.0"
                                    inputMode="decimal"
                                    value={val !== undefined && val !== null ? val : ''}
                                    onChange={(e) => handleActivityScoreChange(student.id, act.id, e.target.value)}
                                    className={`grades-input-score input-c1 ${!canEditScores ? 'grades-input-locked' : ''} ${isUnpresented ? 'input-unpresented-retired' : ''}`}
                                    placeholder={isUnpresented ? "1.0*" : "—"}
                                    readOnly={!canEditScores}
                                    title={
                                      isUnpresented 
                                        ? "Evaluación no presentada por retiro: 1.0 por defecto para el consolidado SIEE"
                                        : (!canEditScores 
                                            ? (isViewingAsGradeDirector 
                                                ? `Solo Lectura (Director de Curso): Calificada por ${teacherInfo.teacherName}` 
                                                : "Solo Lectura: SIEE") 
                                            : `Calificar ${act.name || act.id} (1.0 a 5.0)`)
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
                            );
                          })}

                          {/* Promedio Aula (80%) */}
                          <td className="td-prom-aula" style={{ textAlign: 'center' }}>
                            <span className="prom-aula-pill">
                              {gradeData.promedioAula !== null && gradeData.promedioAula !== undefined && !isNaN(Number(gradeData.promedioAula))
                                ? Number(gradeData.promedioAula).toFixed(1)
                                : '—'}
                            </span>
                          </td>

                          {/* Evaluación Final (20%) */}
                          <td style={{ textAlign: 'center' }} className="td-final-exam">
                            <div className="score-input-wrap">
                              <input 
                                type="number" 
                                step="0.1" 
                                min="1.0" 
                                max="5.0"
                                inputMode="decimal"
                                value={student.evaluacionFinal !== undefined && student.evaluacionFinal !== null ? student.evaluacionFinal : ''}
                                onChange={(e) => handleFinalExamChange(student.id, e.target.value)}
                                className={`grades-input-score input-c3 ${!canEditScores ? 'grades-input-locked' : ''} ${gradeData.isSimulated ? 'is-simulated' : ''}`}
                                placeholder={(student.inhabilitado || student.active === false) ? "1.0* (Retirado)" : "Pendiente"}
                                readOnly={!canEditScores}
                                title={
                                  (student.inhabilitado || student.active === false) && (student.evaluacionFinal === null || student.evaluacionFinal === undefined || student.evaluacionFinal === '')
                                    ? "No presentada por retiro: 1.0 por defecto para consolidado anual SIEE"
                                    : (!canEditScores 
                                        ? (isViewingAsGradeDirector 
                                            ? `Solo Lectura (Director de Curso): Calificada por ${teacherInfo.teacherName}` 
                                            : "Solo Lectura: SIEE") 
                                        : "Calificación de la Evaluación Final (20%)")
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

                          {/* Definitiva con Simulación Predictiva */}
                          <td className="grades-definitiva-cell td-score-def">
                            <div className="definitiva-cell-wrap">
                              <span className={`definitiva-pill ${defBadgeClass}`}>
                                {defVal !== null && defVal !== undefined && !isNaN(Number(defVal))
                                  ? Number(defVal).toFixed(1)
                                  : '—'}
                              </span>
                              {gradeData.isSimulated && (
                                <span 
                                  className="predictive-hint-pill" 
                                  title={`Simulación predictiva con 1.0 en la prueba final. Requiere ${gradeData.notaRequerida !== null && gradeData.notaRequerida !== undefined && !isNaN(Number(gradeData.notaRequerida)) ? Number(gradeData.notaRequerida).toFixed(1) : '—'} en el examen para aprobar la asignatura con 3.0`}
                                >
                                  *Proy. 1.0 (Req: {gradeData.notaRequerida !== null && gradeData.notaRequerida !== undefined && !isNaN(Number(gradeData.notaRequerida)) ? Number(gradeData.notaRequerida).toFixed(1) : '—'})
                                </span>
                              )}
                            </div>
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

                          {/* Rama: Observación de Coordinación */}
                          <td>
                            {canEditCoordinacion ? (
                              <div className="obs-input-wrap">
                                <input 
                                  type="text"
                                  value={student.observacion_coordinacion || student.observacionCoordinacion || ''}
                                  onChange={(e) => handleCoordinacionObservationChange(student.id, e.target.value)}
                                  placeholder="Observación de Coordinación..."
                                  className="grades-input-obs obs-coordinacion-input"
                                />
                                <span className="obs-coordinacion-indicator" title="Observación registrada por Coordinación">
                                  <i className="ph-bold ph-clipboard-text"></i>
                                </span>
                              </div>
                            ) : (
                              (student.observacion_coordinacion || student.observacionCoordinacion) ? (
                                <div className="obs-readonly-box obs-coordinacion-readonly" title="Observación oficial de Coordinación">
                                  <span className="obs-coordinacion-badge">📋 Coordinación:</span>
                                  <span>{student.observacion_coordinacion || student.observacionCoordinacion}</span>
                                </div>
                              ) : (
                                <span className="obs-empty-dash" title="Sin observaciones de coordinación">—</span>
                              )
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
                  <span className="legend-dot" style={{ backgroundColor: '#6366f1' }}></span> Aula Continua 80% ({activities.length} acts)
                </span>
                <span className="footer-legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span> Evaluación Final 20%
                </span>
                <span className="footer-legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span> Definitiva SIEE 100%
                </span>
                <span className="footer-legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#ef4444' }}></span> *Proyección Simulación 1.0
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
              </div>
            </div>
          </section>
        )}
      </main>
      </div>

      {/* Botón Flotante para Guardar Planilla (Exclusivo Docente Titular con Permiso de Calificación) */}
      {activeSheetType === 'subject' && canEditScores && (
        <button
          type="button"
          className="btn-floating-upload grades-floating-save-btn"
          onClick={handleSaveAction}
          title="Guardar notas y actividades docentes en la nube (Supabase)"
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            boxShadow: '0 10px 25px -5px rgba(234, 88, 12, 0.45), 0 8px 10px -6px rgba(234, 88, 12, 0.25)',
            cursor: 'pointer'
          }}
        >
          <i className="ph-bold ph-floppy-disk"></i>
          <span>Guardar Planilla</span>
        </button>
      )}

      {/* Modal de Control de Fechas, Cierres SIEE y Prórrogas (Coordinación / Admin) */}
      <EvaluationCalendarModal 
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentUser={currentUser}
        onCalendarUpdated={() => setCurriculumTick(t => t + 1)}
      />

      {/* Modal de Micro-registro Rápido Móvil (optimizado para celulares, comentado temporalmente según directiva)
      <MobileMicroRegistryModal
        isOpen={isMobileMicroOpen}
        onClose={() => setIsMobileMicroOpen(false)}
        students={filteredStudents}
        activities={activities}
        selectedSubject={selectedSubject}
        selectedGrade={selectedGrade}
        selectedPeriod={selectedPeriod}
        onScoreUpdate={handleMobileScoreUpdate}
        canEdit={canEditScores}
      />
      */}

      {/* Modal 4: Inhabilitar / Marcar Retirado (Soft-Disable) */}
      <RetireStudentModal
        isOpen={isRetireModalOpen}
        onClose={() => {
          setIsRetireModalOpen(false);
          setSelectedStudentForAction(null);
        }}
        student={selectedStudentForAction}
        grade={selectedGrade}
        currentUser={currentUser}
        onStudentRetired={(result) => {
          setStudents(prev => prev.map(s => {
            if (s.id === result.studentId) {
              return {
                ...s,
                active: false,
                status: 'retirado',
                inhabilitado: true,
                motivoRetiro: result.motivoRetiro,
                fechaRetiro: result.fechaRetiro
              };
            }
            return s;
          }));
          const nextCount = Math.max(0, activeStudentsCount - 1);
          setToastMessage(`${result.studentName} marcado como Retirado. Tiraje N+1 actualizado a ${nextCount + 1} copias.`);
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />

      {/* Modal 5: Ficha Histórica y Auditoría SIEE */}
      <StudentAuditDetailModal
        isOpen={isAuditModalOpen}
        onClose={() => {
          setIsAuditModalOpen(false);
          setSelectedStudentForAction(null);
        }}
        student={selectedStudentForAction}
        grade={selectedGrade}
        currentUser={currentUser}
        onOpenRetireModal={handleOpenRetireModal}
        onReactivateStudent={handleReactivateStudent}
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
