/**
 * Jerarquía de Datos Relacional (RBAC) - Sistema Integral de Calificaciones
 * 
 * Estructura de árbol estricta:
 * Año Lectivo (2026 / 2025)
 * └── Periodo (1°, 2°, 3°, 4°)
 *     └── Grado (Transición, 1°, 2°, 3°, 4°, 5°)
 *         ├── Director(a) de Curso Oficial por Grado
 *         └── Materia / Asignatura (Español, Matemáticas, etc.)
 *             ├── Asignación Docente de Materia (docente_id: 'jessica')
 *             └── Lista de Estudiantes
 *                 └── Registro de Calificación:
 *                     ├── Nota Numérica (Editable solo por docente_id de la materia)
 *                     ├── Retroalimentación Docente (Editable por docente_id)
 *                     └── Sugerencia Directiva (Editable solo por rol: rectora)
 * 
 * Rol de Directores de Curso:
 * - Un director de curso por grado obligatorio.
 * - Pueden ver TODAS las notas de sus alumnos de todas las materias del grado.
 * - NO pueden modificar notas ni retroalimentación de materias que no enseñan (Solo Lectura de acompañamiento).
 */

export const ACADEMIC_YEARS = ['2026', '2025'];

export const ACADEMIC_PERIODS = [
  '1° Periodo (25%)',
  '2° Periodo (25%)',
  '3° Periodo (25%)',
  '4° Periodo (25%)'
];

export const GRADES_LIST = [
  'Pre-Jardín',
  'Transición',
  '1° Primaria',
  '2° Primaria',
  '3° Primaria',
  '4° Primaria',
  '5° Primaria'
];

/**
 * Normaliza cualquier formato de grado (ej: "Primero (1°)", "1°", "primero", "prejardín")
 * a la nomenclatura canónica de GRADES_LIST.
 */
export function normalizeGrade(grade) {
  if (!grade) return '1° Primaria';
  const g = grade.toString().toLowerCase().trim();
  if (g.includes('pre-jard') || g.includes('prejard')) return 'Pre-Jardín';
  if (g.includes('transic')) return 'Transición';
  if (g.includes('primero') || g.includes('1')) return '1° Primaria';
  if (g.includes('segundo') || g.includes('2')) return '2° Primaria';
  if (g.includes('tercero') || g.includes('3')) return '3° Primaria';
  if (g.includes('cuarto') || g.includes('4')) return '4° Primaria';
  if (g.includes('quinto') || g.includes('5')) return '5° Primaria';
  return grade;
}

export const ALL_SUBJECTS = [
  'Lengua Castellana',
  'Matemáticas',
  'Ciencias Naturales',
  'Ciencias Sociales',
  'Inglés',
  'Educación Artística',
  'Educación Física',
  'Religión',
  'Ética & Valores'
];

/**
 * Materias Oficiales con Evaluación Final Acumulativa Escrita (SIEE):
 * - 4 evaluaciones acumulativas oficiales al año (1 por cada periodo académico: 1°, 2°, 3° y 4° Periodo).
 * - Se radican, aprueban e imprimen/fotocopian en Coordinación Académica y Secretaría.
 */
export const FINAL_EXAM_SUBJECTS = [
  'Lengua Castellana',
  'Matemáticas',
  'Ciencias Naturales',
  'Ciencias Sociales',
  'Inglés'
];

/**
 * Materias Formativas / Prácticas SIN Evaluación Final Escrita para Impresión:
 * - En el Gimnasio Martín Galeano, el 20% institucional de estas áreas se obtiene
 *   de actividades continuas, formativas, prácticas y vivenciales de aula (no de prueba escrita).
 */
export const EXCLUDED_FINAL_EXAM_SUBJECTS = [
  'Educación Artística',
  'Educación Física',
  'Religión',
  'Ética & Valores'
];

/**
 * Determina si una materia cuenta con evaluación final acumulativa escrita para fotocopiado.
 * @param {string} subject Nombre de la asignatura
 * @returns {boolean}
 */
export function subjectHasFinalExam(subject) {
  if (!subject) return false;
  const s = subject.toLowerCase().trim();
  if (s.includes('art')) return false; // Educación Artística
  if (s.includes('física') || s.includes('fisica')) return false; // Educación Física
  if (s.includes('relig')) return false; // Religión
  if (s.includes('ética') || s.includes('etica')) return false; // Ética & Valores
  return true;
}

