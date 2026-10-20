import { 
  ACADEMIC_YEARS, 
  GRADES_LIST, 
  ALL_SUBJECTS, 
  STUDENTS_BY_GRADE, 
  GRADE_DIRECTORS,
  TEACHER_CURRICULUM_ASSIGNMENTS 
} from '../data/gradesTreeData';
import { USERS } from '../data/users';

const FINAL_EXAMS_STORAGE_KEY = 'gmg_final_exams_tree_v1';
const FINAL_CALENDAR_STORAGE_KEY = 'gmg_final_exams_calendar_v1';

export const FINAL_INSTANCES = [
  'Convocatoria Ordinaria Final (100%)',
  'Nivelaciones & Recuperaciones Finales',
  'Comisión de Evaluación y Promoción'
];

const DEFAULT_FINAL_CALENDAR = {
  'Convocatoria Ordinaria Final (100%)': {
    startDate: '2026-11-03',
    endDate: '2026-11-20',
    closureDate: '2026-11-27',
    status: 'abierto',
    description: 'Exámenes finales acumulativos y sustentaciones de fin de año'
  },
  'Nivelaciones & Recuperaciones Finales': {
    startDate: '2026-11-23',
    endDate: '2026-11-27',
    closureDate: '2026-12-01',
    status: 'programado',
    description: 'Habilitaciones y planes de mejoramiento final para estudiantes con áreas pendientes'
  },
  'Comisión de Evaluación y Promoción': {
    startDate: '2026-11-30',
    endDate: '2026-12-04',
    closureDate: '2026-12-05',
    status: 'programado',
    description: 'Dictamen oficial de promoción de estudiantes de Transición a 5° Primaria'
  }
};

/**
 * Genera el roster inicial de evaluación final para una rama específica
 */
const createInitialFinalRoster = (grade, subject) => {
  const studentsList = STUDENTS_BY_GRADE[grade] || [];
  
  // Asignación de notas realistas iniciales
  const scorePresets = [
    { t: 4.8, p: 4.7, a: 4.5, feedback: 'Excelente dominio de competencias y sustentación impecable.', coord: 'Estudiante con desempeño superior en el cierre de año.', dir: 'Felicitaciones por el rendimiento integral.' },
    { t: 4.2, p: 4.3, a: 4.0, feedback: 'Buen desarrollo conceptual y cumplimiento de objetivos pedagógicos.', coord: 'Aprobación solvente.', dir: '' },
    { t: 3.8, p: 3.5, a: 3.7, feedback: 'Alcanza los logros básicos requeridos para la promoción.', coord: 'Seguimiento preventivo para el próximo año.', dir: '' },
    { t: 4.5, p: 4.4, a: 4.2, feedback: 'Participación destacada en sustentación y portafolio final.', coord: 'Promovido sin observaciones.', dir: 'Gran avance.' },
    { t: 3.2, p: 3.4, a: 3.0, feedback: 'Requiere reforzar lectura analítica y disciplina de estudio.', coord: 'Se recomienda compromiso familiar para el grado superior.', dir: '' },
    { t: 2.8, p: 2.9, a: 2.5, feedback: 'Dificultades en prueba escrita. Convocado a nivelación final.', coord: 'Pendiente de acta de nivelación y sustento de recuperación.', dir: 'Citación a acudiente requerida.' }
  ];

  return studentsList.map((st, index) => {
    const preset = scorePresets[index % scorePresets.length];
    const teorico = preset.t;
    const practico = preset.p;
    const acumulativo = preset.a;
    const def = Number(((teorico * 0.4) + (practico * 0.4) + (acumulativo * 0.2)).toFixed(1));

    let estado = 'Promovido';
    if (def < 3.0) estado = 'En Nivelación';
    if (def < 2.0) estado = 'Reprobado';

    return {
      id: st.id,
      name: st.name,
      notaTeorico: teorico,
      notaPractico: practico,
      notaAcumulativo: acumulativo,
      definitiva: def,
      estadoPromocion: estado,
      retroalimentacionDocente: preset.feedback,
      observacionCoordinacion: preset.coord,
      sugerenciaDirectiva: preset.dir
    };
  });
};

class FinalExamsService {
  constructor() {
    this.tree = this.loadTree();
    this.calendar = this.loadCalendar();
  }

  loadTree() {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(FINAL_EXAMS_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Error al cargar árbol de Evaluaciones Finales:', e);
      return {};
    }
  }

