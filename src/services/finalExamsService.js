import { 
  ACADEMIC_YEARS, 
  ACADEMIC_PERIODS,
  GRADES_LIST, 
  ALL_SUBJECTS, 
  STUDENTS_BY_GRADE, 
  GRADE_DIRECTORS,
  TEACHER_CURRICULUM_ASSIGNMENTS 
} from '../data/gradesTreeData';
import { USERS } from '../data/users';
import gradesService from './gradesService';

const EVALUACIONES_STORAGE_KEY = 'gmg_evaluaciones_impresion_v3';
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
 * Las materias inician como pendientes y solo unas pocas de demostración
 * están subidas con radicados y nombres de archivo totalmente diferenciados.
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
        initialData[period][grade][subj] = {
          id: null,
          uploaded: false,
          grade,
          subject: subj,
          title: `Evaluación de ${subj} - ${grade}`,
          fileName: null,
          fileSize: null,
          fileType: null,
          uploadedAt: null,
          uploadedBy: assign.teacherName,
          teacherId: assign.docente_id,
          copiesNeeded: studentCount,
          copiesStatus: 'pendiente',
          notes: '',
          downloadUrl: null
        };
      });
    });
  });

  // Ejemplos institucionales diferenciados únicamente para el 1° Periodo:
  // Reflejan la nueva distribución oficial:
  // - Jessica: Lengua Castellana (Español)
  // - Yuri: Ciencias Sociales
  // - Elcy: Inglés
  // - Profe 2: Matemáticas
  // - Profe 3: Ciencias Naturales
  // - Directora de Curso: Educación Artística, Religión, Educación Física
  const p1 = '1° Periodo (25%)';
  if (initialData[p1]) {
    // 1. Profe 1: Educación Artística en Transición (Directora de Curso)
    if (initialData[p1]['Transición']?.['Educación Artística']) {
      initialData[p1]['Transición']['Educación Artística'] = {
        id: 'EVAL-TRA-01',
        uploaded: true,
        grade: 'Transición',
        subject: 'Educación Artística',
        title: 'Evaluación de Educación Artística - Transición',
        fileName: 'Evaluacion_Arte_Transicion_Profe1.pdf',
        fileSize: '1.2 MB',
        fileType: 'application/pdf',
        uploadedAt: '2026-03-24 10:15',
        uploadedBy: 'Profe 1',
        teacherId: 'profe1',
        copiesNeeded: (STUDENTS_BY_GRADE['Transición'] || []).length,
        copiesStatus: 'aprobado',
        notes: 'Impresión a color de guía de trazos, motricidad fina y dactilopintura.',
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
        uploadedAt: '2026-03-24 11:30',
        uploadedBy: 'Jessica',
        teacherId: 'jessica',
        copiesNeeded: (STUDENTS_BY_GRADE['1° Primaria'] || []).length,
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
        uploadedAt: '2026-03-24 14:20',
        uploadedBy: 'Yuri',
        teacherId: 'yuri',
        copiesNeeded: (STUDENTS_BY_GRADE['2° Primaria'] || []).length,
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
        uploadedAt: '2026-03-24 16:10',
        uploadedBy: 'Profe 2',
        teacherId: 'profe2',
        copiesNeeded: (STUDENTS_BY_GRADE['3° Primaria'] || []).length,
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
        uploadedAt: '2026-03-24 15:45',
        uploadedBy: 'Elcy',
        teacherId: 'elcy',
        copiesNeeded: (STUDENTS_BY_GRADE['4° Primaria'] || []).length,
        copiesStatus: 'impreso',
        notes: 'Vocabulario temático en inglés, comprensión lectora y estructuras de preguntas.',
        downloadUrl: null
      };
    }

    // 6. Profe 3: Ciencias Naturales en 5° Primaria
    if (initialData[p1]['5° Primaria']?.['Ciencias Naturales']) {
      initialData[p1]['5° Primaria']['Ciencias Naturales'] = {
        id: 'EVAL-5PRI-01',
        uploaded: true,
        grade: '5° Primaria',
        subject: 'Ciencias Naturales',
        title: 'Evaluación de Ciencias Naturales - 5° Primaria',
        fileName: 'Evaluacion_Naturales_5Primaria_Profe3.pdf',
        fileSize: '1.6 MB',
        fileType: 'application/pdf',
        uploadedAt: '2026-03-24 17:00',
        uploadedBy: 'Profe 3',
        teacherId: 'profe3',
        copiesNeeded: (STUDENTS_BY_GRADE['5° Primaria'] || []).length,
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
  }

  loadEvaluations() {
    if (typeof window === 'undefined') return createInitialEvaluationsData();
    try {
      const data = localStorage.getItem(EVALUACIONES_STORAGE_KEY);
      return data ? JSON.parse(data) : createInitialEvaluationsData();
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
    const userKey = user.key || user.role;
    const director = this.getGradeDirector(grade);
    return director.docente_id === userKey || director.teacherName === user.name;
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

  getSubjectsForGrade(grade) {
    if (gradesService && gradesService.getSubjectsForGrade) {
      return gradesService.getSubjectsForGrade(grade);
    }
    const defaultGradeAssignments = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
    const all = Object.keys(defaultGradeAssignments);
    return all.length > 0 ? all : ALL_SUBJECTS;
  }

  getStudentCount(grade) {
    return (STUDENTS_BY_GRADE[grade] || []).length;
  }

  /**
   * Obtiene la lista de grados accesibles para el usuario
   */
  getGradesForUser(user) {
    if (!user) return GRADES_LIST;
    const role = user.role;
    if (['admin', 'rectora', 'induccion_rectora', 'coordinador', 'induccion'].includes(role)) {
      return GRADES_LIST;
    }
    // Docente: todos los grados donde tenga asignaturas asignadas o sea directora de curso
    const userKey = user.key || role;
    const myGrades = GRADES_LIST.filter(g => {
      if (this.isGradeDirector(user, g)) return true;
      const subjectsInGrade = this.getSubjectsForGrade(g);
      return subjectsInGrade.some(subj => {
        const assign = this.getTeacherAssignment(g, subj);
        return assign.docente_id === userKey || assign.teacherName === user.name;
      });
    });

    return myGrades.length > 0 ? myGrades : GRADES_LIST;
  }

  /**
   * Obtiene las materias disponibles para un grado y usuario
   */
  getSubjectsForGradeAndUser(grade, user) {
    const validAll = this.getSubjectsForGrade(grade);

    if (!user) return validAll;
    const role = user.role;
    const userKey = user.key || role;

    if (['admin', 'rectora', 'induccion_rectora', 'coordinador', 'induccion'].includes(role)) {
      return validAll;
    }

    if (this.isGradeDirector(user, grade)) {
      return validAll;
    }

    const mySubjects = validAll.filter(subj => {
      const assignment = this.getTeacherAssignment(grade, subj);
      return assignment.docente_id === userKey || assignment.teacherName === user.name;
    });

    return mySubjects.length > 0 ? mySubjects : validAll;
  }

  canUploadForSubject(user, grade, subject) {
    if (!user) return false;
    if (['admin', 'rectora', 'coordinador'].includes(user.role)) return true;
    const userKey = user.key || user.role;
    const assignment = this.getTeacherAssignment(grade, subject);
    return assignment.docente_id === userKey || assignment.teacherName === user.name;
  }

  canManageDeadlines(user) {
    if (!user) return false;
    return ['coordinador', 'admin', 'rectora'].includes(user.role);
  }

  /**
   * Obtiene la lista de materias de un grado con su estado de evaluación para impresión
   */
  getPrintControlForGrade(period = '1° Periodo (25%)', grade = '1° Primaria') {
    if (!this.evaluations[period]) this.evaluations[period] = {};
    if (!this.evaluations[period][grade]) this.evaluations[period][grade] = {};

    const subjects = this.getSubjectsForGrade(grade);
    const studentCount = this.getStudentCount(grade);

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
          uploadedAt: null,
          uploadedBy: teacher.teacherName,
          teacherId: teacher.docente_id,
          copiesNeeded: studentCount,
          copiesStatus: 'pendiente',
          notes: '',
          downloadUrl: null
        };
        this.evaluations[period][grade][subj] = evalData;
      } else {
        if (!evalData.uploaded) {
          evalData.teacherId = teacher.docente_id;
          evalData.uploadedBy = teacher.teacherName;
        }
      }

      return {
        grade,
        subject: subj,
        teacher: teacher.teacherName,
        teacherId: teacher.docente_id,
        director: this.getGradeDirector(grade),
        studentCount,
        ...evalData
      };
    });

    const totalSubjects = items.length;
    const uploadedCount = items.filter(i => i.uploaded).length;
    const pendingCount = totalSubjects - uploadedCount;
    const totalCopiesNeeded = studentCount * totalSubjects;
    const readyCopies = items.filter(i => i.uploaded).reduce((sum, i) => sum + (i.copiesNeeded || studentCount), 0);
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
   * Sube o actualiza la evaluación de una materia para impresión
   */
  uploadEvaluation({ period, grade, subject, file, notes, copiesStatus = 'aprobado', user }) {
    if (!this.evaluations[period]) this.evaluations[period] = {};
    if (!this.evaluations[period][grade]) this.evaluations[period][grade] = {};

    const assignment = this.getTeacherAssignment(grade, subject);
    const studentCount = this.getStudentCount(grade);
    const cleanGrade = grade.replace(/[\s°]+/g, '').slice(0, 4).toUpperCase();
    const radicado = `EVAL-${cleanGrade}-${Date.now().toString().slice(-4)}`;

    const cleanSubj = subject.replace(/[\s&]+/g, '_');
    const cleanGrd = grade.replace(/[\s°]+/g, '');
    let fileName = file?.name || `Evaluacion_${cleanSubj}_${cleanGrd}_${assignment.teacherName}.pdf`;
    let fileSize = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.4 MB';
    let fileType = file?.type || 'application/pdf';

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.evaluations[period][grade][subject] = {
      id: radicado,
      uploaded: true,
      grade,
      subject,
      title: `Evaluación de ${subject} - ${grade}`,
      fileName,
      fileSize,
      fileType,
      uploadedAt: formattedDate,
      uploadedBy: user?.name || assignment.teacherName,
      teacherId: assignment.docente_id,
      copiesNeeded: studentCount,
      copiesStatus: copiesStatus || 'aprobado',
      notes: notes || 'Listo para impresión y fotocopiado.',
      downloadUrl: file ? URL.createObjectURL(file) : null
    };

    this.saveEvaluations();
    this.notifyUpdate();
    return this.evaluations[period][grade][subject];
  }

  /**
   * Elimina o revoca una evaluación subida
   */
  deleteEvaluation(period, grade, subject) {
    if (this.evaluations[period] && this.evaluations[period][grade] && this.evaluations[period][grade][subject]) {
      const assignment = this.getTeacherAssignment(grade, subject);
      const studentCount = this.getStudentCount(grade);

      this.evaluations[period][grade][subject] = {
        id: null,
        uploaded: false,
        grade,
        subject,
        title: `Evaluación de ${subject} - ${grade}`,
        fileName: null,
        fileSize: null,
        fileType: null,
        uploadedAt: null,
        uploadedBy: assignment.teacherName,
        teacherId: assignment.docente_id,
        copiesNeeded: studentCount,
        copiesStatus: 'pendiente',
        notes: '',
        downloadUrl: null
      };

      this.saveEvaluations();
      this.notifyUpdate();
      return true;
    }
    return false;
  }

  /**
   * Actualiza el estado de fotocopiado/impresión de una evaluación
   */
  updateCopiesStatus(period, grade, subject, status) {
    if (this.evaluations[period]?.[grade]?.[subject]) {
      this.evaluations[period][grade][subject].copiesStatus = status;
      this.saveEvaluations();
      this.notifyUpdate();
      return true;
    }
    return false;
  }

  getDeadlines() {
    return this.deadlines;
  }

  updateDeadline(period, data, user) {
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
  }
}

const finalExamsService = new FinalExamsService();
export default finalExamsService;
