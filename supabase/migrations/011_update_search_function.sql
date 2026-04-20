-- ============================================================
-- ATUALIZAÇÃO DA FUNÇÃO DE BUSCA RAG
-- Adiciona suporte para filtrar por IDs de documentos específicos
-- ============================================================

CREATE OR REPLACE FUNCTION search_document_chunks(
  p_query_embedding  vector(1536),
  p_org_id           uuid,
  p_document_ids     uuid[] DEFAULT NULL, -- Novo parâmetro opcional
  p_match_count      int DEFAULT 10,
  p_similarity_threshold float DEFAULT 0.65 -- Baixei um pouco o threshold para ser mais abrangente
)
RETURNS TABLE (
  id          uuid,
  content     text,
  similarity  float,
  document_id uuid,
  metadata    jsonb
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> p_query_embedding) AS similarity,
    dc.document_id,
    dc.metadata
  FROM document_chunks dc
  WHERE
    dc.org_id = p_org_id
    AND dc.embedding IS NOT NULL
    -- Filtro por IDs de documentos se fornecido
    AND (p_document_ids IS NULL OR dc.document_id = ANY(p_document_ids))
    AND 1 - (dc.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
