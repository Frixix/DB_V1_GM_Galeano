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
  'Transición',
  '1° Primaria',
  '2° Primaria',
  '3° Primaria',
  '4° Primaria',
  '5° Primaria'
];

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

// Directores de Curso Oficiales por Grado (Exactamente 1 Director por Grado)
export const GRADE_DIRECTORS = {
  'Transición': { docente_id: 'profe1', teacherName: 'Profe 1' },
  '1° Primaria': { docente_id: 'jessica', teacherName: 'Jessica' },
  '2° Primaria': { docente_id: 'yuri', teacherName: 'Yuri' },
  '3° Primaria': { docente_id: 'profe2', teacherName: 'Profe 2' },
  '4° Primaria': { docente_id: 'elcy', teacherName: 'Elcy' },
  '5° Primaria': { docente_id: 'profe3', teacherName: 'Profe 3' },
};

// Estudiantes matriculados por Grado
export const STUDENTS_BY_GRADE = {
  'Transición': [
    { id: 'TRA-001', name: 'Martín Alejandro Silva' },
    { id: 'TRA-002', name: 'Sofía Isabella Torres' },
    { id: 'TRA-003', name: 'Jerónimo David Cruz' },
    { id: 'TRA-004', name: 'Sara Valentina Mendoza' },
    { id: 'TRA-005', name: 'Emiliano José Quintero' },
  ],
  '1° Primaria': [
    { id: 'EST-101', name: 'Valentina Gómez Álvarez' },
    { id: 'EST-102', name: 'Santiago Morales Peña' },
    { id: 'EST-103', name: 'Luciana Herrera Rincón' },
    { id: 'EST-104', name: 'Mateo Pardo Beltrán' },
    { id: 'EST-105', name: 'Mariana Ríos Restrepo' },
    { id: 'EST-106', name: 'Samuel Castro Ortiz' },
  ],
  '2° Primaria': [
    { id: 'EST-201', name: 'Gabriel Andrés Rojas' },
    { id: 'EST-202', name: 'Antonella María Duarte' },
    { id: 'EST-203', name: 'Nicolás Felipe Cárdenas' },
    { id: 'EST-204', name: 'Valeria Estefanía Nieto' },
    { id: 'EST-205', name: 'Tomás Alejandro Ospina' },
    { id: 'EST-206', name: 'Camila Victoria Paredes' },
  ],
  '3° Primaria': [
    { id: 'EST-301', name: 'Daniel Esteban Méndez' },
    { id: 'EST-302', name: 'Salomé Patricia Vega' },
    { id: 'EST-303', name: 'Juan Pablo Salazar' },
    { id: 'EST-304', name: 'Isabella Gómez Navarro' },
    { id: 'EST-305', name: 'Andrés Camilo Bernal' },
  ],
  '4° Primaria': [
    { id: 'EST-401', name: 'Alejandro Morales Londoño' },
    { id: 'EST-402', name: 'Manuela Sofía Castaño' },
    { id: 'EST-403', name: 'Felipe José Agudelo' },
    { id: 'EST-404', name: 'Catalina María Henao' },
    { id: 'EST-405', name: 'David Santiago Montoya' },
  ],
  '5° Primaria': [
    { id: 'EST-501', name: 'Sebastián Camilo Roldán' },
    { id: 'EST-502', name: 'Gabriela Lucía Jaramillo' },
    { id: 'EST-503', name: 'Esteban Darío Bustamante' },
    { id: 'EST-504', name: 'Mariángel Sofía Forero' },
    { id: 'EST-505', name: 'Julián Andrés Echeverry' },
  ]
};

// Matriz de Asignación Docente Oficial por (Grado, Materia)
// Reglas Oficiales:
// - Elcy: Especialista institucional en Inglés
// - Jessica: Especialista institucional en Lengua Castellana (Español)
// - Yuri: Especialista institucional en Ciencias Naturales y Ciencias Sociales
// - Artes (Educación Artística), Religión y Educación Física: Asignadas a la misma docente Directora de Curso del grado
// - Profe 2: Docente de Matemáticas (1° a 5°)
// - Profe 1: Docente titular y Directora de Transición
// - Profe 3: Docente titular y Directora de 5° Primaria
// - Ética & Valores: Dirección de curso y formación integral por grado
export const TEACHER_CURRICULUM_ASSIGNMENTS = {
  // Transición (Directora de Curso: Profe 1)
  'Transición': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'profe1', teacherName: 'Profe 1' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'profe1', teacherName: 'Profe 1' },
    'Religión': { docente_id: 'profe1', teacherName: 'Profe 1' },
    'Educación Física': { docente_id: 'profe1', teacherName: 'Profe 1' },
    'Ética & Valores': { docente_id: 'profe1', teacherName: 'Profe 1' },
  },
  // 1° Primaria (Directora de Curso: Jessica)
  '1° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'profe2', teacherName: 'Profe 2' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Religión': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Educación Física': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Ética & Valores': { docente_id: 'jessica', teacherName: 'Jessica' },
  },
  // 2° Primaria (Directora de Curso: Yuri)
  '2° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'profe2', teacherName: 'Profe 2' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Religión': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Educación Física': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ética & Valores': { docente_id: 'yuri', teacherName: 'Yuri' },
  },
  // 3° Primaria (Directora de Curso: Profe 2)
  '3° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'profe2', teacherName: 'Profe 2' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'profe2', teacherName: 'Profe 2' },
    'Religión': { docente_id: 'profe2', teacherName: 'Profe 2' },
    'Educación Física': { docente_id: 'profe2', teacherName: 'Profe 2' },
    'Ética & Valores': { docente_id: 'profe2', teacherName: 'Profe 2' },
  },
  // 4° Primaria (Directora de Curso: Elcy)
  '4° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'profe2', teacherName: 'Profe 2' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Religión': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Física': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Ética & Valores': { docente_id: 'elcy', teacherName: 'Elcy' },
  },
  // 5° Primaria (Directora de Curso: Profe 3)
  '5° Primaria': {
    'Lengua Castellana': { docente_id: 'jessica', teacherName: 'Jessica' },
    'Matemáticas': { docente_id: 'profe2', teacherName: 'Profe 2' },
    'Ciencias Naturales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Ciencias Sociales': { docente_id: 'yuri', teacherName: 'Yuri' },
    'Inglés': { docente_id: 'elcy', teacherName: 'Elcy' },
    'Educación Artística': { docente_id: 'profe3', teacherName: 'Profe 3' },
    'Religión': { docente_id: 'profe3', teacherName: 'Profe 3' },
    'Educación Física': { docente_id: 'profe3', teacherName: 'Profe 3' },
    'Ética & Valores': { docente_id: 'profe3', teacherName: 'Profe 3' },
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
