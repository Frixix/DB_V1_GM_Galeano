import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import { USERS } from '../data/users.js';

const COMMITTEES_STORAGE_KEY = 'gmg_committee_assignments_v2';

export const DEFAULT_COMMITTEE_CONFIG = {
  comite_convivencia: {
    id: 'comite_convivencia',
    name: 'Comité de Convivencia Escolar',
    legalBasis: 'Ley 1620 de 2013',
    icon: 'ph-scales',
    badgeClass: 'tag-pastel-purple',
    assignedTeachers: ['jessica'], // Por defecto 1 o 2 docentes
    maxTeachers: 2,
    description: 'Ruta de Atención Integral, mediación pacífica de conflictos y debido proceso'
  },
  comision_evaluacion: {
    id: 'comision_evaluacion',
    name: 'Comisión de Evaluación y Promoción',
    legalBasis: 'Decreto 1290 de 2009',
    icon: 'ph-chart-pie-slice',
    badgeClass: 'tag-pastel-emerald',
    assignedTeachers: ['yuri'], // Por defecto 1 o 2 docentes
    maxTeachers: 2,
    description: 'Cierres de periodo lectivo, análisis de rendimiento y planes de superación'
  },
  consejo_academico: {
    id: 'consejo_academico',
    name: 'Consejo Académico',
    legalBasis: 'Ley 115 de 1994 (Art. 145)',
    icon: 'ph-graduation-cap',
    badgeClass: 'tag-pastel-rose',
    assignedTeachers: ['profe2', 'profe3'],
    maxTeachers: 2,
    description: 'Alineación de mallas curriculares y proyectos pedagógicos transversales'
  },
  reuniones_docentes: {
    id: 'reuniones_docentes',
    name: 'Reuniones de Docentes & Asambleas',
    legalBasis: 'Claustro de Profesores',
    icon: 'ph-chalkboard-teacher',
    badgeClass: 'tag-pastel-cyan',
    isAllTeachers: true, // Todo el claustro docente participa
    assignedTeachers: ['profe1', 'jessica', 'yuri', 'profe2', 'elcy', 'profe3'],
    maxTeachers: 6,
    description: 'Jornadas pedagógicas institucionales y cronogramas de aula'
  }
};

class CommitteeService {
  constructor() {
    this.committees = this.loadCommittees();
    this.initSupabaseSync();
  }

