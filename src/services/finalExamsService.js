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
  TEACHER_CURRICULUM_ASSIGNMENTS 
} from '../data/gradesTreeData.js';
import { USERS } from '../data/users.js';
import gradesService from './gradesService.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { uploadDocumentFile, deleteDocumentFile, getDocumentPublicUrl } from './storageService.js';

const EVALUACIONES_STORAGE_KEY = 'gmg_evaluaciones_impresion_v5';
const DEADLINES_STORAGE_KEY = 'gmg_evaluaciones_deadlines_v1';

export const DEFAULT_DEADLINES = {
  '1° Periodo (25%)': {
    deadlineDate: '2026-03-27',
    deliveryTime: '17:00',
    status: 'en_plazo',
    description: 'Fecha límite de entrega de evaluaciones para fotocopiado y reproducción del Primer Periodo',
    responsible: 'Coordinación Académica'
  },
  '2° Periodo (25%)': {
    deadlineDate: '2026-06-12',
    deliveryTime: '17:00',
    status: 'programado',
    description: 'Fecha límite de entrega de evaluaciones para fotocopiado y reproducción del Segundo Periodo',
    responsible: 'Coordinación Académica'
  },
  '3° Periodo (25%)': {
    deadlineDate: '2026-09-11',
    deliveryTime: '17:00',
    status: 'programado',
    description: 'Fecha límite de entrega de evaluaciones para fotocopiado y reproducción del Tercer Periodo',
    responsible: 'Coordinación Académica'
  },
  '4° Periodo (25%)': {
    deadlineDate: '2026-11-13',
    deliveryTime: '17:00',
    status: 'programado',
    description: 'Fecha límite de entrega de evaluaciones para fotocopiado y reproducción del Cuarto Periodo (Cierre Final)',
    responsible: 'Coordinación Académica'
  }
};

/**
 * Genera el repositorio inicial de evaluaciones para impresión.
 * Cada materia pertenece de forma única a su grado y a su docente oficial.
 */
