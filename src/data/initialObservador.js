/**
 * Datos Iniciales y Categorización Institucional: Observador del Estudiante y Actas de Comités
 * Gimnasio Martín Galeano - Básica Primaria
 */

export const OBSERVADOR_ROUTES = [
  {
    id: 'all',
    label: 'Todos los Registros',
    icon: 'ph-folders',
    group: 'general',
    description: 'Vista consolidada de anotaciones, citaciones y actas de comités'
  },
  // Bloque 1: Seguimiento a Estudiantes (Observador del Alumno)
  {
    id: 'observador',
    label: 'Observador del Estudiante',
    icon: 'ph-user-list',
    group: 'estudiantes',
    badgeClass: 'tag-pastel-teal',
    color: '#0f766e',
    bgColor: '#ccfbf1',
    description: 'Anotaciones pedagógicas, llamados de atención convivencial, méritos y felicitaciones'
  },
  {
    id: 'citaciones',
    label: 'Citaciones & Acudientes',
    icon: 'ph-users-three',
    group: 'estudiantes',
    badgeClass: 'tag-pastel-amber',
    color: '#b45309',
    bgColor: '#fef3c7',
    description: 'Actas de compromiso con padres de familia, descargos y acuerdos de corresponsabilidad'
  },
  {
    id: 'piar',
    label: 'Seguimiento Pedagógico & PIAR',
    icon: 'ph-brain',
    group: 'estudiantes',
    badgeClass: 'tag-pastel-blue',
    color: '#1d4ed8',
    bgColor: '#dbeafe',
    description: 'Planes Individuales de Ajustes Razonables (PIAR), refuerzo pedagógico y adaptaciones'
  },
  // Bloque 2: Actas de Comités Internos Institucionales
  {
    id: 'comite_convivencia',
    label: 'Comité de Convivencia Escolar',
    icon: 'ph-scales',
    group: 'comites',
    badgeClass: 'tag-pastel-purple',
    color: '#6b21a8',
    bgColor: '#f3e8ff',
    description: 'Aplicación de la Ley 1620, mediación de conflictos escolares, protocolos Tipo I, II y III'
  },
  {
    id: 'comision_evaluacion',
    label: 'Comisión de Evaluación y Promoción',
    icon: 'ph-chart-pie-slice',
    group: 'comites',
    badgeClass: 'tag-pastel-emerald',
    color: '#047857',
    bgColor: '#d1fae5',
    description: 'Decreto 1290, actas de cierre de periodo, estudiantes en riesgo académico y planes de superación'
  },
  {
    id: 'consejo_academico',
    label: 'Consejo Académico',
    icon: 'ph-graduation-cap',
    group: 'comites',
    badgeClass: 'tag-pastel-rose',
    color: '#be123c',
    bgColor: '#ffe4e6',
    description: 'Articulación de mallas curriculares por áreas, proyectos transversales y evaluación formativa'
  },
  {
    id: 'reuniones_docentes',
    label: 'Reuniones de Docentes & Asambleas',
    icon: 'ph-chalkboard-teacher',
    group: 'comites',
    badgeClass: 'tag-pastel-cyan',
    color: '#0e7490',
    bgColor: '#cffafe',
    description: 'Claustro de profesores, comités de área, jornadas pedagógicas y cronogramas de aula'
  }
];

/**
 * Matriz Oficial de Miembros de Comités Internos (Gobierno Escolar y Convivencia)
 * Gimnasio Martín Galeano - Básica Primaria
 * Exclusividad: Solo Rectoría (Claudia) puede convocar reuniones de comités.
 */
