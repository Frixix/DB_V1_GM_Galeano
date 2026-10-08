const GB = 1024 * 1024 * 1024
const MB = 1024 * 1024

export const USERS = {
  induccion_rectora: {
    name: 'Claudia (Inducción Rectora)',
    role: 'induccion_rectora',
    label: 'Capacitación de Supervisión Directiva',
    initial: '👑',
    pass: 'induccionrectora2026',
    maxUploadBytes: 2 * GB,
    maxUploadLabel: '2 GB',
  },
  induccion: {
    name: 'Inducción Profesoras',
    role: 'induccion',
    label: 'Módulo de Capacitación Docente',
    initial: '✨',
    pass: 'induccion2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  admin: {
    name: 'Administrador',
    role: 'admin',
    label: 'Administrador General',
    initial: 'A',
    pass: 'admin2026',
    maxUploadBytes: 2 * GB,
    maxUploadLabel: '2 GB',
  },
  claudia: {
    name: 'Claudia (Rectora)',
    role: 'rectora',
    label: 'Rectora Institucional',
    initial: 'C',
    pass: 'rectora2026',
    maxUploadBytes: 2 * GB,
    maxUploadLabel: '2 GB',
  },
  jessica: {
    name: 'Jessica',
    role: 'docente',
    label: 'Docente',
    initial: 'J',
    pass: 'jessica2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  yuri: {
    name: 'Yuri',
    role: 'docente',
    label: 'Docente',
    initial: 'Y',
    pass: 'yuri2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
  elcy: {
    name: 'Elcy',
    role: 'docente',
    label: 'Docente',
    initial: 'E',
    pass: 'elcy2026',
    maxUploadBytes: 15 * MB,
    maxUploadLabel: '15 MB',
  },
}

export const BOVEDA_PASSWORD = 'boveda2026'
export const SYSTEM_STORAGE_CAPACITY_BYTES = 2 * GB