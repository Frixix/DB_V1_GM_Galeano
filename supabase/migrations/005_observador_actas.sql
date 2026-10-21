-- ========================================================
-- SISTEMA DE OBSERVADOR DEL ALUMNO & ACTAS DE CONVIVENCIA
-- GIMNASIO MARTÍN GALEANO — BÁSICA PRIMARIA
-- Migración 005: Esquema de Observador, Citaciones y Comités
-- ========================================================

-- 1. Tabla de Registros del Observador y Actas de Comités
create table if not exists observador_records (
  id text primary key,
  route text not null,
  title text not null,
  date text not null,
  period text,
  grade text,
  teacher text not null,
  student_id text,
  student_name text,
  guardian_name text,
  session_type text,
  attendees text,
  type text,
  semaforo text not null default 'amarillo',
  status text not null default 'en_seguimiento',
  description text,
  agreements text,
  follow_up_date text,
  follow_up_date_iso text,
  file_name text,
  storage_key text,
  notes text,
  resolution_notes text,
  resolution_image text,
  resolved_at text,
  resolved_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Habilitar Seguridad RLS y Políticas de Acceso Idempotentes
alter table observador_records enable row level security;

drop policy if exists "Lectura de observador_records" on observador_records;
create policy "Lectura de observador_records" on observador_records for select using (true);

drop policy if exists "Insercion de observador_records" on observador_records;
create policy "Insercion de observador_records" on observador_records for insert with check (true);

drop policy if exists "Actualizacion de observador_records" on observador_records;
create policy "Actualizacion de observador_records" on observador_records for update using (true);

drop policy if exists "Eliminacion de observador_records" on observador_records;
create policy "Eliminacion de observador_records" on observador_records for delete using (true);

-- 3. Habilitar Realtime para sincronización instantánea entre directivos y docentes
do $$ 
begin
  alter publication supabase_realtime add table observador_records;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 4. Índices de Búsqueda Rápida y Filtrado
create index if not exists idx_observador_route on observador_records (route);
create index if not exists idx_observador_grade on observador_records (grade);
create index if not exists idx_observador_semaforo on observador_records (semaforo);
create index if not exists idx_observador_status on observador_records (status);
create index if not exists idx_observador_teacher on observador_records (teacher);

-- 5. Inserción de Registros Iniciales Institucionales (Datos Semilla)
insert into observador_records (
  id, route, title, date, period, grade, teacher, student_id, student_name, guardian_name,
  session_type, attendees, type, semaforo, status, description, agreements, follow_up_date,
  notes, resolution_notes, resolution_image, resolved_at, resolved_by
) values
(
  'OBS-2026-004',
  'observador',
  'Compromiso de Convivencia: Retardos reiterados y porte de uniforme',
  '09/10/2026, 07:15 a. m.',
  '1° Periodo',
  '3° Primaria',
  'Profe 2',
  'EST-301',
  'Emiliano Suárez Botero',
  null,
  null,
  null,
  'falta_leve',
  'amarillo',
  'en_seguimiento',
  'El alumno registra 4 retardos consecutivos al ingreso de la primera hora de clase sin justificación médica, además de presentarse sin el suéter reglamentario del uniforme.',
  '1. El acudiente y el estudiante se comprometen a ingresar puntualmente a las 6:45 a. m. 2. Presentación completa del uniforme según manual de convivencia. 3. Plazo máximo de 1 semana para evidenciar cumplimiento estricto.',
  '16/10/2026',
  'Plazo vencido sin reporte de subsanación.',
  '',
  null,
  null,
  null
),
(
  'CIT-2026-002',
  'citaciones',
  'Citación Urgente a Acudiente: Agresión verbal en descanso',
  '16/10/2026, 11:30 a. m.',
  '1° Periodo',
  '4° Primaria',
  'Elcy',
  'EST-402',
  'Samuel Esteban Parra',
  'Marcela Parra (Madre)',
  null,
  null,
  'falta_grave',
  'rojo',
  'en_seguimiento',
  'En el descanso de la mañana se presentó altercado con uso de vocabulario soez hacia un compañero de 3° grado por disputa de balón de fútbol en la cancha.',
  '1. Presentación obligatoria de la madre de familia para firma de acta de mediación escolar. 2. Redacción de carta de disculpa pedagógica y servicio voluntario en descanso.',
  '19/10/2026',
  'Citación prioritaria programada para la jornada de la tarde.',
  '',
  null,
  null,
  null
),
(
  'PIAR-2026-001',
  'piar',
  'Ajuste Razonable PIAR: Flexibilización en comprensión de lectura',
  '10/10/2026, 08:45 a. m.',
  '1° Periodo',
  '2° Primaria',
  'Yuri',
  'EST-201',
  'Matías Alejandro Gómez',
  null,
  null,
  null,
  'felicitacion',
  'amarillo',
  'en_seguimiento',
  'Implementación de textos con apoyo pictográfico y mayor tiempo de respuesta en evaluaciones formativas de Lengua Castellana y Ciencias.',
  '1. Seguimiento pedagógico semanal con material adaptado. 2. Acompañamiento en casa 20 minutos diarios con lecturas cortas guiadas.',
  '24/10/2026',
  'Evolución positiva en fluidez verbal básica.',
  '',
  null,
  null,
  null
),
(
  'ACT-CONV-2026-001',
  'comite_convivencia',
  'Acta Ordinaria N° 01: Apertura de Convivencia Escolar 2026',
  '14/10/2026, 02:00 p. m.',
  '1° Periodo',
  'Institucional',
  'Claudia (Rectora)',
  null,
  null,
  null,
  'Ordinaria',
  'Claudia (Rectora), Jessica (Rep. Docentes), Elcy (Docente Primaria), Coordinación & Padres',
  'ordinaria',
  'verde',
  'acta_aprobada',
  'Instalación formal del Comité Escolar de Convivencia para el año lectivo 2026 conforme a la Ley 1620 de 2013. Se revisan los protocolos de atención integral.',
  '1. Socializar la ruta de atención integral Tipo I, II y III con directores de curso. 2. Establecer cronograma bimensual de mediación y seguimiento preventivo.',
  '14/11/2026',
  'Comité instalado formalmente con quórum del 100%.',
  'Acta firmada y registrada en el archivo de Rectoría.',
  null,
  '14/10/2026, 03:30 p. m.',
  'Claudia (Rectora)'
),
(
  'ACT-EVAL-2026-001',
  'comision_evaluacion',
  'Acta Comisión Evaluación: Corte 50% Primer Periodo Lectivo',
  '17/10/2026, 01:30 p. m.',
  '1° Periodo',
  'Institucional',
  'Claudia (Rectora)',
  null,
  null,
  null,
  'Ordinaria',
  'Claudia (Rectora), Profe 1 (Transición), Jessica (1°), Yuri (2°), Profe 2 (3°), Elcy (4°), Profe 3 (5°)',
  'ordinaria',
  'verde',
  'acta_aprobada',
  'En cumplimiento del Decreto 1290 y el SIEE del Gimnasio Martín Galeano, se analiza la sábana consolidada de calificaciones al 50% del primer bimestre lectivo. Se detectan 3 estudiantes con bajo desempeño en el área de Matemáticas en 2° y 3° grado.',
  '1. Activar talleres formativos de refuerzo pedagógico antes de las evaluaciones bimestrales finales. 2. Directores de curso remitirán reporte de alerta temprana a los acudientes respectivos. 3. Se valida el cumplimiento del modelo de evaluación continua SIEE (80% Aula Continua y 20% Evaluación Final) en todas las planillas.',
  '31/10/2026',
  'Participación del 100% de la planta docente institucional.',
  'Planillas revisadas y compromisos de superación académica notificados.',
  null,
  '17/10/2026, 03:00 p. m.',
  'Claudia (Rectora)'
),
(
  'ACT-ACAD-2026-001',
  'consejo_academico',
  'Acta Consejo Académico: Articulación Curricular por Áreas',
  '12/10/2026, 03:15 p. m.',
  '1° Periodo',
  'Institucional',
  'Claudia (Rectora)',
  null,
  null,
  null,
  'Ordinaria',
  'Claudia (Rectora), Jessica (Español), Yuri (Sociales), Profe 2 (Matemáticas), Elcy (Inglés), Profe 3 (Ciencias)',
  'ordinaria',
  'verde',
  'acta_aprobada',
  'Revisión y unificación de mallas curriculares según los Derechos Básicos de Aprendizaje (DBA) para Básica Primaria.',
  '1. Entregar ajustes a planeaciones antes del 20 de octubre. 2. Incluir proyectos transversales de lectura crítica en el cronograma institucional.',
  '20/10/2026',
  'Aprobación unánime del claustro académico.',
  'Planeaciones curriculares consolidadas en Recursos Pedagógicos.',
  null,
  '12/10/2026, 04:45 p. m.',
  'Claudia (Rectora)'
),
(
  'ACT-DOC-2026-001',
  'reuniones_docentes',
  'Reunión General de Docentes: Cronograma y Eventos Institucionales',
  '15/10/2026, 02:30 p. m.',
  '1° Periodo',
  'Institucional',
  'Claudia (Rectora)',
  null,
  null,
  null,
  'Ordinaria',
  'Claudia (Rectora), Profe 1, Jessica, Yuri, Profe 2, Elcy, Profe 3',
  'ordinaria',
  'verde',
  'acta_aprobada',
  'Jornada pedagógica para coordinar calendario de izadas de bandera, simulacros institucionales y salidas de campo.',
  '1. Profe 2 coordinará la primera izada de bandera de matemáticas. 2. Cada directora de grado enviará circular informativa a padres con 3 días de anticipación.',
  '22/10/2026',
  'Acuerdos pedagógicos firmados por todos los asistentes.',
  'Cronograma institucional publicado en el portal docente.',
  null,
  '15/10/2026, 04:00 p. m.',
  'Claudia (Rectora)'
),
(
  'OBS-2026-001',
  'observador',
  'Reconocimiento de Mérito: Liderazgo y Colaboración en Aula',
  '08/10/2026, 10:15 a. m.',
  '1° Periodo',
  '1° Primaria',
  'Jessica',
  'EST-101',
  'Santiago Morales Henao',
  null,
  null,
  null,
  'felicitacion',
  'verde',
  'resuelto',
  'El estudiante destaca por su empatía, espíritu colaborativo ayudando a sus compañeros en las guías de lectoescritura y excelente presentación personal.',
  '1. Felicitación pública en el aula de clase. 2. Constancia meritoria en el observador escolar.',
  '15/10/2026',
  'Caso ejemplar de convivencia positiva.',
  'Se entregó mención de honor y se registró en la carpeta del estudiante.',
  null,
  '08/10/2026, 10:30 a. m.',
  'Jessica'
)
on conflict (id) do nothing;
