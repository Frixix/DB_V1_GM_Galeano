-- ========================================================
-- SISTEMA DOCUMENTAL — GIMNASIO MARTIN GALEANO
-- Migracion 001: Esquema de Documentos y Politicas
-- ========================================================

-- 1. Secuencia y Funcion para Radicado Automatico
create sequence if not exists radicado_seq start 6;

create or replace function next_radicado() returns text as $$
begin
  return 'MG-PRI-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('radicado_seq')::text, 4, '0');
end;
$$ language plpgsql;

-- 2. Tabla de Documentos
create table if not exists documents (
  id text primary key default next_radicado(),
  title text not null,
  folder text not null,
  grade text,
  subject text,
  teacher text not null,
  period text,
  is_public boolean default false,
  file_name text,
  file_size text,
  compressed_size text,
  raw_bytes bigint default 0,
  ratio text,
  is_compressed boolean default false,
  notes text,
  boveda_year text,
  boveda_subfolder text,
  storage_key text,
  uploaded_at text,
  created_at timestamptz default now()
);

-- 3. Habilitar Seguridad RLS y Politicas Idempotentes
alter table documents enable row level security;

drop policy if exists "Lectura de documentos" on documents;
create policy "Lectura de documentos" on documents for select using (true);

drop policy if exists "Insercion de documentos" on documents;
create policy "Insercion de documentos" on documents for insert with check (true);

drop policy if exists "Actualizacion de documentos" on documents;
create policy "Actualizacion de documentos" on documents for update using (true);

drop policy if exists "Eliminacion de documentos" on documents;
create policy "Eliminacion de documentos" on documents for delete using (true);

-- 4. Soporte para Realtime en Supabase
do $$ 
begin
  alter publication supabase_realtime add table documents;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

-- 5. Datos Iniciales
insert into documents (
  id, title, folder, grade, subject, teacher, period, is_public,
  file_name, file_size, compressed_size, raw_bytes, ratio, is_compressed,
  uploaded_at, notes, boveda_year, boveda_subfolder
) values
(
  'MG-PRI-001',
  'Planeación Curricular: Fracciones y Pensamiento Numérico',
  'planeaciones',
  'Tercero (3°)',
  'Matemáticas',
  'Jessica',
  '1° Periodo',
  false,
  'Planeacion_Matematicas_3_Jessica.pdf',
  '1.4 MB',
  '420 KB',
  1468006,
  '70%',
  true,
  '05/10/2026, 09:15 a. m.',
  'Planeación bimestral propia del grado tercero.',
  null,
  null
),
(
  'MG-PRI-002',
  'Circular N 01: Inicio de Bimestre y Directrices Institucionales',
  'institucional',
  'General',
  'Institucional',
  'Claudia (Rectora)',
  'Anual / Permanente',
  true,
  'Circular_01_Directrices_2026.pdf',
  '1.8 MB',
  '510 KB',
  1887436,
  '72%',
  true,
  '06/10/2026, 08:30 a. m.',
  'Estimado cuerpo docente: Se socializan los horarios de entrega de planeaciones pedagógicas, fechas de cortes de notas y pautas de acompañamiento en aula para el primer bimestre.',
  null,
  null
),
(
  'MG-PRI-003',
  'Guía Didáctica: Ecosistemas y Biodiversidad',
  'talleres',
  'Cuarto (4°)',
  'Ciencias Naturales',
  'Yuri',
  '2° Periodo',
  false,
  'Taller_Ciencias_4_Yuri.docx',
  '680 KB',
  '190 KB',
  696320,
  '72%',
  true,
  '05/10/2026, 11:40 a. m.',
  'Guías con actividades prácticas para laboratorio escolar.',
  null,
  null
),
(
  'MG-PRI-004',
  'Planilla de Seguimiento y Lectoescritura',
  'calificaciones',
  'Primero (1°)',
  'Lengua Castellana',
  'Elcy',
  '1° Periodo',
  false,
  'Planilla_Espanol_1_Elcy.xlsx',
  '512 KB',
  '135 KB',
  524288,
  '74%',
  true,
  '05/10/2026, 02:10 p. m.',
  'Valoración formativa de trazo y comprensión de fonemas.',
  null,
  null
),
(
  'MG-BOV-001',
  'Acta Ordinaria N 01 - Consejo Directivo 2026',
  'boveda',
  'Directivo',
  'Directiva',
  'Claudia (Rectora)',
  'Anual / Permanente',
  false,
  'Acta_Consejo_Directivo_01_2026.pdf',
  '2.4 MB',
  '720 KB',
  2516582,
  '70%',
  true,
  '06/10/2026, 09:00 a. m.',
  'Aprobación del presupuesto operativo y plan de gestión institucional de Básica Primaria.',
  '2026',
  'consejo'
)
on conflict (id) do nothing;
