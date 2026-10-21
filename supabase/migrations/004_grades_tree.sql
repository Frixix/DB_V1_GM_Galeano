-- ========================================================
-- SISTEMA DE NOTAS Y CALIFICACIONES (SIEE) — GIMNASIO MARTIN GALEANO
-- Migracion 004: Esquema de Sabanas de Calificaciones y Actividades
-- ========================================================

-- 1. Tabla de Ramas del Arbol de Calificaciones (Ano -> Periodo -> Grado -> Materia)
create table if not exists grades_branches (
  id text primary key, -- Clave canonica unica: ej "2026__1_periodo_25__1_primaria__matematicas"
  year text not null,
  period text not null,
  grade text not null,
  subject text not null,
  docente_id text,
  teacher_name text,
  activities jsonb not null default '[]'::jsonb,
  students jsonb not null default '[]'::jsonb,
  updated_by text,
  updated_at timestamptz default now()
);

-- 2. Habilitar Seguridad RLS y Politicas Idempotentes
alter table grades_branches enable row level security;

drop policy if exists "Lectura de calificaciones" on grades_branches;
create policy "Lectura de calificaciones" on grades_branches for select using (true);

drop policy if exists "Insercion de calificaciones" on grades_branches;
create policy "Insercion de calificaciones" on grades_branches for insert with check (true);

drop policy if exists "Actualizacion de calificaciones" on grades_branches;
create policy "Actualizacion de calificaciones" on grades_branches for update using (true);

drop policy if exists "Eliminacion de calificaciones" on grades_branches;
create policy "Eliminacion de calificaciones" on grades_branches for delete using (true);

-- 3. Habilitar Realtime para reflejo instantaneo entre directivos y docentes
do $$ 
begin
  alter publication supabase_realtime add table grades_branches;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 4. Indice de busqueda rapida por grado y periodo
create index if not exists idx_grades_branches_lookup 
on grades_branches (year, period, grade, subject);

-- 5. Boveda de Respaldo Institucional (institutional_vault)
create table if not exists institutional_vault (
  user_key text primary key,
  cipher text,
  default_invalidated boolean default false,
  updated_at timestamptz default now()
);

alter table institutional_vault enable row level security;

drop policy if exists "Lectura de vault" on institutional_vault;
create policy "Lectura de vault" on institutional_vault for select using (true);

drop policy if exists "Insercion de vault" on institutional_vault;
create policy "Insercion de vault" on institutional_vault for insert with check (true);

drop policy if exists "Actualizacion de vault" on institutional_vault;
create policy "Actualizacion de vault" on institutional_vault for update using (true);

drop policy if exists "Eliminacion de vault" on institutional_vault;
create policy "Eliminacion de vault" on institutional_vault for delete using (true);

do $$ 
begin
  alter publication supabase_realtime add table institutional_vault;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