export const COMMITTEE_MEMBERS = {
  comite_convivencia: {
    id: 'comite_convivencia',
    name: 'Comité de Convivencia Escolar',
    convoker: 'Claudia (Rectora)',
    convokerKey: 'claudia',
    legalBasis: 'Ley 1620 de 2013',
    membersKeys: ['claudia', 'jessica', 'elcy'],
    memberNames: ['Claudia (Rectora)', 'Jessica (Rep. Docentes)', 'Elcy (Docente Primaria)', 'Coordinación & Padres'],
    description: 'Ruta de Atención Integral, mediación pacífica de conflictos y debido proceso'
  },
  comision_evaluacion: {
    id: 'comision_evaluacion',
    name: 'Comisión de Evaluación y Promoción',
    convoker: 'Claudia (Rectora)',
    convokerKey: 'claudia',
    legalBasis: 'Decreto 1290 de 2009',
    membersKeys: ['claudia', 'profe1', 'jessica', 'yuri', 'profe2', 'elcy', 'profe3'],
    memberNames: ['Claudia (Rectora)', 'Profe 1 (Transición)', 'Jessica (1°)', 'Yuri (2°)', 'Profe 2 (3°)', 'Elcy (4°)', 'Profe 3 (5°)'],
    description: 'Cierres de periodo lectivo, análisis de sábanas de calificaciones y planes de superación'
  },
  consejo_academico: {
    id: 'consejo_academico',
    name: 'Consejo Académico',
    convoker: 'Claudia (Rectora)',
    convokerKey: 'claudia',
    legalBasis: 'Ley 115 de 1994 (Art. 145)',
    membersKeys: ['claudia', 'jessica', 'yuri', 'profe2', 'elcy', 'profe3'],
    memberNames: ['Claudia (Rectora)', 'Jessica (Español)', 'Yuri (Ciencias Sociales)', 'Profe 2 (Matemáticas)', 'Elcy (Inglés)', 'Profe 3 (Ciencias Naturales)'],
    description: 'Alineación de mallas curriculares, Derechos Básicos de Aprendizaje (DBA) y proyectos pedagógicos'
  },
  reuniones_docentes: {
    id: 'reuniones_docentes',
    name: 'Reuniones de Docentes & Asambleas',
    convoker: 'Claudia (Rectora)',
    convokerKey: 'claudia',
    legalBasis: 'Claustro de Profesores',
    membersKeys: ['claudia', 'profe1', 'jessica', 'yuri', 'profe2', 'elcy', 'profe3'],
    memberNames: ['Claudia (Rectora)', 'Profe 1', 'Jessica', 'Yuri', 'Profe 2', 'Elcy', 'Profe 3'],
    description: 'Jornadas pedagógicas institucionales, cronogramas de aula y acuerdos institucionales'
  }
};

/**
 * Validador de membresía de un docente en un comité escolar
 * Integra dinámicamente las asignaciones directivas a criterio de Rectoría
 */
export function isUserCommitteeMember(committeeId, user) {
  if (!user) return false;
  const userRole = user.role || '';
  if (['admin', 'rectora', 'induccion_rectora', 'coordinador'].includes(userRole)) return true;

  // Consulta de asignaciones personalizadas de Rectoría desde localStorage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('gmg_committee_assignments_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[committeeId]) {
          const custom = parsed[committeeId];
          if (custom.isAllTeachers) return true;
          const userKey = (user.key || '').toLowerCase();
          const userName = (user.name || '').toLowerCase();
          const isAssigned = (custom.assignedTeachers || []).some((k) => {
            return k.toLowerCase() === userKey || userName.includes(k.toLowerCase());
          });
          return isAssigned;
        }
      }
    } catch {
      // Continuar con fallback
    }
  }

  const userKey = (user.key || '').toLowerCase();
  const userName = (user.name || '').toLowerCase();
  const committee = COMMITTEE_MEMBERS[committeeId];
  if (!committee) return false;
  return (
    committee.membersKeys.some((k) => k.toLowerCase() === userKey) ||
    committee.memberNames.some((n) => n.toLowerCase().includes(userName))
  );
}


