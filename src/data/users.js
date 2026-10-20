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
    avatar: null,
    pass: 'induccion2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  admin: {
    name: 'Administrador',
    role: 'admin',
    label: 'Administrador General',
    initial: 'A',
    avatar: null,
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
    avatar: null,
    pass: 'coordinacion2026',
    maxUploadBytes: 1 * GB,
    maxUploadLabel: '1 GB',
  },
  profe1: {
    name: 'Profe 1',
    role: 'docente',
    label: 'Docente • Dir. Transición',
    initial: 'P1',
    avatar: null,
    pass: 'profe12026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  jessica: {
    name: 'Jessica',
    role: 'docente',
    label: 'Docente de Español • Dir. 1° Primaria',
    initial: 'J',
    avatar: null,
    pass: 'jessica2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  yuri: {
    name: 'Yuri',
    role: 'docente',
    label: 'Docente de Ciencias (Naturales & Sociales) • Dir. 2° Primaria',
    initial: 'Y',
    avatar: null,
    pass: 'yuri2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  profe2: {
    name: 'Profe 2',
    role: 'docente',
    label: 'Docente de Matemáticas • Dir. 3° Primaria',
    initial: 'P2',
    avatar: null,
    pass: 'profe22026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  elcy: {
    name: 'Elcy',
    role: 'docente',
    label: 'Docente de Inglés • Dir. 4° Primaria',
    initial: 'E',
    avatar: null,
    pass: 'elcy2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  profe3: {
    name: 'Profe 3',
    role: 'docente',
    label: 'Docente • Dir. 5° Primaria',
    initial: 'P3',
    avatar: null,
    pass: 'profe32026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
}

export const BOVEDA_PASSWORD = 'boveda2026'
export const SYSTEM_STORAGE_CAPACITY_BYTES = 2 * GB

export const USERS_OVERRIDES_STORAGE_KEY = 'gmg_custom_users_overrides_v1';

export function loadUserOverrides() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(USERS_OVERRIDES_STORAGE_KEY);
    if (raw) {
      const overrides = JSON.parse(raw);
      Object.entries(overrides).forEach(([key, val]) => {
        if (USERS[key]) {
          Object.assign(USERS[key], val);
        }
      });
    }
  } catch (e) {
    console.warn('Error al cargar overrides de usuarios:', e);
  }
}

export function saveUserOverride(userKey, updates) {
  if (!userKey || !USERS[userKey]) return;
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
