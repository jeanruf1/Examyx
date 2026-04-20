-- ============================================================
-- MIGRATION 001: Extensions
-- Habilitar extensões necessárias para o ProvaAI
-- ============================================================

-- pgvector: suporte a embeddings e busca semântica
CREATE EXTENSION IF NOT EXISTS vector;

-- uuid-ossp: geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pg_trgm: busca por texto similar (fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent: busca sem acentos (ex: "matematica" encontra "matemática")
CREATE EXTENSION IF NOT EXISTS unaccent;