/**
 * Configuración del Semáforo Convivencial e Institucional
 * 🔴 Rojo: Crítico / Falta grave / Alerta no resuelta (Va primero en la vista)
 * 🟡 Amarillo: En Seguimiento / Proceso / Compromiso vigente (Va en medio)
 * 🟢 Verde: Superado / Resuelto con solución documentada (Va al fondo / final)
 */
export const SEMAFORO_CONFIG = {
  rojo: {
    id: 'rojo',
    label: 'Alerta Crítica',
    color: '#dc2626',
    bgColor: '#fef2f2',
    borderColor: '#fca5a5',
    badgeClass: 'semaforo-badge-rojo',
    order: 1,
    icon: 'ph-warning-octagon',
    description: 'Casos pendientes con llamado de atención, faltas graves o acuerdos sin cumplir'
  },
  amarillo: {
    id: 'amarillo',
    label: 'En Seguimiento',
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    badgeClass: 'semaforo-badge-amarillo',
    order: 2,
    icon: 'ph-clock-countdown',
    description: 'Citaciones activas, acuerdos firmados en observación o planes de apoyo en desarrollo'
  },
  verde: {
    id: 'verde',
    label: 'Superado / Resuelto',
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    badgeClass: 'semaforo-badge-verde',
    order: 3,
    icon: 'ph-check-circle',
    description: 'Casos y compromisos con evidencia de cumplimiento y solución registrada'
  }
};

/**
 * Lista de docentes seleccionables al radicar un hecho (puede ser cualquiera del cuerpo docente)
 */
export const AVAILABLE_TEACHERS = [
  { key: 'profe1', name: 'Profe 1', label: 'Docente • Dir. Transición' },
  { key: 'jessica', name: 'Jessica', label: 'Docente Español • Dir. 1° Primaria' },
  { key: 'yuri', name: 'Yuri', label: 'Docente C. Sociales • Dir. 2° Primaria' },
  { key: 'profe2', name: 'Profe 2', label: 'Docente Matemáticas • Dir. 3° Primaria' },
  { key: 'elcy', name: 'Elcy', label: 'Docente Inglés • Dir. 4° Primaria' },
  { key: 'profe3', name: 'Profe 3', label: 'Docente C. Naturales • Dir. 5° Primaria' },
  { key: 'claudia', name: 'Claudia (Rectora)', label: 'Rectoría Institucional' }
];

export const RECORD_STATUSES = {
  compromiso_firmado: {
    id: 'compromiso_firmado',
    label: 'Compromiso Firmado',
    badgeClass: 'status-badge-teal',
    icon: 'ph-signature'
  },
  en_seguimiento: {
    id: 'en_seguimiento',
    label: 'En Seguimiento',
    badgeClass: 'status-badge-amber',
    icon: 'ph-clock-countdown'
  },
  resuelto: {
    id: 'resuelto',
    label: 'Superado / Resuelto',
    badgeClass: 'status-badge-emerald',
    icon: 'ph-check-circle'
  },
  acta_aprobada: {
    id: 'acta_aprobada',
    label: 'Acta Aprobada & Firmada',
    badgeClass: 'status-badge-indigo',
    icon: 'ph-seal-check'
  }
};

export const RECORD_TYPES = {
  felicitacion: {
    id: 'felicitacion',
    label: 'Mérito & Felicitación',
    badgeClass: 'type-badge-success',
    icon: 'ph-star'
  },
  falta_leve: {
    id: 'falta_leve',
    label: 'Falta Leve (Tipo I)',
    badgeClass: 'type-badge-warning',
    icon: 'ph-warning'
  },
  falta_grave: {
    id: 'falta_grave',
    label: 'Falta Grave (Tipo II)',
    badgeClass: 'type-badge-danger',
    icon: 'ph-warning-octagon'
  },
  falta_gravisima: {
    id: 'falta_gravisima',
    label: 'Falta Gravísima (Tipo III)',
    badgeClass: 'type-badge-danger',
    icon: 'ph-shield-warning'
  },
  piar_ajuste: {
    id: 'piar_ajuste',
    label: 'Ajuste Curricular PIAR',
    badgeClass: 'type-badge-info',
    icon: 'ph-brain'
  },
  ordinaria: {
    id: 'ordinaria',
    label: 'Sesión Ordinaria',
    badgeClass: 'type-badge-primary',
    icon: 'ph-calendar-check'
  },
  extraordinaria: {
    id: 'extraordinaria',
    label: 'Sesión Extraordinaria',
    badgeClass: 'type-badge-purple',
    icon: 'ph-lightning'
  }
};

