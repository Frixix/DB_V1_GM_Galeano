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
import { USERS } from '../data/users';

const GRADES_STORAGE_KEY = 'gmg_grades_tree_v1';
const ASSIGNMENTS_CUSTOM_KEY = 'gmg_curriculum_assignments_custom';
const DIRECTORS_CUSTOM_KEY = 'gmg_grade_directors_custom';
const REPLACEMENTS_LOG_KEY = 'gmg_curriculum_reemplazos_history';
const CALENDAR_STORAGE_KEY = 'gmg_evaluation_calendar_v1';
const EXTENSIONS_STORAGE_KEY = 'gmg_extemporary_extensions_v1';
const CURRICULUM_ROLES_VERSION = 'v2_roles_elcy_jessica_yuri_2026';

const DEFAULT_EVALUATION_CALENDAR = {
  '1° Periodo (25%)': {
    startDate: '2026-02-02',
    endDate: '2026-04-10',
    closureDate: '2026-04-17',
    status: 'abierto',
    description: 'Evaluaciones ordinarias Primer Periodo Lectivo'
  },
  '2° Periodo (25%)': {
    startDate: '2026-04-13',
    endDate: '2026-06-19',
    closureDate: '2026-06-26',
    status: 'programado',
    description: 'Evaluaciones ordinarias Segundo Periodo Lectivo'
  },
  '3° Periodo (25%)': {
    startDate: '2026-07-13',
    endDate: '2026-09-18',
    closureDate: '2026-09-25',
    status: 'programado',
    description: 'Evaluaciones ordinarias Tercer Periodo Lectivo'
  },
  '4° Periodo (25%)': {
    startDate: '2026-09-21',
    endDate: '2026-11-20',
    closureDate: '2026-11-27',
    status: 'programado',
    description: 'Evaluaciones finales y comisiones de promoción'
  }
};

/**
 * Servicio Centralizado para la Jerarquía de Datos Relacional (RBAC) de Calificaciones
 * Incluye:
 * - Directores de curso oficiales por grado.
 * - Solo lectura para directores en materias ajenas.
 * - Soporte para rol Coordinación (auditoría global, observacion_coordinacion, fechas y prórrogas).
 * - Transferencia inmediata de planillas de estudiantes al nuevo docente nombrado.
 */

class GradesService {
  constructor() {
    this.checkVersionAndMigrate();
    this.tree = this.loadTreeFromStorage();
    this.customAssignments = this.loadFromStorage(ASSIGNMENTS_CUSTOM_KEY, {});
    this.customDirectors = this.loadFromStorage(DIRECTORS_CUSTOM_KEY, {});
    this.replacementLogs = this.loadFromStorage(REPLACEMENTS_LOG_KEY, []);
    this.evaluationCalendar = this.loadFromStorage(CALENDAR_STORAGE_KEY, DEFAULT_EVALUATION_CALENDAR);
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
    try {
      localStorage.setItem(GRADES_STORAGE_KEY, JSON.stringify(this.tree));
    } catch (e) {
      console.error('Error al persistir árbol de calificaciones:', e);
    }
  }

