// "icon" es el nombre del icono de Phosphor; TourSpotlight lo convertirá en componente.
// "targetId" es el id del elemento que se resalta (null = pantalla centrada).

export const TOUR_STEPS_DOCENTE = [
  {
    targetId: null,
    title: '¡Bienvenida al Archivo Institucional! ✨',
    desc: 'Primer sistema integral de archivo, radicación y custodia de actas para colegios privados. En 5 pasos clave le mostramos cómo radicar circulares, consultar actas y registrar evaluaciones.',
    icon: 'Sparkle',
  },
  {
    targetId: 'tour-card-grades',
    title: 'Paso 1 · Planillas y Calificaciones (SIEE)',
    desc: 'Ingrese notas por actividad en sus materias asignadas. La plataforma calcula automáticamente la escala SIEE: 80% desempeño continuo de aula y 20% evaluación final.',
    icon: 'ChartLineUp',
  },
  {
    targetId: 'tour-navbar-notifications',
    title: 'Paso 2 · Circulares Institucionales al Día',
    desc: 'En la campanita superior recibirá avisos oficiales de Rectoría. Al hacer clic y leer la circular oficial, la notificación se confirma automáticamente.',
    icon: 'BellRinging',
  },
  {
    targetId: 'tour-card-docs',
    title: 'Paso 3 · Radicación de Guías y Planeaciones',
    desc: 'Desde Recursos Pedagógicos suba sus planeaciones semanales, talleres y guías (PDF, Word o Excel). El sistema los comprime y resguarda en su carpeta privada.',
    icon: 'CloudArrowUp',
  },
  {
    targetId: 'tour-card-observador',
    title: 'Paso 4 · Observador y Citaciones a Padres',
    desc: 'Diligencie compromisos académicos, novedades de convivencia y citaciones a acudientes con fecha, acuerdos formativos y respaldo institucional inmediato.',
    icon: 'UserList',
  },
  {
    targetId: 'tour-navbar-user-chip',
    title: 'Paso 5 · Perfil y Presencia en el Colegio',
    desc: 'Al ingresar a la plataforma queda registrada su presencia activa en vivo. En la esquina superior derecha puede personalizar su foto de perfil y consultar su cuenta.',
    icon: 'CheckCircle',
  },
];

export const TOUR_STEPS_RECTORA = [
  {
    targetId: null,
    title: 'Bienvenida, Rectora Claudia 👑',
    desc: 'Centro de Archivo Institucional, Radicación y Custodia Directiva. Le presentamos en 6 pasos rápidos cómo resguardar actas de consejo, emitir circulares y auditar toda la institución.',
    icon: 'Crown',
  },
  {
    targetId: 'tour-card-grades',
    title: 'Paso 1 · Notas y Calificaciones (SIEE)',
    desc: 'Supervise en tiempo real las planillas de Transición a 5°, ponderaciones del SIEE (80% Aula y 20% Examen), sábanas consolidadas y rankings de promedios por grado.',
    icon: 'ChartLineUp',
  },
  {
    targetId: 'tour-card-docs',
    title: 'Paso 2 · Circulares y Gestión Documental',
    desc: 'Emita circulares oficiales que generan globos de notificación activos a toda la planta docente. Audite planeaciones curriculares, guías y talleres organizados por docente.',
    icon: 'Megaphone',
  },
  {
    targetId: 'tour-card-boveda',
    title: 'Paso 3 · Bóveda Directiva Confidencial',
    desc: 'Resguardo de alta seguridad reservado para Rectoría con clave maestra. Custodie actas de Consejo Directivo, balances contables, contratos y soportes PEI por año lectivo.',
    icon: 'Vault',
  },
  {
    targetId: 'tour-card-matriculas',
    title: 'Paso 4 · Matrículas y Censo Escolar',
    desc: 'Inscriba estudiantes y supervise retiros. Por regla de oro de auditoría, ningún estudiante se elimina físicamente (Soft-Disable), protegiendo notas históricas y conteo de copias N+1.',
    icon: 'IdentificationBadge',
  },
  {
    targetId: 'tour-card-observador',
    title: 'Paso 5 · Observador y Comités Escolares',
    desc: 'Seguimiento formativo y disciplinario de estudiantes, citaciones a acudientes y repositorio de actas de comités (Convivencia, Evaluación y Consejo Académico).',
    icon: 'UserList',
  },
  {
    targetId: 'tour-card-docentes',
    title: 'Paso 6 · Planta Docente y Presencia en Vivo',
    desc: 'Consulte directores de curso y asignaciones de materias. Además, la barra superior le indica en tiempo real qué profesoras se encuentran conectadas en el colegio.',
    icon: 'Broadcast',
  },
];
