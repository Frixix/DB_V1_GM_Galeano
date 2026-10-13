-- ========================================================
-- SISTEMA DOCUMENTAL — GIMNASIO MARTIN GALEANO
-- Migracion 002: Configuracion de Bucket y Politicas de Storage
-- ========================================================

-- 1. Creacion o actualizacion del bucket para documentos institucionales
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos-galeano',
  'documentos-galeano',
  true,
  2147483648, -- 2 GB maximo institucional
  null
)
on conflict (id) do update set
  public = true,
  file_size_limit = 2147483648;

-- 2. Politicas de Seguridad RLS en storage.objects (idempotentes)
drop policy if exists "Acceso publico de lectura a documentos" on storage.objects;
create policy "Acceso publico de lectura a documentos"
on storage.objects for select
using (bucket_id = 'documentos-galeano');

drop policy if exists "Permitir subida de documentos" on storage.objects;
create policy "Permitir subida de documentos"
on storage.objects for insert
with check (bucket_id = 'documentos-galeano');

drop policy if exists "Permitir actualizacion de documentos" on storage.objects;
create policy "Permitir actualizacion de documentos"
on storage.objects for update
using (bucket_id = 'documentos-galeano');

drop policy if exists "Permitir eliminacion de documentos" on storage.objects;
create policy "Permitir eliminacion de documentos"
on storage.objects for delete
using (bucket_id = 'documentos-galeano');
