-- ============================================================
-- MIGRATION 008: Armazenamento da Pílula de Revisão
-- Permite que a pílula gerada seja persistente e igual no PDF
-- ============================================================

ALTER TABLE exams ADD COLUMN IF NOT EXISTS review_pill JSONB;
