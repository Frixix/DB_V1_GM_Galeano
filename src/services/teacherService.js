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
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const TEACHER_AUDIT_LOG_KEY = 'gmg_teacher_management_audit_v1';

class TeacherService {
  constructor() {
    this.auditLogs = this.loadAuditLogs();
    this.realtimeChannel = null;

    if (typeof window !== 'undefined') {
      this.initRemoteSync();
    }
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

    // Sincronizar log en Supabase
    if (isSupabaseConfigured && supabase) {
      supabase.from('docentes_audit_logs').insert([{
        id: entry.id,
        action: entry.action,
        details: entry.details,
        author: entry.author,
        author_role: entry.authorRole,
        created_at: entry.timestamp
      }]).then(() => {}).catch(() => {});
    }

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
    const teacherOrder = ['profe0', 'profe1', 'jessica', 'yuri', 'profe2', 'elcy', 'profe3'];
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

  async updateTeacherProfile(key, { name, label, status }, adminUser) {
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

    // Sincronización en Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const profilePayload = {
          user_key: key,
          name: USERS[key].name,
          label: USERS[key].label || '',
          status: USERS[key].status || 'activa',
          role: USERS[key].role || 'docente',
          updated_at: new Date().toISOString(),
          updated_by: adminUser?.name || 'Dirección'
        };

        const { error } = await supabase
          .from('docentes_perfiles')
          .upsert([profilePayload], { onConflict: 'user_key' });

        if (error) {
          await supabase.from('institutional_vault').upsert({
            user_key: `teacher_profile_${key}`,
            cipher: JSON.stringify(profilePayload),
            default_invalidated: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_key' });
        }
      } catch (err) {
        console.warn('[TeacherService] Error sincronizando perfil en Supabase:', err);
      }
    }

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

  async setGradeDirector(grade, newDocenteKey, { linkDirectorSubjects = true, adminUser } = {}) {
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

    // Sincronización en Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const directorPayload = {
          grade,
          docente_id: newDocenteKey,
          teacher_name: newTeacher.name,
          updated_at: now,
          updated_by: adminUser?.name || 'Dirección'
        };

        const { error } = await supabase
          .from('directores_curso')
          .upsert([directorPayload], { onConflict: 'grade' });

        if (error) {
          await supabase.from('institutional_vault').upsert({
            user_key: `director_${grade.replace(/\s+/g, '_')}`,
            cipher: JSON.stringify(directorPayload),
            default_invalidated: true,
            updated_at: now
          }, { onConflict: 'user_key' });
        }

        // Sincronizar asignaciones formativas vinculadas
        if (affectedSubjects.length > 0) {
          const asigPayloads = affectedSubjects.map(s => ({
            id: `${grade.replace(/\s+/g, '_')}__${s.replace(/[\s&]+/g, '_')}`,
            grade,
            subject: s,
            docente_id: newDocenteKey,
            teacher_name: newTeacher.name,
            updated_at: now,
            updated_by: adminUser?.name || 'Dirección'
          }));

          await supabase
            .from('asignaciones_materias')
            .upsert(asigPayloads, { onConflict: 'id' });
        }
      } catch (err) {
        console.warn('[TeacherService] Error sincronizando director en Supabase:', err);
      }
    }

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

  async setSubjectTeacher(grade, subject, newDocenteKey, adminUser) {
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

    // Sincronización en Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const id = `${grade.replace(/\s+/g, '_')}__${subject.replace(/[\s&]+/g, '_')}`;
        const payload = {
          id,
          grade,
          subject,
          docente_id: newDocenteKey,
          teacher_name: newTeacher.name,
          updated_at: now,
          updated_by: adminUser?.name || 'Dirección'
        };

        const { error } = await supabase
          .from('asignaciones_materias')
          .upsert([payload], { onConflict: 'id' });

        if (error) {
          await supabase.from('institutional_vault').upsert({
            user_key: `asig_${id}`,
            cipher: JSON.stringify(payload),
            default_invalidated: true,
            updated_at: now
          }, { onConflict: 'user_key' });
        }
      } catch (err) {
        console.warn('[TeacherService] Error sincronizando asignación en Supabase:', err);
      }
    }

    return { success: true, assignment: gradesService.customAssignments[grade][subject] };
  }

  async setSubjectAcrossGrades(subject, newDocenteKey, targetGrades = null, adminUser) {
    const grades = targetGrades || GRADES_LIST;
    const newTeacher = USERS[newDocenteKey];
    if (!newTeacher) throw new Error(`Docente inválido: ${newDocenteKey}`);

    for (const grade of grades) {
      const gradeSubjects = gradesService.getSubjectsForGrade(grade);
      if (gradeSubjects.includes(subject)) {
        await this.setSubjectTeacher(grade, subject, newDocenteKey, adminUser);
      }
    }

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

  async applyGaleanoOfficialPreset(adminUser) {
    const now = new Date().toISOString();

    // 1. Asignar Directores Oficiales
    const officialDirectors = {
      'Pre-Jardín': 'profe0',
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

      const isPreschool = grade === 'Pre-Jardín' || grade === 'Transición';

      let assignments = {};
      if (isPreschool) {
        // En Preescolar (Pre-Jardín y Transición), la Directora de Curso no rota y tiene el control total de sus alumnos y evaluaciones
        ALL_SUBJECTS.forEach(subj => {
          assignments[subj] = { docente_id: dirKey, teacherName: dirTeacher.name };
        });
      } else {
        assignments = {
          'Lengua Castellana': { docente_id: 'jessica', teacherName: USERS.jessica.name },
          'Inglés': { docente_id: 'elcy', teacherName: USERS.elcy.name },
          'Ciencias Sociales': { docente_id: 'yuri', teacherName: USERS.yuri.name },
          'Ciencias Naturales': { docente_id: 'yuri', teacherName: USERS.yuri.name },
          'Matemáticas': { docente_id: 'profe2', teacherName: USERS.profe2.name },
          // Materias formativas vinculadas a Directora de Curso:
          'Educación Artística': { docente_id: dirKey, teacherName: dirTeacher.name },
          'Religión': { docente_id: dirKey, teacherName: dirTeacher.name },
          'Educación Física': { docente_id: dirKey, teacherName: dirTeacher.name },
          'Ética & Valores': { docente_id: dirKey, teacherName: dirTeacher.name }
        };
      }

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
    saveUserOverride('profe0', { label: 'Docente • Dir. Pre-Jardín' });
    saveUserOverride('profe1', { label: 'Docente • Dir. Transición' });
    saveUserOverride('jessica', { label: 'Docente de Español • Dir. 1° Primaria' });
    saveUserOverride('yuri', { label: 'Docente de Ciencias (Naturales & Sociales) • Dir. 2° Primaria' });
    saveUserOverride('profe2', { label: 'Docente de Matemáticas • Dir. 3° Primaria' });
    saveUserOverride('elcy', { label: 'Docente de Inglés • Dir. 4° Primaria' });
    saveUserOverride('profe3', { label: 'Docente • Dir. 5° Primaria' });

    gradesService.persistCustomState();
    gradesService.persistTree();

    this.addAuditLog(
      'Aplicación de Preset Institucional Galeano 2026',
      'Configuración integral: Preescolar sin rotación (Pre-Jardín y Transición con Directoras titulares a cargo total), Primaria con especialistas (Elcy, Jessica, Yuri, Profe 2).',
      adminUser
    );

    this.notifyUpdates();

    // Sincronización masiva en Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const directorsPayload = Object.entries(officialDirectors).map(([grade, docKey]) => ({
          grade,
          docente_id: docKey,
          teacher_name: (USERS[docKey] || {}).name || docKey,
          updated_at: now,
          updated_by: adminUser?.name || 'Preset Galeano'
        }));
        await supabase.from('directores_curso').upsert(directorsPayload, { onConflict: 'grade' });

        const profilesPayload = ['profe0', 'profe1', 'jessica', 'yuri', 'profe2', 'elcy', 'profe3'].map(k => ({
          user_key: k,
          name: USERS[k].name,
          label: USERS[k].label,
          status: USERS[k].status || 'activa',
          role: USERS[k].role || 'docente',
          updated_at: now,
          updated_by: adminUser?.name || 'Preset Galeano'
        }));
        await supabase.from('docentes_perfiles').upsert(profilesPayload, { onConflict: 'user_key' });
      } catch (err) {
        console.warn('[TeacherService] Error sincronizando preset con Supabase:', err);
      }
    }

    return { success: true };
  }

  async applyDirectorSubjectsRule(adminUser) {
    const now = new Date().toISOString();
    let count = 0;
    const formativasPayload = [];

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

          formativasPayload.push({
            id: `${grade.replace(/\s+/g, '_')}__${subj.replace(/[\s&]+/g, '_')}`,
            grade,
            subject: subj,
            docente_id: director.docente_id,
            teacher_name: director.teacherName,
            updated_at: now,
            updated_by: adminUser?.name || 'Vinculación Formativas'
          });

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

    if (isSupabaseConfigured && supabase && formativasPayload.length > 0) {
      supabase.from('asignaciones_materias').upsert(formativasPayload, { onConflict: 'id' }).then(() => {}).catch(() => {});
    }

    return { success: true, count };
  }

  async resetToFactoryDefaults(adminUser) {
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

    // Sincronizar en Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('directores_curso').delete().neq('grade', 'NONE');
        await supabase.from('asignaciones_materias').delete().neq('id', 'NONE');
        await supabase.from('docentes_perfiles').delete().neq('user_key', 'NONE');
      } catch (err) {
        console.warn('[TeacherService] Error restableciendo en Supabase:', err);
      }
    }

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
      { key: 'claudia', label: USERS.claudia?.name || 'Claudia (Rectora)' },
      { key: 'coordinacion', label: 'Coordinación Académica' },
      ...this.getTeachers().map(t => {
        const rawGrade = t.directedGrade || (t.label?.match(/(Pre-Jardín|Transición|[1-5]°(?:\s*Primaria)?)/i)?.[0]) || 'Docente';
        const gradeBadge = rawGrade.replace(/\s*Primaria/gi, '').trim();
        const displayLabel = t.name.toLowerCase().includes(gradeBadge.toLowerCase())
          ? t.name
          : `${t.name} (${gradeBadge})`;
        return {
          key: t.key,
          label: displayLabel
        };
      }),
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

  // =========================================================================
  // 6. SINCRONIZACIÓN REMOTA CON SUPABASE & REALTIME
  // =========================================================================

  async initRemoteSync() {
    if (!isSupabaseConfigured || !supabase) return;

    try {
      // 1. Cargar directores remotos
      const { data: remoteDirs, error: dirsErr } = await supabase
        .from('directores_curso')
        .select('*');

      if (!dirsErr && Array.isArray(remoteDirs) && remoteDirs.length > 0) {
        remoteDirs.forEach(row => {
          if (row.grade && row.docente_id) {
            gradesService.customDirectors[row.grade] = {
              docente_id: row.docente_id,
              teacherName: row.teacher_name,
              updatedAt: row.updated_at
            };
          }
        });
        gradesService.persistCustomState();
      }

      // 2. Cargar asignaciones de materias remotas
      const { data: remoteAsigs, error: asigsErr } = await supabase
        .from('asignaciones_materias')
        .select('*');

      if (!asigsErr && Array.isArray(remoteAsigs) && remoteAsigs.length > 0) {
        remoteAsigs.forEach(row => {
          if (row.grade && row.subject && row.docente_id) {
            if (!gradesService.customAssignments[row.grade]) {
              gradesService.customAssignments[row.grade] = {};
            }
            gradesService.customAssignments[row.grade][row.subject] = {
              docente_id: row.docente_id,
              teacherName: row.teacher_name,
              updatedAt: row.updated_at
            };
          }
        });
        gradesService.persistCustomState();
      }

      // 3. Cargar perfiles docentes remotos
      const { data: remoteProfiles, error: profsErr } = await supabase
        .from('docentes_perfiles')
        .select('*');

      if (!profsErr && Array.isArray(remoteProfiles) && remoteProfiles.length > 0) {
        remoteProfiles.forEach(row => {
          if (row.user_key && USERS[row.user_key]) {
            saveUserOverride(row.user_key, {
              name: row.name,
              label: row.label,
              status: row.status
            });
          }
        });
      }

      this.notifyUpdates();

      // 4. Iniciar suscripción Realtime
      this.initRealtimeSubscription();
    } catch (e) {
      console.warn('[TeacherService] Sincronización remota Supabase omitida:', e);
    }
  }

  initRealtimeSubscription() {
    if (!isSupabaseConfigured || !supabase || this.realtimeChannel) return;

    try {
      this.realtimeChannel = supabase
        .channel('gestion_docente_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'directores_curso' }, (payload) => {
          const row = payload.new;
          if (row && row.grade && row.docente_id) {
            gradesService.customDirectors[row.grade] = {
              docente_id: row.docente_id,
              teacherName: row.teacher_name,
              updatedAt: row.updated_at
            };
            gradesService.persistCustomState();
            this.notifyUpdates();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'asignaciones_materias' }, (payload) => {
          const row = payload.new;
          if (row && row.grade && row.subject && row.docente_id) {
            if (!gradesService.customAssignments[row.grade]) {
              gradesService.customAssignments[row.grade] = {};
            }
            gradesService.customAssignments[row.grade][row.subject] = {
              docente_id: row.docente_id,
              teacherName: row.teacher_name,
              updatedAt: row.updated_at
            };
            gradesService.persistCustomState();
            this.notifyUpdates();
          }
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'docentes_perfiles' }, (payload) => {
          const row = payload.new;
          if (row && row.user_key && USERS[row.user_key]) {
            saveUserOverride(row.user_key, {
              name: row.name,
              label: row.label,
              status: row.status
            });
            this.notifyUpdates();
          }
        })
        .subscribe();
    } catch (err) {
      console.warn('[TeacherService] Error en suscripción Realtime:', err);
    }
  }
}

export const teacherService = new TeacherService();
export default teacherService;