const createInitialEvaluationsData = () => {
  const initialData = {};

  ACADEMIC_PERIODS.forEach((period) => {
    initialData[period] = {};

    GRADES_LIST.forEach((grade) => {
      initialData[period][grade] = {};
      const subjectsInGrade = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
      const studentCount = (STUDENTS_BY_GRADE[grade] || []).length;

      Object.entries(subjectsInGrade).forEach(([subj, assign]) => {
        // En el Gimnasio Martín Galeano solo las materias académicas fundamentales
        // (Lengua Castellana, Matemáticas, Ciencias Naturales, Ciencias Sociales e Inglés)
        // cuentan con evaluación final acumulativa escrita para fotocopiado e impresión.
        // En Educación Artística, Educación Física, Religión y Ética & Valores, el 20%
        // se obtiene de otras actividades formativas de aula (sin examen escrito).
        if (!subjectHasFinalExam(subj)) return;

        initialData[period][grade][subj] = {
          id: null,
          uploaded: false,
          grade,
          subject: subj,
          title: `Evaluación de ${subj} - ${grade}`,
          fileName: null,
          fileSize: null,
          fileType: null,
          storageKey: null,
          uploadedAt: null,
          uploadedBy: assign.teacherName,
          teacherId: assign.docente_id,
          copiesNeeded: studentCount + 1,
          copiesStatus: 'pendiente',
          notes: '',
          downloadUrl: null
        };
      });
    });
  });

  // Ejemplos institucionales diferenciados para el 1° Periodo:
  const p1 = '1° Periodo (25%)';
  if (initialData[p1]) {
    // 0. Profe Pre-Jardín: Lengua Castellana en Pre-Jardín (Directora no rota)
    if (initialData[p1]['Pre-Jardín']?.['Lengua Castellana']) {
      initialData[p1]['Pre-Jardín']['Lengua Castellana'] = {
        id: 'EVAL-PRJ-01',
        uploaded: true,
        grade: 'Pre-Jardín',
        subject: 'Lengua Castellana',
        title: 'Evaluación de Lengua Castellana - Pre-Jardín',
        fileName: 'Evaluacion_Lengua_PreJardin_ProfePreJardin.pdf',
        fileSize: '1.1 MB',
        fileType: 'application/pdf',
        storageKey: null,
        uploadedAt: '2026-03-24 09:30',
        uploadedBy: 'Profe Pre-Jardín',
        teacherId: 'profe0',
        copiesNeeded: (STUDENTS_BY_GRADE['Pre-Jardín'] || []).length + 1,
        copiesStatus: 'aprobado',
        notes: 'Guía de trazos iniciales, aprestamiento y discriminación fonológica.',
        downloadUrl: null
      };
    }

    // 1. Profe 1: Matemáticas en Transición (Directora no rota)
    if (initialData[p1]['Transición']?.['Matemáticas']) {
      initialData[p1]['Transición']['Matemáticas'] = {
        id: 'EVAL-TRA-01',
        uploaded: true,
        grade: 'Transición',
        subject: 'Matemáticas',
        title: 'Evaluación de Matemáticas - Transición',
        fileName: 'Evaluacion_Matematicas_Transicion_Profe1.pdf',
        fileSize: '1.2 MB',
        fileType: 'application/pdf',
        storageKey: null,
        uploadedAt: '2026-03-24 10:15',
        uploadedBy: 'Profe 1',
        teacherId: 'profe1',
        copiesNeeded: (STUDENTS_BY_GRADE['Transición'] || []).length + 1,
        copiesStatus: 'aprobado',
        notes: 'Guía institucional de nociones lógicas, conteo inicial, conjuntos y figuras geométricas.',
        downloadUrl: null
      };
    }

    // 2. Jessica: Lengua Castellana (Español) en 1° Primaria
    if (initialData[p1]['1° Primaria']?.['Lengua Castellana']) {
      initialData[p1]['1° Primaria']['Lengua Castellana'] = {
        id: 'EVAL-1PRI-01',
        uploaded: true,
        grade: '1° Primaria',
        subject: 'Lengua Castellana',
        title: 'Evaluación de Lengua Castellana - 1° Primaria',
        fileName: 'Evaluacion_Lengua_1Primaria_Jessica.pdf',
        fileSize: '1.5 MB',
        fileType: 'application/pdf',
        storageKey: null,
        uploadedAt: '2026-03-24 11:30',
        uploadedBy: 'Jessica',
        teacherId: 'jessica',
        copiesNeeded: (STUDENTS_BY_GRADE['1° Primaria'] || []).length + 1,
        copiesStatus: 'impreso',
        notes: 'Evaluación de lectoescritura inicial, comprensión silábica y fonemas básicos.',
        downloadUrl: null
      };
    }

    // 3. Yuri: Ciencias Sociales en 2° Primaria
    if (initialData[p1]['2° Primaria']?.['Ciencias Sociales']) {
      initialData[p1]['2° Primaria']['Ciencias Sociales'] = {
        id: 'EVAL-2PRI-01',
        uploaded: true,
        grade: '2° Primaria',
        subject: 'Ciencias Sociales',
        title: 'Evaluación de Ciencias Sociales - 2° Primaria',
        fileName: 'Evaluacion_Sociales_2Primaria_Yuri.pdf',
        fileSize: '1.3 MB',
        fileType: 'application/pdf',
        storageKey: null,
        uploadedAt: '2026-03-24 14:20',
        uploadedBy: 'Yuri',
        teacherId: 'yuri',
        copiesNeeded: (STUDENTS_BY_GRADE['2° Primaria'] || []).length + 1,
        copiesStatus: 'aprobado',
        notes: 'Espacios geográficos cercanos, noción de comunidad y deberes ciudadanos.',
        downloadUrl: null
      };
    }

    // 4. Profe 2: Matemáticas en 3° Primaria
    if (initialData[p1]['3° Primaria']?.['Matemáticas']) {
      initialData[p1]['3° Primaria']['Matemáticas'] = {
        id: 'EVAL-3PRI-01',
        uploaded: true,
        grade: '3° Primaria',
        subject: 'Matemáticas',
        title: 'Evaluación de Matemáticas - 3° Primaria',
        fileName: 'Evaluacion_Matematicas_3Primaria_Profe2.pdf',
        fileSize: '1.4 MB',
        fileType: 'application/pdf',
        storageKey: null,
        uploadedAt: '2026-03-24 16:10',
        uploadedBy: 'Profe 2',
        teacherId: 'profe2',
        copiesNeeded: (STUDENTS_BY_GRADE['3° Primaria'] || []).length + 1,
        copiesStatus: 'aprobado',
        notes: 'Resolución de problemas con operaciones multiplicativas y tablas de datos.',
        downloadUrl: null
      };
    }

    // 5. Elcy: Inglés en 4° Primaria
    if (initialData[p1]['4° Primaria']?.['Inglés']) {
      initialData[p1]['4° Primaria']['Inglés'] = {
        id: 'EVAL-4PRI-01',
        uploaded: true,
        grade: '4° Primaria',
        subject: 'Inglés',
        title: 'Evaluación de Inglés - 4° Primaria',
        fileName: 'Evaluacion_Ingles_4Primaria_Elcy.pdf',
        fileSize: '1.8 MB',
        fileType: 'application/pdf',
        storageKey: null,
        uploadedAt: '2026-03-24 15:45',
        uploadedBy: 'Elcy',
        teacherId: 'elcy',
        copiesNeeded: (STUDENTS_BY_GRADE['4° Primaria'] || []).length + 1,
        copiesStatus: 'impreso',
        notes: 'Vocabulario temático en inglés, comprensión lectora y estructuras de preguntas.',
        downloadUrl: null
      };
    }

    // 6. Yuri: Ciencias Naturales en 5° Primaria
    if (initialData[p1]['5° Primaria']?.['Ciencias Naturales']) {
      initialData[p1]['5° Primaria']['Ciencias Naturales'] = {
        id: 'EVAL-5PRI-01',
        uploaded: true,
        grade: '5° Primaria',
        subject: 'Ciencias Naturales',
        title: 'Evaluación de Ciencias Naturales - 5° Primaria',
        fileName: 'Evaluacion_Naturales_5Primaria_Yuri.pdf',
        fileSize: '1.6 MB',
        fileType: 'application/pdf',
        storageKey: null,
        uploadedAt: '2026-03-24 17:00',
        uploadedBy: 'Yuri',
        teacherId: 'yuri',
        copiesNeeded: (STUDENTS_BY_GRADE['5° Primaria'] || []).length + 1,
        copiesStatus: 'aprobado',
        notes: 'Sistemas biológicos humanos, nutrición y ecosistemas de Colombia.',
        downloadUrl: null
      };
    }
  }

  return initialData;
};

