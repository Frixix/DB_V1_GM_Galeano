-- ========================================================
-- SISTEMA DOCUMENTAL — GIMNASIO MARTIN GALEANO
-- Migracion 009: Columna pillar_id en documentos (Decreto 1075)
-- ========================================================

-- Agregar columna opcional pillar_id a la tabla documents
alter table documents
add column if not exists pillar_id text;

-- Indice para acelerar consultas por pilar normativo
create index if not exists idx_documents_pillar_id on documents(pillar_id);
