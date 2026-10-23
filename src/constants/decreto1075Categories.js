/**
 * Clasificación Oficial de los 9 Pilares de Inspección y Vigilancia (Decreto 1075 de 2015)
 * y Esquema de Compilación y Radicación Colaborativa Institucional.
 */

export const COLLABORATION_TYPES = {
  COLLABORATIVE_ALL: 'collaborative_all',     // Construcción multi-área colegiada (todos los docentes aportan capítulos/áreas)
  ASSIGNED_ROLE: 'assigned_role',             // Docente titular, comité o área especializada asignada
  DIRECTIVO_EXCLUSIVE: 'directivo_exclusive'  // Exclusivo de Rectoría, Representante Legal y Consejo Directivo
};

export const SUBJECT_PREFIX_MAP = {
  'Matemáticas': 'MATEMATICAS_',
  'Lengua Castellana': 'ESPAÑOL_',
  'Ciencias Naturales': 'CIENCIAS_',
  'Ciencias Sociales': 'SOCIALES_',
  'Inglés': 'INGLES_',
  'Educación Artística': 'ARTISTICA_',
  'Educación Física': 'EDUFISICA_',
  'Religión': 'RELIGION_',
  'Ética y Valores': 'ETICA_',
  'Tecnología e Informática': 'TECNOLOGIA_',
  'Convivencia Escolar': 'CONVIVENCIA_',
  'Orientación Escolar': 'ORIENTACION_',
  'Institucional': 'INSTITUCIONAL_'
};

export const DECRETO_AREAS_REQUIRED = [
  { key: 'MATEMATICAS', label: 'Matemáticas', prefix: 'MATEMATICAS_' },
  { key: 'ESPAÑOL', label: 'Lengua Castellana', prefix: 'ESPAÑOL_' },
  { key: 'CIENCIAS', label: 'Ciencias Naturales', prefix: 'CIENCIAS_' },
  { key: 'SOCIALES', label: 'Ciencias Sociales', prefix: 'SOCIALES_' },
  { key: 'INGLES', label: 'Idioma Extranjero (Inglés)', prefix: 'INGLES_' },
  { key: 'CONVIVENCIA', label: 'Convivencia y Bienestar', prefix: 'CONVIVENCIA_' },
  { key: 'ORIENTACION', label: 'Orientación / Inclusión', prefix: 'ORIENTACION_' }
];