  loadCommittees() {
    if (typeof window === 'undefined') return { ...DEFAULT_COMMITTEE_CONFIG };
    try {
      const stored = localStorage.getItem(COMMITTEES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_COMMITTEE_CONFIG,
          ...parsed
        };
      }
    } catch (e) {
      console.warn('[CommitteeService] Error al cargar comités desde localStorage:', e);
    }
    return { ...DEFAULT_COMMITTEE_CONFIG };
  }

  persistCommittees() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(COMMITTEES_STORAGE_KEY, JSON.stringify(this.committees));
      window.dispatchEvent(new CustomEvent('gmg_committees_updated', { detail: this.committees }));
    } catch (e) {
      console.error('[CommitteeService] Error al persistir comités:', e);
    }
  }

  async initSupabaseSync() {
    if (typeof window === 'undefined' || !isSupabaseConfigured || !supabase) return;
    try {
      const { data, error } = await supabase
        .from('institutional_vault')
        .select('cipher')
        .eq('user_key', 'institutional_committees_config')
        .maybeSingle();

      if (!error && data?.cipher) {
        const parsed = JSON.parse(data.cipher);
        this.committees = {
          ...this.committees,
          ...parsed
        };
        localStorage.setItem(COMMITTEES_STORAGE_KEY, JSON.stringify(this.committees));
        window.dispatchEvent(new CustomEvent('gmg_committees_updated', { detail: this.committees }));
      }
    } catch (err) {
      console.warn('[CommitteeService] Advertencia al sincronizar comités con Supabase:', err);
    }
  }

  getCommittees() {
    return this.committees;
  }

  getCommittee(committeeId) {
    return this.committees[committeeId] || null;
  }

  getAssignedTeachers(committeeId) {
    const committee = this.committees[committeeId];
    if (!committee) return [];
    return committee.assignedTeachers || [];
  }

  /**
   * Asignación oficial por parte de Rectoría (Máximo 2 docentes por comité, o 1 si prefiere)
   */
  async setAssignedTeachers(committeeId, teacherKeys = [], author = null) {
    if (!this.committees[committeeId]) return false;

    // Validación de límite: máximo 2 docentes para comités especializados
    const maxAllowed = this.committees[committeeId].maxTeachers || 2;
    const cleanKeys = Array.from(new Set(teacherKeys)).slice(0, maxAllowed);

    this.committees[committeeId] = {
      ...this.committees[committeeId],
      assignedTeachers: cleanKeys,
      lastAssignedBy: author?.name || 'Claudia (Rectora)',
      lastAssignedAt: new Date().toISOString()
    };

    this.persistCommittees();

    // Sincronización en la nube (institutional_vault) - Se omite si es perfil de inducción/demo para proteger datos maestros
    const isInduccion = author?.role === 'induccion' || author?.role === 'induccion_rectora';
    if (isSupabaseConfigured && supabase && !isInduccion) {
      try {
        await supabase.from('institutional_vault').upsert({
          user_key: 'institutional_committees_config',
          cipher: JSON.stringify(this.committees),
          default_invalidated: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_key' });
      } catch (err) {
        console.warn('[CommitteeService] Error al respaldar comités en Supabase:', err);
      }
    }

    return true;
  }

  /**
   * ¿El usuario tiene facultad para asignar y reconfigurar comités?
   * Exclusivo a criterio de la Rectora y Administración General
   */
  canManageCommittees(user) {
    if (!user) return false;
    return ['admin', 'rectora', 'induccion_rectora'].includes(user.role);
  }

  /**
   * ¿El usuario es miembro asignado de un comité específico?
   */
  isUserAssigned(committeeId, user) {
    if (!user) return false;
    const role = user.role || '';
    if (['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(role)) return true;

    const committee = this.committees[committeeId];
    if (!committee) return false;

    if (committee.isAllTeachers) return true;

    const userKey = (user.key || '').toLowerCase();
    const userName = (user.name || '').toLowerCase();

    return committee.assignedTeachers.some(k => {
      const targetUser = USERS[k];
      return k.toLowerCase() === userKey || 
             (targetUser && targetUser.name.toLowerCase() === userName) ||
             userName.includes(k.toLowerCase());
    });
  }

  /**
   * Obtiene la lista de comités en los que un docente está formalmente asignado
   */
  getUserAssignedCommittees(user) {
    if (!user) return [];
    if (['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(user.role)) {
      return Object.keys(this.committees);
    }
    return Object.keys(this.committees).filter(id => this.isUserAssigned(id, user));
  }

  /**
   * Bloqueo de función y validación de permisos de edición / modificación:
   * - Si es un comité X (ej: comite_convivencia), la docente asignada a evaluación (Y) NO PUEDE modificarlo.
   * - Solo miembros del comité respectivo o directivos (Rectora/Admin) pueden crear, modificar o cerrar actas.
   */
  canUserEditRecord(record, user) {
    if (!user) return false;
    const isPrivileged = ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(user.role);
    if (isPrivileged) return true;

    if (!record) return false;

    // Caso 1: Actas de Comités Internos (comite_convivencia, comision_evaluacion, etc.)
    if (['comite_convivencia', 'comision_evaluacion', 'consejo_academico', 'reuniones_docentes'].includes(record.route)) {
      return this.isUserAssigned(record.route, user);
    }

    // Caso 2: Observador y Citaciones a Estudiantes
    const isOwner = record.teacher === user.name || record.teacher === user.key;
    return isOwner;
  }

  /**
   * Determina si el usuario puede radicar o crear un registro en una ruta dada
   */
  canUserCreateInRoute(route, user) {
    if (!user) return false;
    const isPrivileged = ['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(user.role);
    if (isPrivileged) return true;

    // Rutas de seguimiento de aula abiertas a docentes
    if (['observador', 'citaciones', 'piar'].includes(route)) {
      return true;
    }

    // Rutas de comités: solo si está asignada formalmente por Rectoría
    return this.isUserAssigned(route, user);
  }

  /**
   * Formatea los nombres completos de las docentes asignadas a un comité
   */
  getCommitteeMembersLabel(committeeId) {
    const committee = this.committees[committeeId];
    if (!committee) return 'Sin asignación';
    if (committee.isAllTeachers) return 'Claustro Docente Completo';

    const names = committee.assignedTeachers.map(key => {
      const u = USERS[key];
      return u ? u.name : key;
    });

    return names.length > 0 ? names.join(' y ') : 'Pendiente por asignar';
  }
}

export const committeeService = new CommitteeService();
export default committeeService;
