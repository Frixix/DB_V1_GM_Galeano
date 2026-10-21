-- ========================================================
-- SISTEMA DE GESTIÓN DE MATRÍCULA & CENSO ESCOLAR
-- Migración 008: Censo Estudiantil, Histórico Blindado y Novedades
-- Gimnasio Martin Galeano
-- ========================================================

-- 1. Tabla de Censo Estudiantil Oficial y Matrículas
create table if not exists matriculas_estudiantes (
  id text primary key, -- ej: "EST-101", "TRA-001"
  name text not null,
  grade text not null,
  acudiente text,
  nombre_madre text,
  telefono_madre text,
  telefono text,
  fecha_ingreso text not null default to_char(current_date, 'YYYY-MM-DD'),
  tipo_ingreso text not null default 'Matrícula Regular',
  active boolean not null default true,
  status text not null default 'activo', -- 'activo', 'retirado'
  inhabilitado boolean not null default false,
  motivo_retiro text,
  fecha_retiro text,
  observaciones text,
  registered_by text,
  updated_by text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. Habilitar Seguridad RLS y Políticas Idempotentes
alter table matriculas_estudiantes enable row level security;

drop policy if exists "Lectura de matriculas" on matriculas_estudiantes;
create policy "Lectura de matriculas" on matriculas_estudiantes for select using (true);

drop policy if exists "Insercion de matriculas" on matriculas_estudiantes;
create policy "Insercion de matriculas" on matriculas_estudiantes for insert with check (true);

drop policy if exists "Actualizacion de matriculas" on matriculas_estudiantes;
create policy "Actualizacion de matriculas" on matriculas_estudiantes for update using (true);

drop policy if exists "Eliminacion de matriculas" on matriculas_estudiantes;
create policy "Eliminacion de matriculas" on matriculas_estudiantes for delete using (true);

-- 3. Habilitar Realtime para reflejo instantáneo en todos los dispositivos
do $$ 
begin
  alter publication supabase_realtime add table matriculas_estudiantes;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 4. Índices de Búsqueda Rápida por Grado y Estado
create index if not exists idx_matriculas_grade on matriculas_estudiantes (grade);
create index if not exists idx_matriculas_status on matriculas_estudiantes (status);
create index if not exists idx_matriculas_active on matriculas_estudiantes (active);

-- 5. Censo Oficial Base Galeano 2026 (Idempotente)
insert into matriculas_estudiantes (id, name, grade, acudiente, fecha_ingreso, tipo_ingreso, active, status, inhabilitado, registered_by)
values
  -- Transición
  ('TRA-001', 'Martín Alejandro Silva', 'Transición', 'Claudia Silva (Madre) - Cel: 311 204 8891', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('TRA-002', 'Sofía Isabella Torres', 'Transición', 'Carlos Torres (Padre) - Cel: 315 489 1234', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('TRA-003', 'Jerónimo David Cruz', 'Transición', 'Paola Cruz (Madre) - Cel: 320 812 4578', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('TRA-004', 'Sara Valentina Mendoza', 'Transición', 'Julián Mendoza (Padre) - Cel: 318 642 9012', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('TRA-005', 'Emiliano José Quintero', 'Transición', 'Marcela Quintero (Madre) - Cel: 313 755 3321', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  -- 1° Primaria
  ('EST-101', 'Valentina Gómez Álvarez', '1° Primaria', 'Marta Álvarez (Madre) - Cel: 310 892 1102', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-102', 'Santiago Morales Peña', '1° Primaria', 'Andrés Morales (Padre) - Cel: 314 556 7891', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-103', 'Luciana Herrera Rincón', '1° Primaria', 'Patricia Rincón (Madre) - Cel: 312 901 3456', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-104', 'Mateo Pardo Beltrán', '1° Primaria', 'Diego Pardo (Padre) - Cel: 316 234 5678', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-105', 'Mariana Ríos Restrepo', '1° Primaria', 'Gloria Restrepo (Madre) - Cel: 317 445 6789', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-106', 'Samuel Castro Ortiz', '1° Primaria', 'Fernando Castro (Padre) - Cel: 319 887 6543', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  -- 2° Primaria
  ('EST-201', 'Gabriel Andrés Rojas', '2° Primaria', 'Lorena Rojas (Madre) - Cel: 310 123 4567', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-202', 'Antonella María Duarte', '2° Primaria', 'Mario Duarte (Padre) - Cel: 315 234 5678', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-203', 'Nicolás Felipe Cárdenas', '2° Primaria', 'Liliana Cárdenas (Madre) - Cel: 320 345 6789', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-204', 'Valeria Estefanía Nieto', '2° Primaria', 'Camilo Nieto (Padre) - Cel: 318 456 7890', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-205', 'Tomás Alejandro Ospina', '2° Primaria', 'Adriana Ospina (Madre) - Cel: 313 567 8901', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-206', 'Camila Victoria Paredes', '2° Primaria', 'Guillermo Paredes (Padre) - Cel: 311 678 9012', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  -- 3° Primaria
  ('EST-301', 'Daniel Esteban Méndez', '3° Primaria', 'Helena Méndez (Madre) - Cel: 314 789 0123', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-302', 'Salomé Patricia Vega', '3° Primaria', 'Rodrigo Vega (Padre) - Cel: 312 890 1234', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-303', 'Juan Pablo Salazar', '3° Primaria', 'Beatriz Salazar (Madre) - Cel: 316 901 2345', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-304', 'Isabella Gómez Navarro', '3° Primaria', 'Óscar Gómez (Padre) - Cel: 317 012 3456', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-305', 'Andrés Camilo Bernal', '3° Primaria', 'Viviana Bernal (Madre) - Cel: 319 123 4567', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  -- 4° Primaria
  ('EST-401', 'Alejandro Morales Londoño', '4° Primaria', 'Daniela Londoño (Madre) - Cel: 310 234 5678', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-402', 'Manuela Sofía Castaño', '4° Primaria', 'Víctor Castaño (Padre) - Cel: 315 345 6789', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-403', 'Felipe José Agudelo', '4° Primaria', 'Clara Agudelo (Madre) - Cel: 320 456 7890', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-404', 'Catalina María Henao', '4° Primaria', 'Javier Henao (Padre) - Cel: 318 567 8901', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-405', 'David Santiago Montoya', '4° Primaria', 'Mónica Montoya (Madre) - Cel: 313 678 9012', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  -- 5° Primaria
  ('EST-501', 'Sebastián Camilo Roldán', '5° Primaria', 'Nelson Roldán (Padre) - Cel: 311 789 0123', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-502', 'Gabriela Lucía Jaramillo', '5° Primaria', 'Diana Jaramillo (Madre) - Cel: 314 890 1234', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-503', 'Esteban Darío Bustamante', '5° Primaria', 'Gustavo Bustamante (Padre) - Cel: 312 901 2345', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-504', 'Mariángel Sofía Forero', '5° Primaria', 'Sandra Forero (Madre) - Cel: 316 012 3456', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional'),
  ('EST-505', 'Julián Andrés Echeverry', '5° Primaria', 'Felipe Echeverry (Padre) - Cel: 317 123 4567', '2026-02-02', 'Matrícula Regular', true, 'activo', false, 'Secretaría Institucional')
on conflict (id) do nothing;