class FinalExamsService {
  constructor() {
    this.evaluations = this.loadEvaluations();
    this.deadlines = this.loadDeadlines();
    this.realtimeChannel = null;

    // Sincronización reactiva con novedades del roster escolar (ingresos / inhabilitaciones)
    if (typeof window !== 'undefined') {
      window.addEventListener('gmg_roster_updated', () => {
        this.notifyUpdate();
      });
      // Inicializar fetch remoto y suscripción Realtime en Supabase
      this.initRemoteSync();
    }
  }

  loadEvaluations() {
    if (typeof window === 'undefined') return createInitialEvaluationsData();
    try {
      const data = localStorage.getItem(EVALUACIONES_STORAGE_KEY);
      if (!data) return createInitialEvaluationsData();
      const parsed = JSON.parse(data);
      let modified = false;
      Object.keys(parsed).forEach((period) => {
        Object.keys(parsed[period] || {}).forEach((grade) => {
          Object.keys(parsed[period][grade] || {}).forEach((subj) => {
            if (!subjectHasFinalExam(subj)) {
              delete parsed[period][grade][subj];
              modified = true;
            }
          });
        });
      });
      if (modified) {
        localStorage.setItem(EVALUACIONES_STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.error('Error cargando repositorio de evaluaciones para impresión:', e);
      return createInitialEvaluationsData();
    }
  }

  saveEvaluations() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(EVALUACIONES_STORAGE_KEY, JSON.stringify(this.evaluations));
    } catch (e) {
      console.error('Error guardando repositorio de evaluaciones para impresión:', e);
    }
  }

