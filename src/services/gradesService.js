import { 
  ACADEMIC_YEARS, 
  ACADEMIC_PERIODS, 
  GRADES_LIST, 
  ALL_SUBJECTS, 
  FINAL_EXAM_SUBJECTS,
  EXCLUDED_FINAL_EXAM_SUBJECTS,
  subjectHasFinalExam,
  STUDENTS_BY_GRADE, 
  GRADE_DIRECTORS, 
  TEACHER_CURRICULUM_ASSIGNMENTS, 
  createInitialRosterForBranch,
  normalizeGrade
} from '../data/gradesTreeData.js';
import { USERS } from '../data/users.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const GRADES_STORAGE_KEY = 'gmg_grades_tree_v1';
const ASSIGNMENTS_CUSTOM_KEY = 'gmg_curriculum_assignments_custom';
const DIRECTORS_CUSTOM_KEY = 'gmg_grade_directors_custom';
const REPLACEMENTS_LOG_KEY = 'gmg_curriculum_reemplazos_history';
const CALENDAR_STORAGE_KEY = 'gmg_evaluation_calendar_v1';
const EXTENSIONS_STORAGE_KEY = 'gmg_extemporary_extensions_v1';
const CURRICULUM_ROLES_VERSION = 'v3_yuri_ciencias_naturales_sociales_2026';

const DEFAULT_EVALUATION_CALENDAR = {
  '1° Periodo (25%)': {
    startDate: '2026-02-02',
    endDate: '2026-04-10',
    closureDate: '2026-04-17',
    status: 'cerrado',
    description: 'Evaluaciones ordinarias Primer Periodo Lectivo'
  },
  '2° Periodo (25%)': {
    startDate: '2026-04-13',
    endDate: '2026-06-19',
    closureDate: '2026-06-26',
    status: 'cerrado',
    description: 'Evaluaciones ordinarias Segundo Periodo Lectivo'
  },
  '3° Periodo (25%)': {
    startDate: '2026-07-13',
    endDate: '2026-09-18',
    closureDate: '2026-09-25',
    status: 'cerrado',
    description: 'Evaluaciones ordinarias Tercer Periodo Lectivo'
  },
  '4° Periodo (25%)': {
    startDate: '2026-09-21',
    endDate: '2026-11-20',
    closureDate: '2026-11-27',
    status: 'abierto',
    description: 'Evaluaciones finales y comisiones de promoción'
  }
};

/**
 * Obtiene la fecha actual en formato local YYYY-MM-DD (sin desfase de zona horaria)
 */
export function getLocalDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calcula automáticamente el estado de cada periodo académico según la fecha actual.
 * Regla de Oro Institucional: NUNCA pueden quedar dos periodos académicos abiertos al tiempo.
 *
 * @param {Object} calendar Calendario de periodos
 * @param {string|Date} referenceDate Fecha de referencia (por defecto fecha actual)
 * @returns {Object} Calendario con estados actualizados
 */
export function syncPeriodStatusesByDate(calendar, referenceDate = new Date()) {
  const todayStr = typeof referenceDate === 'string' ? referenceDate : getLocalDateString(referenceDate);
  const updated = {};

  // 1. Encontrar el periodo que contiene la fecha actual.
  // Si varios coinciden por solapamiento de fechas, se elige el más reciente que haya iniciado.
  let matchingIndex = -1;
  for (let i = ACADEMIC_PERIODS.length - 1; i >= 0; i--) {
    const key = ACADEMIC_PERIODS[i];
    const data = calendar[key] || DEFAULT_EVALUATION_CALENDAR[key];
    const start = data.startDate || '2026-01-01';
    const close = data.closureDate || data.endDate || '2026-12-31';
    if (todayStr >= start && todayStr <= close) {
      matchingIndex = i;
      break;
    }
  }

  // 2. Asignar estados garantizando exclusividad: MÁXIMO 1 periodo abierto
  ACADEMIC_PERIODS.forEach((key, idx) => {
    const data = { ...(calendar[key] || DEFAULT_EVALUATION_CALENDAR[key]) };
    const start = data.startDate || '2026-01-01';
    const close = data.closureDate || data.endDate || '2026-12-31';

    if (matchingIndex !== -1) {
      if (idx < matchingIndex) {
        data.status = 'cerrado';
      } else if (idx === matchingIndex) {
        data.status = 'abierto';
      } else {
        data.status = 'programado';
      }
    } else {
      // Fuera de rango de periodos (ej. receso de mitad de año o fin de año)
      if (todayStr > close) {
        data.status = 'cerrado';
      } else if (todayStr < start) {
        data.status = 'programado';
      } else {
        data.status = 'programado';
      }
    }
    updated[key] = data;
  });

  return updated;
}

/**
 * Servicio Centralizado para la Jerarquía de Datos Relacional (RBAC) de Calificaciones
 * Incluye:
 * - Directores de curso oficiales por grado.
 * - Solo lectura para directores en materias ajenas.
 * - Soporte para rol Coordinación (auditoría global, observacion_coordinacion, fechas y prórrogas).
 * - Transferencia inmediata de planillas de estudiantes al nuevo docente nombrado.
 */

/**
 * Calcula el rendimiento y proyección según el modelo SIEE 80% Aula / 20% Evaluación Final
 * - Promedio simple de $N$ actividades continuas de aula (80%)
 * - Evaluación Final (20%)
 * - Simulación predictiva con 1.0 si la evaluación final no se ha presentado
 * 
 * Regla de Auditoría Fase 5 (Estudiantes Retirados / Inhabilitados):
 * - Sus notas previas se conservan intactas para auditoría.
 * - Evaluaciones no presentadas o periodos futuros se registran con 1.0 por defecto para el cómputo del consolidado.
 */
