-- ========================================================
-- REPOSITORIO DE EVALUACIONES FINALES & IMPRESION SIEE
-- Migracion 006: Esquema de Pruebas Acumulativas y Fechas Limite
-- Gimnasio Martin Galeano
-- ========================================================

-- 1. Tabla de Evaluaciones Finales por Periodo, Grado y Materia
create table if not exists evaluaciones_finales (
  id text primary key,
  period text not null,
  grade text not null,
  subject text not null,
  title text,
  uploaded boolean default false,
  file_name text,
  file_size text,
  file_type text,
  storage_key text,
  download_url text,
  uploaded_at timestamptz default now(),
  uploaded_by text,
  teacher_id text,
  teacher_name text,
  copies_needed integer default 0,
  copies_status text default 'aprobado',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Habilitar Seguridad RLS y Politicas Idempotentes
alter table evaluaciones_finales enable row level security;

drop policy if exists "Lectura de evaluaciones finales" on evaluaciones_finales;
create policy "Lectura de evaluaciones finales" on evaluaciones_finales for select using (true);

drop policy if exists "Insercion de evaluaciones finales" on evaluaciones_finales;
create policy "Insercion de evaluaciones finales" on evaluaciones_finales for insert with check (true);

drop policy if exists "Actualizacion de evaluaciones finales" on evaluaciones_finales;
create policy "Actualizacion de evaluaciones finales" on evaluaciones_finales for update using (true);

drop policy if exists "Eliminacion de evaluaciones finales" on evaluaciones_finales;
create policy "Eliminacion de evaluaciones finales" on evaluaciones_finales for delete using (true);

-- 3. Tabla de Calendario y Fechas Limite de Impresion por Periodo
create table if not exists evaluaciones_deadlines (
  period text primary key,
  deadline_date text not null,
  delivery_time text not null,
  status text default 'en_plazo',
  description text,
  responsible text default 'Coordinacion Academica',
  last_modified_by text,
  updated_at timestamptz default now()
);

alter table evaluaciones_deadlines enable row level security;

drop policy if exists "Lectura de fechas limite" on evaluaciones_deadlines;
create policy "Lectura de fechas limite" on evaluaciones_deadlines for select using (true);

drop policy if exists "Insercion de fechas limite" on evaluaciones_deadlines;
create policy "Insercion de fechas limite" on evaluaciones_deadlines for insert with check (true);

drop policy if exists "Actualizacion de fechas limite" on evaluaciones_deadlines;
create policy "Actualizacion de fechas limite" on evaluaciones_deadlines for update using (true);

drop policy if exists "Eliminacion de fechas limite" on evaluaciones_deadlines;
create policy "Eliminacion de fechas limite" on evaluaciones_deadlines for delete using (true);

-- 4. Habilitar Realtime para actualizacion instantanea
do $$ 
begin
  alter publication supabase_realtime add table evaluaciones_finales;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$ 
begin
  alter publication supabase_realtime add table evaluaciones_deadlines;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 5. Indices de busqueda rapida
create index if not exists idx_evaluaciones_lookup 
on evaluaciones_finales (period, grade, subject);

create index if not exists idx_evaluaciones_teacher 
on evaluaciones_finales (teacher_id, period);

-- 6. Insercion inicial idempotente de fechas limite por defecto
insert into evaluaciones_deadlines (period, deadline_date, delivery_time, status, description, responsible, last_modified_by, updated_at)
values
  ('1° Periodo (25%)', '2026-03-27', '17:00', 'en_plazo', 'Fecha limite de entrega de evaluaciones para fotocopiado y reproduccion del Primer Periodo', 'Coordinacion Academica', 'Sistema SIEE', now()),
  ('2° Periodo (25%)', '2026-06-12', '17:00', 'programado', 'Fecha limite de entrega de evaluaciones para fotocopiado y reproduccion del Segundo Periodo', 'Coordinacion Academica', 'Sistema SIEE', now()),
  ('3° Periodo (25%)', '2026-09-11', '17:00', 'programado', 'Fecha limite de entrega de evaluaciones para fotocopiado y reproduccion del Tercer Periodo', 'Coordinacion Academica', 'Sistema SIEE', now()),
  ('4° Periodo (25%)', '2026-11-13', '17:00', 'programado', 'Fecha limite de entrega de evaluaciones para fotocopiado y reproduccion del Cuarto Periodo (Cierre Final)', 'Coordinacion Academica', 'Sistema SIEE', now())
on conflict (period) do nothing;
