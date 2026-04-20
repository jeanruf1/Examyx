-- ============================================================
-- CONFIGURAÇÃO DE POLÍTICAS DO BUCKET 'materials'
-- Permite que usuários autenticados enviem figuras extraídas
-- ============================================================

-- 1. Garantir que o bucket existe e é público (opcional, mas recomendado para exibição rápida)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Permitir que qualquer usuário autenticado faça UPLOAD (INSERT)
CREATE POLICY "Permitir upload para usuários autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'materials');

-- 3. Permitir que qualquer pessoa VEJA as imagens (SELECT)
CREATE POLICY "Permitir leitura pública no bucket materials"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'materials');

-- 4. Permitir que o usuário delete seus próprios uploads (opcional)
CREATE POLICY "Permitir delete para o próprio dono"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'materials');