export function calculateGrade80_20(student, branchActivities = [], subject = '') {
  if (!student) {
    return {
      promedioAula: 0,
      aporteAula: 0,
      evaluacionFinal: null,
      aporteFinal: 0.20,
      definitiva: '1.0',
      definitivaNum: 1.0,
      isSimulated: true,
      notaRequerida: 3.0,
      puedeAprobar: true,
      activeScoresCount: 0,
      isRetired: false,
      isSubjectWithFinalExam: true
    };
  }

  // En el Gimnasio Martín Galeano:
  // - Materias con evaluación final escrita (20%): Lengua Castellana, Matemáticas, Ciencias Naturales, Ciencias Sociales e Inglés.
  // - Materias formativas/prácticas (Ética, Ed. Física, Artística, Religión): El 20% se obtiene de otras actividades formativas de aula (sin examen escrito).
  const isSubjectWithFinalExam = !subject || subjectHasFinalExam(subject);

  const isRetired = Boolean(student.inhabilitado || student.active === false || student.status === 'retirado' || student.status === 'inactivo');

  // Si el estudiante está retirado / inhabilitado:
  if (isRetired) {
    const scoresList = [];
    let preservedCount = 0;

    if (branchActivities && branchActivities.length > 0) {
      branchActivities.forEach((act) => {
        let val = null;
        if (student.scores && student.scores[act.id] !== undefined && student.scores[act.id] !== null && student.scores[act.id] !== '') {
          val = Number(student.scores[act.id]);
        } else if (student[act.id] !== undefined && student[act.id] !== null && student[act.id] !== '') {
          val = Number(student[act.id]);
        }

        if (val !== null && !isNaN(val) && val >= 1.0 && val <= 5.0) {
          scoresList.push(val);
          preservedCount++;
        } else {
          // Evaluación no presentada por retiro -> 1.0 por defecto (Auditoría SIEE)
          scoresList.push(1.0);
        }
      });
    } else {
      if (student.c1 !== undefined && student.c1 !== '' && !isNaN(Number(student.c1))) {
        scoresList.push(Number(student.c1));
        preservedCount++;
      } else {
        scoresList.push(1.0);
      }
      if (student.c2 !== undefined && student.c2 !== '' && !isNaN(Number(student.c2))) {
        scoresList.push(Number(student.c2));
        preservedCount++;
      } else {
        scoresList.push(1.0);
      }
    }

    const promedioAula = scoresList.length > 0
      ? Number((scoresList.reduce((sum, n) => sum + n, 0) / scoresList.length).toFixed(2))
      : 1.0;

    const aporteAula = Number((promedioAula * 0.80).toFixed(2));

    let finalExamVal = null;
    if (student.evaluacionFinal !== undefined && student.evaluacionFinal !== null && student.evaluacionFinal !== '') {
      finalExamVal = Number(student.evaluacionFinal);
    } else if (student.c3 !== undefined && student.c3 !== null && student.c3 !== '') {
      finalExamVal = Number(student.c3);
    }

    const hasFinalExam = finalExamVal !== null && !isNaN(finalExamVal) && finalExamVal >= 1.0 && finalExamVal <= 5.0;
    const effectiveFinalExam = hasFinalExam ? finalExamVal : 1.0;
    const aporteFinal = Number((effectiveFinalExam * 0.20).toFixed(2));
    const definitivaNum = Number((aporteAula + aporteFinal).toFixed(1));

    return {
      promedioAula,
      aporteAula,
      evaluacionFinal: hasFinalExam ? finalExamVal : 1.0,
      aporteFinal,
      definitiva: definitivaNum.toFixed(1),
      definitivaNum,
      isSimulated: isSubjectWithFinalExam ? !hasFinalExam : false,
      notaRequerida: 3.0,
      puedeAprobar: false,
      activeScoresCount: preservedCount,
      isRetired: true,
      hasPreservedScores: preservedCount > 0,
      isSubjectWithFinalExam
    };
  }

  // Estudiante Activo normal:
  const validScores = [];

  if (branchActivities && branchActivities.length > 0) {
    branchActivities.forEach((act) => {
      let val = null;
      if (student.scores && student.scores[act.id] !== undefined && student.scores[act.id] !== null && student.scores[act.id] !== '') {
        val = Number(student.scores[act.id]);
      } else if (student[act.id] !== undefined && student[act.id] !== null && student[act.id] !== '') {
        val = Number(student[act.id]);
      }
      if (val !== null && !isNaN(val) && val >= 1.0 && val <= 5.0) {
        validScores.push(val);
      }
    });
  }

  // Si no se encontraron por branchActivities, buscar en campos legados c1 y c2
  if (validScores.length === 0) {
    if (student.c1 !== undefined && student.c1 !== '' && !isNaN(Number(student.c1))) {
      validScores.push(Number(student.c1));
    }
    if (student.c2 !== undefined && student.c2 !== '' && !isNaN(Number(student.c2))) {
      validScores.push(Number(student.c2));
    }
  }

  const activeScoresCount = validScores.length;
  const promedioAula = activeScoresCount > 0
    ? Number((validScores.reduce((sum, n) => sum + n, 0) / activeScoresCount).toFixed(2))
    : 0;

  const aporteAula = Number((promedioAula * 0.80).toFixed(2));

  // Evaluación Final / Otras Actividades (20%)
  let finalExamVal = null;
  if (student.evaluacionFinal !== undefined && student.evaluacionFinal !== null && student.evaluacionFinal !== '') {
    finalExamVal = Number(student.evaluacionFinal);
  } else if (student.c3 !== undefined && student.c3 !== null && student.c3 !== '') {
    finalExamVal = Number(student.c3);
  }

  const hasFinalExam = finalExamVal !== null && !isNaN(finalExamVal) && finalExamVal >= 1.0 && finalExamVal <= 5.0;

  let aporteFinal = 0;
  let definitivaNum = 0;
  let isSimulated = false;

  if (hasFinalExam) {
    aporteFinal = Number((finalExamVal * 0.20).toFixed(2));
    definitivaNum = Number((aporteAula + aporteFinal).toFixed(1));
    isSimulated = false;
  } else if (!isSubjectWithFinalExam) {
    // Asignatura formativa sin examen acumulativo escrito (Ética, Ed. Física, Artística, Religión):
    // El 20% se obtiene de otras actividades formativas de aula. Si no se registra nota específica,
    // se calcula la definitiva en base al rendimiento continuo de aula sin proyectar castigo de 1.0.
    if (activeScoresCount > 0) {
      aporteFinal = Number((promedioAula * 0.20).toFixed(2));
      definitivaNum = Number(promedioAula.toFixed(1));
      isSimulated = false;
    } else {
      aporteFinal = 0.20;
      definitivaNum = 1.0;
      isSimulated = false;
    }
  } else {
    // Asignatura fundamental con examen final acumulativo obligatorio:
    // SIMULACIÓN PREDICTIVA CON 1.0 mientras no se califique la prueba bimestral:
    aporteFinal = 0.20;
    definitivaNum = Number((aporteAula + 0.20).toFixed(1));
    isSimulated = true;
  }

  // Nota requerida en la prueba final para aprobar con 3.0 (solo si tiene examen y está simulado)
  const notaRequeridaRaw = (3.0 - aporteAula) / 0.20;
  const notaRequerida = isSubjectWithFinalExam
    ? Number(Math.max(1.0, Math.min(5.0, notaRequeridaRaw)).toFixed(1))
    : null;
  const puedeAprobar = !isSubjectWithFinalExam || notaRequeridaRaw <= 5.0;

  return {
    promedioAula,
    aporteAula,
    evaluacionFinal: hasFinalExam ? finalExamVal : null,
    aporteFinal,
    definitiva: definitivaNum.toFixed(1),
    definitivaNum,
    isSimulated,
    notaRequerida,
    puedeAprobar,
    activeScoresCount,
    isRetired: false,
    isSubjectWithFinalExam
  };
}

class GradesService {
  constructor() {
    this.checkVersionAndMigrate();
    this.tree = this.loadTreeFromStorage();
    this.customAssignments = this.loadFromStorage(ASSIGNMENTS_CUSTOM_KEY, {});
    this.customDirectors = this.loadFromStorage(DIRECTORS_CUSTOM_KEY, {});
    this.replacementLogs = this.loadFromStorage(REPLACEMENTS_LOG_KEY, []);
    const rawCalendar = this.loadFromStorage(CALENDAR_STORAGE_KEY, DEFAULT_EVALUATION_CALENDAR);
    this.evaluationCalendar = syncPeriodStatusesByDate(rawCalendar);
    this.extemporaryExtensions = this.loadFromStorage(EXTENSIONS_STORAGE_KEY, []);
  }

  checkVersionAndMigrate() {
    if (typeof window !== 'undefined') {
      try {
        const storedVer = localStorage.getItem('gmg_curriculum_roles_version');
        if (storedVer !== CURRICULUM_ROLES_VERSION) {
          // Limpiar sobreescrituras personalizadas anteriores para aplicar la nueva asignación oficial
          localStorage.removeItem(ASSIGNMENTS_CUSTOM_KEY);
          localStorage.removeItem(DIRECTORS_CUSTOM_KEY);
          localStorage.setItem('gmg_curriculum_roles_version', CURRICULUM_ROLES_VERSION);
        }
      } catch (e) {
        console.warn('Error al verificar versión de currículo:', e);
      }
    }
  }

  loadTreeFromStorage() {
    if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return {};
    try {
      const data = localStorage.getItem(GRADES_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error al cargar árbol de calificaciones de localStorage:', e);
    }
    return {};
  }

  loadFromStorage(key, fallback) {
    if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return fallback;
    try {
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn(`Error al leer ${key} de localStorage:`, e);
    }
    return fallback;
  }

  persistTree() {
    if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') return;
    try {
      localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(this.tree));
    } catch (e) {
      console.error('Error al persistir árbol de calificaciones:', e);
    }
  }