// Directores de Curso Oficiales por Grado (Exactamente 1 Director por Grado)
export const GRADE_DIRECTORS = {
  'Pre-Jardín': { docente_id: 'liliana', teacherName: 'Liliana' },
  'Transición': { docente_id: 'liliana', teacherName: 'Liliana' },
  '1° Primaria': { docente_id: 'yuri', teacherName: 'Yuri' },
  '2° Primaria': { docente_id: 'elcy', teacherName: 'Elcy' },
  '3° Primaria': { docente_id: 'blanca', teacherName: 'Blanca' },
  '4° Primaria': { docente_id: 'nicolle', teacherName: 'Nicolle' },
  '5° Primaria': { docente_id: 'jessica', teacherName: 'Jessica' },
};

// Estudiantes matriculados por Grado (Roster Base Institucional)
export const STUDENTS_BY_GRADE = {
  'Pre-Jardín': [
    { id: 'PRJ-001', name: 'Thiago Emmanuel Vargas', acudiente: 'Camila Vargas (Madre) - Cel: 310 987 6543', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'PRJ-002', name: 'Mia Antonella Castillo', acudiente: 'Juan Castillo (Padre) - Cel: 315 876 5432', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'PRJ-003', name: 'Lucas Gabriel Cárdenas', acudiente: 'Diana Cárdenas (Madre) - Cel: 320 765 4321', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'PRJ-004', name: 'Emma Lucía Gómez', acudiente: 'Sebastián Gómez (Padre) - Cel: 318 654 3210', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
  ],
  'Transición': [
    { id: 'TRA-001', name: 'Martín Alejandro Silva', acudiente: 'Claudia Silva (Madre) - Cel: 311 204 8891', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'TRA-002', name: 'Sofía Isabella Torres', acudiente: 'Carlos Torres (Padre) - Cel: 315 489 1234', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'TRA-003', name: 'Jerónimo David Cruz', acudiente: 'Paola Cruz (Madre) - Cel: 320 812 4578', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'TRA-004', name: 'Sara Valentina Mendoza', acudiente: 'Julián Mendoza (Padre) - Cel: 318 642 9012', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'TRA-005', name: 'Emiliano José Quintero', acudiente: 'Marcela Quintero (Madre) - Cel: 313 755 3321', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
  ],
  '1° Primaria': [
    { id: 'EST-101', name: 'Valentina Gómez Álvarez', acudiente: 'Marta Álvarez (Madre) - Cel: 310 892 1102', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-102', name: 'Santiago Morales Peña', acudiente: 'Andrés Morales (Padre) - Cel: 314 556 7891', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-103', name: 'Luciana Herrera Rincón', acudiente: 'Patricia Rincón (Madre) - Cel: 312 901 3456', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-104', name: 'Mateo Pardo Beltrán', acudiente: 'Diego Pardo (Padre) - Cel: 316 234 5678', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-105', name: 'Mariana Ríos Restrepo', acudiente: 'Gloria Restrepo (Madre) - Cel: 317 445 6789', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-106', name: 'Samuel Castro Ortiz', acudiente: 'Fernando Castro (Padre) - Cel: 319 887 6543', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
  ],
  '2° Primaria': [
    { id: 'EST-201', name: 'Gabriel Andrés Rojas', acudiente: 'Lorena Rojas (Madre) - Cel: 310 123 4567', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-202', name: 'Antonella María Duarte', acudiente: 'Mario Duarte (Padre) - Cel: 315 234 5678', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-203', name: 'Nicolás Felipe Cárdenas', acudiente: 'Liliana Cárdenas (Madre) - Cel: 320 345 6789', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-204', name: 'Valeria Estefanía Nieto', acudiente: 'Camilo Nieto (Padre) - Cel: 318 456 7890', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-205', name: 'Tomás Alejandro Ospina', acudiente: 'Adriana Ospina (Madre) - Cel: 313 567 8901', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-206', name: 'Camila Victoria Paredes', acudiente: 'Guillermo Paredes (Padre) - Cel: 311 678 9012', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
  ],
  '3° Primaria': [
    { id: 'EST-301', name: 'Daniel Esteban Méndez', acudiente: 'Helena Méndez (Madre) - Cel: 314 789 0123', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-302', name: 'Salomé Patricia Vega', acudiente: 'Rodrigo Vega (Padre) - Cel: 312 890 1234', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-303', name: 'Juan Pablo Salazar', acudiente: 'Beatriz Salazar (Madre) - Cel: 316 901 2345', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-304', name: 'Isabella Gómez Navarro', acudiente: 'Óscar Gómez (Padre) - Cel: 317 012 3456', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-305', name: 'Andrés Camilo Bernal', acudiente: 'Viviana Bernal (Madre) - Cel: 319 123 4567', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
  ],
  '4° Primaria': [
    { id: 'EST-401', name: 'Alejandro Morales Londoño', acudiente: 'Daniela Londoño (Madre) - Cel: 310 234 5678', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-402', name: 'Manuela Sofía Castaño', acudiente: 'Víctor Castaño (Padre) - Cel: 315 345 6789', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-403', name: 'Felipe José Agudelo', acudiente: 'Clara Agudelo (Madre) - Cel: 320 456 7890', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-404', name: 'Catalina María Henao', acudiente: 'Javier Henao (Padre) - Cel: 318 567 8901', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-405', name: 'David Santiago Montoya', acudiente: 'Mónica Montoya (Madre) - Cel: 313 678 9012', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
  ],
  '5° Primaria': [
    { id: 'EST-501', name: 'Sebastián Camilo Roldán', acudiente: 'Nelson Roldán (Padre) - Cel: 311 789 0123', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-502', name: 'Gabriela Lucía Jaramillo', acudiente: 'Diana Jaramillo (Madre) - Cel: 314 890 1234', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-503', name: 'Esteban Darío Bustamante', acudiente: 'Gustavo Bustamante (Padre) - Cel: 312 901 2345', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-504', name: 'Mariángel Sofía Forero', acudiente: 'Sandra Forero (Madre) - Cel: 316 012 3456', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
    { id: 'EST-505', name: 'Julián Andrés Echeverry', acudiente: 'Felipe Echeverry (Padre) - Cel: 317 123 4567', fechaIngreso: '2026-02-02', tipoIngreso: 'Matrícula Regular' },
  ]
};

// Matriz de Asignación Docente Oficial por (Grado, Materia)
// Reglas Oficiales:
// - Preescolar (Pre-Jardín y Transición): Liliana a cargo de todas las asignaturas
// - Rotación de Especialistas en Básica Primaria (1° a 5°):
//   • 1° Primaria / Directora: Yuri (Especialista en Ciencias Naturales y Ciencias Sociales)
//   • 2° Primaria / Directora: Elcy (Especialista en Inglés)
//   • 3° Primaria / Directora: Blanca (Especialista en Matemáticas)
//   • 4° Primaria / Directora: Nicolle (Especialista en Ciencias Sociales)
//   • 5° Primaria / Directora: Jessica (Especialista en Español / Lengua Castellana)
//   • Asignaturas formativas (Educación Artística, Religión, Educación Física, Ética & Valores): Directora de curso de cada grado
export const TEACHER_CURRICULUM_ASSIGNMENTS = {
  // Pre-Jardín (Directora de Curso: Liliana - Todas las asignaturas)
  'Pre-Jardín': {
    'Lengua Castellana': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Matemáticas': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Ciencias Naturales': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Ciencias Sociales': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Inglés': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Educación Artística': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Religión': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Educación Física': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Ética & Valores': { docente_id: 'liliana', teacherName: 'Liliana' },
  },
  // Transición (Directora de Curso: Liliana - Todas las asignaturas)
  'Transición': {
    'Lengua Castellana': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Matemáticas': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Ciencias Naturales': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Ciencias Sociales': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Inglés': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Educación Artística': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Religión': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Educación Física': { docente_id: 'liliana', teacherName: 'Liliana' },
    'Ética & Valores': { docente_id: 'liliana', teacherName: 'Liliana' },
  },
  // 1° Primaria (Directora de Curso: Yuri - Ciencias)
  '1° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'blanca', teacherName: 'Blanca' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'nicolle', teacherName: 'Nicolle' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Religión': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Educación Física': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ética & Valores': { docente_id: 'yuri', teacherName: 'Yuri' },
  },
  // 2° Primaria (Directora de Curso: Elcy - Inglés)
  '2° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'blanca', teacherName: 'Blanca' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'nicolle', teacherName: 'Nicolle' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Religión': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Física': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Ética & Valores': { docente_id: 'elcy', teacherName: 'Elcy' },
  },
  // 3° Primaria (Directora de Curso: Blanca - Matemáticas)
  '3° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'blanca', teacherName: 'Blanca' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'nicolle', teacherName: 'Nicolle' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'blanca', teacherName: 'Blanca' },
    'Religión': { docente_id: 'blanca', teacherName: 'Blanca' },
    'Educación Física': { docente_id: 'blanca', teacherName: 'Blanca' },
    'Ética & Valores': { docente_id: 'blanca', teacherName: 'Blanca' },
  },
  // 4° Primaria (Directora de Curso: Nicolle - Sociales)
  '4° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'blanca', teacherName: 'Blanca' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'nicolle', teacherName: 'Nicolle' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'nicolle', teacherName: 'Nicolle' },
    'Religión': { docente_id: 'nicolle', teacherName: 'Nicolle' },
    'Educación Física': { docente_id: 'nicolle', teacherName: 'Nicolle' },
    'Ética & Valores': { docente_id: 'nicolle', teacherName: 'Nicolle' },
  },
  // 5° Primaria (Directora de Curso: Jessica - Español)
  '5° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'blanca', teacherName: 'Blanca' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'nicolle', teacherName: 'Nicolle' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Religión': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Educación Física': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Ética & Valores': { docente_id: 'jessica', teacherName: 'Jessica' },
  }
};

/**
 * Generador de notas iniciales para una rama específica del árbol
 * Compatible con el nuevo motor flexible 80% Aula Continua / 20% Evaluación Final
 */
export const createInitialRosterForBranch = (grade, subject, period) => {
  const students = STUDENTS_BY_GRADE[grade] || STUDENTS_BY_GRADE['1° Primaria'];
  
  // Notas con variaciones pedagógicas realistas
  const presets = [
    { a1: 4.8, a2: 4.5, a3: 4.7, ef: 5.0, retro: 'Excelente autonomía y participación activa en clase.', dir: 'Felicitaciones por el destacado desempeño académico.' },
    { a1: 4.0, a2: 4.2, a3: 3.9, ef: null, retro: 'Cumplido con sus actividades y tareas diarias.', dir: '' },
    { a1: 4.6, a2: 4.7, a3: 4.8, ef: 4.8, retro: 'Gran liderazgo en proyectos de grupo.', dir: 'Candidata a cuadro de honor institucional.' },
    { a1: 3.6, a2: 3.8, a3: 3.5, ef: null, retro: 'Progreso notable en la conceptualización.', dir: '' },
    { a1: 4.2, a2: 4.1, a3: 4.5, ef: 4.5, retro: 'Ordenado y con disposición positiva.', dir: '' },
    { a1: 3.0, a2: 3.2, a3: 3.4, ef: null, retro: 'Reforzar talleres continuos en casa.', dir: 'Sugerido plan de mejoramiento preventivo.' },
  ];

  return students.map((st, i) => {
    const p = presets[i % presets.length];
    return {
      id: st.id,
      name: st.name,
      acudiente: st.acudiente || 'Acudiente registrado en secretaría',
      fechaIngreso: st.fechaIngreso || '2026-02-02',
      tipoIngreso: st.tipoIngreso || 'Matrícula Regular',
      active: st.active !== undefined ? st.active : true,
      status: st.status || 'activo',
      inhabilitado: Boolean(st.inhabilitado),
      motivoRetiro: st.motivoRetiro || null,
      fechaRetiro: st.fechaRetiro || null,
      // Diccionario de actividades continuas de aula (80%)
      scores: {
        act_1: p.a1,
        act_2: p.a2,
        act_3: p.a3
      },
      // Evaluación Final (20%) - Si es null, el motor proyecta la simulación con 1.0
      evaluacionFinal: p.ef,
      // Campos legados para compatibilidad hacia atrás
      c1: p.a1,
      c2: p.a2,
      c3: p.ef || '',
      retroalimentacionDocente: p.retro,
      sugerenciaDirectiva: p.dir,
      comentarioAuditoria: ''
    };
  });
};
