import { 
  ACADEMIC_YEARS, 
  ACADEMIC_PERIODS, 
  GRADES_LIST, 
  ALL_SUBJECTS, 
  STUDENTS_BY_GRADE, 
  TEACHER_CURRICULUM_ASSIGNMENTS, 
  createInitialRosterForBranch 
} from '../data/gradesTreeData';

const GRADES_STORAGE_KEY = 'gmg_grades_tree_v1';

/**
 * Servicio Centralizado para la Jerarquía de Datos Relacional (RBAC) de Calificaciones
 * 
 * Estructura del Árbol:
 * Año Lectivo (2026)
 * └── Periodo (1°, 2°, 3°, 4°)
 *     └── Grado (Transición, 1°, 2°, 3°, 4°, 5°)
 *         └── Materia / Asignatura (Español, Matemáticas, etc.)
 *             ├── Asignación Docente (docente_id: 'jessica')
 *             └── Lista de Estudiantes
 *                 └── Registro de Calificación:
 *                     ├── Nota Numérica (Editable solo por docente_id asignado)
 *                     ├── Retroalimentación Docente (Editable solo por docente_id)
 *                     └── Sugerencia Directiva (Editable solo por rol: rectora)
 */

class GradesService {
  constructor() {
    this.tree = this.loadTreeFromStorage();
  }

  /**
   * Carga el árbol desde localStorage o lo inicializa vacío
   */
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

  /**
   * Guarda el estado del árbol en localStorage
   */
  persistTree() {
    try {
      localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(this.tree));
    } catch (e) {
      console.error('Error al persistir árbol de calificaciones:', e);
    }
  }

  /**
   * Obtiene la asignación docente de una materia en un grado
   */
  getTeacherAssignment(grade, subject) {
    if (TEACHER_CURRICULUM_ASSIGNMENTS[grade] && TEACHER_CURRICULUM_ASSIGNMENTS[grade][subject]) {
      return TEACHER_CURRICULUM_ASSIGNMENTS[grade][subject];
    }
    // Fallback razonable
    return { docente_id: 'jessica', teacherName: 'Jessica' };
  }

  /**
   * Devuelve los Años Lectivos disponibles
   */
  getAcademicYears() {
    return ACADEMIC_YEARS;
  }

  /**
   * Devuelve los Períodos Lectivos disponibles
   */
  getAcademicPeriods() {
    return ACADEMIC_PERIODS;
  }

  /**
   * Devuelve los Grados a los que tiene acceso el usuario según su rol RBAC
   */
  getGradesForUser(user) {
    if (!user) return GRADES_LIST;
    const role = user.role;
    const userKey = user.key || role;

    // Directivos y Administradores ven todos los grados
    if (role === 'rectora' || role === 'induccion_rectora' || role === 'admin') {
      return GRADES_LIST;
    }

    // Docente en modo inducción ve todos los grados para prueba
    if (role === 'induccion') {
      return GRADES_LIST;
    }

    // Docente regular: solo grados donde tiene al menos una materia asignada
    const assignedGrades = GRADES_LIST.filter(grade => {
      const gradeSubjects = TEACHER_CURRICULUM_ASSIGNMENTS[grade];
      if (!gradeSubjects) return false;
      return Object.values(gradeSubjects).some(assign => assign.docente_id === userKey);
    });

    return assignedGrades.length > 0 ? assignedGrades : ['1° Primaria'];
  }

  /**
   * Devuelve las Materias disponibles para un Grado específico según el rol del usuario
   */
  getSubjectsForGradeAndUser(grade, user) {
    const gradeAssignments = TEACHER_CURRICULUM_ASSIGNMENTS[grade] || {};
    const allSubjectsInGrade = Object.keys(gradeAssignments);

    if (!user) return allSubjectsInGrade.length > 0 ? allSubjectsInGrade : ALL_SUBJECTS;
    const role = user.role;
    const userKey = user.key || role;

    // Directivos y Administradores ven todas las materias del grado
    if (role === 'rectora' || role === 'induccion_rectora' || role === 'admin' || role === 'induccion') {
      return allSubjectsInGrade.length > 0 ? allSubjectsInGrade : ALL_SUBJECTS;
    }

    // Docente regular: solo las materias donde docente_id === userKey
    const teacherSubjects = allSubjectsInGrade.filter(subj => {
      return gradeAssignments[subj]?.docente_id === userKey;
    });

    return teacherSubjects.length > 0 ? teacherSubjects : (allSubjectsInGrade.slice(0, 1));
  }

  /**
   * Accede a la rama del árbol: Año -> Periodo -> Grado -> Materia
   * Si la rama no existe aún, la genera a partir de la nómina oficial
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
   * Verifica si el usuario actual tiene permiso de editar notas numéricas
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

  /**
   * Verifica si el usuario actual puede editar retroalimentación pedagógica
   */
  canEditTeacherFeedback(user, grade, subject) {
    return this.canEditScores(user, grade, subject);
  }

  /**
   * Verifica si el usuario actual puede editar sugerencias directivas
   */
  canEditDirectiveSuggestion(user) {
    if (!user) return false;
    return user.role === 'rectora' || user.role === 'induccion_rectora';
  }

  /**
   * Verifica si el usuario actual puede agregar notas de auditoría técnica
   */
  canEditAdminAudit(user) {
    if (!user) return false;
    return user.role === 'admin';
  }

  /**
   * Guarda o actualiza la lista completa de estudiantes en la rama
   */
  saveBranchStudents(year, period, grade, subject, students, user) {
    const branch = this.getBranch(year, period, grade, subject);
    branch.students = students;
    branch.lastUpdated = new Date().toISOString();
    branch.lastUpdatedBy = user?.name || 'Sistema';
    this.persistTree();
    return branch;
  }

  /**
   * Actualiza el registro de un estudiante individual respetando RBAC
   */
  updateStudentRecord(year, period, grade, subject, studentId, changes, user) {
    const branch = this.getBranch(year, period, grade, subject);
    const canScores = this.canEditScores(user, grade, subject);
    const canDirective = this.canEditDirectiveSuggestion(user);
    const canFeedback = this.canEditTeacherFeedback(user, grade, subject);
    const canAdmin = this.canEditAdminAudit(user);

    branch.students = branch.students.map(st => {
      if (st.id !== studentId) return st;

      const updated = { ...st };

      // Actualizar notas numéricas solo si tiene permiso docente
      if (canScores) {
        if ('c1' in changes) updated.c1 = changes.c1;
        if ('c2' in changes) updated.c2 = changes.c2;
        if ('c3' in changes) updated.c3 = changes.c3;
      }

      // Actualizar retroalimentación docente
      if (canFeedback && 'retroalimentacionDocente' in changes) {
        updated.retroalimentacionDocente = changes.retroalimentacionDocente;
      }

      // Actualizar sugerencia directiva
      if (canDirective && 'sugerenciaDirectiva' in changes) {
        updated.sugerenciaDirectiva = changes.sugerenciaDirectiva;
      }

      // Actualizar auditoría administrativa
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
