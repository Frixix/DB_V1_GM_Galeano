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

const EVALUACIONES_STORAGE_KEY = 'gmg_evaluaciones_impresion_v1';
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
 * Genera registros de demostración iniciales con algunas evaluaciones ya subidas
 * y otras pendientes para dar dinamismo institucional inmediato.
 */
const createInitialEvaluationsData = () => {
  const initialData = {};

  ACADEMIC_PERIODS.forEach((period, pIdx) => {
    initialData[period] = {};

    GRADES_LIST.forEach((grade) => {
      initialData[period][grade] = {};
      const subjectsInGrade = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
      const studentCount = (STUDENTS_BY_GRADE[grade] || []).length;

      Object.entries(subjectsInGrade).forEach(([subj, assign], idx) => {
        // En el 1° periodo marcamos la mayoría como subidas y un par pendientes
        const isUploaded = pIdx === 0 ? (idx % 3 !== 2) : false;

        if (isUploaded) {
          const cleanSubj = subj.toLowerCase().replace(/[\s&]+/g, '_');
          const cleanGrade = grade.toLowerCase().replace(/[\s°]+/g, '');
          initialData[period][grade][subj] = {
            id: `EVAL-${pIdx + 1}-${idx + 101}`,
            uploaded: true,
            title: `Evaluación de ${subj} - ${grade}`,
            fileName: `Evaluacion_${cleanSubj}_${cleanGrade}_P${pIdx + 1}.pdf`,
            fileSize: `${(1.1 + (idx * 0.2)).toFixed(1)} MB`,
            fileType: 'application/pdf',
            uploadedAt: '2026-03-24 14:35',
            uploadedBy: assign.teacherName,
            teacherId: assign.docente_id,
            copiesNeeded: studentCount,
            copiesStatus: idx === 0 ? 'impreso' : 'aprobado',
            notes: 'Impresión a doble cara, grapada en la esquina superior izquierda.',
            downloadUrl: null
          };
        } else {
          initialData[period][grade][subj] = {
            id: null,
            uploaded: false,
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
        }
      });
    });
  });

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

  getGradeDirector(grade) {
    return GRADE_DIRECTORS[grade] || { docente_id: 'jessica', teacherName: 'Jessica' };
  }

  isGradeDirector(user, grade) {
    if (!user || !grade) return false;
    const userKey = user.key || user.role;
    const director = this.getGradeDirector(grade);
    return director.docente_id === userKey || director.teacherName === user.name;
  }

  getTeacherAssignment(grade, subject) {
    if (TEACHER_CURRICULUM_ASSIGNMENTS[grade] && TEACHER_CURRICULUM_ASSIGNMENTS[grade][subject]) {
      return TEACHER_CURRICULUM_ASSIGNMENTS[grade][subject];
    }
    return { docente_id: 'jessica', teacherName: 'Jessica' };
  }

  getStudentCount(grade) {
    return (STUDENTS_BY_GRADE[grade] || []).length;
  }

  getGradesForUser(user) {
    if (!user) return GRADES_LIST;
    const role = user.role;
    if (['admin', 'rectora', 'induccion_rectora', 'coordinador', 'induccion'].includes(role)) {
      return GRADES_LIST;
    }
    const directedGrade = Object.keys(GRADE_DIRECTORS).find(g => this.isGradeDirector(user, g));
    if (directedGrade) return [directedGrade];
    return ['1° Primaria'];
  }

  getSubjectsForGradeAndUser(grade, user) {
    const defaultGradeAssignments = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
    const allSubjects = Object.keys(defaultGradeAssignments);
    const validAll = allSubjects.length > 0 ? allSubjects : ALL_SUBJECTS;

    if (!user) return validAll;
    const role = user.role;
    const userKey = user.key || role;

    if (['admin', 'rectora', 'induccion_rectora', 'coordinador', 'induccion'].includes(role)) {
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
   * Obtiene la lista consolidada de materias de un grado con su estado de evaluación para impresión
   */
  getPrintControlForGrade(period = '1° Periodo (25%)', grade = '1° Primaria') {
    if (!this.evaluations[period]) this.evaluations[period] = {};
    if (!this.evaluations[period][grade]) this.evaluations[period][grade] = {};

    const assignments = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
    const studentCount = this.getStudentCount(grade);

    const items = Object.entries(assignments).map(([subj, teacher]) => {
      let evalData = this.evaluations[period][grade][subj];
      if (!evalData) {
        evalData = {
          id: null,
          uploaded: false,
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
      }

      return {
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
    const readyCopies = studentCount * uploadedCount;
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
   * Sube o actualiza la evaluación de una materia para impresión
   */
  uploadEvaluation({ period, grade, subject, file, notes, copiesStatus = 'aprobado', user }) {
    if (!this.evaluations[period]) this.evaluations[period] = {};
    if (!this.evaluations[period][grade]) this.evaluations[period][grade] = {};

    const assignment = this.getTeacherAssignment(grade, subject);
    const studentCount = this.getStudentCount(grade);
    const radicado = `EVAL-${Date.now().toString().slice(-4)}`;

    let fileName = file?.name || `Evaluacion_${subject.replace(/\s+/g, '_')}_${grade.replace(/\s+/g, '_')}.pdf`;
    let fileSize = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB';
    let fileType = file?.type || 'application/pdf';

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.evaluations[period][grade][subject] = {
      id: radicado,
      uploaded: true,
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