  saveTree() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(FINAL_EXAMS_STORAGE_KEY, JSON.stringify(this.tree));
    } catch (e) {
      console.error('Error al guardar árbol de Evaluaciones Finales:', e);
    }
  }

  loadCalendar() {
    if (typeof window === 'undefined') return DEFAULT_FINAL_CALENDAR;
    try {
      const data = localStorage.getItem(FINAL_CALENDAR_STORAGE_KEY);
      return data ? JSON.parse(data) : DEFAULT_FINAL_CALENDAR;
    } catch (e) {
      return DEFAULT_FINAL_CALENDAR;
    }
  }

  saveCalendar() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(FINAL_CALENDAR_STORAGE_KEY, JSON.stringify(this.calendar));
    } catch (e) {
      console.error('Error al guardar calendario de Evaluaciones Finales:', e);
    }
  }

  notifyUpdate() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gmg_final_exams_updated', {
        detail: { timestamp: new Date().toISOString() }
      }));
    }
  }

  getInstances() {
    return FINAL_INSTANCES;
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

    // Docente: asignaturas a su cargo en ese grado
    const mySubjects = validAll.filter(subj => {
      const assignment = this.getTeacherAssignment(grade, subj);
      return assignment.docente_id === userKey || assignment.teacherName === user.name;
    });

    return mySubjects.length > 0 ? mySubjects : validAll;
  }

  canEditScores(user, grade, subject) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'coordinador' || user.role === 'rectora') return false; // Blindaje estricto

    const userKey = user.key || user.role;
    const assignment = this.getTeacherAssignment(grade, subject);
    return assignment.docente_id === userKey || assignment.teacherName === user.name;
  }

  canEditFeedback(user, grade, subject) {
    return this.canEditScores(user, grade, subject);
  }

  canEditCoordinacionObservation(user) {
    if (!user) return false;
    return ['coordinador', 'admin'].includes(user.role);
  }

  canEditDirectiveSuggestion(user) {
    if (!user) return false;
    return ['rectora', 'induccion_rectora', 'admin'].includes(user.role);
  }

  canManageCalendar(user) {
    if (!user) return false;
    return ['coordinador', 'admin'].includes(user.role);
  }

  isViewingAsGradeDirector(user, grade, subject) {
    if (!user || !grade || !subject) return false;
    const isDir = this.isGradeDirector(user, grade);
    const isTeacher = this.canEditScores(user, grade, subject);
    return isDir && !isTeacher;
  }

  /**
   * Obtiene la rama de evaluaciones finales: Año -> Instancia -> Grado -> Materia
   */
  getBranch(year = '2026', instance = FINAL_INSTANCES[0], grade = '1° Primaria', subject = 'Lengua Castellana') {
    if (!this.tree[year]) this.tree[year] = {};
    if (!this.tree[year][instance]) this.tree[year][instance] = {};
    if (!this.tree[year][instance][grade]) this.tree[year][instance][grade] = {};

    if (!this.tree[year][instance][grade][subject]) {
      this.tree[year][instance][grade][subject] = {
        meta: {
          year,
          instance,
          grade,
          subject,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        students: createInitialFinalRoster(grade, subject)
      };
      this.saveTree();
    }

    return this.tree[year][instance][grade][subject];
  }

  /**
   * Guarda o actualiza la rama de evaluaciones finales
   */
  saveBranch(year, instance, grade, subject, students, user) {
    if (!this.tree[year]) this.tree[year] = {};
    if (!this.tree[year][instance]) this.tree[year][instance] = {};
    if (!this.tree[year][instance][grade]) this.tree[year][instance][grade] = {};

    const existingBranch = this.tree[year][instance][grade][subject] || {};

    this.tree[year][instance][grade][subject] = {
      meta: {
        ...(existingBranch.meta || {}),
        updatedAt: new Date().toISOString(),
        updatedBy: user?.name || 'Sistema'
      },
      students
    };

    this.saveTree();
    this.notifyUpdate();
    return true;
  }

  /**
   * Devuelve la Sábana Consolidada de Evaluación Final y Promoción de un Grado
   */
  getConsolidatedGradeSheet(year = '2026', instance = FINAL_INSTANCES[0], grade = '1° Primaria') {
    const subjects = this.getSubjectsForGradeAndUser(grade, null);
    const studentsList = STUDENTS_BY_GRADE[grade] || [];

    const consolidatedStudents = studentsList.map(st => {
      const subjectScores = {};
      let totalSum = 0;
      let validCount = 0;
      let failedSubjects = 0;

      subjects.forEach(subj => {
        const branch = this.getBranch(year, instance, grade, subj);
        const stData = branch.students.find(s => s.id === st.id);
        const score = stData ? Number(stData.definitiva) : 0;
        subjectScores[subj] = score;

        if (score > 0) {
          totalSum += score;
          validCount++;
        }
        if (score > 0 && score < 3.0) {
          failedSubjects++;
        }
      });

      const average = validCount > 0 ? Number((totalSum / validCount).toFixed(1)) : 0;
      
      let dictamen = 'Promovido';
      if (failedSubjects >= 2 || (average > 0 && average < 3.0)) {
        dictamen = 'Comisión de Promoción';
      } else if (failedSubjects === 1) {
        dictamen = 'Nivelación Pendiente';
      }

      return {
        id: st.id,
        name: st.name,
        subjectScores,
        average,
        failedSubjects,
        dictamen
      };
    });

    // Calcular rankings / puestos
    consolidatedStudents.sort((a, b) => b.average - a.average);
    consolidatedStudents.forEach((st, idx) => {
      st.ranking = idx + 1;
    });

    const totalStudents = consolidatedStudents.length;
    const sumAverages = consolidatedStudents.reduce((sum, s) => sum + s.average, 0);
    const gradeAverage = totalStudents > 0 ? (sumAverages / totalStudents).toFixed(1) : '0.0';
    const passedCount = consolidatedStudents.filter(s => s.dictamen === 'Promovido').length;
    const gradePassRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;

    return {
      year,
      instance,
      grade,
      subjects,
      students: consolidatedStudents,
      stats: {
        totalStudents,
        gradeAverage,
        gradePassRate,
        passedCount,
        failedCount: totalStudents - passedCount,
        director: this.getGradeDirector(grade)
      }
    };
  }

  getCalendar() {
    return this.calendar;
  }

  updateCalendarInstance(instanceKey, data, user) {
    if (!this.canManageCalendar(user)) {
      throw new Error('No tienes permisos de Coordinación o Administración para modificar el calendario.');
    }
    this.calendar[instanceKey] = {
      ...(this.calendar[instanceKey] || {}),
      ...data,
      lastModifiedBy: user?.name || 'Coordinación'
    };
    this.saveCalendar();
    this.notifyUpdate();
  }
}

const finalExamsService = new FinalExamsService();
export default finalExamsService;