  loadDeadlines() {
    if (typeof window === 'undefined') return DEFAULT_DEADLINES;
    try {
      const data = localStorage.getItem(DEADLINES_STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_DEADLINES;
    } catch (e) {
      return DEFAULT_DEADLINES;
    }
  }

  saveDeadlines() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(DEADLINES_STORAGE_KEY, JSON.stringify(this.deadlines));
    } catch (e) {
      console.error('Error guardando fechas límite de impresión:', e);
    }
  }

  notifyUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gmg_evaluaciones_updated', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
  }

  getPeriods() {
    return ACADEMIC_PERIODS;
  }

  getYears() {
    return ACADEMIC_YEARS;
  }

  getGrades() {
    return GRADES_LIST;
  }

  isDirectorCourseSubject(subject) {
    if (!subject) return false;
    const s = subject.toLowerCase();
    return s.includes('art') || s.includes('relig') || s.includes('física') || s.includes('fisica');
  }

  getGradeDirector(grade) {
    if (gradesService && gradesService.getGradeDirector) {
      return gradesService.getGradeDirector(grade);
    }
    return GRADE_DIRECTORS[grade] || { docente_id: 'jessica', teacherName: 'Jessica' };
  }

  isGradeDirector(user, grade) {
    if (!user || !grade) return false;
    const userKey = (user.key || user.role || '').toLowerCase();
    const userName = (user.name || '').toLowerCase();
    const director = this.getGradeDirector(grade);
    const dirId = (director.docente_id || '').toLowerCase();
    const dirName = (director.teacherName || '').toLowerCase();
    return dirId === userKey || dirName === userName;
  }

  getTeacherAssignment(grade, subject) {
    if (gradesService && gradesService.getTeacherAssignment) {
      return gradesService.getTeacherAssignment(grade, subject);
    }
    if (this.isDirectorCourseSubject(subject)) {
      return this.getGradeDirector(grade);
    }
    if (TEACHER_CURRICULUM_ASSIGNMENTS[grade] && TEACHER_CURRICULUM_ASSIGNMENTS[grade][subject]) {
      return TEACHER_CURRICULUM_ASSIGNMENTS[grade][subject];
    }
    return { docente_id: 'jessica', teacherName: 'Jessica' };
  }

  subjectHasFinalExam(subject) {
    return subjectHasFinalExam(subject);
  }

  getSubjectsForGrade(grade) {
    let list = [];
    if (gradesService && gradesService.getSubjectsForGrade) {
      list = gradesService.getSubjectsForGrade(grade);
    } else {
      const defaultGradeAssignments = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
      list = Object.keys(defaultGradeAssignments);
    }
    if (!list || list.length === 0) list = ALL_SUBJECTS;
    // Excluir asignaturas formativas sin examen acumulativo escrito para fotocopiado (SIEE)
    return list.filter((subj) => this.subjectHasFinalExam(subj));
  }

  getStudentCount(grade) {
    if (gradesService && gradesService.getActiveStudentsCount) {
      return gradesService.getActiveStudentsCount(grade);
    }
    return (STUDENTS_BY_GRADE[grade] || []).length;
  }

  getPrintingCopiesSuggestion(grade) {
    if (gradesService && gradesService.getPrintingCopiesSuggestion) {
      return gradesService.getPrintingCopiesSuggestion(grade);
    }
    const count = this.getStudentCount(grade);
    return {
      grade,
      activeStudents: count,
      docenteCopies: 1,
      suggestedCopies: count + 1,
      formulaText: `${count} alumnos activos + 1 copia docente calificador = ${count + 1} copias`,
      shortText: `${count + 1} copias (${count} + 1)`
    };
  }

  /**
   * Helper estricto de coincidencia de docente (por id, key o nombre)
   */
  isTeacherMatch(user, assignment) {
    if (!user || !assignment) return false;
    const userKey = (user.key || user.role || '').toLowerCase();
    const userName = (user.name || '').toLowerCase();
    const assignId = (assignment.docente_id || assignment.teacherId || '').toLowerCase();
    const assignName = (assignment.teacherName || assignment.teacher || '').toLowerCase();

    if (assignId && userKey && assignId === userKey) return true;
    if (assignName && userName && assignName === userName) return true;
    if (userKey && assignName && assignName.includes(userKey)) return true;
    if (assignId && userName && userName.includes(assignId)) return true;
    return false;
  }

  /**
   * Determina si el usuario tiene rol de supervisión global directiva
   */
  isPrivilegedUser(user) {
    if (!user) return false;
    return ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(user.role);
  }

  /**
   * Obtiene la lista de grados accesibles para el usuario
   * Para docentes, estrictamente los grados donde dicta asignaturas a su cargo
   */
  getGradesForUser(user) {
    if (!user) return GRADES_LIST;
    if (user.role === 'induccion') {
      return ['1° Primaria'];
    }
    if (this.isPrivilegedUser(user)) {
      return GRADES_LIST;
    }

    const myGrades = GRADES_LIST.filter(g => {
      const subjectsInGrade = this.getSubjectsForGrade(g);
      return subjectsInGrade.some(subj => {
        const assign = this.getTeacherAssignment(g, subj);
        return this.isTeacherMatch(user, assign);
      });
    });

    return myGrades.length > 0 ? myGrades : [GRADES_LIST[0]];
  }

  /**
   * Obtiene las materias disponibles para un grado y usuario
   * Para docentes, restringe estrictamente a sus materias a cargo para privacidad absoluta
   */
  getSubjectsForGradeAndUser(grade, user) {
    const validAll = this.getSubjectsForGrade(grade);

    if (!user) return validAll;
    if (user.role === 'induccion') {
      return grade === '1° Primaria' ? ['Lengua Castellana'] : [];
    }
    if (this.isPrivilegedUser(user)) {
      return validAll;
    }

    // Docente: estrictamente sus materias asignadas (no ve exámenes de otras docentes)
    const mySubjects = validAll.filter(subj => {
      const assignment = this.getTeacherAssignment(grade, subj);
      return this.isTeacherMatch(user, assignment);
    });

    return mySubjects;
  }

  /**
   * Determina si el usuario puede cargar / sustituir la evaluación de una materia
   */
  canUploadForSubject(user, grade, subject) {
    if (!user) return false;
    if (user.role === 'induccion') {
      return grade === '1° Primaria' && (subject === 'Lengua Castellana' || !subject);
    }
    if (this.isPrivilegedUser(user)) return true;
    const assignment = this.getTeacherAssignment(grade, subject);
    return this.isTeacherMatch(user, assignment);
  }

  /**
   * Permisos para configurar el calendario de fechas límite
   */
  canManageDeadlines(user) {
    if (!user) return false;
    return ['coordinador', 'admin', 'rectora', 'induccion_rectora'].includes(user.role);
  }

  /**
   * Obtiene la lista de materias de un grado con su estado de evaluación para impresión
   */
  getPrintControlForGrade(period = '1° Periodo (25%)', grade = '1° Primaria') {
    if (!this.evaluations[period]) this.evaluations[period] = {};
    if (!this.evaluations[period][grade]) this.evaluations[period][grade] = {};

    const subjects = this.getSubjectsForGrade(grade);
    const printInfo = this.getPrintingCopiesSuggestion(grade);
    const studentCount = printInfo.activeStudents;
    const copiesNeededDynamic = printInfo.suggestedCopies;

    const items = subjects.map((subj) => {
      const teacher = this.getTeacherAssignment(grade, subj);
      let evalData = this.evaluations[period][grade][subj];
      if (!evalData) {
        evalData = {
          id: null,
          uploaded: false,
          grade,
          subject: subj,
          title: `Evaluación de ${subj} - ${grade}`,
          fileName: null,
          fileSize: null,
          fileType: null,
          storageKey: null,
          uploadedAt: null,
          uploadedBy: teacher.teacherName,
          teacherId: teacher.docente_id,
          copiesNeeded: copiesNeededDynamic,
          copiesStatus: 'pendiente',
          notes: '',
          downloadUrl: null
        };
        this.evaluations[period][grade][subj] = evalData;
      } else {
        evalData.copiesNeeded = copiesNeededDynamic;
        if (!evalData.uploaded) {
          evalData.teacherId = teacher.docente_id;
          evalData.uploadedBy = teacher.teacherName;
        }
      }

      return {
        grade,
        subject: subj,
        studentCount,
        activeStudents: studentCount,
        suggestedCopies: copiesNeededDynamic,
        formulaText: printInfo.formulaText,
        ...evalData,
        copiesNeeded: copiesNeededDynamic,
        teacher: teacher.teacherName,
        teacherId: teacher.docente_id,
        uploadedBy: evalData.uploaded ? (evalData.uploadedBy || teacher.teacherName) : teacher.teacherName,
        director: this.getGradeDirector(grade)
      };
    });

    const totalSubjects = items.length;
    const uploadedCount = items.filter(i => i.uploaded).length;
    const pendingCount = totalSubjects - uploadedCount;
    const totalCopiesNeeded = copiesNeededDynamic * totalSubjects;
    const readyCopies = items.filter(i => i.uploaded).reduce((sum, i) => sum + (i.copiesNeeded || copiesNeededDynamic), 0);
    const progressPercent = totalSubjects > 0 ? Math.round((uploadedCount / totalSubjects) * 100) : 0;

    const deadlineInfo = this.deadlines[period] || DEFAULT_DEADLINES[period] || {};

    return {
      period,
      grade,
      items,
      stats: {
        totalSubjects,
        uploadedCount,
        pendingCount,
        studentCount,
        activeStudents: studentCount,
        suggestedCopies: copiesNeededDynamic,
        totalCopiesNeeded,
        readyCopies,
        progressPercent,
        deadlineInfo,
        director: this.getGradeDirector(grade)
      }
    };
  }

  /**
   * Obtiene la lista consolidada de TODOS los grados para el periodo dado
   */
  getPrintControlAll(period = '1° Periodo (25%)') {
    let allItems = [];
    GRADES_LIST.forEach((g) => {
      const data = this.getPrintControlForGrade(period, g);
      allItems = allItems.concat(data.items);
    });

    const totalSubjects = allItems.length;
    const uploadedCount = allItems.filter(i => i.uploaded).length;
    const pendingCount = totalSubjects - uploadedCount;
    const totalCopiesNeeded = allItems.reduce((acc, i) => acc + (i.copiesNeeded || 0), 0);
    const readyCopies = allItems.filter(i => i.uploaded).reduce((acc, i) => acc + (i.copiesNeeded || 0), 0);
    const progressPercent = totalSubjects > 0 ? Math.round((uploadedCount / totalSubjects) * 100) : 0;
    const deadlineInfo = this.deadlines[period] || DEFAULT_DEADLINES[period] || {};

    return {
      period,
      grade: 'all',
      items: allItems,
      stats: {
        totalSubjects,
        uploadedCount,
        pendingCount,
        studentCount: allItems.reduce((acc, i) => acc + (i.studentCount || 0), 0),
        totalCopiesNeeded,
        readyCopies,
        progressPercent,
        deadlineInfo
      }
    };
  }

  /**
   * Obtiene la lista de materias asignadas a un docente específico a través de todos los grados
   */
  getPrintControlForTeacher(period = '1° Periodo (25%)', teacherName) {
    if (!teacherName || teacherName === 'all') {
      return this.getPrintControlAll(period);
    }
    const allData = this.getPrintControlAll(period);
    const items = allData.items.filter(i => i.teacher === teacherName);
    const totalSubjects = items.length;
    const uploadedCount = items.filter(i => i.uploaded).length;
    const pendingCount = totalSubjects - uploadedCount;
    const totalCopiesNeeded = items.reduce((acc, i) => acc + (i.copiesNeeded || 0), 0);
    const readyCopies = items.filter(i => i.uploaded).reduce((acc, i) => acc + (i.copiesNeeded || 0), 0);
    const progressPercent = totalSubjects > 0 ? Math.round((uploadedCount / totalSubjects) * 100) : 0;
    const deadlineInfo = this.deadlines[period] || DEFAULT_DEADLINES[period] || {};

    return {
      period,
      grade: 'all',
      teacher: teacherName,
      items,
      stats: {
        totalSubjects,
        uploadedCount,
        pendingCount,
        studentCount: items.reduce((acc, i) => acc + (i.studentCount || 0), 0),
        totalCopiesNeeded,
        readyCopies,
        progressPercent,
        deadlineInfo
      }
    };
  }

  /**
   * Obtiene los datos de control de impresión según el ROL del usuario
   * Blindaje Estricto de Privacidad: Docentes nunca ven materias de otras docentes
   */
  getPrintControlForUser(period = '1° Periodo (25%)', grade = 'all', user = null) {
    const isPrivileged = this.isPrivilegedUser(user);

    if (isPrivileged || !user) {
      if (grade === 'all') {
        return this.getPrintControlAll(period);
      }
      return this.getPrintControlForGrade(period, grade);
    }

    // Docente titular: filtrado estricto
    const allPeriodData = this.getPrintControlAll(period);
    const myItems = allPeriodData.items.filter(item => this.isTeacherMatch(user, item));

    const items = (grade === 'all') 
      ? myItems 
      : myItems.filter(item => item.grade === grade);

    const totalSubjects = items.length;
    const uploadedCount = items.filter(i => i.uploaded).length;
    const pendingCount = totalSubjects - uploadedCount;
    const totalCopiesNeeded = items.reduce((acc, i) => acc + (i.copiesNeeded || 0), 0);
    const readyCopies = items.filter(i => i.uploaded).reduce((acc, i) => acc + (i.copiesNeeded || 0), 0);
    const progressPercent = totalSubjects > 0 ? Math.round((uploadedCount / totalSubjects) * 100) : 0;
    const deadlineInfo = this.deadlines[period] || DEFAULT_DEADLINES[period] || {};

    return {
      period,
      grade,
      teacher: user.name,
      items,
      stats: {
        totalSubjects,
        uploadedCount,
        pendingCount,
        studentCount: items.reduce((acc, i) => acc + (i.studentCount || 0), 0),
        totalCopiesNeeded,
        readyCopies,
        progressPercent,
        deadlineInfo
      }
    };
  }

  /**
   * Sube o actualiza la evaluación de una materia para impresión (asíncrono con R2 / Supabase)
   */
  async uploadEvaluation({ period, grade, subject, file, notes, copiesStatus = 'aprobado', user }) {
    if (!this.canUploadForSubject(user, grade, subject)) {
      throw new Error(`No tienes permisos para subir la evaluación de "${subject}" en el grado ${grade}.`);
    }

    if (!this.evaluations[period]) this.evaluations[period] = {};
    if (!this.evaluations[period][grade]) this.evaluations[period][grade] = {};

    const assignment = this.getTeacherAssignment(grade, subject);
    const printInfo = this.getPrintingCopiesSuggestion(grade);
    const cleanGrade = grade.replace(/[\s°]+/g, '').slice(0, 4).toUpperCase();
    const cleanSubj = subject.replace(/[\s&]+/g, '_');
    const existingEval = this.evaluations[period]?.[grade]?.[subject];
    const oldStorageKey = existingEval?.storageKey;
    const radicado = existingEval?.id || `EVAL-${cleanGrade}-${Date.now().toString().slice(-4)}`;

    const isInduccion = user?.role === 'induccion' || user?.role === 'induccion_rectora';
    let storageKey = existingEval?.storageKey || null;
    let downloadUrl = existingEval?.downloadUrl || null;

    // Subida binaria a Cloudflare R2 / Supabase Storage si se suministró archivo (omitido en modo inducción)
    if (file) {
      if (!isInduccion) {
        try {
          const uploadRes = await uploadDocumentFile(file, 'evaluaciones', radicado);
          if (!uploadRes.error && uploadRes.storageKey) {
            storageKey = uploadRes.storageKey;
            downloadUrl = getDocumentPublicUrl(storageKey);

            // Limpieza preventiva: si el archivo sustituido tenía una ruta diferente en R2, se elimina para no dejar huérfanos
            if (oldStorageKey && oldStorageKey !== storageKey) {
              deleteDocumentFile(oldStorageKey).catch(e => console.warn('[FinalExamsService] Limpieza archivo previo:', e));
            }
          }
        } catch (err) {
          console.warn('[FinalExamsService] Advertencia subiendo archivo a R2/Storage:', err);
        }
      }
      if (!downloadUrl && typeof window !== 'undefined') {
        downloadUrl = URL.createObjectURL(file);
      }
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const evalData = {
      id: radicado,
      uploaded: true,
      grade,
      subject,
      title: `Evaluación de ${subject} - ${grade}`,
      fileName: file ? file.name : (this.evaluations[period]?.[grade]?.[subject]?.fileName || `Evaluacion_${cleanSubj}_${cleanGrade}_${assignment.teacherName}.pdf`),
      fileSize: file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : (this.evaluations[period]?.[grade]?.[subject]?.fileSize || '1.4 MB'),
      fileType: file?.type || 'application/pdf',
      storageKey,
      downloadUrl,
      uploadedAt: formattedDate,
      uploadedBy: user?.name || assignment.teacherName,
      teacherId: assignment.docente_id,
      teacher: assignment.teacherName,
      copiesNeeded: printInfo.suggestedCopies,
      copiesStatus: copiesStatus || 'aprobado',
      notes: notes || `Sugerencia institucional automatizada: ${printInfo.formulaText}.`,
      isSimulated: isInduccion
    };

    this.evaluations[period][grade][subject] = evalData;

    if (isInduccion) {
      this.notifyUpdate();
      return evalData;
    }

    this.saveEvaluations();
    this.notifyUpdate();

    // Sincronización asíncrona con Supabase
    this.syncEvaluationToSupabase(period, evalData).catch(err => {
      console.warn('[FinalExamsService] Error persistiendo evaluación en Supabase:', err);
    });

    return evalData;
  }

  /**
   * Elimina o revoca una evaluación subida
   */
  async deleteEvaluation(period, grade, subject, user = null) {
    if (user && !this.canUploadForSubject(user, grade, subject)) {
      throw new Error(`No tienes permisos para eliminar la evaluación de "${subject}" en ${grade}.`);
    }

    if (this.evaluations[period] && this.evaluations[period][grade] && this.evaluations[period][grade][subject]) {
      const isInduccion = user?.role === 'induccion' || user?.role === 'induccion_rectora';
      const existing = this.evaluations[period][grade][subject];
      if (existing.storageKey && !isInduccion) {
        deleteDocumentFile(existing.storageKey).catch(e => console.warn('Error eliminando archivo R2:', e));
      }

      const assignment = this.getTeacherAssignment(grade, subject);
      const studentCount = this.getStudentCount(grade);

      const resetData = {
        id: null,
        uploaded: false,
        grade,
        subject,
        title: `Evaluación de ${subject} - ${grade}`,
        fileName: null,
        fileSize: null,
        fileType: null,
        storageKey: null,
        uploadedAt: null,
        uploadedBy: assignment.teacherName,
        teacherId: assignment.docente_id,
        copiesNeeded: studentCount + 1,
        copiesStatus: 'pendiente',
        notes: '',
        downloadUrl: null
      };

      this.evaluations[period][grade][subject] = resetData;

      if (isInduccion) {
        this.notifyUpdate();
        return true;
      }

      this.saveEvaluations();
      this.notifyUpdate();

      // Sincronizar eliminación en Supabase
      this.deleteEvaluationFromSupabase(period, grade, subject).catch(err => {
        console.warn('[FinalExamsService] Error sincronizando eliminación en Supabase:', err);
      });

      return true;
    }
    return false;
  }

  /**
   * Actualiza el estado de fotocopiado/impresión de una evaluación (exclusivo directivos)
   */
  async updateCopiesStatus(period, grade, subject, status, user = null) {
    if (user && !this.isPrivilegedUser(user)) {
      throw new Error('Solo el personal directivo y de coordinación puede modificar el estado de fotocopiado.');
    }

    if (this.evaluations[period]?.[grade]?.[subject]) {
      this.evaluations[period][grade][subject].copiesStatus = status;
      this.saveEvaluations();
      this.notifyUpdate();

      // Persistir actualización en Supabase
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('evaluaciones_finales')
            .update({ copies_status: status, updated_at: new Date().toISOString() })
            .eq('period', period)
            .eq('grade', grade)
            .eq('subject', subject);
        } catch (e) {
          console.warn('[FinalExamsService] Error actualizando estado en Supabase:', e);
        }
      }

      return true;
    }
    return false;
  }

  getDeadlines() {
    return this.deadlines;
  }

  async updateDeadline(period, data, user) {
    if (!this.canManageDeadlines(user)) {
      throw new Error('No tienes permisos para modificar las fechas límite de entrega.');
    }
    this.deadlines[period] = {
      ...(this.deadlines[period] || DEFAULT_DEADLINES[period] || {}),
      ...data,
      lastModifiedBy: user?.name || 'Coordinación'
    };
    this.saveDeadlines();
    this.notifyUpdate();

    // Sincronizar en Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const payload = {
          period,
          deadline_date: data.deadlineDate,
          delivery_time: data.deliveryTime,
          status: data.status,
          description: data.description || '',
          responsible: data.responsible || 'Coordinación Académica',
          last_modified_by: user?.name || 'Coordinación',
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('evaluaciones_deadlines')
          .upsert([payload], { onConflict: 'period' });

        if (error) {
          // Respaldo en vault
          await supabase.from('institutional_vault').upsert({
            user_key: `eval_deadlines_${period}`,
            cipher: JSON.stringify(payload),
            default_invalidated: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_key' });
        }
      } catch (e) {
        console.warn('[FinalExamsService] Error persistiendo fecha límite en Supabase:', e);
      }
    }
  }

  // ===========================================================================
  // MÉTODOS DE SINCRONIZACIÓN CON SUPABASE & VAULT
  // ===========================================================================

  async syncEvaluationToSupabase(period, evalData) {
    if (!isSupabaseConfigured || !supabase) return;

    const payload = {
      id: evalData.id || `EVAL_${period.replace(/\s+/g, '_')}_${evalData.grade.replace(/\s+/g, '_')}_${evalData.subject.replace(/\s+/g, '_')}`,
      period,
      grade: evalData.grade,
      subject: evalData.subject,
      title: evalData.title || `Evaluación de ${evalData.subject} - ${evalData.grade}`,
      uploaded: evalData.uploaded,
      file_name: evalData.fileName,
      file_size: evalData.fileSize,
      file_type: evalData.fileType,
      storage_key: evalData.storageKey,
      download_url: evalData.downloadUrl,
      uploaded_at: new Date().toISOString(),
      uploaded_by: evalData.uploadedBy,
      teacher_id: evalData.teacherId,
      teacher_name: evalData.teacher,
      copies_needed: evalData.copiesNeeded,
      copies_status: evalData.copiesStatus || 'aprobado',
      notes: evalData.notes || '',
      updated_at: new Date().toISOString()
    };

    // 1. Intentar upsert en evaluaciones_finales
    try {
      const { error } = await supabase
        .from('evaluaciones_finales')
        .upsert([payload], { onConflict: 'id' });

      if (!error) return;
    } catch {
      // Continuar con respaldo en vault
    }

    // 2. Respaldo transparente en institutional_vault
    try {
      await supabase.from('institutional_vault').upsert({
        user_key: `eval_${payload.id}`,
        cipher: JSON.stringify(evalData),
        default_invalidated: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_key' });
    } catch (err) {
      console.warn('[FinalExamsService] Fallo respaldo en institutional_vault:', err);
    }
  }

  async deleteEvaluationFromSupabase(period, grade, subject) {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      await supabase
        .from('evaluaciones_finales')
        .update({
          uploaded: false,
          file_name: null,
          file_size: null,
          file_type: null,
          storage_key: null,
          download_url: null,
          copies_status: 'pendiente',
          notes: '',
          updated_at: new Date().toISOString()
        })
        .eq('period', period)
        .eq('grade', grade)
        .eq('subject', subject);
    } catch (err) {
      console.warn('[FinalExamsService] Error actualizando borrado en Supabase:', err);
    }
  }

  async initRemoteSync() {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Cargar evaluaciones existentes en Supabase
      const { data: remoteEvals, error: evalsErr } = await supabase
        .from('evaluaciones_finales')
        .select('*');

      if (!evalsErr && Array.isArray(remoteEvals) && remoteEvals.length > 0) {
        let changed = false;
        remoteEvals.forEach(row => {
          const { period, grade, subject } = row;
          if (period && grade && subject) {
            if (!this.evaluations[period]) this.evaluations[period] = {};
            if (!this.evaluations[period][grade]) this.evaluations[period][grade] = {};
            this.evaluations[period][grade][subject] = {
              id: row.id,
              uploaded: row.uploaded ?? true,
              grade: row.grade,
              subject: row.subject,
              title: row.title || `Evaluación de ${subject} - ${grade}`,
              fileName: row.file_name,
              fileSize: row.file_size,
              fileType: row.file_type,
              storageKey: row.storage_key,
              downloadUrl: row.download_url,
              uploadedAt: row.uploaded_at,
              uploadedBy: row.uploaded_by,
              teacherId: row.teacher_id,
              teacher: row.teacher_name,
              copiesNeeded: row.copies_needed,
              copiesStatus: row.copies_status,
              notes: row.notes
            };
            changed = true;
          }
        });

        if (changed) {
          this.saveEvaluations();
          this.notifyUpdate();
        }
      }

      // 2. Cargar fechas límite en Supabase
      const { data: remoteDeadlines, error: deadErr } = await supabase
        .from('evaluaciones_deadlines')
        .select('*');

      if (!deadErr && Array.isArray(remoteDeadlines) && remoteDeadlines.length > 0) {
        let deadChanged = false;
        remoteDeadlines.forEach(row => {
          if (row.period) {
            this.deadlines[row.period] = {
              deadlineDate: row.deadline_date,
              deliveryTime: row.delivery_time,
              status: row.status,
              description: row.description,
              responsible: row.responsible,
              lastModifiedBy: row.last_modified_by
            };
            deadChanged = true;
          }
        });

        if (deadChanged) {
          this.saveDeadlines();
          this.notifyUpdate();
        }
      }

      // 3. Suscripción a Supabase Realtime
      this.initRealtimeSubscription();
    } catch (e) {
      console.warn('[FinalExamsService] Inicialización remota Supabase omitida:', e);
    }
  }

  initRealtimeSubscription() {
    if (!isSupabaseConfigured || !supabase || this.realtimeChannel) return;

    try {
      this.realtimeChannel = supabase
        .channel('evaluaciones_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluaciones_finales' }, (payload) => {
          const row = payload.new || payload.old;
          if (row && row.period && row.grade && row.subject) {
            if (!this.evaluations[row.period]) this.evaluations[row.period] = {};
            if (!this.evaluations[row.period][row.grade]) this.evaluations[row.period][row.grade] = {};

            if (payload.eventType === 'DELETE' || (row.uploaded === false)) {
              const assign = this.getTeacherAssignment(row.grade, row.subject);
              this.evaluations[row.period][row.grade][row.subject] = {
                id: null,
                uploaded: false,
                grade: row.grade,
                subject: row.subject,
                title: `Evaluación de ${row.subject} - ${row.grade}`,
                fileName: null,
                fileSize: null,
                fileType: null,
                storageKey: null,
                uploadedAt: null,
                uploadedBy: assign.teacherName,
                teacherId: assign.docente_id,
                copiesNeeded: this.getStudentCount(row.grade) + 1,
                copiesStatus: 'pendiente',
                notes: '',
                downloadUrl: null
              };
            } else {
              this.evaluations[row.period][row.grade][row.subject] = {
                id: row.id,
                uploaded: row.uploaded ?? true,
                grade: row.grade,
                subject: row.subject,
                title: row.title || `Evaluación de ${row.subject} - ${row.grade}`,
                fileName: row.file_name,
                fileSize: row.file_size,
                fileType: row.file_type,
                storageKey: row.storage_key,
                downloadUrl: row.download_url,
                uploadedAt: row.uploaded_at,
                uploadedBy: row.uploaded_by,
                teacherId: row.teacher_id,
                teacher: row.teacher_name,
                copiesNeeded: row.copies_needed,
                copiesStatus: row.copies_status,
                notes: row.notes
              };
            }
            this.saveEvaluations();
            this.notifyUpdate();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluaciones_deadlines' }, (payload) => {
          const row = payload.new;
          if (row && row.period) {
            this.deadlines[row.period] = {
              deadlineDate: row.deadline_date,
              deliveryTime: row.delivery_time,
              status: row.status,
              description: row.description,
              responsible: row.responsible,
              lastModifiedBy: row.last_modified_by
            };
            this.saveDeadlines();
            this.notifyUpdate();
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('[FinalExamsService] Error en suscripción Realtime:', err);
    }
  }
}

const finalExamsService = new FinalExamsService();
export default finalExamsService;
