-- ========================================================
-- GESTION DOCENTE & PLANTA CURRICULAR
-- Migracion 007: Directores de Curso, Malla Curricular, Perfiles y Auditoria
-- Gimnasio Martin Galeano
-- ========================================================

-- 1. Tabla de Directores de Curso por Grado
create table if not exists directores_curso (
  grade text primary key,
  docente_id text not null,
  teacher_name text not null,
  updated_at timestamptz default now(),
  updated_by text
);

alter table directores_curso enable row level security;

drop policy if exists "Lectura de directores" on directores_curso;
create policy "Lectura de directores" on directores_curso for select using (true);

drop policy if exists "Insercion de directores" on directores_curso;
create policy "Insercion de directores" on directores_curso for insert with check (true);

drop policy if exists "Actualizacion de directores" on directores_curso;
create policy "Actualizacion de directores" on directores_curso for update using (true);

drop policy if exists "Eliminacion de directores" on directores_curso;
create policy "Eliminacion de directores" on directores_curso for delete using (true);

-- 2. Tabla de Asignaciones de Materias (Malla Curricular)
create table if not exists asignaciones_materias (
  id text primary key,
  grade text not null,
  subject text not null,
  docente_id text not null,
  teacher_name text not null,
  updated_at timestamptz default now(),
  updated_by text
);

alter table asignaciones_materias enable row level security;

drop policy if exists "Lectura de asignaciones" on asignaciones_materias;
create policy "Lectura de asignaciones" on asignaciones_materias for select using (true);

drop policy if exists "Insercion de asignaciones" on asignaciones_materias;
create policy "Insercion de asignaciones" on asignaciones_materias for insert with check (true);

drop policy if exists "Actualizacion de asignaciones" on asignaciones_materias;
create policy "Actualizacion de asignaciones" on asignaciones_materias for update using (true);

drop policy if exists "Eliminacion de asignaciones" on asignaciones_materias;
create policy "Eliminacion de asignaciones" on asignaciones_materias for delete using (true);

-- 3. Tabla de Perfiles y Estados de la Planta Docente
create table if not exists docentes_perfiles (
  user_key text primary key,
  name text not null,
  label text,
  status text default 'activa',
  role text default 'docente',
  updated_at timestamptz default now(),
  updated_by text
);

alter table docentes_perfiles enable row level security;

drop policy if exists "Lectura de perfiles docentes" on docentes_perfiles;
create policy "Lectura de perfiles docentes" on docentes_perfiles for select using (true);

drop policy if exists "Insercion de perfiles docentes" on docentes_perfiles;
create policy "Insercion de perfiles docentes" on docentes_perfiles for insert with check (true);

drop policy if exists "Actualizacion de perfiles docentes" on docentes_perfiles;
create policy "Actualizacion de perfiles docentes" on docentes_perfiles for update using (true);

drop policy if exists "Eliminacion de perfiles docentes" on docentes_perfiles;
create policy "Eliminacion de perfiles docentes" on docentes_perfiles for delete using (true);

-- 4. Tabla de Auditoria de Cambios Curriculares
create table if not exists docentes_audit_logs (
  id text primary key,
  action text not null,
  details text,
  author text,
  author_role text,
  created_at timestamptz default now()
);

alter table docentes_audit_logs enable row level security;

drop policy if exists "Lectura de auditoria docente" on docentes_audit_logs;
create policy "Lectura de auditoria docente" on docentes_audit_logs for select using (true);

drop policy if exists "Insercion de auditoria docente" on docentes_audit_logs;
create policy "Insercion de auditoria docente" on docentes_audit_logs for insert with check (true);

-- 5. Habilitar Realtime para reflejo instantaneo
do $$ 
begin
  alter publication supabase_realtime add table directores_curso;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table asignaciones_materias;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table docentes_perfiles;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 6. Indices de rendimiento
create index if not exists idx_asig_grade_subject on asignaciones_materias (grade, subject);
create index if not exists idx_asig_docente on asignaciones_materias (docente_id);

-- 7. Datos Iniciales Idempotentes: Preset Institucional Galeano 2026
insert into directores_curso (grade, docente_id, teacher_name, updated_at, updated_by)
values
  ('Transición', 'profe1', 'Profe 1', now(), 'Sistema Institucional'),
  ('1° Primaria', 'jessica', 'Jessica', now(), 'Sistema Institucional'),
  ('2° Primaria', 'yuri', 'Yuri', now(), 'Sistema Institucional'),
  ('3° Primaria', 'profe2', 'Profe 2', now(), 'Sistema Institucional'),
  ('4° Primaria', 'elcy', 'Elcy', now(), 'Sistema Institucional'),
  ('5° Primaria', 'profe3', 'Profe 3', now(), 'Sistema Institucional')
on conflict (grade) do nothing;

insert into docentes_perfiles (user_key, name, label, status, role, updated_at, updated_by)
values
  ('profe1', 'Profe 1', 'Docente • Dir. Transición', 'activa', 'docente', now(), 'Sistema Institucional'),
  ('jessica', 'Jessica', 'Docente de Español • Dir. 1° Primaria', 'activa', 'docente', now(), 'Sistema Institucional'),
  ('yuri', 'Yuri', 'Docente de Ciencias (Naturales & Sociales) • Dir. 2° Primaria', 'activa', 'docente', now(), 'Sistema Institucional'),
  ('profe2', 'Profe 2', 'Docente de Matemáticas • Dir. 3° Primaria', 'activa', 'docente', now(), 'Sistema Institucional'),
  ('elcy', 'Elcy', 'Docente de Inglés • Dir. 4° Primaria', 'activa', 'docente', now(), 'Sistema Institucional'),
  ('profe3', 'Profe 3', 'Docente de Ciencias • Dir. 5° Primaria', 'activa', 'docente', now(), 'Sistema Institucional')
on conflict (user_key) do nothing;
