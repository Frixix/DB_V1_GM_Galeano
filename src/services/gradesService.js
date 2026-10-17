import { 
  ACADEMIC_YEARS, 
  ACADEMIC_PERIODS, 
  GRADES_LIST, 
  ALL_SUBJECTS, 
  STUDENTS_BY_GRADE, 
  GRADE_DIRECTORS,
  TEACHER_CURRICULUM_ASSIGNMENTS, 
  createInitialRosterForBranch 
} from '../data/gradesTreeData';

const GRADES_STORAGE_KEY = 'gmg_grades_tree_v1';

/**
 * Servicio Centralizado para la Jerarquía de Datos Relacional (RBAC) de Calificaciones
 * Incluye Regla de Directores de Curso (Homeroom Teachers):
 * - 1 Director de curso por grado.
 * - Pueden supervisar todas las materias y notas de sus alumnos en su grado.
 * - Solo lectura para materias que no son suyas (no pueden alterar notas de otros docentes).
 */

class GradesService {
  constructor() {
    this.tree = this.loadTreeFromStorage();
  }

  loadTreeFromStorage() {
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

  persistTree() {
    try {
      localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(this.tree));
    } catch (e) {
      console.error('Error al persistir árbol de calificaciones:', e);
    }
  }

  /**
   * Obtiene el Director de Curso asignado a un grado
   */
  getGradeDirector(grade) {
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
    return director.docente_id === userKey;
  }