  persistCustomState() {
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
   * - Rectora / Admin: Todos los grados
   * - Docente: Su grado de dirección de curso y todos los grados donde dicta materias oficiales
   */
  getGradesForUser(user) {
    if (!user) return GRADES_LIST;
    const role = user.role;
    const userKey = user.key || role;

    // Directivos, Administradores, Coordinador y Modo Inducción ven todos los grados
    if (role === 'rectora' || role === 'induccion_rectora' || role === 'admin' || role === 'induccion' || role === 'coordinador') {
      return GRADES_LIST;
    }

    // Para docente: su grado de dirección de curso Y todos los grados donde dicta materias
    const accessibleGrades = GRADES_LIST.filter(grade => {
      if (this.isGradeDirector(user, grade)) return true;
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
   * - Rectora / Admin: Todas las materias del grado
   * - Directora de Curso del grado: Todas las materias del grado (propias editables, ajenas en acompañamiento)
   * - Docente visitante: Únicamente las materias que tiene a su cargo en este grado
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

    // Si es Directora de Curso del grado, puede ver todas las materias del grado para acompañamiento pedagógico
    if (this.isGradeDirector(user, grade)) {
      return allSubjectsInGrade;
    }

    // Para docentes no directoras del grado: solo ven las materias que tienen a cargo
    const teacherSubjects = allSubjectsInGrade.filter(subj => {
      const assignment = this.getTeacherAssignment(grade, subj);
      return assignment.docente_id === userKey || assignment.teacherName === user.name;
    });

    return teacherSubjects.length > 0 ? teacherSubjects : (allSubjectsInGrade.slice(0, 1));
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
    const subjects = this.getSubjectsForGrade(grade);
    const studentsBase = STUDENTS_BY_GRADE[grade] || STUDENTS_BY_GRADE['1° Primaria'] || [];
    
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
        const studentRecord = branch?.students?.find(s => s.id === st.id);
        if (studentRecord) {
          const c1 = Number(studentRecord.c1) || 0;
          const c2 = Number(studentRecord.c2) || 0;
          const c3 = Number(studentRecord.c3) || 0;
          const defNum = Number(((c1 * 0.4) + (c2 * 0.4) + (c3 * 0.2)).toFixed(1));
          subjectGrades[subj] = defNum;
          totalSum += defNum;
          subjectsCount += 1;
          if (defNum < 3.0) {
            failedCount += 1;
          }
        } else {
          subjectGrades[subj] = 0;
        }
      });

      const average = subjectsCount > 0 ? Number((totalSum / subjectsCount).toFixed(2)) : 0;

      return {
        id: st.id,
        name: st.name,
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
   * Accede a la rama del árbol: Año -> Periodo -> Grado -> Materia
   */
  getBranch(year = '2026', period = '1° Periodo (25%)', grade = '1° Primaria', subject = 'Matemáticas') {
    if (!this.tree[year]) this.tree[year] = {};
    if (!this.tree[year][period]) this.tree[year][period] = {};
    if (!this.tree[year][period][grade]) this.tree[year][period][grade] = {};

    const teacherInfo = this.getTeacherAssignment(grade, subject);

    if (!this.tree[year][period][grade][subject]) {
      const initialRoster = createInitialRosterForBranch(grade, subject, period);

      this.tree[year][period][grade][subject] = {
        docente_id: teacherInfo.docente_id,
        teacherName: teacherInfo.teacherName,
        students: initialRoster,
        lastUpdated: new Date().toISOString()
      };
      this.persistTree();
    } else {
      // Sincronizar docente asignado si hubo reemplazo administrativo
      if (this.tree[year][period][grade][subject].docente_id !== teacherInfo.docente_id) {
        this.tree[year][period][grade][subject].docente_id = teacherInfo.docente_id;
        this.tree[year][period][grade][subject].teacherName = teacherInfo.teacherName;
        this.persistTree();
      }
    }

    return this.tree[year][period][grade][subject];
  }

  isViewingAsGradeDirector(user, grade, subject) {
    if (!user) return false;
    if (user.role === 'rectora' || user.role === 'induccion_rectora' || user.role === 'admin' || user.role === 'induccion' || user.role === 'coordinador') {
      return false;
    }
    const isDirector = this.isGradeDirector(user, grade);
    if (!isDirector) return false;

    const teacherInfo = this.getTeacherAssignment(grade, subject);
    const userKey = user.key || user.role;
    return teacherInfo.docente_id !== userKey;
  }

  canEditScores(user, grade, subject) {
    if (!user) return false;
    // Blindaje estricto: Rectoría, Admin y Coordinación NO pueden editar notas numéricas de docentes
    if (user.role === 'rectora' || user.role === 'induccion_rectora' || user.role === 'admin' || user.role === 'coordinador') {
      return false;
    }
    if (user.role === 'induccion') {
      return true;
    }
    const teacherInfo = this.getTeacherAssignment(grade, subject);
    const userKey = user.key || user.role;
    return teacherInfo.docente_id === userKey || teacherInfo.teacherName === user.name;
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

  /**
   * Permiso de edición en campo exclusivo: observacion_coordinacion
   * Exclusivo para Coordinación y Administrador General
   */
  canEditCoordinacionObservation(user) {
    if (!user) return false;
    return user.role === 'coordinador' || user.role === 'admin';
  }

  /**
   * Permiso para gestión del calendario de evaluaciones y habilitación de prórrogas extemporáneas
   */
  canManageCalendarAndDeadlines(user) {
    if (!user) return false;
    return user.role === 'coordinador' || user.role === 'admin';
  }

  // =====================================================================
  // GESTIÓN DE FECHAS, CIERRES Y PRÓRROGAS EXTEMPORÁNEAS (COORDINACIÓN)
  // =====================================================================

  getEvaluationCalendar() {
    return this.evaluationCalendar;
  }

  updateEvaluationPeriod(period, updateData, user) {
    if (!this.canManageCalendarAndDeadlines(user)) {
      throw new Error('No tiene autorización para modificar el calendario de evaluaciones.');
    }
    if (!this.evaluationCalendar[period]) {
      this.evaluationCalendar[period] = {};
    }
    this.evaluationCalendar[period] = {
      ...this.evaluationCalendar[period],
      ...updateData,
      lastModifiedBy: user?.name || 'Coordinación',
      lastModifiedAt: new Date().toISOString()
    };
    this.persistCustomState();
    this.notifyCurriculumUpdate();
    return this.evaluationCalendar[period];
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

  saveBranchStudents(year, period, grade, subject, students, user) {
    const branch = this.getBranch(year, period, grade, subject);
    branch.students = students.map(student => ({
      ...student,
      observacion_coordinacion: student.observacion_coordinacion || student.observacionCoordinacion || null,
      observacionCoordinacion: student.observacion_coordinacion || student.observacionCoordinacion || null,
    }));
    branch.lastUpdated = new Date().toISOString();
    branch.lastUpdatedBy = user?.name || 'Sistema';
    this.persistTree();
    return branch;
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