export const DECRETO_1075_PILLARS = [
  {
    id: 'pei',
    numero: 1,
    titulo: 'PEI (Proyecto Educativo Institucional)',
    articulos: 'Arts. 2.3.3.1.4.1 al 2.3.3.1.4.5',
    descripcion: 'Identidad, principios, objetivos, horizonte institucional y participación comunitaria.',
    badgeColor: 'border-rose-200 bg-rose-50 text-rose-800',
    icon: 'ph-book-bookmark',
    collaborationType: 'collaborative_all',
    tiposSugeridos: ['Documento PEI Vigente', 'Evidencia Construcción Comunitaria', 'Horizonte Institucional']
  },
  {
    id: 'siee',
    numero: 2,
    titulo: 'SIEE (Evaluación y Promoción)',
    articulos: 'Arts. 2.3.3.3.3.1 al 2.3.3.3.3.11',
    descripcion: 'Criterios de evaluación, escala de valoración, promoción anticipada y actas de comisiones.',
    badgeColor: 'border-blue-200 bg-blue-50 text-blue-800',
    icon: 'ph-check-square-offset',
    collaborationType: 'assigned_role',
    tiposSugeridos: ['Acuerdo Aprobación SIEE', 'Actas Comisiones de Promoción', 'Protocolo Nivelaciones']
  },
  {
    id: 'manual_convivencia',
    numero: 3,
    titulo: 'Manual de Convivencia & Ley 1620',
    articulos: 'Arts. 2.3.3.1.5.1 al 2.3.3.1.5.8',
    descripcion: 'Derechos, deberes, protocolos de atención integral y rutas de convivencia escolar.',
    badgeColor: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    icon: 'ph-users-three',
    collaborationType: 'assigned_role',
    tiposSugeridos: ['Manual Vigente Aprobado', 'Actas de Socialización a Padres', 'Protocolos Ruta Ley 1620']
  },
  {
    id: 'gobierno_escolar',
    numero: 4,
    titulo: 'Gobierno Escolar & Actas Directivas',
    articulos: 'Arts. 2.3.3.1.5.9 al 2.3.3.1.5.15',
    descripcion: 'Actas de Consejo Directivo, Consejo Académico, Consejo de Padres y Personería.',
    badgeColor: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: 'ph-buildings',
    collaborationType: 'directivo_exclusive',
    tiposSugeridos: ['Actas Consejo Directivo', 'Actas Consejo Académico', 'Actas Elección Gobierno Escolar']
  },
  {
    id: 'curriculo_plan_estudios',
    numero: 5,
    titulo: 'Currículo y Plan de Estudios',
    articulos: 'Arts. 2.3.3.3.2.1 al 2.3.3.3.2.10',
    descripcion: 'Organización de áreas obligatorias, intensidades horarias, mallas curriculares y flexibilidad.',
    badgeColor: 'border-indigo-200 bg-indigo-50 text-indigo-800',
    icon: 'ph-books',
    collaborationType: 'collaborative_all',
    tiposSugeridos: ['Malla Curricular Básica Primaria', 'Plan de Estudios por Asignatura', 'Distribución Horaria']
  },
  {
    id: 'organizacion_servicio',
    numero: 6,
    titulo: 'Organización del Servicio Educativo',
    articulos: 'Arts. 2.3.3.1.1.1 al 2.3.3.1.1.9',
    descripcion: 'Calendario escolar, resolución de costos educativos aprobada, matrículas y permanencia.',
    badgeColor: 'border-cyan-200 bg-cyan-50 text-cyan-800',
    icon: 'ph-calendar-check',
    collaborationType: 'directivo_exclusive',
    tiposSugeridos: ['Resolución Costos Educativos SED', 'Calendario Escolar Oficial', 'Libro de Matrículas']
  },
  {
    id: 'evaluacion_docente',
    numero: 7,
    titulo: 'Evaluación y Planta Docente',
    articulos: 'Arts. 2.4.1.1.22.1 al 2.4.1.1.22.4',
    descripcion: 'Evaluación de desempeño docente, directores de grado, perfiles de cargo y contratos.',
    badgeColor: 'border-teal-200 bg-teal-50 text-teal-800',
    icon: 'ph-chalkboard-teacher',
    collaborationType: 'directivo_exclusive',
    tiposSugeridos: ['Formatos Evaluación Desempeño', 'Asignaciones Académicas Oficiales', 'Hojas de Vida y Contratos']
  },
  {
    id: 'inclusion_piar',
    numero: 8,
    titulo: 'Inclusión & Diversidad (PIAR)',
    articulos: 'Arts. 2.3.3.5.1.1 al 2.3.3.5.7.3',
    descripcion: 'Planes Individuales de Ajustes Razonables (PIAR), informes pedagógicos y actas con familias.',
    badgeColor: 'border-violet-200 bg-violet-50 text-violet-800',
    icon: 'ph-puzzle-piece',
    collaborationType: 'assigned_role',
    tiposSugeridos: ['Expedientes PIAR Radicados', 'Actas de Acuerdo con Acudientes', 'Informes Psicopedagógicos']
  },
  {
    id: 'proyectos_transversales',
    numero: 9,
    titulo: 'Proyectos Pedagógicos Transversales',
    articulos: 'Arts. 2.3.3.4.1.1 al 2.3.3.4.1.9',
    descripcion: 'PRAE (Ambiental), PESCC (Sexualidad), Movilidad Escolar, Educación Financiera y Tiempo Libre.',
    badgeColor: 'border-orange-200 bg-orange-50 text-orange-800',
    icon: 'ph-globe-hemisphere-west',
    collaborationType: 'assigned_role',
    tiposSugeridos: ['Proyecto Ambiental Escolar (PRAE)', 'Proyecto de Sexualidad (PESCC)', 'Plan Movilidad y Prevención']
  }
];
