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
import { committeeService } from './committeeService.js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';

const TEACHER_AUDIT_LOG_KEY = 'gmg_teacher_management_audit_v1';
const TEACHER_RETIREMENT_HISTORY_KEY = 'gmg_teacher_retirements_history_v1';

class TeacherService {
  constructor() {
    this.auditLogs = this.loadAuditLogs();
    this.retirementsHistory = this.loadRetirementsHistory();
    this.realtimeChannel = null;

    if (typeof window !== 'undefined') {
      this.initRemoteSync();
    }
  }

  loadRetirementsHistory() {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(TEACHER_RETIREMENT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Error al cargar historial de bajas docentes:', e);
      return [];
    }
  }

  persistRetirementsHistory() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TEACHER_RETIREMENT_HISTORY_KEY, JSON.stringify(this.retirementsHistory));
    } catch (e) {
      console.error('Error al guardar historial de bajas docentes:', e);
    }
  }

  getRetirementsHistory() {
    return this.retirementsHistory;
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

  getTeachers(includeRetired = false) {
    const teacherOrder = ['liliana', 'yuri', 'elcy', 'blanca', 'nicolle', 'jessica'];
    const teachers = Object.entries(USERS)
      .filter(([key, u]) => {
        if (['admin', 'claudia', 'coordinacion', 'induccion', 'induccion_rectora'].includes(key)) return false;
        const isDocenteRole = u.role === 'docente' || ['liliana', 'yuri', 'elcy', 'blanca', 'nicolle', 'jessica'].includes(key);
        if (!isDocenteRole) return false;
        if (!includeRetired && u.status === 'retirada') return false;
        return true;
      })
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

  getTeacherProfile(userKey) {
    if (!userKey) return null;
    return USERS[userKey] || null;
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

    const isInduccion = adminUser?.role === 'induccion' || adminUser?.role === 'induccion_rectora';
    if (isInduccion) {
      return { success: true, simulated: true, teacher: USERS[key] };
    }

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
  // 1.1 GESTIÓN DE BAJAS DOCENTES Y REEMPLAZO OBLIGATORIO DE RESPONSABILIDADES
  // =========================================================================

  /**
   * Ejecuta la baja de un(a) docente y el traspaso total e inmediato de todas
   * sus responsabilidades (dirección de curso, materias curriculares, comités de ley)
   * a un(a) nuevo(a) docente entrante o existente.
   */
  async processTeacherDischarge({
    retiredKey,
    reason,
    dischargeDate,
    replacementMode, // 'new' | 'existing'
    existingReplacementKey,
    newTeacherData, // { name, label, pass }
    author
  }) {
    if (!retiredKey || !USERS[retiredKey]) {
      throw new Error(`Docente a dar de baja no encontrado: ${retiredKey}`);
    }

    if (!reason || !reason.trim()) {
      throw new Error('Debe especificar el motivo formal de la baja/retiro del docente.');
    }

    const retiredDocente = { ...USERS[retiredKey] };
    const now = new Date().toISOString();
    const effectiveDate = dischargeDate || now.split('T')[0];

    let replacementKey = null;
    let replacementName = '';

    if (replacementMode === 'new') {
      if (!newTeacherData || !newTeacherData.name || !newTeacherData.name.trim()) {
        throw new Error('Debe ingresar el nombre del nuevo docente que asume el cargo.');
      }
      
      const cleanName = newTeacherData.name.trim();
      // Generar una clave única para el nuevo usuario docente (ej. 'camila', 'laura_gomez')
      let baseKey = cleanName.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, '_')
        .split('_')[0];
      
      if (!baseKey || baseKey.length < 3) baseKey = 'docente';
      let candidateKey = baseKey;
      let counter = 1;
      while (USERS[candidateKey] && candidateKey !== retiredKey) {
        candidateKey = `${baseKey}_${counter}`;
        counter++;
      }

      replacementKey = candidateKey;
      replacementName = cleanName;

      // Crear nuevo usuario docente en el sistema
      saveUserOverride(replacementKey, {
        name: cleanName,
        role: 'docente',
        label: newTeacherData.label || `Docente Reemplazo de ${retiredDocente.name}`,
        initial: cleanName.slice(0, 1).toUpperCase(),
        avatar: '/images/avatars/profe1.svg',
        pass: newTeacherData.pass || `${replacementKey}2026`,
        maxUploadBytes: 15 * 1024 * 1024,
        maxUploadLabel: '15 MB',
        status: 'activa'
      });
    } else {
      if (!existingReplacementKey || !USERS[existingReplacementKey]) {
        throw new Error('Debe seleccionar un docente existente de la planta para transferir las responsabilidades.');
      }
      if (existingReplacementKey === retiredKey) {
        throw new Error('El docente sustituto no puede ser el mismo docente dado de baja.');
      }
      replacementKey = existingReplacementKey;
      replacementName = USERS[replacementKey].name;
    }

    // 1. Marcar al docente saliente como 'retirada' e inhabilitar (isBlocked: true)
    saveUserOverride(retiredKey, {
      status: 'retirada',
      isBlocked: true,
      retiredAt: effectiveDate,
      retirementReason: reason.trim(),
      replacedBy: replacementKey,
      replacedByName: replacementName
    });

    // Disparar evento de revocación si coincide con la sesión activa
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gmg_teacher_discharged', {
        detail: { retiredKey, replacementKey }
      }));
    }

    // 2. Traspasar Dirección de Curso si el docente retirado era director
    const transferredDirectorGrades = [];
    GRADES_LIST.forEach(grade => {
      const currentDir = gradesService.getGradeDirector(grade);
      if (currentDir.docente_id === retiredKey) {
        gradesService.customDirectors[grade] = {
          docente_id: replacementKey,
          teacherName: replacementName,
          replacedFrom: retiredKey,
          replacedFromName: retiredDocente.name,
          updatedAt: now
        };
        transferredDirectorGrades.push(grade);
      }
    });

    // 3. Traspasar todas las materias asignadas en la Malla Curricular
    const transferredSubjects = [];
    GRADES_LIST.forEach(grade => {
      const gradeSubjects = gradesService.getSubjectsForGrade(grade);
      gradeSubjects.forEach(subj => {
        const assign = gradesService.getTeacherAssignment(grade, subj);
        if (assign.docente_id === retiredKey) {
          if (!gradesService.customAssignments[grade]) gradesService.customAssignments[grade] = {};
          gradesService.customAssignments[grade][subj] = {
            docente_id: replacementKey,
            teacherName: replacementName,
            previousDocenteKey: retiredKey,
            previousTeacherName: retiredDocente.name,
            updatedAt: now
          };
          transferredSubjects.push({ grade, subject: subj });

          // Sincronizar en el árbol relacional SIEE de planillas y evaluaciones
          ACADEMIC_YEARS.forEach(y => {
            ACADEMIC_PERIODS.forEach(p => {
              if (gradesService.tree[y]?.[p]?.[grade]?.[subj]) {
                gradesService.tree[y][p][grade][subj].docente_id = replacementKey;
                gradesService.tree[y][p][grade][subj].teacherName = replacementName;
                gradesService.tree[y][p][grade][subj].lastUpdated = now;
                gradesService.tree[y][p][grade][subj].lastUpdatedBy = `Baja Docente: ${retiredDocente.name} -> ${replacementName}`;
              }
            });
          });
        }
      });
    });

    // Persistir el árbol relacional y directores
    gradesService.persistCustomState();
    gradesService.persistTree();

    // 4. Traspasar Comités Institucionales de Ley (Ley 1620, Dec. 1290, Ley 115)
    const transferredCommittees = [];
    try {
      const allCommittees = committeeService.getCommittees();
      Object.entries(allCommittees).forEach(([cId, cData]) => {
        if (cData.assignedTeachers && cData.assignedTeachers.includes(retiredKey)) {
          const updatedTeachers = cData.assignedTeachers.map(k => k === retiredKey ? replacementKey : k);
          committeeService.setAssignedTeachers(cId, updatedTeachers, author);
          transferredCommittees.push(cData.name);
        }
      });
    } catch (err) {
      console.warn('[TeacherService] Error actualizando comités tras baja docente:', err);
    }

    // 5. Registrar en el Historial Permanente de Bajas Docentes
    const retirementEntry = {
      id: `BAJA-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: now,
      effectiveDate,
      retiredKey,
      retiredName: retiredDocente.name,
      retiredLabel: retiredDocente.label || 'Docente',
      reason: reason.trim(),
      replacementKey,
      replacementName,
      replacementMode,
      author: author?.name || 'Dirección',
      authorRole: author?.role || 'admin',
      transferredDirectorGrades,
      transferredSubjectsCount: transferredSubjects.length,
      transferredCommittees
    };

    this.retirementsHistory.unshift(retirementEntry);
    this.persistRetirementsHistory();

    // 6. Auditoría institucional
    this.addAuditLog(
      'Baja Docente y Reemplazo Obligatorio',
      `Baja de ${retiredDocente.name}. Motivo: "${reason.trim()}". Entra en su lugar: ${replacementName}. Transferidas ${transferredSubjects.length} materias, directores: [${transferredDirectorGrades.join(', ')}] y comités: [${transferredCommittees.join(', ')}].`,
      author
    );

    this.notifyUpdates();

    // 7. Sincronizar en Supabase si está disponible
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('institutional_vault').upsert({
          user_key: `teacher_retirement_${retirementEntry.id}`,
          cipher: JSON.stringify(retirementEntry),
          default_invalidated: true,
          updated_at: now
        }, { onConflict: 'user_key' });

        // Actualizar perfiles remotos
        await supabase.from('docentes_perfiles').upsert([
          {
            user_key: retiredKey,
            name: retiredDocente.name,
            label: retiredDocente.label,
            status: 'retirada',
            updated_at: now,
            updated_by: author?.name || 'Dirección'
          },
          {
            user_key: replacementKey,
            name: replacementName,
            label: USERS[replacementKey]?.label || '',
            status: 'activa',
            updated_at: now,
            updated_by: author?.name || 'Dirección'
          }
        ], { onConflict: 'user_key' });
      } catch (e) {
        console.warn('[TeacherService] Error sincronizando baja en Supabase:', e);
      }
    }

    return {
      success: true,
      entry: retirementEntry
    };
  }

  /**
   * Reactiva a un docente previamente dado de baja o inhabilitado.
   * Requiere autorización de rol directivo y motivo obligatorio.
   */
  async reactivateTeacher({ teacherKey, reason, author }) {
    if (!teacherKey || !USERS[teacherKey]) {
      throw new Error(`Docente no encontrado para reactivación: ${teacherKey}`);
    }

    // Validar autorización directiva
    const authorRole = author?.role || '';
    const allowedRoles = ['admin', 'rectora', 'induccion_rectora', 'coordinacion'];
    if (!allowedRoles.includes(authorRole)) {
      throw new Error('No autorizado: Solo Rectoría, Dirección o Coordinación pueden reactivar docentes.');
    }

    if (!reason || reason.trim().length < 10) {
      throw new Error('Debe especificar un motivo formal de reactivación con un mínimo de 10 caracteres.');
    }

    const now = new Date().toISOString();
    const docente = USERS[teacherKey];

    // Actualizar estado a 'activa', isBlocked: false y registrar auditoría
    saveUserOverride(teacherKey, {
      status: 'activa',
      isBlocked: false,
      reactivatedAt: now,
      reactivatedBy: author?.name || 'Dirección Institucional',
      reactivationReason: reason.trim()
    });

    this.addAuditLog(
      'Reactivación de Docente',
      `Docente ${docente.name} reactivado(a) por ${author?.name || 'Dirección'}. Motivo: "${reason.trim()}".`,
      author
    );

    this.notifyUpdates();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('docentes_perfiles').upsert({
          user_key: teacherKey,
          name: docente.name,
          label: docente.label,
          status: 'activa',
          updated_at: now,
          updated_by: author?.name || 'Dirección'
        }, { onConflict: 'user_key' });
      } catch (err) {
        console.warn('[TeacherService] Error sincronizando reactivación en Supabase:', err);
      }
    }

    return {
      success: true,
      message: `Docente ${docente.name} ha sido reactivado(a) exitosamente.`
    };
  }
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

    const isInduccion = adminUser?.role === 'induccion' || adminUser?.role === 'induccion_rectora';
    if (isInduccion) {
      return { success: true, simulated: true, grade, director: newTeacher };
    }

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

    const isInduccion = adminUser?.role === 'induccion' || adminUser?.role === 'induccion_rectora';
    if (isInduccion) {
      return { success: true, simulated: true, grade, director: newTeacher };
    }

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
      'Pre-Jardín': 'liliana',
      'Transición': 'liliana',
      '1° Primaria': 'yuri',
      '2° Primaria': 'elcy',
      '3° Primaria': 'blanca',
      '4° Primaria': 'nicolle',
      '5° Primaria': 'jessica'
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
        // En Preescolar (Pre-Jardín y Transición), Liliana a cargo de todas las asignaturas
        ALL_SUBJECTS.forEach(subj => {
          assignments[subj] = { docente_id: 'liliana', teacherName: USERS.liliana.name };
        });
      } else {
        assignments = {
          'Lengua Castellana': { docente_id: 'jessica', teacherName: USERS.jessica.name },
          'Matemáticas': { docente_id: 'blanca', teacherName: USERS.blanca.name },
          'Ciencias Naturales': { docente_id: 'yuri', teacherName: USERS.yuri.name },
          'Ciencias Sociales': { docente_id: 'nicolle', teacherName: USERS.nicolle.name },
          'Inglés': { docente_id: 'elcy', teacherName: USERS.elcy.name },
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
    saveUserOverride('liliana', { label: 'Docente Titular • Dir. Preescolar' });
    saveUserOverride('yuri', { label: 'Docente de Ciencias (Naturales & Sociales) • Dir. 1° Primaria' });
    saveUserOverride('elcy', { label: 'Docente de Inglés • Dir. 2° Primaria' });
    saveUserOverride('blanca', { label: 'Docente de Matemáticas • Dir. 3° Primaria' });
    saveUserOverride('nicolle', { label: 'Docente de Ciencias Sociales • Dir. 4° Primaria' });
    saveUserOverride('jessica', { label: 'Docente de Español (Lengua Castellana) • Dir. 5° Primaria' });

    gradesService.persistCustomState();
    gradesService.persistTree();

    this.addAuditLog(
      'Aplicación de Preset Institucional Galeano 2026',
      'Configuración integral: Preescolar con Liliana (todas las materias), 1° Yuri (Ciencias), 2° Elcy (Inglés), 3° Blanca (Matemáticas), 4° Nicolle (Sociales), 5° Jessica (Español).',
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

        const profilesPayload = ['liliana', 'yuri', 'elcy', 'blanca', 'nicolle', 'jessica'].map(k => ({
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