export const initialObservadorRecords = [
  {
    id: 'OBS-2026-004',
    route: 'observador',
    title: 'Compromiso de Convivencia: Retardos reiterados y porte de uniforme',
    date: '09/10/2026, 07:15 a. m.',
    period: '1° Periodo',
    grade: '3° Primaria',
    teacher: 'Profe 2',
    studentId: 'EST-301',
    studentName: 'Emiliano Suárez Botero',
    type: 'falta_leve',
    semaforo: 'amarillo', // Inicialmente en seguimiento, pero su plazo venció el 16/10 y escalará a rojo
    status: 'en_seguimiento',
    description: 'El alumno registra 4 retardos consecutivos al ingreso de la primera hora de clase sin justificación médica, además de presentarse sin el suéter reglamentario del uniforme.',
    agreements: '1. El acudiente y el estudiante se comprometen a ingresar puntualmente a las 6:45 a. m.\n2. Presentación completa del uniforme según manual de convivencia.\n3. Plazo máximo de 1 semana para evidenciar cumplimiento estricto.',
    followUpDate: '16/10/2026', // Vencido hace 3 días
    notes: 'Plazo vencido sin reporte de subsanación.',
    resolutionNotes: '',
    resolutionImage: null,
    resolvedAt: null,
    resolvedBy: null
  },
  {
    id: 'CIT-2026-002',
    route: 'citaciones',
    title: 'Citación Urgente a Acudiente: Agresión verbal en descanso',
    date: '16/10/2026, 11:30 a. m.',
    period: '1° Periodo',
    grade: '4° Primaria',
    teacher: 'Elcy',
    studentId: 'EST-402',
    studentName: 'Samuel Esteban Parra',
    guardianName: 'Marcela Parra (Madre)',
    type: 'falta_grave',
    semaforo: 'rojo',
    status: 'en_seguimiento',
    description: 'En el descanso de la mañana se presentó altercado con uso de vocabulario soez hacia un compañero de 3° grado por disputa de balón de fútbol en la cancha.',
    agreements: '1. Presentación obligatoria de la madre de familia para firma de acta de mediación escolar.\n2. Redacción de carta de disculpa pedagógica y servicio voluntario en descanso.',
    followUpDate: '19/10/2026', // Vence hoy 19 de octubre
    notes: 'Citación prioritaria programada para la jornada de la tarde.',
    resolutionNotes: '',
    resolutionImage: null,
    resolvedAt: null,
    resolvedBy: null
  },
  {
    id: 'OBS-2026-002',
    route: 'observador',
    title: 'Llamado de Atención: Desacato reiterado de normas de aula',
    date: '14/10/2026, 10:15 a. m.',
    period: '1° Periodo',
    grade: '1° Primaria',
    teacher: 'Jessica',
    studentId: 'EST-102',
    studentName: 'Santiago Morales Peña',
    type: 'falta_leve',
    semaforo: 'rojo',
    status: 'en_seguimiento',
    description: 'El alumno interrumpe de manera reiterada la explicación de la docente en clase de Matemáticas, distrae a los compañeros de mesa arrojando borradores y se niega a abrir su cuaderno de actividades.',
    agreements: '1. El alumno se compromete a escuchar atentamente las indicaciones de la docente sin levantarse del puesto.\n2. Ubicación pedagógica en la primera fila para monitoreo visual.\n3. Si reitera el comportamiento en la presente semana, se citará formalmente al acudiente.',
    followUpDate: '21/10/2026',
    notes: 'Primera anotación pedagógica del periodo lectivo.',
    resolutionNotes: '',
    resolutionImage: null,
    resolvedAt: null,
    resolvedBy: null
  },
  {
    id: 'CIT-2026-001',
    route: 'citaciones',
    title: 'Acta de Compromiso: Incumplimiento reiterado de tareas escolares',
    date: '15/10/2026, 02:30 p. m.',
    period: '1° Periodo',
    grade: '2° Primaria',
    teacher: 'Yuri',
    studentId: 'EST-203',
    studentName: 'Nicolás Felipe Cárdenas',
    guardianName: 'Martha Patricia Cárdenas (Madre)',
    type: 'falta_leve',
    semaforo: 'amarillo',
    status: 'compromiso_firmado',
    description: 'Se realiza reunión presencial de orientación con la madre de familia debido a la no presentación de 4 talleres bimestrales en Ciencias Naturales y Matemáticas, evidenciando desatención en las actividades asignadas para la casa.',
    agreements: '1. La madre revisará diariamente el cuaderno de comunicaciones y firmará las tareas elaboradas.\n2. La docente Yuri habilitará plazo extraordinario hasta el 24 de octubre para la entrega nivelatoria de las guías pendientes con nota máxima sobre 3.8.\n3. Se establece seguimiento semanal conjunto docente-familia.',
    followUpDate: '24/10/2026',
    notes: 'Madre manifiesta total compromiso y disposición de acompañamiento en el hogar.',
    resolutionNotes: '',
    resolutionImage: null,
    resolvedAt: null,
    resolvedBy: null
  },
  {
    id: 'PIAR-2026-001',
    route: 'piar',
    title: 'Plan Individual de Ajustes Razonables (PIAR): Flexibilización en Lengua Castellana',
    date: '13/10/2026, 11:00 a. m.',
    period: '1° Periodo',
    grade: '4° Primaria',
    teacher: 'Elcy',
    studentId: 'EST-404',
    studentName: 'Catalina María Henao',
    guardianName: 'Roberto Henao (Padre)',
    type: 'piar_ajuste',
    semaforo: 'amarillo',
    status: 'en_seguimiento',
    description: 'De acuerdo con la valoración psicopedagógica externa y el diagnóstico de dislexia evolutiva leve, se formalizan ajustes metodológicos y de evaluación en el área de Lengua Castellana y Ciencias Sociales.',
    agreements: '1. Otorgar 20 minutos adicionales en las evaluaciones escritas.\n2. Priorizar la sustentación oral de conceptos y el uso de organizadores gráficos y mapas mentales.\n3. Evitar lectura en voz alta bajo presión frente al grupo.\n4. Informes mensuales de avance con los padres de familia.',
    followUpDate: '15/11/2026',
    notes: 'Ajuste concertado con la Dirección de Curso y la Coordinación Académica.',
    resolutionNotes: '',
    resolutionImage: null,
    resolvedAt: null,
    resolvedBy: null
  },
  {
    id: 'OBS-2026-001',
    route: 'observador',
    title: 'Anotación Positiva: Destacado compañerismo y colaboración',
    date: '16/10/2026, 09:30 a. m.',
    period: '1° Periodo',
    grade: 'Transición',
    teacher: 'Profe 1',
    studentId: 'TRA-001',
    studentName: 'Martín Alejandro Silva',
    type: 'felicitacion',
    semaforo: 'verde',
    status: 'resuelto',
    description: 'El estudiante demostró un admirable espíritu de solidaridad durante la jornada lúdica, apoyando voluntariamente a sus compañeros en la organización del material pedagógico y fomentando la resolución pacífica de turnos de juego.',
    agreements: 'Se registra felicitación en la hoja de vida institucional y se le otorga reconocimiento como monitor solidario de la semana.',
    followUpDate: '23/10/2026',
    notes: 'Excelente disposición y articulación con los valores institucionales del Gimnasio Martín Galeano.',
    resolutionNotes: 'El estudiante Martín Alejandro culminó la semana con felicitación y reconocimiento en formación general por su empatía y liderazgo positivo.',
    resolutionImage: null,
    resolvedAt: '17/10/2026, 11:00 a. m.',
    resolvedBy: 'Profe 1'
  },
  {
    id: 'ACT-CONV-001',
    route: 'comite_convivencia',
    title: 'Acta N° 01: Instalación del Comité y Revisión de Convivencia General',
    date: '10/10/2026, 03:00 p. m.',
    period: '1° Periodo',
    grade: 'Institucional',
    teacher: 'Claudia (Rectora)',
    sessionType: 'Ordinaria',
    attendees: 'Claudia (Rectora), Jessica (Docente 1°), Yuri (Docente 2°), Elcy (Docente 4°), Representante de Padres',
    type: 'ordinaria',
    semaforo: 'verde',
    status: 'acta_aprobada',
    description: '1. Verificación de quórum reglamentario según Ley 1620 de 2013.\n2. Socialización del estado de convivencia en Básica Primaria (cero casos Tipo II o Tipo III en el arranque del año).\n3. Diseño del plan de talleres preventivos de resolución asertiva de conflictos y buen trato escolar en los descansos.',
    agreements: '1. Se aprueba por unanimidad el cronograma de "Semana del Buen Trato" para el mes de noviembre.\n2. Docentes de primaria liderarán dinámicas de integración en las pausas activas.\n3. Próxima sesión ordinaria programada para el segundo viernes del siguiente mes.',
    followUpDate: '14/11/2026',
    notes: 'Acta leída, aprobada y firmada por todos los miembros del comité.',
    resolutionNotes: 'Sesión instalada exitosamente con el 100% de los miembros reglamentarios.',
    resolutionImage: null,
    resolvedAt: '10/10/2026, 04:30 p. m.',
    resolvedBy: 'Claudia (Rectora)'
  },
  {
    id: 'ACT-EVAL-001',
    route: 'comision_evaluacion',
    title: 'Acta N° 01: Balance Parcial de Rendimiento y Planes de Superación (Corte Mitad Periodo)',
    date: '17/10/2026, 01:30 p. m.',
    period: '1° Periodo',
    grade: 'Institucional',
    teacher: 'Claudia (Rectora)',
    sessionType: 'Ordinaria',
    attendees: 'Claudia (Rectora), Profe 1 (Transición), Jessica (1°), Yuri (2°), Profe 2 (3°), Elcy (4°), Profe 3 (5°)',
    type: 'ordinaria',
    semaforo: 'verde',
    status: 'acta_aprobada',
    description: 'En cumplimiento del Decreto 1290 y el SIEE del Gimnasio Martín Galeano, se analiza la sábana consolidada de calificaciones al 50% del primer bimestre lectivo. Se detectan 3 estudiantes con bajo desempeño en el área de Matemáticas en 2° y 3° grado.',
    agreements: '1. Activar talleres formativos de refuerzo pedagógico antes de las evaluaciones bimestrales finales.\n2. Directores de curso remitirán reporte de alerta temprana a los acudientes respectivos.\n3. Se valida el cumplimiento del modelo de evaluación continua SIEE (80% Aula Continua y 20% Evaluación Final) en todas las planillas.',
    followUpDate: '31/10/2026',
    notes: 'Participación del 100% de la planta docente institucional.',
    resolutionNotes: 'Planillas revisadas y compromisos de superación académica notificados.',
    resolutionImage: null,
    resolvedAt: '17/10/2026, 03:00 p. m.',
    resolvedBy: 'Claudia (Rectora)'
  },
  {
    id: 'ACT-EVAL-002',
    route: 'comision_evaluacion',
    title: 'Acta Extraordinaria N° 02: Superación de Riesgo Académico & Planillas Pendientes',
    date: '12/10/2026, 02:00 p. m.',
    period: '1° Periodo',
    grade: 'Institucional',
    teacher: 'Claudia (Rectora)',
    sessionType: 'Extraordinaria',
    attendees: 'Claudia (Rectora), Jessica (1°), Yuri (2°), Profe 2 (3°), Elcy (4°)',
    type: 'extraordinaria',
    semaforo: 'rojo',
    status: 'en_seguimiento',
    description: 'Revisión y consolidación de compromisos de nivelación académica para estudiantes con notas inferiores a 3.0 en el primer corte. Se fija plazo perentorio de entrega de evidencias.',
    agreements: '1. Citación a padres de familia de estudiantes con 2 o más asignaturas en desempeño bajo.\n2. Radicación de talleres de superación en la plataforma pedagógica.',
    followUpDate: '18/10/2026',
    notes: 'Acta pendiente de verificación y firmas de cierre.',
    resolutionNotes: '',
    resolutionImage: null,
    resolvedAt: null,
    resolvedBy: null
  },
  {
    id: 'ACT-ACAD-001',
    route: 'consejo_academico',
    title: 'Acta N° 02: Articulación Curricular DBA y Proyectos Transversales de Primaria',
    date: '12/10/2026, 08:00 a. m.',
    period: '1° Periodo',
    grade: 'Institucional',
    teacher: 'Claudia (Rectora)',
    sessionType: 'Ordinaria',
    attendees: 'Claudia (Rectora), Jessica, Yuri, Elcy, Profe 2',
    type: 'ordinaria',
    semaforo: 'verde',
    status: 'acta_aprobada',
    description: 'Revisión y alineación de las mallas curriculares de Básica Primaria con los Derechos Básicos de Aprendizaje (DBA) emitidos por el Ministerio de Educación Nacional. Articulación del proyecto transversal de Lectoescritura "Galeano Lee".',
    agreements: '1. Integrar 15 minutos diarios de lectura guiada en todas las áreas del conocimiento.\n2. Presentación de planeaciones pedagógicas del segundo periodo con matriz integrada de competencias.',
    followUpDate: '05/11/2026',
    notes: 'Aprobado formalmente por el Consejo Académico.',
    resolutionNotes: 'Mallas curriculares articuladas y validadas.',
    resolutionImage: null,
    resolvedAt: '12/10/2026, 09:30 a. m.',
    resolvedBy: 'Claudia (Rectora)'
  },
  {
    id: 'ACT-DOC-001',
    route: 'reuniones_docentes',
    title: 'Acta de Jornada Pedagógica: Cronograma Bimestral y Lineamientos de Aula',
    date: '08/10/2026, 07:30 a. m.',
    period: '1° Periodo',
    grade: 'Institucional',
    teacher: 'Claudia (Rectora)',
    sessionType: 'Ordinaria',
    attendees: 'Todo el cuerpo docente de Básica Primaria (Profe 1, Jessica, Yuri, Profe 2, Elcy, Profe 3) y Rectoría',
    type: 'ordinaria',
    semaforo: 'verde',
    status: 'acta_aprobada',
    description: 'Socialización del calendario escolar, protocolos de acompañamiento en descanso, unificación de formatos de observador del estudiante y criterios para citación oportuna a padres de familia.',
    agreements: '1. Todo llamado de atención formal debe constar en la plataforma con compromisos claros y medibles.\n2. Las citaciones a acudientes deben notificarse con al menos 48 horas de antelación salvo caso fortuito.',
    followUpDate: '30/10/2026',
    notes: 'Compromiso colectivo de puntualidad y registro riguroso de novedades pedagógicas.',
    resolutionNotes: 'Compromiso colectivo de puntualidad y acuerdos suscritos.',
    resolutionImage: null,
    resolvedAt: '08/10/2026, 09:00 a. m.',
    resolvedBy: 'Claudia (Rectora)'
  }
];
