-- ========================================================
-- SISTEMA DOCUMENTAL — GIMNASIO MARTIN GALEANO
-- Migracion 003: Seguimiento de Lectura de Circulares
-- ========================================================

-- 1. Tabla de Lectura de Circulares por Usuario
create table if not exists circular_reads (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references documents(id) on delete cascade,
  user_key text not null,
  read_at timestamptz default now(),
  constraint unique_document_user_read unique (document_id, user_key)
);

-- 2. Habilitar Seguridad RLS y Politicas Idempotentes
alter table circular_reads enable row level security;

drop policy if exists "Lectura publica de circular_reads" on circular_reads;
create policy "Lectura publica de circular_reads" on circular_reads for select using (true);

drop policy if exists "Insercion de circular_reads" on circular_reads;
create policy "Insercion de circular_reads" on circular_reads for insert with check (true);

drop policy if exists "Actualizacion de circular_reads" on circular_reads;
create policy "Actualizacion de circular_reads" on circular_reads for update using (true);

drop policy if exists "Eliminacion de circular_reads" on circular_reads;
create policy "Eliminacion de circular_reads" on circular_reads for delete using (true);

-- 3. Habilitar Realtime para actualizacion dinamica de lectores
do $$ 
begin
  alter publication supabase_realtime add table circular_reads;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