  /**
   * Obtiene la asignación docente de una materia específica en un grado
   */
  getTeacherAssignment(grade, subject) {
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
   * Un docente accede a los grados donde:
   * 1. Enseña al menos una materia, O
   * 2. Es el Director de Curso del grado
   */
  getGradesForUser(user) {
    if (!user) return GRADES_LIST;
    const role = user.role;
    const userKey = user.key || role;

    // Directivos, Administradores y Modo Inducción ven todos los grados
    if (role === 'rectora' || role === 'induccion_rectora' || role === 'admin' || role === 'induccion') {
      return GRADES_LIST;
    }

    // Docente regular
    const accessibleGrades = GRADES_LIST.filter(grade => {
      // ¿Es director de curso de este grado?
      if (this.isGradeDirector(user, grade)) return true;

      // ¿Enseña alguna materia en este grado?
      const gradeSubjects = TEACHER_CURRICULUM_ASSIGNMENTS[grade];
      if (!gradeSubjects) return false;
      return Object.values(gradeSubjects).some(assign => assign.docente_id === userKey);
    });

    return accessibleGrades.length > 0 ? accessibleGrades : ['1° Primaria'];
  }

  /**
   * Devuelve las Materias disponibles para un Grado específico según el rol del usuario
   * REGLA CLAVE DIRECTOR DE CURSO:
   * - Si el docente es Director de Curso de este grado, ¡puede ver TODAS las materias del grado!
   * - Si NO es Director de Curso, solo ve las materias que enseña directamente.
   */
  getSubjectsForGradeAndUser(grade, user) {
    const gradeAssignments = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
    const allSubjectsInGrade = Object.keys(gradeAssignments);

    if (!user) return allSubjectsInGrade.length > 0 ? allSubjectsInGrade : ALL_SUBJECTS;
    const role = user.role;
    const userKey = user.key || role;

    // Directivos, Administradores y Modo Inducción ven todas las materias
    if (role === 'rectora' || role === 'induccion_rectora' || role === 'admin' || role === 'induccion') {
      return allSubjectsInGrade.length > 0 ? allSubjectsInGrade : ALL_SUBJECTS;
    }

    // Si es Director de Curso del grado: ve TODAS las materias de sus alumnos
    if (this.isGradeDirector(user, grade)) {
      return allSubjectsInGrade.length > 0 ? allSubjectsInGrade : ALL_SUBJECTS;
    }

    // Docente regular no director: solo las materias donde docente_id === userKey
    const teacherSubjects = allSubjectsInGrade.filter(subj => {
      return gradeAssignments[subj]?.docente_id === userKey;
    });

    return teacherSubjects.length > 0 ? teacherSubjects : (allSubjectsInGrade.slice(0, 1));
  }

  /**
   * Accede a la rama del árbol: Año -> Periodo -> Grado -> Materia
   */
  getBranch(year = '2026', period = '1° Periodo (25%)', grade = '1° Primaria', subject = 'Matemáticas') {
    if (!this.tree[year]) this.tree[year] = {};
    if (!this.tree[year][period]) this.tree[year][period] = {};
    if (!this.tree[year][period][grade]) this.tree[year][period][grade] = {};

    if (!this.tree[year][period][grade][subject]) {
      const teacherInfo = this.getTeacherAssignment(grade, subject);
      const initialRoster = createInitialRosterForBranch(grade, subject, period);

      this.tree[year][period][grade][subject] = {
        docente_id: teacherInfo.docente_id,
        teacherName: teacherInfo.teacherName,
        students: initialRoster,
        lastUpdated: new Date().toISOString()
      };
      this.persistTree();
    }

    return this.tree[year][period][grade][subject];
  }

  /**
   * Verifica si el usuario está en modo "Supervisión Director de Curso"
   * (Es director del grado, pero NO es el docente titular de esta materia específica)
   */
  isViewingAsGradeDirector(user, grade, subject) {
    if (!user) return false;
    if (user.role === 'rectora' || user.role === 'induccion_rectora' || user.role === 'admin' || user.role === 'induccion') {
      return false;
    }
    const isDirector = this.isGradeDirector(user, grade);
    if (!isDirector) return false;

    const teacherInfo = this.getTeacherAssignment(grade, subject);
    const userKey = user.key || user.role;
    return teacherInfo.docente_id !== userKey;
  }

  /**
   * Verifica si el usuario actual tiene permiso de editar notas numéricas
   * REGLA: Los directores de curso pueden VER todas las notas, pero NO modificarlas
   * (solo pueden modificar las materias que ellos mismos enseñan).
   */
  canEditScores(user, grade, subject) {
    if (!user) return false;
    // Directivos y admin: BLOQUEADO (Solo lectura institucional)
    if (user.role === 'rectora' || user.role === 'induccion_rectora' || user.role === 'admin') {
      return false;
    }
    // Docente inducción: permitido para demos
    if (user.role === 'induccion') {
      return true;
    }
    // Docente titular asignado a la materia
    const teacherInfo = this.getTeacherAssignment(grade, subject);
    const userKey = user.key || user.role;
    return teacherInfo.docente_id === userKey;
  }

  canEditTeacherFeedback(user, grade, subject) {
    return this.canEditScores(user, grade, subject);
  }

  canEditDirectiveSuggestion(user) {
    if (!user) return false;
    return user.role === 'rectora' || user.role === 'induccion_rectora';
  }

  canEditAdminAudit(user) {
    if (!user) return false;
    return user.role === 'admin';
  }

  saveBranchStudents(year, period, grade, subject, students, user) {
    const branch = this.getBranch(year, period, grade, subject);
    branch.students = students;
    branch.lastUpdated = new Date().toISOString();
    branch.lastUpdatedBy = user?.name || 'Sistema';
    this.persistTree();
    return branch;
  }

  updateStudentRecord(year, period, grade, subject, studentId, changes, user) {
    const branch = this.getBranch(year, period, grade, subject);
    const canScores = this.canEditScores(user, grade, subject);
    const canDirective = this.canEditDirectiveSuggestion(user);
    const canFeedback = this.canEditTeacherFeedback(user, grade, subject);
    const canAdmin = this.canEditAdminAudit(user);

    branch.students = branch.students.map(st => {
      if (st.id !== studentId) return st;

      const updated = { ...st };

      if (canScores) {
        if ('c1' in changes) updated.c1 = changes.c1;
        if ('c2' in changes) updated.c2 = changes.c2;
        if ('c3' in changes) updated.c3 = changes.c3;
      }

      if (canFeedback && 'retroalimentacionDocente' in changes) {
        updated.retroalimentacionDocente = changes.retroalimentacionDocente;
      }

      if (canDirective && 'sugerenciaDirectiva' in changes) {
        updated.sugerenciaDirectiva = changes.sugerenciaDirectiva;
      }

      if (canAdmin && 'comentarioAuditoria' in changes) {
        updated.comentarioAuditoria = changes.comentarioAuditoria;
      }

      return updated;
    });

    branch.lastUpdated = new Date().toISOString();
    branch.lastUpdatedBy = user?.name || 'Sistema';
    this.persistTree();
    return branch;
  }
}

export const gradesService = new GradesService();
export default gradesService;
