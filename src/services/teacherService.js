import { USERS, saveUserOverride, resetAllUserOverrides } from '../data/users.js';
import { 
  GRADES_LIST, 
  ALL_SUBJECTS, 
  GRADE_DIRECTORS, 
  TEACHER_CURRICULUM_ASSIGNMENTS,
  ACADEMIC_YEARS,
  ACADEMIC_PERIODS
} from '../data/gradesTreeData.js';
import gradesService from './gradesService.js';

const TEACHER_AUDIT_LOG_KEY = 'gmg_teacher_management_audit_v1';

class TeacherService {
  constructor() {
    this.auditLogs = this.loadAuditLogs();
  }

  loadAuditLogs() {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(TEACHER_AUDIT_LOG_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Error al cargar logs de auditoría docente:', e);
      return [];
    }
  }

  persistAuditLogs() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TEACHER_AUDIT_LOG_KEY, JSON.stringify(this.auditLogs));
    } catch (e) {
      console.error('Error al guardar logs de auditoría docente:', e);
    }
  }

  addAuditLog(action, details, author) {
    const entry = {
      id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      author: author?.name || author?.role || 'Directivo',
      authorRole: author?.role || 'admin'
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 100) this.auditLogs.pop();
    this.persistAuditLogs();
    return entry;
  }

  getAuditLogs() {
    return this.auditLogs;
  }

  notifyUpdates() {
    if (typeof window !== 'undefined') {
      const now = new Date().toISOString();
      window.dispatchEvent(new CustomEvent('gmg_teachers_updated', { detail: { timestamp: now } }));
      window.dispatchEvent(new CustomEvent('gmg_curriculum_updated', { detail: { timestamp: now } }));
      window.dispatchEvent(new CustomEvent('gmg_evaluaciones_updated', { detail: { timestamp: now } }));
    }
  }

  subscribe(callback) {
    if (typeof window === 'undefined') return () => {};
    const handler = (e) => callback(e);
    window.addEventListener('gmg_teachers_updated', handler);
    window.addEventListener('gmg_curriculum_updated', handler);
    return () => {
      window.removeEventListener('gmg_teachers_updated', handler);
      window.removeEventListener('gmg_curriculum_updated', handler);
    };
  }

  // =========================================================================
  // 1. GESTIÓN DE PLANTA DOCENTE (PERFILES)
  // =========================================================================

  getTeachers() {
    const teacherOrder = ['profe1', 'jessica', 'yuri', 'profe2', 'elcy', 'profe3'];
    const teachers = Object.entries(USERS)
      .filter(([key, u]) => u.role === 'docente' || key.startsWith('profe') || ['jessica', 'yuri', 'elcy'].includes(key))
      .map(([key, u]) => {
        // Encontrar grado donde es director(a)
        const directedGrade = GRADES_LIST.find(g => {
          const dir = gradesService.getGradeDirector(g);
          return dir.docente_id === key;
        }) || null;

        return {
          key,
          name: u.name,
          role: u.role,
          label: u.label,
          initial: u.initial,
          avatar: u.avatar,
          status: u.status || 'activa',
          directedGrade,
          pass: u.pass
        };
      });

    return teachers.sort((a, b) => {
      const idxA = teacherOrder.indexOf(a.key);
      const idxB = teacherOrder.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  getTeacher(key) {
    return USERS[key] || null;
  }

  updateTeacherProfile(key, { name, label, status }, adminUser) {
    if (!key || !USERS[key]) {
      throw new Error(`Docente no encontrado con clave: ${key}`);
    }

    const prevName = USERS[key].name;
    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (label && label.trim()) updates.label = label.trim();
    if (status) updates.status = status;

    saveUserOverride(key, updates);

    // Si el nombre cambió, actualizar en directores, asignaciones y árbol relacional SIEE
    if (updates.name && updates.name !== prevName) {
      const newName = updates.name;
      GRADES_LIST.forEach(grade => {
        const dir = gradesService.getGradeDirector(grade);
        if (dir.docente_id === key) {
          gradesService.customDirectors[grade] = {
            ...dir,
            teacherName: newName
          };
        }
        const subjects = gradesService.getSubjectsForGrade(grade);
        subjects.forEach(subj => {
          const assign = gradesService.getTeacherAssignment(grade, subj);
          if (assign.docente_id === key) {
            if (!gradesService.customAssignments[grade]) gradesService.customAssignments[grade] = {};
            gradesService.customAssignments[grade][subj] = {
              ...assign,
              teacherName: newName
            };
          }
        });
      });
      gradesService.persistCustomState();

      // Sincronizar en el árbol relacional completo de planillas SIEE
      const now = new Date().toISOString();
      ACADEMIC_YEARS.forEach(y => {
        ACADEMIC_PERIODS.forEach(p => {
          GRADES_LIST.forEach(grade => {
            const subjects = gradesService.getSubjectsForGrade(grade);
            subjects.forEach(subj => {
              if (gradesService.tree[y]?.[p]?.[grade]?.[subj]?.docente_id === key) {
                gradesService.tree[y][p][grade][subj].teacherName = newName;
                gradesService.tree[y][p][grade][subj].lastUpdated = now;
              }
            });
          });
        });
      });
      gradesService.persistTree();
    }

    this.addAuditLog(
      'Actualización de Perfil Docente',
      `Se modificó el perfil de ${prevName}: ${JSON.stringify(updates)}`,
      adminUser
    );

    this.notifyUpdates();
    return { success: true, teacher: USERS[key] };
  }

  // =========================================================================
  // 2. GESTIÓN DE DIRECTORES DE CURSO
  // =========================================================================

  getGradeDirectorsMap() {
    const map = {};
    GRADES_LIST.forEach(grade => {
      map[grade] = gradesService.getGradeDirector(grade);
    });
    return map;
  }

  setGradeDirector(grade, newDocenteKey, { linkDirectorSubjects = true, adminUser } = {}) {
    if (!GRADES_LIST.includes(grade)) {
      throw new Error(`Grado inválido: ${grade}`);
    }
    const newTeacher = USERS[newDocenteKey];
    if (!newTeacher) {
      throw new Error(`Docente no encontrado: ${newDocenteKey}`);
    }

    const currentDirector = gradesService.getGradeDirector(grade);
    const now = new Date().toISOString();

    // Guardar nuevo director
    gradesService.customDirectors[grade] = {
      docente_id: newDocenteKey,
      teacherName: newTeacher.name,
      replacedFrom: currentDirector.docente_id,
      replacedFromName: currentDirector.teacherName,
      updatedAt: now
    };

    // Vincular automáticamente materias formativas a la nueva Directora de Curso
    const affectedSubjects = [];
    if (linkDirectorSubjects) {
      const gradeSubjects = gradesService.getSubjectsForGrade(grade);
      gradeSubjects.forEach(subj => {
        if (gradesService.isDirectorCourseSubject(subj) || subj === 'Ética & Valores') {
          if (!gradesService.customAssignments[grade]) {
            gradesService.customAssignments[grade] = {};
          }
          gradesService.customAssignments[grade][subj] = {
            docente_id: newDocenteKey,
            teacherName: newTeacher.name,
            updatedAt: now
          };
          affectedSubjects.push(subj);

          // Actualizar árbol relacional
          ACADEMIC_YEARS.forEach(y => {
            ACADEMIC_PERIODS.forEach(p => {
              if (gradesService.tree[y]?.[p]?.[grade]?.[subj]) {
                gradesService.tree[y][p][grade][subj].docente_id = newDocenteKey;
                gradesService.tree[y][p][grade][subj].teacherName = newTeacher.name;
                gradesService.tree[y][p][grade][subj].lastUpdated = now;
                gradesService.tree[y][p][grade][subj].lastUpdatedBy = `Gestión Docente: ${adminUser?.name || 'Dirección'}`;
              }
            });
          });
        }
      });
    }

    gradesService.persistCustomState();
    gradesService.persistTree();

    this.addAuditLog(
      'Cambio de Directora de Curso',
      `${grade}: Asignada a ${newTeacher.name} (anterior: ${currentDirector.teacherName}). Materias vinculadas: ${affectedSubjects.join(', ') || 'Ninguna'}`,
      adminUser
    );

    this.notifyUpdates();
    return {
      success: true,
      grade,
      newDirector: gradesService.customDirectors[grade],
      affectedSubjects
    };
  }

  // =========================================================================
  // 3. GESTIÓN DE MALLA CURRICULAR Y MATERIAS
  // =========================================================================

  getCurriculumMatrix() {
    return gradesService.getCurriculumMatrix();
  }

  setSubjectTeacher(grade, subject, newDocenteKey, adminUser) {
    if (!GRADES_LIST.includes(grade)) throw new Error(`Grado inválido: ${grade}`);
    const newTeacher = USERS[newDocenteKey];
    if (!newTeacher) throw new Error(`Docente inválido: ${newDocenteKey}`);

    const current = gradesService.getTeacherAssignment(grade, subject);
    const now = new Date().toISOString();

    if (!gradesService.customAssignments[grade]) {
      gradesService.customAssignments[grade] = {};
    }

    gradesService.customAssignments[grade][subject] = {
      docente_id: newDocenteKey,
      teacherName: newTeacher.name,
      previousDocenteKey: current.docente_id,
      previousTeacherName: current.teacherName,
      updatedAt: now
    };

    // Actualizar en el árbol relacional para sincronización inmediata de planillas
    ACADEMIC_YEARS.forEach(y => {
      ACADEMIC_PERIODS.forEach(p => {
        if (gradesService.tree[y]?.[p]?.[grade]?.[subject]) {
          gradesService.tree[y][p][grade][subject].docente_id = newDocenteKey;
          gradesService.tree[y][p][grade][subject].teacherName = newTeacher.name;
          gradesService.tree[y][p][grade][subject].lastUpdated = now;
          gradesService.tree[y][p][grade][subject].lastUpdatedBy = `Gestión Docente: ${adminUser?.name || 'Dirección'}`;
        }
      });
    });

    gradesService.persistCustomState();
    gradesService.persistTree();

    this.addAuditLog(
      'Asignación de Materia',
      `${grade} • ${subject}: Asignada a ${newTeacher.name} (anterior: ${current.teacherName})`,
      adminUser
    );

    this.notifyUpdates();
    return { success: true, assignment: gradesService.customAssignments[grade][subject] };
  }

  setSubjectAcrossGrades(subject, newDocenteKey, targetGrades = null, adminUser) {
    const grades = targetGrades || GRADES_LIST;
    const newTeacher = USERS[newDocenteKey];
    if (!newTeacher) throw new Error(`Docente inválido: ${newDocenteKey}`);

    grades.forEach(grade => {
      const gradeSubjects = gradesService.getSubjectsForGrade(grade);
      if (gradeSubjects.includes(subject)) {
        this.setSubjectTeacher(grade, subject, newDocenteKey, adminUser);
      }
    });

    this.addAuditLog(
      'Asignación Masiva de Asignatura',
      `Asignatura ${subject} asignada a ${newTeacher.name} en: ${grades.join(', ')}`,
      adminUser
    );

    this.notifyUpdates();
    return { success: true };
  }

  // =========================================================================
  // 4. PRESETS INSTITUCIONALES INTELIGENTES (1-CLIC)
  // =========================================================================

  applyGaleanoOfficialPreset(adminUser) {
    const now = new Date().toISOString();

    // 1. Asignar Directores Oficiales
    const officialDirectors = {
      'Transición': 'profe1',
      '1° Primaria': 'jessica',
      '2° Primaria': 'yuri',
      '3° Primaria': 'profe2',
      '4° Primaria': 'elcy',
      '5° Primaria': 'profe3'
    };

    Object.entries(officialDirectors).forEach(([grade, docKey]) => {
      const teacher = USERS[docKey] || { name: docKey };
      gradesService.customDirectors[grade] = {
        docente_id: docKey,
        teacherName: teacher.name,
        updatedAt: now
      };
    });

    // 2. Asignar Materias Curriculares
    if (!gradesService.customAssignments) gradesService.customAssignments = {};

    GRADES_LIST.forEach(grade => {
      if (!gradesService.customAssignments[grade]) gradesService.customAssignments[grade] = {};
      const dirKey = officialDirectors[grade];
      const dirTeacher = USERS[dirKey] || { name: dirKey };

      const isTransicion = grade === 'Transición';

      const assignments = {
        // Reglas de Usuario:
        'Lengua Castellana': { docente_id: 'jessica', teacherName: USERS.jessica.name },
        'Inglés': { docente_id: 'elcy', teacherName: USERS.elcy.name },
        'Ciencias Sociales': { docente_id: 'yuri', teacherName: USERS.yuri.name },
        'Ciencias Naturales': { docente_id: 'yuri', teacherName: USERS.yuri.name },
        'Matemáticas': isTransicion 
          ? { docente_id: 'profe1', teacherName: USERS.profe1.name }
          : { docente_id: 'profe2', teacherName: USERS.profe2.name },
        // Materias formativas vinculadas a Directora de Curso:
        'Educación Artística': { docente_id: dirKey, teacherName: dirTeacher.name },
        'Religión': { docente_id: dirKey, teacherName: dirTeacher.name },
        'Educación Física': { docente_id: dirKey, teacherName: dirTeacher.name },
        'Ética & Valores': { docente_id: dirKey, teacherName: dirTeacher.name }
      };

      Object.entries(assignments).forEach(([subj, assign]) => {
        gradesService.customAssignments[grade][subj] = {
          ...assign,
          updatedAt: now
        };

        // Sincronizar árbol
        ACADEMIC_YEARS.forEach(y => {
          ACADEMIC_PERIODS.forEach(p => {
            if (gradesService.tree[y]?.[p]?.[grade]?.[subj]) {
              gradesService.tree[y][p][grade][subj].docente_id = assign.docente_id;
              gradesService.tree[y][p][grade][subj].teacherName = assign.teacherName;
              gradesService.tree[y][p][grade][subj].lastUpdated = now;
              gradesService.tree[y][p][grade][subj].lastUpdatedBy = `Preset Galeano 2026: ${adminUser?.name || 'Dirección'}`;
            }
          });
        });
      });
    });

    // 3. Actualizar Etiquetas de Perfil
    saveUserOverride('elcy', { label: 'Docente de Inglés • Dir. 4° Primaria' });
    saveUserOverride('jessica', { label: 'Docente de Español • Dir. 1° Primaria' });
    saveUserOverride('yuri', { label: 'Docente de Ciencias (Naturales & Sociales) • Dir. 2° Primaria' });
    saveUserOverride('profe2', { label: 'Docente de Matemáticas • Dir. 3° Primaria' });
    saveUserOverride('profe1', { label: 'Docente • Dir. Transición' });
    saveUserOverride('profe3', { label: 'Docente • Dir. 5° Primaria' });

    gradesService.persistCustomState();
    gradesService.persistTree();

    this.addAuditLog(
      'Aplicación de Preset Institucional Galeano 2026',
      'Configuración integral: Elcy (Inglés), Jessica (Español), Yuri (Ciencias Nat. y Soc.), Profe 2 (Matemáticas) y Directoras para Formativas (Artes, Religión, Ed. Física, Ética).',
      adminUser
    );

    this.notifyUpdates();
    return { success: true };
  }

  applyDirectorSubjectsRule(adminUser) {
    const now = new Date().toISOString();
    let count = 0;

    GRADES_LIST.forEach(grade => {
      const director = gradesService.getGradeDirector(grade);
      const gradeSubjects = gradesService.getSubjectsForGrade(grade);

      gradeSubjects.forEach(subj => {
        if (gradesService.isDirectorCourseSubject(subj) || subj === 'Ética & Valores') {
          if (!gradesService.customAssignments[grade]) gradesService.customAssignments[grade] = {};
          gradesService.customAssignments[grade][subj] = {
            docente_id: director.docente_id,
            teacherName: director.teacherName,
            updatedAt: now
          };
          count++;

          // Sincronizar en árbol
          ACADEMIC_YEARS.forEach(y => {
            ACADEMIC_PERIODS.forEach(p => {
              if (gradesService.tree[y]?.[p]?.[grade]?.[subj]) {
                gradesService.tree[y][p][grade][subj].docente_id = director.docente_id;
                gradesService.tree[y][p][grade][subj].teacherName = director.teacherName;
                gradesService.tree[y][p][grade][subj].lastUpdated = now;
              }
            });
          });
        }
      });
    });

    gradesService.persistCustomState();
    gradesService.persistTree();

    this.addAuditLog(
      'Vinculación de Asignaturas Formativas a Directoras',
      `Se vincularon ${count} materias formativas (Artes, Religión, Educación Física, Ética) a sus respectivas Directoras de Curso`,
      adminUser
    );

    this.notifyUpdates();
    return { success: true, count };
  }

  resetToFactoryDefaults(adminUser) {
    gradesService.customAssignments = {};
    gradesService.customDirectors = {};
    resetAllUserOverrides();

    gradesService.persistCustomState();
    gradesService.persistTree();

    this.addAuditLog(
      'Restablecimiento de Fábrica',
      'Se eliminaron todas las sobreescrituras personalizadas curriculares y de usuarios, restaurando las definiciones originales del sistema.',
      adminUser
    );

    this.notifyUpdates();
    return { success: true };
  }

  // =========================================================================
  // 5. MÉTODOS REACTIVOS PARA OTRAS VISTAS (LOGIN, SIDEBARS, ETC.)
  // =========================================================================

  getStaffMembersForLogin() {
    return [
      { key: 'claudia', name: USERS.claudia?.name || 'Claudia (Rectora)', roleTitle: 'Rectora', grade: 'Rectoría Institucional', status: USERS.claudia?.status || 'activa' },
      { key: 'coordinacion', name: USERS.coordinacion?.name || 'Coordinación Académica', roleTitle: 'Coordinación', grade: 'Supervisión Institucional', status: USERS.coordinacion?.status || 'activa' },
      ...this.getTeachers().map(t => {
        const dirGrade = t.directedGrade ? `Dir. ${t.directedGrade}` : 'Docente';
        return {
          key: t.key,
          name: t.name,
          roleTitle: t.label ? t.label.split('•')[0].trim() : 'Docente',
          grade: dirGrade,
          status: t.status || 'activa'
        };
      })
    ];
  }

  getLoginSelectOptions() {
    return [
      { key: 'induccion_rectora', label: '👑 Inducción Rectora' },
      { key: 'induccion', label: '✨ Inducción Profesoras' },
      { key: 'claudia', label: `${USERS.claudia?.name || 'Claudia'} (Rectora Institucional)` },
      { key: 'coordinacion', label: 'Coordinación Académica' },
      ...this.getTeachers().map(t => ({
        key: t.key,
        label: `${t.name} (${t.label || 'Docente'})`
      })),
      { key: 'admin', label: 'Administrador General' }
    ];
  }

  getSidebarTeachers() {
    const list = this.getTeachers().map(t => ({
      key: t.key,
      name: t.name,
      label: t.label || `Dir. ${t.directedGrade || 'Curso'}`,
      grade: t.directedGrade || '1° Primaria',
      status: t.status || 'activa',
      icon: 'ph-user'
    }));

    list.push({
      key: 'claudia',
      name: USERS.claudia?.name || 'Claudia (Rectora)',
      label: 'Rectoría',
      status: USERS.claudia?.status || 'activa',
      isRectora: true
    });

    return list;
  }
}

export const teacherService = new TeacherService();
export default teacherService;
