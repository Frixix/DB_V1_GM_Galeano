const GB = 1024 * 1024 * 1024
const MB = 1024 * 1024

export const USERS = {
  induccion_rectora: {
    name: 'Claudia (Inducción Rectora)',
    role: 'induccion_rectora',
    label: 'Capacitación de Supervisión Directiva',
    initial: '👑',
    avatar: '/images/avatars/rectora.svg',
    pass: 'induccionrectora2026',
    maxUploadBytes: 2 * GB,
    maxUploadLabel: '2 GB',
  },
  induccion: {
    name: 'Inducción Profesoras',
    role: 'induccion',
    label: 'Módulo de Capacitación Docente',
    initial: '✨',
    avatar: '/images/avatars/rectora.svg',
    pass: 'induccion2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  admin: {
    name: 'Administrador',
    role: 'admin',
    label: 'Administrador General',
    initial: 'A',
    avatar: '/images/avatars/admin.svg',
    pass: 'admin2026',
    maxUploadBytes: 2 * GB,
    maxUploadLabel: '2 GB',
  },
  claudia: {
    name: 'Claudia (Rectora)',
    role: 'rectora',
    label: 'Rectora Institucional',
    initial: 'C',
    avatar: '/images/avatars/rectora.svg',
    pass: 'rectora2026',
    maxUploadBytes: 2 * GB,
    maxUploadLabel: '2 GB',
  },
  coordinacion: {
    name: 'Coordinación Académica',
    role: 'coordinador',
    label: 'Coordinador(a) Académico(a) & Convivencial',
    initial: '📋',
    avatar: '/images/avatars/coordinacion.svg',
    pass: 'coordinacion2026',
    maxUploadBytes: 1 * GB,
    maxUploadLabel: '1 GB',
  },
  liliana: {
    name: 'Liliana',
    role: 'docente',
    label: 'Docente Titular • Dir. Preescolar',
    initial: 'L',
    avatar: '/images/avatars/profe1.svg',
    pass: 'liliana2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  yuri: {
    name: 'Yuri',
    role: 'docente',
    label: 'Docente de Ciencias (Naturales & Sociales) • Dir. 1° Primaria',
    initial: 'Y',
    avatar: '/images/avatars/yuri.svg',
    pass: 'yuri2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  elcy: {
    name: 'Elcy',
    role: 'docente',
    label: 'Docente de Inglés • Dir. 2° Primaria',
    initial: 'E',
    avatar: '/images/avatars/elcy.svg',
    pass: 'elcy2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  blanca: {
    name: 'Blanca',
    role: 'docente',
    label: 'Docente de Matemáticas • Dir. 3° Primaria',
    initial: 'B',
    avatar: '/images/avatars/profe2.svg',
    pass: 'blanca2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  nicolle: {
    name: 'Nicolle',
    role: 'docente',
    label: 'Docente de Ciencias Sociales • Dir. 4° Primaria',
    initial: 'N',
    avatar: '/images/avatars/profe3.svg',
    pass: 'nicolle2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  jessica: {
    name: 'Jessica',
    role: 'docente',
    label: 'Docente de Español (Lengua Castellana) • Dir. 5° Primaria',
    initial: 'J',
    avatar: '/images/avatars/jessica.svg',
    pass: 'jessica2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
}

export const BOVEDA_PASSWORD = 'boveda2026'
export const SYSTEM_STORAGE_CAPACITY_BYTES = 15 * GB

export const INSTITUTION_CONFIG = {
  id: 'gmg',
  name: 'Gimnasio Martin Galeano',
  plan: 'Plan Institucional Blindaje SED',
  storageQuotaBytes: 15 * GB
};

export const USERS_OVERRIDES_STORAGE_KEY = 'gmg_custom_users_overrides_v1';
export const TEACHER_RETIREMENT_HISTORY_KEY = 'gmg_teacher_retirements_history_v1';

export function loadUserOverrides() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(USERS_OVERRIDES_STORAGE_KEY);
    if (raw) {
      const overrides = JSON.parse(raw);
      Object.entries(overrides).forEach(([key, val]) => {
        if (!USERS[key]) {
          // Si es un nuevo docente registrado dinámicamente
          USERS[key] = {
            name: val.name || key,
            role: val.role || 'docente',
            label: val.label || 'Docente Titular',
            initial: val.initial || (val.name ? val.name.slice(0, 1).toUpperCase() : 'D'),
            avatar: val.avatar || '/images/avatars/profe1.svg',
            pass: val.pass || `${key}2026`,
            maxUploadBytes: val.maxUploadBytes || (15 * 1024 * 1024),
            maxUploadLabel: val.maxUploadLabel || '15 MB',
            status: val.status || 'activa'
          };
        } else {
          Object.assign(USERS[key], val);
        }
      });
    }
  } catch (e) {
    console.warn('Error al cargar overrides de usuarios:', e);
  }
}

export function saveUserOverride(userKey, updates) {
  if (!userKey) return;
  if (!USERS[userKey]) {
    USERS[userKey] = {
      name: updates.name || userKey,
      role: updates.role || 'docente',
      label: updates.label || 'Docente Titular',
      initial: updates.initial || (updates.name ? updates.name.slice(0, 1).toUpperCase() : 'D'),
      avatar: updates.avatar || '/images/avatars/profe1.svg',
      pass: updates.pass || `${userKey}2026`,
      maxUploadBytes: updates.maxUploadBytes || (15 * 1024 * 1024),
      maxUploadLabel: updates.maxUploadLabel || '15 MB',
      status: updates.status || 'activa'
    };
  }
  Object.assign(USERS[userKey], updates);
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(USERS_OVERRIDES_STORAGE_KEY);
    const overrides = raw ? JSON.parse(raw) : {};
    overrides[userKey] = {
      ...(overrides[userKey] || {}),
      ...updates
    };
    localStorage.setItem(USERS_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Error al guardar override de usuario:', e);
  }
}

export function resetAllUserOverrides() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(USERS_OVERRIDES_STORAGE_KEY);
    } catch (e) {}
  }
}

// Carga automática inicial en el entorno del navegador
if (typeof window !== 'undefined') {
  loadUserOverrides();
}