  persistCustomState() {
    if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') return;
    try {
      localStorage.setItem(ASSIGNMENTS_CUSTOM_KEY, JSON.stringify(this.customAssignments));
      localStorage.setItem(DIRECTORS_CUSTOM_KEY, JSON.stringify(this.customDirectors));
      localStorage.setItem(REPLACEMENTS_LOG_KEY, JSON.stringify(this.replacementLogs));
      localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(this.evaluationCalendar));
      localStorage.setItem(EXTENSIONS_STORAGE_KEY, JSON.stringify(this.extemporaryExtensions));
    } catch (e) {
      console.error('Error al persistir novedades, calendario y asignaciones:', e);
    }
  }

  notifyCurriculumUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gmg_curriculum_updated', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
  }

  /**
   * Obtiene el Director de Curso asignado a un grado (considera reemplazos de administrador)
   */
  getGradeDirector(grade) {
    if (this.customDirectors[grade]) {
      return this.customDirectors[grade];
    }
    if (GRADE_DIRECTORS[grade]) {
      return GRADE_DIRECTORS[grade];
    }
    return { docente_id: 'jessica', teacherName: 'Jessica' };
  }

  /**
   * Verifica si un usuario es Director de Curso del grado indicado
   */
  isGradeDirector(user, grade) {
    if (!user || !grade) return false;
    const userKey = user.key || user.role;
    const director = this.getGradeDirector(grade);
    return director.docente_id === userKey || director.teacherName === user.name;
  }

  /**
   * Determina si una materia corresponde por mandato institucional a la Directora de Curso del grado:
   * Educación Artística (Artes), Religión y Educación Física
   */
  isDirectorCourseSubject(subject) {
    if (!subject) return false;
    const s = subject.toLowerCase();
    return s.includes('art') || s.includes('relig') || s.includes('física') || s.includes('fisica');
  }

  /**
   * Obtiene la asignación docente de una materia específica en un grado
   */
  getTeacherAssignment(grade, subject) {
    if (this.customAssignments[grade] && this.customAssignments[grade][subject]) {
      return this.customAssignments[grade][subject];
    }
    // Si la materia es del bloque institucional de dirección de curso (Artes, Religión, Educación Física),
    // siempre corresponde dinámicamente a la Directora de Curso oficial actual de ese grado
    if (this.isDirectorCourseSubject(subject)) {
      return this.getGradeDirector(grade);
    }
    if (TEACHER_CURRICULUM_ASSIGNMENTS[grade] && TEACHER_CURRICULUM_ASSIGNMENTS[grade][subject]) {
      return TEACHER_CURRICULUM_ASSIGNMENTS[grade][subject];
    }
    return { docente_id: 'jessica', teacherName: 'Jessica' };
  }

  getAcademicYears() {
    return ACADEMIC_YEARS;
  }

  getAcademicPeriods() {
    return ACADEMIC_PERIODS;
  }

  /**
   * Devuelve los Grados a los que tiene acceso el usuario según su rol RBAC
   * - Rectora / Admin / Coordinación: Todos los grados (supervisión y auditoría en modo visual)
   * - Docente: ÚNICAMENTE los grados donde dicta asignaturas a su cargo (aislamiento estricto)
   */
  getGradesForUser(user) {
    if (!user) return GRADES_LIST;
    const role = user.role;
    const userKey = user.key || role;

    // Directivos, Administradores, Coordinador y Modo Inducción ven todos los grados
    if (role === 'rectora' || role === 'induccion_rectora' || role === 'admin' || role === 'induccion' || role === 'coordinador') {
      return GRADES_LIST;
    }

    // Para docente: ÚNICAMENTE los grados donde tiene materias asignadas a su cargo oficial
    const accessibleGrades = GRADES_LIST.filter(grade => {
      const subjectsInGrade = this.getSubjectsForGrade(grade);
      return subjectsInGrade.some(subj => {
        const assignment = this.getTeacherAssignment(grade, subj);
        return assignment.docente_id === userKey || assignment.teacherName === user.name;
      });
    });

    return accessibleGrades.length > 0 ? accessibleGrades : ['1° Primaria'];
  }

  /**
   * Devuelve las Materias disponibles para un Grado específico según el rol del usuario
   * - Rectora / Admin / Coordinación: Todas las materias del grado (supervisión institucional)
   * - Docente: ÚNICAMENTE las materias que tiene a su cargo en este grado (no ven materias ni notas de otras docentes)
   */
  getSubjectsForGradeAndUser(grade, user) {
    const allSubjectsInGrade = this.getSubjectsForGrade(grade);

    if (!user) return allSubjectsInGrade;
    const role = user.role;
    const userKey = user.key || role;

    // Directivos, Administradores, Coordinador y Modo Inducción ven todas las materias
    if (role === 'rectora' || role === 'induccion_rectora' || role === 'admin' || role === 'induccion' || role === 'coordinador') {
      return allSubjectsInGrade;
    }

    // Para docentes: ÚNICAMENTE las materias asignadas a su cargo (estricto aislamiento entre docentes)
    const teacherSubjects = allSubjectsInGrade.filter(subj => {
      const assignment = this.getTeacherAssignment(grade, subj);
      return assignment.docente_id === userKey || assignment.teacherName === user.name;
    });

    return teacherSubjects;
  }

  /**
   * Devuelve todas las materias oficiales configuradas para un grado
   */
  getSubjectsForGrade(grade) {
    const defaultGradeAssignments = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
    const customGradeAssignments = this.customAssignments[grade] || {};
    const all = Array.from(new Set([
      ...Object.keys(defaultGradeAssignments),
      ...Object.keys(customGradeAssignments)
    ]));
    return all.length > 0 ? all : ALL_SUBJECTS;
  }

  /**
   * Genera el consolidado general de notas de un grado y periodo (Sábana General - Vista General)
   */
  getConsolidatedGradeSheet(year = '2026', period = '1° Periodo (25%)', grade = '1° Primaria') {
    const canonicalGrade = normalizeGrade(grade);
    const subjects = this.getSubjectsForGrade(canonicalGrade);
    const studentsBase = this.getGradeRoster(canonicalGrade, year, period);
    
    // Obtenemos los datos de cada materia para el año, periodo y grado
    const subjectRosters = {};
    subjects.forEach(subj => {
      subjectRosters[subj] = this.getBranch(year, period, grade, subj);
    });

    const studentsReport = studentsBase.map((st) => {
      const subjectGrades = {};
      let totalSum = 0;
      let subjectsCount = 0;
      let failedCount = 0;

      subjects.forEach(subj => {
        const branch = subjectRosters[subj];
        const studentRecord = branch?.students?.find(s => s.id === st.id) || st;
        if (studentRecord) {
          const calc = calculateGrade80_20(studentRecord, branch?.activities, subj);
          const defNum = calc.definitivaNum;
          subjectGrades[subj] = defNum;
          totalSum += defNum;
          subjectsCount += 1;
          if (defNum < 3.0) {
            failedCount += 1;
          }
        } else {
          // Si está inhabilitado/retirado, 1.0 por defecto; sino 0
          const fallbackVal = st.inhabilitado ? 1.0 : 0;
          subjectGrades[subj] = fallbackVal;
          if (fallbackVal > 0) {
            totalSum += fallbackVal;
            subjectsCount += 1;
            failedCount += 1;
          }
        }
      });

      const average = subjectsCount > 0 ? Number((totalSum / subjectsCount).toFixed(2)) : 0;
      const isRetired = st.active === false || st.status === 'inactivo' || st.status === 'retirado' || st.inhabilitado;

      return {
        id: st.id,
        name: st.name,
        grade: canonicalGrade,
        active: !isRetired,
        status: isRetired ? 'retirado' : 'activo',
        inhabilitado: isRetired,
        motivoRetiro: st.motivoRetiro || null,
        fechaRetiro: st.fechaRetiro || null,
        acudiente: st.acudiente || 'Acudiente registrado en secretaría',
        fechaIngreso: st.fechaIngreso || '2026-02-02',
        tipoIngreso: st.tipoIngreso || 'Matrícula Regular',
        subjectGrades,
        average,
        failedCount
      };
    });

    // Ordenar por promedio descendente para determinar ranking/puesto
    const sortedStudents = [...studentsReport].sort((a, b) => b.average - a.average);
    const rankedStudents = sortedStudents.map((st, index) => ({
      ...st,
      rank: index + 1
    }));

    // Métricas del consolidado del grado
    const overallSum = rankedStudents.reduce((acc, s) => acc + s.average, 0);
    const gradeAverage = rankedStudents.length > 0 ? (overallSum / rankedStudents.length).toFixed(2) : '0.00';
    const cleanPassingStudents = rankedStudents.filter(s => s.failedCount === 0).length;
    const gradePassRate = rankedStudents.length > 0 ? Math.round((cleanPassingStudents / rankedStudents.length) * 100) : 0;
    const topStudent = rankedStudents.length > 0 ? rankedStudents[0] : null;

    return {
      grade,
      period,
      year,
      subjects,
      students: rankedStudents,
      stats: {
        totalStudents: rankedStudents.length,
        gradeAverage,
        gradePassRate,
        topStudent
      }
    };
  }

  /**
   * Genera el consolidado anual de notas de un grado (4 Periodos Lectivos)
   * Regla de Auditoría Fase 5:
   * - Las notas previas se conservan intactas para auditoría.
   * - Los periodos futuros o evaluaciones no presentadas por retiro se registran con 1.0 por defecto para el cómputo del consolidado anual.
   * - Consolidado anual por materia = P1(25%) + P2(25%) + P3(25%) + P4(25%).
   */
  getAnnualConsolidatedGradeSheet(year = '2026', grade = '1° Primaria') {
    const canonicalGrade = normalizeGrade(grade);
    const subjects = this.getSubjectsForGrade(canonicalGrade);
    const allStudents = this.getGradeRoster(canonicalGrade, year, ACADEMIC_PERIODS[0]);

    const studentReports = allStudents.map(st => {
      const subjectAnnuals = {};
      const subjectPeriodBreakdown = {};
      let totalAnnualSum = 0;
      let subjectsCount = 0;
      let failedSubjectsCount = 0;

      subjects.forEach(subj => {
        const periodScores = [];
        let subjectDefinitivaSum = 0;

        ACADEMIC_PERIODS.forEach(period => {
          const branch = this.getBranch(year, period, canonicalGrade, subj);
          const studentRec = branch?.students?.find(s => s.id === st.id);
          
          let periodDef = 1.0;
          if (studentRec) {
            const calc = calculateGrade80_20(studentRec, branch?.activities, subj);
            periodDef = calc.definitivaNum;
          }
          periodScores.push(periodDef);
          subjectDefinitivaSum += periodDef * 0.25;
        });

        const subjectAnnualDef = Number(subjectDefinitivaSum.toFixed(2));
        subjectAnnuals[subj] = subjectAnnualDef;
        subjectPeriodBreakdown[subj] = periodScores;
        totalAnnualSum += subjectAnnualDef;
        subjectsCount += 1;
        if (subjectAnnualDef < 3.0) {
          failedSubjectsCount += 1;
        }
      });

      const annualAverage = subjectsCount > 0 ? Number((totalAnnualSum / subjectsCount).toFixed(2)) : 1.0;
      const isRetired = st.active === false || st.status === 'inactivo' || st.status === 'retirado' || st.inhabilitado;

      return {
        id: st.id,
        name: st.name,
        grade: canonicalGrade,
        active: !isRetired,
        status: isRetired ? 'retirado' : 'activo',
        inhabilitado: isRetired,
        motivoRetiro: st.motivoRetiro || null,
        fechaRetiro: st.fechaRetiro || null,
        acudiente: st.acudiente || 'Acudiente registrado en secretaría',
        fechaIngreso: st.fechaIngreso || '2026-02-02',
        tipoIngreso: st.tipoIngreso || 'Matrícula Regular',
        subjectAnnuals,
        subjectPeriodBreakdown,
        annualAverage,
        failedSubjectsCount
      };
    });

    const sortedStudents = [...studentReports].sort((a, b) => b.annualAverage - a.annualAverage);
    const rankedStudents = sortedStudents.map((st, idx) => ({
      ...st,
      rank: idx + 1
    }));

    return {
      year,
      grade: canonicalGrade,
      subjects,
      periods: ACADEMIC_PERIODS,
      students: rankedStudents,
      stats: {
        totalRegistered: rankedStudents.length,
        activeCount: rankedStudents.filter(s => s.active).length,
        retiredCount: rankedStudents.filter(s => !s.active).length,
        gradeAnnualAverage: rankedStudents.length > 0
          ? (rankedStudents.reduce((acc, s) => acc + s.annualAverage, 0) / rankedStudents.length).toFixed(2)
          : '0.00'
      }
    };
  }

  /**
   * Accede a la rama del árbol: Año -> Periodo -> Grado -> Materia
   */
  getBranch(year = '2026', period = '1° Periodo (25%)', grade = '1° Primaria', subject = 'Matemáticas') {
    if (!this.tree[year]) this.tree[year] = {};
    if (!this.tree[year][period]) this.tree[year][period] = {};
    if (!this.tree[year][period][grade]) this.tree[year][period][grade] = {};

    const teacherInfo = this.getTeacherAssignment(grade, subject);
    const defaultActivities = [
      { id: 'act_1', name: 'Taller 1', type: 'Taller' },
      { id: 'act_2', name: 'Quiz Rápido', type: 'Quiz' },
      { id: 'act_3', name: 'Trabajo en Clase', type: 'Clase' }
    ];

    if (!this.tree[year][period][grade][subject]) {
      const initialRoster = createInitialRosterForBranch(grade, subject, period);

      this.tree[year][period][grade][subject] = {
        docente_id: teacherInfo.docente_id,
        teacherName: teacherInfo.teacherName,
        activities: defaultActivities,
        students: initialRoster,
        lastUpdated: new Date().toISOString()
      };
      this.persistTree();
    } else {
      const branch = this.tree[year][period][grade][subject];
      if (!branch.activities || !Array.isArray(branch.activities) || branch.activities.length === 0) {
        branch.activities = defaultActivities;
        this.persistTree();
      }

      // Sincronizar docente asignado si hubo reemplazo administrativo o actualización de perfil docente
      if (
        branch.docente_id !== teacherInfo.docente_id ||
        branch.teacherName !== teacherInfo.teacherName
      ) {
        branch.docente_id = teacherInfo.docente_id;
        branch.teacherName = teacherInfo.teacherName;
        this.persistTree();
      }
    }

    return this.tree[year][period][grade][subject];
  }

  isViewingAsGradeDirector(user, grade, subject) {
    return false;
  }

  canEditScores(user, grade, subject, period = null) {
    if (!user) return false;
    // Administrador, Rectoría y Coordinación supervisan y auditan institucionalmente en modo exclusivamente VISUAL (sin alterar notas)
    if (user.role === 'admin' || user.role === 'rectora' || user.role === 'induccion_rectora' || user.role === 'coordinador') {
      return false;
    }
    if (user.role === 'induccion') {
      return true;
    }
    const teacherInfo = this.getTeacherAssignment(grade, subject);
    const userKey = user.key || user.role;
    const isTeacher = teacherInfo.docente_id === userKey || teacherInfo.teacherName === user.name;
    if (!isTeacher) return false;

    // Validación según calendario académico SIEE y fechas de corte:
    if (period && this.evaluationCalendar && this.evaluationCalendar[period]) {
      const pData = this.evaluationCalendar[period];
      if (pData.status === 'cerrado' || pData.status === 'programado') {
        // En periodo cerrado o programado, solo se permite calificar si tiene prórroga extemporánea activa autorizada por Coordinación
        return this.isSubjectOpenForExtemporary(period, grade, subject);
      }
    }

    return true;
  }

  canEditTeacherFeedback(user, grade, subject, period = null) {
    return this.canEditScores(user, grade, subject, period);
  }

  canEditDirectiveSuggestion(user) {
    if (!user) return false;
    return user.role === 'rectora' || user.role === 'induccion_rectora';
  }

  canEditAdminAudit(user) {
    // Administrador institucional está en modo estrictamente visual de auditoría
    return false;
  }

  /**
   * Permiso de edición en campo exclusivo: observacion_coordinacion
   * Exclusivo para Coordinación Académica
   */
  canEditCoordinacionObservation(user) {
    if (!user) return false;
    return user.role === 'coordinador';
  }

  /**
   * Permiso para gestión del calendario de evaluaciones y habilitación de prórrogas extemporáneas
   */
  canManageCalendarAndDeadlines(user) {
    if (!user) return false;
    return user.role === 'coordinador' || user.role === 'admin';
  }

  /**
   * Permiso para gestión de malla curricular y novedades docentes
   */
  canManageCurriculum(user) {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'rectora' || user.role === 'induccion_rectora' || user.role === 'coordinador';
  }

  // =====================================================================
  // GESTIÓN DE FECHAS, CIERRES Y PRÓRROGAS EXTEMPORÁNEAS (COORDINACIÓN)
  // =====================================================================

  getEvaluationCalendar(autoSync = false) {
    if (autoSync) {
      this.evaluationCalendar = syncPeriodStatusesByDate(this.evaluationCalendar);
    }
    return this.evaluationCalendar;
  }

  updateEvaluationPeriod(period, updateData, user) {
    if (!this.canManageCalendarAndDeadlines(user)) {
      throw new Error('No tiene autorización para modificar el calendario de evaluaciones.');
    }
    if (!this.evaluationCalendar[period]) {
      this.evaluationCalendar[period] = { ...(DEFAULT_EVALUATION_CALENDAR[period] || {}) };
    }

    // Regla de Oro Institucional: NUNCA pueden quedar dos periodos académicos abiertos al tiempo
    if (updateData.status === 'abierto') {
      const targetIndex = ACADEMIC_PERIODS.indexOf(period);
      ACADEMIC_PERIODS.forEach((pKey, idx) => {
        if (!this.evaluationCalendar[pKey]) {
          this.evaluationCalendar[pKey] = { ...(DEFAULT_EVALUATION_CALENDAR[pKey] || {}) };
        }
        if (idx < targetIndex) {
          this.evaluationCalendar[pKey].status = 'cerrado';
        } else if (idx === targetIndex) {
          this.evaluationCalendar[pKey] = {
            ...this.evaluationCalendar[pKey],
            ...updateData,
            status: 'abierto',
            lastModifiedBy: user?.name || 'Coordinación',
            lastModifiedAt: new Date().toISOString()
          };
        } else {
          this.evaluationCalendar[pKey].status = 'programado';
        }
      });
    } else if (updateData.startDate || updateData.closureDate) {
      // Si se actualizaron fechas, aplicar la actualización y recalcular automáticamente por fechas
      this.evaluationCalendar[period] = {
        ...this.evaluationCalendar[period],
        ...updateData,
        lastModifiedBy: user?.name || 'Coordinación',
        lastModifiedAt: new Date().toISOString()
      };
      this.evaluationCalendar = syncPeriodStatusesByDate(this.evaluationCalendar);
    } else {
      this.evaluationCalendar[period] = {
        ...this.evaluationCalendar[period],
        ...updateData,
        lastModifiedBy: user?.name || 'Coordinación',
        lastModifiedAt: new Date().toISOString()
      };
    }

    this.persistCustomState();
    this.notifyCurriculumUpdate();
    return this.evaluationCalendar;
  }

  recalculatePeriodsByCurrentDate(user) {
    if (user && !this.canManageCalendarAndDeadlines(user)) {
      throw new Error('No tiene autorización para modificar el calendario de evaluaciones.');
    }
    this.evaluationCalendar = syncPeriodStatusesByDate(this.evaluationCalendar);
    this.persistCustomState();
    this.notifyCurriculumUpdate();
    return this.evaluationCalendar;
  }

  getExtemporaryExtensions() {
    return this.extemporaryExtensions;
  }

  grantExtemporaryExtension({ period, grade, subject, teacherKey, hours = 48, reason, grantedBy }) {
    if (!this.canManageCalendarAndDeadlines(grantedBy)) {
      throw new Error('Solo Coordinación y Administrador pueden habilitar prórrogas extemporáneas.');
    }

    const expiresAt = new Date(Date.now() + Number(hours) * 60 * 60 * 1000).toISOString();
    const extension = {
      id: `EXT-${Date.now()}`,
      period,
      grade,
      subject,
      teacherKey,
      grantedAt: new Date().toISOString(),
      expiresAt,
      hours,
      reason: reason || 'Prórroga formal autorizada por Coordinación Académica',
      grantedByName: grantedBy?.name || 'Coordinación',
      status: 'activa'
    };

    this.extemporaryExtensions.unshift(extension);
    this.persistCustomState();
    this.notifyCurriculumUpdate();
    return extension;
  }

  revokeExtemporaryExtension(extensionId, user) {
    if (!this.canManageCalendarAndDeadlines(user)) {
      throw new Error('No tiene permisos para revocar prórrogas.');
    }
    const ext = this.extemporaryExtensions.find(e => e.id === extensionId);
    if (ext) {
      ext.status = 'revocada';
      ext.revokedAt = new Date().toISOString();
      ext.revokedBy = user?.name || 'Coordinación';
      this.persistCustomState();
      this.notifyCurriculumUpdate();
    }
    return ext;
  }

  isSubjectOpenForExtemporary(period, grade, subject) {
    const now = new Date();
    return this.extemporaryExtensions.some(ext => 
      ext.period === period &&
      ext.grade === grade &&
      ext.subject === subject &&
      ext.status === 'activa' &&
      new Date(ext.expiresAt) > now
    );
  }

  saveBranchStudents(year, period, grade, subject, students, user, activities = null) {
    const branch = this.getBranch(year, period, grade, subject);
    if (activities && Array.isArray(activities)) {
      branch.activities = activities;
    }
    branch.students = students.map(student => ({
      ...student,
      observacion_coordinacion: student.observacion_coordinacion || student.observacionCoordinacion || null,
      observacionCoordinacion: student.observacion_coordinacion || student.observacionCoordinacion || null,
    }));
    branch.lastUpdated = new Date().toISOString();
    branch.lastUpdatedBy = user?.name || 'Sistema';
    this.persistTree();

    // Sincronización asíncrona con Supabase en segundo plano
    this.syncBranchToSupabase(year, period, grade, subject, branch).catch(err => {
      console.warn('[GradesService] Advertencia al respaldar en Supabase:', err);
    });

    return branch;
  }

  /**
   * Genera una clave canónica normalizada para identificar ramas en Supabase
   */
  getBranchCanonicalKey(year, period, grade, subject) {
    const clean = (str = '') => String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_');
    return `${clean(year)}__${clean(period)}__${clean(grade)}__${clean(subject)}`;
  }

  /**
   * Sincroniza una rama con Supabase (tabla grades_branches con respaldo en institutional_vault)
   */
  async syncBranchToSupabase(year, period, grade, subject, branchData) {
    if (!isSupabaseConfigured || !supabase) return { synced: false, reason: 'Supabase no configurado' };

    const branchKey = this.getBranchCanonicalKey(year, period, grade, subject);
    const payload = {
      id: branchKey,
      year: String(year),
      period: String(period),
      grade: String(grade),
      subject: String(subject),
      docente_id: branchData.docente_id || null,
      teacher_name: branchData.teacherName || null,
      activities: branchData.activities || [],
      students: branchData.students || [],
      updated_by: branchData.lastUpdatedBy || 'Docente',
      updated_at: new Date().toISOString()
    };

    // 1. Intentar persistencia en la tabla especializada grades_branches
    try {
      const { data, error } = await supabase
        .from('grades_branches')
        .upsert([payload], { onConflict: 'id' });

      if (!error) {
        return { synced: true, provider: 'grades_branches' };
      }
    } catch {
      // Continuar con respaldo
    }

    // 2. Respaldo transparente en institutional_vault
    try {
      const vaultPayload = {
        user_key: `grades_branch_${branchKey}`,
        cipher: JSON.stringify(branchData),
        default_invalidated: true,
        updated_at: new Date().toISOString()
      };
      const { error: vaultErr } = await supabase
        .from('institutional_vault')
        .upsert(vaultPayload, { onConflict: 'user_key' });

      if (vaultErr) {
        console.warn('[GradesService] Advertencia al sincronizar rama con Supabase:', vaultErr);
        return { synced: false, error: vaultErr };
      }
      return { synced: true, provider: 'institutional_vault' };
    } catch (err) {
      console.warn('[GradesService] Excepción al sincronizar con Supabase:', err);
      return { synced: false, error: err };
    }
  }

  /**
   * Descarga la rama desde Supabase si existe una versión remota
   */
  async fetchBranchFromSupabase(year, period, grade, subject) {
    if (!isSupabaseConfigured || !supabase) return null;

    const branchKey = this.getBranchCanonicalKey(year, period, grade, subject);

    // 1. Intentar desde grades_branches
    try {
      const { data, error } = await supabase
        .from('grades_branches')
        .select('*')
        .eq('id', branchKey)
        .maybeSingle();

      if (!error && data) {
        return {
          docente_id: data.docente_id,
          teacherName: data.teacher_name,
          activities: data.activities || [],
          students: data.students || [],
          lastUpdated: data.updated_at,
          lastUpdatedBy: data.updated_by
        };
      }
    } catch {
      // Continuar con respaldo
    }

    // 2. Respaldo desde institutional_vault
    try {
      const { data, error } = await supabase
        .from('institutional_vault')
        .select('cipher, updated_at')
        .eq('user_key', `grades_branch_${branchKey}`)
        .maybeSingle();

      if (!error && data?.cipher) {
        const parsed = JSON.parse(data.cipher);
        return parsed;
      }
    } catch {
      // Ignorar
    }

    return null;
  }

  /**
   * Actualiza el árbol local en memoria y localStorage con datos recibidos de la nube
   */
  updateBranchFromRemote(year, period, grade, subject, remoteBranch) {
    if (!this.tree[year]) this.tree[year] = {};
    if (!this.tree[year][period]) this.tree[year][period] = {};
    if (!this.tree[year][period][grade]) this.tree[year][period][grade] = {};
    this.tree[year][period][grade][subject] = {
      ...this.tree[year][period][grade][subject],
      ...remoteBranch
    };
    this.persistTree();
  }

  /**
   * Sincroniza un estudiante en la tabla matriculas_estudiantes de Supabase
   */
  async syncStudentToSupabase(studentData, currentUser = null) {
    if (!isSupabaseConfigured || !supabase) return { synced: false, reason: 'Supabase no configurado' };

    const payload = {
      id: String(studentData.id),
      name: String(studentData.name),
      grade: String(studentData.grade),
      acudiente: studentData.acudiente || null,
      nombre_madre: studentData.nombreMadre || studentData.nombre_madre || null,
      telefono_madre: studentData.telefonoMadre || studentData.telefono_madre || null,
      telefono: studentData.telefono || null,
      fecha_ingreso: studentData.fechaIngreso || studentData.fecha_ingreso || new Date().toISOString().split('T')[0],
      tipo_ingreso: studentData.tipoIngreso || studentData.tipo_ingreso || 'Matrícula Regular',
      active: studentData.active !== false,
      status: studentData.status || (studentData.active !== false ? 'activo' : 'retirado'),
      inhabilitado: Boolean(studentData.inhabilitado || studentData.active === false),
      motivo_retiro: studentData.motivoRetiro || studentData.motivo_retiro || null,
      fecha_retiro: studentData.fechaRetiro || studentData.fecha_retiro || null,
      observaciones: studentData.observaciones || null,
      registered_by: studentData.registeredBy || currentUser?.name || 'Administración',
      updated_by: currentUser?.name || 'Administración',
      updated_at: new Date().toISOString()
    };

    // 1. Persistencia directa en matriculas_estudiantes
    try {
      const { data, error } = await supabase
        .from('matriculas_estudiantes')
        .upsert([payload], { onConflict: 'id' });

      if (!error) {
        return { synced: true, provider: 'matriculas_estudiantes' };
      }
    } catch {
      // Continuar con respaldo
    }

    // 2. Respaldo en institutional_vault
    try {
      const vaultPayload = {
        user_key: `student_roster_${payload.id}`,
        cipher: JSON.stringify(payload),
        default_invalidated: true,
        updated_at: new Date().toISOString()
      };
      await supabase
        .from('institutional_vault')
        .upsert(vaultPayload, { onConflict: 'user_key' });
      return { synced: true, provider: 'institutional_vault' };
    } catch (err) {
      console.warn('[GradesService] Error sincronizando estudiante en Supabase:', err);
      return { synced: false, error: err };
    }
  }

  /**
   * Descarga todos los estudiantes de Supabase para consolidar el censo institucional
   */
  async fetchStudentsFromSupabase() {
    if (!isSupabaseConfigured || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('matriculas_estudiantes')
        .select('*');

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map(row => ({
          id: row.id,
          name: row.name,
          grade: row.grade,
          acudiente: row.acudiente,
          nombreMadre: row.nombre_madre,
          telefonoMadre: row.telefono_madre,
          telefono: row.telefono,
          fechaIngreso: row.fecha_ingreso,
          tipoIngreso: row.tipo_ingreso,
          active: row.active,
          status: row.status,
          inhabilitado: row.inhabilitado,
          motivoRetiro: row.motivo_retiro,
          fechaRetiro: row.fecha_retiro,
          observaciones: row.observaciones,
          registeredBy: row.registered_by
        }));
      }
    } catch {
      // Ignorar y continuar con fallback
    }

    return null;
  }

  /**
   * Sincronización remota inicial del censo escolar
   */
  async initMatriculasRemoteSync() {
    try {
      const remoteStudents = await this.fetchStudentsFromSupabase();
      if (remoteStudents && remoteStudents.length > 0) {
        let changed = false;
        remoteStudents.forEach(remoteSt => {
          const canonicalGrade = normalizeGrade(remoteSt.grade);
          const subjects = this.getSubjectsForGrade(canonicalGrade);
          
          ACADEMIC_PERIODS.forEach(period => {
            subjects.forEach(subj => {
              const branch = this.getBranch('2026', period, canonicalGrade, subj);
              if (branch && branch.students) {
                const existing = branch.students.find(s => s.id === remoteSt.id);
                if (existing) {
                  // Actualizar estado si cambió
                  if (existing.active !== remoteSt.active || existing.status !== remoteSt.status) {
                    existing.active = remoteSt.active;
                    existing.status = remoteSt.status;
                    existing.inhabilitado = remoteSt.inhabilitado;
                    existing.motivoRetiro = remoteSt.motivoRetiro;
                    existing.fechaRetiro = remoteSt.fechaRetiro;
                    changed = true;
                  }
                } else {
                  // Nuevo estudiante remoto
                  branch.students.push({
                    id: remoteSt.id,
                    name: remoteSt.name,
                    grade: canonicalGrade,
                    acudiente: remoteSt.acudiente,
                    nombreMadre: remoteSt.nombreMadre,
                    telefonoMadre: remoteSt.telefonoMadre,
                    fechaIngreso: remoteSt.fechaIngreso,
                    tipoIngreso: remoteSt.tipoIngreso,
                    active: remoteSt.active,
                    status: remoteSt.status,
                    inhabilitado: remoteSt.inhabilitado,
                    motivoRetiro: remoteSt.motivoRetiro,
                    fechaRetiro: remoteSt.fechaRetiro,
                    observaciones: remoteSt.observaciones,
                    scores: {},
                    evaluacionFinal: null
                  });
                  changed = true;
                }
              }
            });
          });
        });

        if (changed) {
          this.persistTree();
          this.notifyCurriculumUpdate();
        }
      }
    } catch (err) {
      console.warn('[GradesService] Error en initMatriculasRemoteSync:', err);
    }
  }

  /**
   * Suscripción Realtime a cambios en matriculas_estudiantes
   */
  initMatriculasRealtimeSubscription() {
    if (!isSupabaseConfigured || !supabase) return () => {};

    try {
      const channelId = `matriculas_channel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const channel = supabase
        .channel(channelId)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matriculas_estudiantes' }, (payload) => {
          if (payload.new && payload.new.id) {
            const st = payload.new;
            const canonicalGrade = normalizeGrade(st.grade);
            const subjects = this.getSubjectsForGrade(canonicalGrade);

            ACADEMIC_PERIODS.forEach(period => {
              subjects.forEach(subj => {
                const branch = this.getBranch('2026', period, canonicalGrade, subj);
                if (branch && branch.students) {
                  const target = branch.students.find(s => s.id === st.id);
                  if (target) {
                    target.active = st.active;
                    target.status = st.status;
                    target.inhabilitado = st.inhabilitado;
                    target.motivoRetiro = st.motivo_retiro;
                    target.fechaRetiro = st.fecha_retiro;
                  } else {
                    branch.students.push({
                      id: st.id,
                      name: st.name,
                      grade: canonicalGrade,
                      acudiente: st.acudiente,
                      nombreMadre: st.nombre_madre,
                      telefonoMadre: st.telefono_madre,
                      fechaIngreso: st.fecha_ingreso,
                      tipoIngreso: st.tipo_ingreso,
                      active: st.active,
                      status: st.status,
                      inhabilitado: st.inhabilitado,
                      motivoRetiro: st.motivo_retiro,
                      fechaRetiro: st.fecha_retiro,
                      scores: {},
                      evaluacionFinal: null
                    });
                  }
                }
              });
            });

            this.persistTree();
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('gmg_roster_updated', {
                detail: { grade: canonicalGrade, studentId: st.id, active: st.active, timestamp: new Date().toISOString() }
              }));
            }
          }
        })
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch {
      return () => {};
    }
  }

  // =====================================================================
  // CÁLCULO DINÁMICO DE IMPRESIONES INSTITUCIONALES (N + 1) & GESTIÓN DE ROSTER
  // =====================================================================

  /**
   * Obtiene la lista de estudiantes de un grado para un periodo (desde el árbol o fallback)
   */
  getGradeRoster(grade, year = '2026', period = '1° Periodo (25%)') {
    const canonicalGrade = normalizeGrade(grade);
    const subjects = this.getSubjectsForGrade(canonicalGrade);
    const firstSubj = subjects[0] || 'Matemáticas';
    const branch = this.getBranch(year, period, canonicalGrade, firstSubj);
    return branch?.students || [];
  }

  /**
   * Permiso para gestión de matrícula, inscripción extemporánea y control de retiros
   * Acceso: Solo Administrador General, Rectora y Coordinación Académica
   */
  canManageMatricula(user) {
    if (!user) return false;
    const role = user.role;
    return role === 'admin' || role === 'rectora' || role === 'induccion_rectora' || role === 'coordinador';
  }

  /**
   * Obtiene la lista consolidada de todos los estudiantes del colegio (Censo Histórico Escolar)
   */
  getAllStudents(year = '2026') {
    const list = [];
    const seenIds = new Set();

    GRADES_LIST.forEach(grade => {
      const canonicalGrade = normalizeGrade(grade);
      const subjects = this.getSubjectsForGrade(canonicalGrade);
      const firstSubj = subjects[0] || 'Matemáticas';
      const branch = this.getBranch(year, ACADEMIC_PERIODS[0], canonicalGrade, firstSubj);
      
      (branch.students || []).forEach(st => {
        if (!seenIds.has(st.id)) {
          seenIds.add(st.id);
          const isRetired = st.active === false || st.status === 'inactivo' || st.status === 'retirado' || st.inhabilitado;
          list.push({
            ...st,
            grade: canonicalGrade,
            active: !isRetired,
            status: isRetired ? 'retirado' : 'activo',
            inhabilitado: isRetired,
            acudiente: st.acudiente || 'Acudiente registrado en secretaría',
            fechaIngreso: st.fechaIngreso || '2026-02-02',
            tipoIngreso: st.tipoIngreso || 'Matrícula Regular',
            motivoRetiro: st.motivoRetiro || null,
            fechaRetiro: st.fechaRetiro || null
          });
        }
      });
    });

    return list;
  }

  /**
   * Obtiene la lista de estudiantes activos en el grado seleccionado (según el roster de la planilla)
   * Los estudiantes retirados/inhabilitados quedan excluidos automáticamente del conteo activo
   */
  getActiveStudents(grade, year = '2026', period = '1° Periodo (25%)') {
    const roster = this.getGradeRoster(grade, year, period);
    return roster.filter(s => s.active !== false && s.status !== 'inactivo' && s.status !== 'retirado' && !s.inhabilitado);
  }

  /**
   * Cuenta la cantidad de estudiantes activos en el grado seleccionado
   */
  getActiveStudentsCount(grade, year = '2026', period = '1° Periodo (25%)') {
    return this.getActiveStudents(grade, year, period).length;
  }

  /**
   * Fórmula Institucional de Impresión (Fase 4): Alumnos Activos + 1 (Copia física del Docente Calificador)
   * Regla Fase 5: El registro histórico de retirados no altera este conteo (se basa estrictamente en activos).
   */
  getPrintingCopiesSuggestion(grade, year = '2026', period = '1° Periodo (25%)') {
    const canonicalGrade = normalizeGrade(grade);
    const activeStudents = this.getActiveStudentsCount(canonicalGrade, year, period);
    const suggestedCopies = activeStudents + 1;
    return {
      grade: canonicalGrade,
      activeStudents,
      docenteCopies: 1,
      suggestedCopies,
      formulaText: `${activeStudents} alumnos activos + 1 copia docente calificador = ${suggestedCopies} copias`,
      shortText: `${suggestedCopies} copias (${activeStudents} + 1)`
    };
  }

  /**
   * FASE 5: Inscribir un nuevo estudiante extemporáneo al roster institucional oficial
   * Acceso: Solo Admin, Rectora y Coordinación
   * Campos: Nombre, Código, Grado, Acudiente, Fecha de Ingreso
   */
  addStudentExtemporaneo({
    grade,
    name,
    id,
    acudiente,
    nombreMadre,
    telefonoMadre,
    telefono,
    fechaIngreso,
    tipoIngreso = 'Matrícula Extemporánea',
    observaciones = ''
  }, user, year = '2026') {
    if (!this.canManageMatricula(user)) {
      throw new Error('Acceso denegado: Solo Administrador, Rectora y Coordinación pueden inscribir nuevos estudiantes.');
    }

    if (!name || !name.trim()) {
      throw new Error('El nombre completo del estudiante es obligatorio.');
    }
    if (!grade) {
      throw new Error('El grado académico es obligatorio.');
    }

    const canonicalGrade = normalizeGrade(grade);
    const subjects = this.getSubjectsForGrade(canonicalGrade);
    const studentCode = id && id.trim() 
      ? id.trim().toUpperCase() 
      : `EST-${canonicalGrade.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const cleanMotherPhone = (telefonoMadre || telefono || '').toString().replace(/\D/g, '').slice(0, 10);
    const cleanMotherName = (nombreMadre || '').trim();
    const formattedGuardian = acudiente?.trim() || (
      cleanMotherName 
        ? `${cleanMotherName} (Madre)${cleanMotherPhone ? ` - Cel: ${cleanMotherPhone}` : ''}`
        : 'Acudiente registrado en secretaría'
    );

    const newStudent = {
      id: studentCode,
      name: name.trim(),
      grade: canonicalGrade,
      nombreMadre: cleanMotherName || null,
      telefonoMadre: cleanMotherPhone || null,
      telefono: cleanMotherPhone || null,
      acudiente: formattedGuardian,
      fechaIngreso: fechaIngreso || new Date().toISOString().split('T')[0],
      tipoIngreso: tipoIngreso || 'Matrícula Extemporánea',
      observaciones: observaciones?.trim() || '',
      active: true,
      status: 'activo',
      inhabilitado: false,
      motivoRetiro: null,
      fechaRetiro: null,
      registeredBy: user?.name || 'Administración',
      registeredAt: new Date().toISOString(),
      scores: {},
      evaluacionFinal: null,
      c1: '',
      c2: '',
      c3: '',
      retroalimentacionDocente: '',
      sugerenciaDirectiva: '',
      observacion_coordinacion: null,
      observacionCoordinacion: null,
      comentarioAuditoria: `Inscripción extemporánea radicada por ${user?.name || 'Administración'}`
    };

    // Propagar a TODAS las materias y a TODOS los periodos lectivos del grado en el árbol
    ACADEMIC_PERIODS.forEach(period => {
      subjects.forEach(subj => {
        const branch = this.getBranch(year, period, canonicalGrade, subj);
        if (branch && branch.students) {
          const exists = branch.students.find(s => s.id === studentCode);
          if (!exists) {
            branch.students.push({ ...newStudent });
            branch.lastUpdated = new Date().toISOString();
            branch.lastUpdatedBy = user?.name || 'Administración';
          }
        }
      });
    });

    this.persistTree();

    this.syncStudentToSupabase(newStudent, user).catch(err => {
      console.warn('[GradesService] Error sincronizando estudiante nuevo:', err);
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gmg_roster_updated', {
        detail: { grade: canonicalGrade, action: 'add', student: newStudent, timestamp: new Date().toISOString() }
      }));
    }
    this.notifyCurriculumUpdate();

    return newStudent;
  }

  /**
   * Wrapper retrocompatible para agregar estudiante al grado
   */
  addStudentToGrade(grade, studentData, user = null, year = '2026', period = '1° Periodo (25%)') {
    return this.addStudentExtemporaneo({
      grade,
      name: studentData.name,
      id: studentData.id,
      acudiente: studentData.acudiente,
      fechaIngreso: studentData.fechaIngreso,
      tipoIngreso: studentData.tipoIngreso,
      observaciones: studentData.observaciones
    }, user, year);
  }

  /**
   * FASE 5: REGLA DE ORO DE AUDITORÍA (SOFT-DISABLE)
   * En caso de retiro o traslado, se marca como Retirado / Inhabilitado.
   * Sus notas previas se conservan intactas para auditoría, y las evaluaciones
   * no presentadas se registran con 1.0 por defecto para el cómputo consolidado.
   */
  markStudentAsRetired(grade, studentId, { motivoRetiro, fechaRetiro } = {}, user, year = '2026') {
    if (!this.canManageMatricula(user)) {
      throw new Error('Acceso denegado: Solo Administrador, Rectora y Coordinación pueden inhabilitar o retirar estudiantes.');
    }

    const canonicalGrade = normalizeGrade(grade);
    const subjects = this.getSubjectsForGrade(canonicalGrade);
    const withdrawalReason = motivoRetiro?.trim() || 'Retiro / Traslado escolar';
    const withdrawalDate = fechaRetiro || new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    let studentName = studentId;

    // Actualizar en todas las materias y periodos manteniendo notas previas para auditoría
    ACADEMIC_PERIODS.forEach(period => {
      subjects.forEach(subj => {
        const branch = this.getBranch(year, period, canonicalGrade, subj);
        if (branch && branch.students) {
          const target = branch.students.find(s => s.id === studentId);
          if (target) {
            studentName = target.name || studentName;
            target.active = false;
            target.status = 'retirado';
            target.inhabilitado = true;
            target.motivoRetiro = withdrawalReason;
            target.fechaRetiro = withdrawalDate;
            target.retiredBy = user?.name || 'Administración';
            target.retiredAt = nowIso;
            branch.lastUpdated = nowIso;
            branch.lastUpdatedBy = `Retiro SIEE: ${user?.name || 'Administración'}`;
          }
        }
      });
    });

    this.persistTree();

    this.syncStudentToSupabase({
      id: studentId,
      name: studentName,
      grade: canonicalGrade,
      active: false,
      status: 'retirado',
      inhabilitado: true,
      motivoRetiro: withdrawalReason,
      fechaRetiro: withdrawalDate
    }, user).catch(err => {
      console.warn('[GradesService] Error sincronizando retiro:', err);
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gmg_roster_updated', {
        detail: { 
          grade: canonicalGrade, 
          action: 'retire', 
          studentId, 
          studentName, 
          active: false, 
          motivoRetiro: withdrawalReason, 
          fechaRetiro: withdrawalDate,
          timestamp: nowIso 
        }
      }));
    }
    this.notifyCurriculumUpdate();

    return {
      success: true,
      studentId,
      studentName,
      grade: canonicalGrade,
      motivoRetiro: withdrawalReason,
      fechaRetiro: withdrawalDate
    };
  }

  /**
   * FASE 5: Reactivar a un estudiante retirado si retorna a la institución
   */
  reactivateStudent(grade, studentId, user, year = '2026') {
    if (!this.canManageMatricula(user)) {
      throw new Error('Acceso denegado: Solo Administrador, Rectora y Coordinación pueden reactivar estudiantes.');
    }

    const canonicalGrade = normalizeGrade(grade);
    const subjects = this.getSubjectsForGrade(canonicalGrade);
    const nowIso = new Date().toISOString();
    let studentName = studentId;

    ACADEMIC_PERIODS.forEach(period => {
      subjects.forEach(subj => {
        const branch = this.getBranch(year, period, canonicalGrade, subj);
        if (branch && branch.students) {
          const target = branch.students.find(s => s.id === studentId);
          if (target) {
            studentName = target.name || studentName;
            target.active = true;
            target.status = 'activo';
            target.inhabilitado = false;
            target.motivoRetiro = null;
            target.fechaRetiro = null;
            target.reactivatedBy = user?.name || 'Administración';
            target.reactivatedAt = nowIso;
            branch.lastUpdated = nowIso;
            branch.lastUpdatedBy = `Reactivación: ${user?.name || 'Administración'}`;
          }
        }
      });
    });

    this.persistTree();

    this.syncStudentToSupabase({
      id: studentId,
      name: studentName,
      grade: canonicalGrade,
      active: true,
      status: 'activo',
      inhabilitado: false,
      motivoRetiro: null,
      fechaRetiro: null
    }, user).catch(err => {
      console.warn('[GradesService] Error sincronizando reactivación:', err);
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gmg_roster_updated', {
        detail: { 
          grade: canonicalGrade, 
          action: 'reactivate', 
          studentId, 
          studentName, 
          active: true, 
          timestamp: nowIso 
        }
      }));
    }
    this.notifyCurriculumUpdate();

    return {
      success: true,
      studentId,
      studentName,
      grade: canonicalGrade
    };
  }

  /**
   * Alternar estado de estudiante (Activo <-> Inhabilitado/Retirado)
   */
  toggleStudentStatus(grade, studentId, user = null, year = '2026', period = '1° Periodo (25%)') {
    const canonicalGrade = normalizeGrade(grade);
    const roster = this.getGradeRoster(canonicalGrade, year, period);
    const target = roster.find(s => s.id === studentId);
    if (!target) return false;

    const isCurrentlyActive = target.active !== false && target.status !== 'inactivo' && target.status !== 'retirado' && !target.inhabilitado;
    if (isCurrentlyActive) {
      this.markStudentAsRetired(canonicalGrade, studentId, { motivoRetiro: 'Inhabilitación administrativa' }, user, year);
      return false;
    } else {
      this.reactivateStudent(canonicalGrade, studentId, user, year);
      return true;
    }
  }

  /**
   * REGLA DE ORO DE AUDITORÍA INSTITUCIONAL:
   * Prohibición absoluta de eliminación física de estudiantes en la base de datos o estado local.
   */
  deleteStudent() {
    throw new Error('REGLA DE ORO DE AUDITORÍA SIEE (Fase 5): Queda estrictamente prohibido eliminar (DELETE) un estudiante de la base de datos o estado local. En caso de retiro o traslado, utilice la acción "Inhabilitar / Marcar Retirado".');
  }

  // =====================================================================
  // GESTIÓN ADMINISTRATIVA: NOVEDADES Y REEMPLAZOS DOCENTES DE EMERGENCIA
  // =====================================================================

  /**
   * Obtiene la matriz curricular completa para visualización del administrador
   */
  getCurriculumMatrix() {
    return GRADES_LIST.map(grade => {
      const director = this.getGradeDirector(grade);
      const defaultDirector = GRADE_DIRECTORS[grade];
      const isDirectorReplaced = Boolean(this.customDirectors[grade] && this.customDirectors[grade].docente_id !== defaultDirector?.docente_id);

      const defaultSubjects = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
      const customSubjects = this.customAssignments[grade] || {};
      const subjectNames = Array.from(new Set([...Object.keys(defaultSubjects), ...Object.keys(customSubjects)]));

      const subjects = subjectNames.map(subj => {
        const assignment = this.getTeacherAssignment(grade, subj);
        const originalAssignment = defaultSubjects[subj] || assignment;
        const isSubjectReplaced = Boolean(this.customAssignments[grade]?.[subj] && this.customAssignments[grade]?.[subj].docente_id !== originalAssignment?.docente_id);

        return {
          subject: subj,
          docente_id: assignment.docente_id,
          teacherName: assignment.teacherName,
          isReplaced: isSubjectReplaced,
          originalDocenteName: originalAssignment?.teacherName || assignment.teacherName,
          reason: assignment.reason || null,
          replacedAt: assignment.replacedAt || null
        };
      });

      return {
        grade,
        director: {
          ...director,
          isReplaced: isDirectorReplaced,
          originalDocenteName: defaultDirector?.teacherName || director.teacherName,
          reason: director.reason || null,
          replacedAt: director.replacedAt || null
        },
        subjects
      };
    });
  }

  /**
   * Obtiene el historial de reemplazos y novedades registradas
   */
  getReplacementLogs() {
    return this.replacementLogs;
  }

  /**
   * Ejecuta el reemplazo de un docente por incapacidad, permiso o novedad administrativa.
   * Transfiere el acceso inmediato de planillas al nuevo docente nombrado.
   */
  executeTeacherReplacement({
    grade,
    previousDocenteKey,
    newDocenteKey,
    replaceDirector = true,
    replaceSubjects = true,
    specificSubject = null,
    reason = 'Incapacidad médica EPS',
    adminUser
  }) {
    if (!grade || !newDocenteKey) {
      throw new Error('Debe especificar el grado y el docente de reemplazo.');
    }

    const newTeacherObj = USERS[newDocenteKey] || { name: newDocenteKey };
    const prevTeacherObj = USERS[previousDocenteKey] || { name: previousDocenteKey };
    const now = new Date().toISOString();

    const replacedSubjectsList = [];

    // 1. Reemplazo de Director de Curso si aplica
    let directorReplaced = false;
    const currentDirector = this.getGradeDirector(grade);
    if (replaceDirector || currentDirector.docente_id === previousDocenteKey) {
      this.customDirectors[grade] = {
        docente_id: newDocenteKey,
        teacherName: newTeacherObj.name,
        replacedFrom: currentDirector.docente_id,
        replacedFromName: currentDirector.teacherName,
        reason,
        replacedAt: now
      };
      directorReplaced = true;

      // Transferir automáticamente las asignaturas de dirección de curso
      // (Artes, Religión, Educación Física) al nuevo docente en el árbol
      const gradeSubjects = this.getSubjectsForGrade(grade);
      gradeSubjects.forEach(subj => {
        if (this.isDirectorCourseSubject(subj)) {
          if (!replacedSubjectsList.includes(subj)) replacedSubjectsList.push(subj);
          ACADEMIC_YEARS.forEach(y => {
            ACADEMIC_PERIODS.forEach(p => {
              if (this.tree[y]?.[p]?.[grade]?.[subj]) {
                this.tree[y][p][grade][subj].docente_id = newDocenteKey;
                this.tree[y][p][grade][subj].teacherName = newTeacherObj.name;
                this.tree[y][p][grade][subj].lastUpdated = now;
                this.tree[y][p][grade][subj].lastUpdatedBy = `Reemplazo Directora: ${newTeacherObj.name}`;
              }
            });
          });
        }
      });
    }

    // 2. Reemplazo de Materias y transferencia de contenido
    if (replaceSubjects) {
      if (!this.customAssignments[grade]) {
        this.customAssignments[grade] = {};
      }

      const defaultSubjects = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
      const subjectKeys = specificSubject 
        ? [specificSubject] 
        : Object.keys(defaultSubjects);

      subjectKeys.forEach(subj => {
        const currentAssign = this.getTeacherAssignment(grade, subj);
        
        // Si no se especificó materia, reemplazar solo las del docente incapacitado (o todas si era titular)
        if (specificSubject || currentAssign.docente_id === previousDocenteKey || !previousDocenteKey) {
          this.customAssignments[grade][subj] = {
            docente_id: newDocenteKey,
            teacherName: newTeacherObj.name,
            replacedFrom: currentAssign.docente_id,
            replacedFromName: currentAssign.teacherName,
            reason,
            replacedAt: now
          };
          replacedSubjectsList.push(subj);

          // Actualizar en el árbol relacional para que el nuevo docente herede todo de inmediato
          ACADEMIC_YEARS.forEach(y => {
            ACADEMIC_PERIODS.forEach(p => {
              if (this.tree[y]?.[p]?.[grade]?.[subj]) {
                this.tree[y][p][grade][subj].docente_id = newDocenteKey;
                this.tree[y][p][grade][subj].teacherName = newTeacherObj.name;
                this.tree[y][p][grade][subj].lastReplacedFrom = currentAssign.docente_id;
                this.tree[y][p][grade][subj].lastUpdated = now;
                this.tree[y][p][grade][subj].lastUpdatedBy = `Reemplazo Administrador: ${newTeacherObj.name}`;
              }
            });
          });
        }
      });
    }

    // 3. Crear registro de auditoría
    const logEntry = {
      id: `REP-${Date.now()}`,
      timestamp: now,
      grade,
      previousDocenteKey: previousDocenteKey || currentDirector.docente_id,
      previousDocenteName: prevTeacherObj.name || currentDirector.teacherName,
      newDocenteKey,
      newDocenteName: newTeacherObj.name,
      replaceDirector: directorReplaced,
      subjectsReplaced: replacedSubjectsList,
      reason,
      registeredBy: adminUser?.name || 'Administrador',
      status: 'activo'
    };

    this.replacementLogs.unshift(logEntry);

    // 4. Persistir estado y notificar
    this.persistCustomState();
    this.persistTree();
    this.notifyCurriculumUpdate();

    return {
      success: true,
      log: logEntry,
      message: `¡Reemplazo exitoso! ${newTeacherObj.name} ahora tiene acceso oficial y activo a ${grade}.`
    };
  }

  /**
   * Finaliza o revierte un reemplazo, restaurando al docente titular original
   */
  revertReplacement(logId, adminUser) {
    const logIndex = this.replacementLogs.findIndex(l => l.id === logId);
    if (logIndex === -1) {
      throw new Error('Registro de reemplazo no encontrado.');
    }

    const log = this.replacementLogs[logIndex];
    const { grade, previousDocenteKey, previousDocenteName, subjectsReplaced, replaceDirector } = log;
    const now = new Date().toISOString();

    // Restaurar Director si fue reemplazado
    if (replaceDirector && this.customDirectors[grade]) {
      const defaultDir = GRADE_DIRECTORS[grade];
      if (defaultDir && defaultDir.docente_id === previousDocenteKey) {
        delete this.customDirectors[grade];
      } else {
        this.customDirectors[grade] = {
          docente_id: previousDocenteKey,
          teacherName: previousDocenteName,
          restoredAt: now
        };
      }
    }

    // Restaurar Materias
    if (subjectsReplaced && subjectsReplaced.length > 0) {
      subjectsReplaced.forEach(subj => {
        const defaultAssign = TEACHER_CURRICULUM_ASSIGNMENTS[grade]?.[subj];
        if (defaultAssign && defaultAssign.docente_id === previousDocenteKey) {
          if (this.customAssignments[grade]) {
            delete this.customAssignments[grade][subj];
          }
        } else {
          if (!this.customAssignments[grade]) this.customAssignments[grade] = {};
          this.customAssignments[grade][subj] = {
            docente_id: previousDocenteKey,
            teacherName: previousDocenteName,
            restoredAt: now
          };
        }

        // Restaurar en el árbol relacional
        ACADEMIC_YEARS.forEach(y => {
          ACADEMIC_PERIODS.forEach(p => {
            if (this.tree[y]?.[p]?.[grade]?.[subj]) {
              this.tree[y][p][grade][subj].docente_id = previousDocenteKey;
              this.tree[y][p][grade][subj].teacherName = previousDocenteName;
              this.tree[y][p][grade][subj].lastUpdated = now;
              this.tree[y][p][grade][subj].lastUpdatedBy = `Reincorporación: ${previousDocenteName}`;
            }
          });
        });
      });
    }

    // Actualizar log a finalizado
    this.replacementLogs[logIndex] = {
      ...log,
      status: 'finalizado',
      revertedAt: now,
      revertedBy: adminUser?.name || 'Administrador'
    };

    this.persistCustomState();
    this.persistTree();
    this.notifyCurriculumUpdate();

    return {
      success: true,
      message: `¡Reemplazo finalizado! ${previousDocenteName} ha sido reintegrada a sus funciones en ${grade}.`
    };
  }
}

export const gradesService = new GradesService();
export default gradesService;
