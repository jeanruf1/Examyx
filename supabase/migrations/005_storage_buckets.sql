-- ============================================================
-- MIGRATION 005: Storage Buckets
-- Configurar buckets do Supabase Storage com políticas de acesso
-- ============================================================
-- ATENÇÃO: Execute este arquivo no SQL Editor do Supabase
-- Os buckets são criados via Storage API ou SQL abaixo
-- ============================================================


-- ------------------------------------------------------------
-- CRIAR BUCKETS
-- ------------------------------------------------------------

-- Logos das escolas (público — para exibir no cabeçalho das provas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'school-logos',
  'school-logos',
  true,                          -- público (qualquer um pode ver a logo)
  2097152,                       -- 2MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;


-- Documentos para RAG (privado — apenas professores da escola)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-documents',
  'exam-documents',
  false,                         -- privado
  52428800,                      -- 50MB max por arquivo
  ARRAY['application/pdf', 'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;


-- Imagens para questões (mapas, gráficos, tirinhas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-images',
  'exam-images',
  false,                         -- privado
  10485760,                      -- 10MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;


-- Exports de provas (PDFs e DOCX gerados)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exam-exports',
  'exam-exports',
  false,                         -- privado
  20971520,                      -- 20MB max
  ARRAY['application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------
-- STORAGE RLS POLICIES: school-logos
-- ------------------------------------------------------------

CREATE POLICY "Qualquer um pode ver logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'school-logos');

CREATE POLICY "School admin pode fazer upload de logo"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'school-logos'
    AND get_my_role() IN ('school_admin', 'superadmin')
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );

CREATE POLICY "School admin pode atualizar logo"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'school-logos'
    AND get_my_role() IN ('school_admin', 'superadmin')
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );

CREATE POLICY "School admin pode deletar logo"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'school-logos'
    AND get_my_role() IN ('school_admin', 'superadmin')
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );


-- ------------------------------------------------------------
-- STORAGE RLS POLICIES: exam-documents
-- Arquivos organizados como: {org_id}/{document_id}/arquivo.pdf
-- ------------------------------------------------------------

CREATE POLICY "Professores podem ver documentos da sua escola"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'exam-documents'
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );

CREATE POLICY "Professores podem fazer upload de documentos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exam-documents'
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );

CREATE POLICY "Professores podem deletar seus documentos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'exam-documents'
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );


-- ------------------------------------------------------------
-- STORAGE RLS POLICIES: exam-images
-- Arquivos organizados como: {org_id}/{exam_id}/imagem.png
-- ------------------------------------------------------------

CREATE POLICY "Professores podem ver imagens da sua escola"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'exam-images'
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );

CREATE POLICY "Professores podem fazer upload de imagens"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exam-images'
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );

CREATE POLICY "Professores podem deletar imagens"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'exam-images'
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );


-- ------------------------------------------------------------
-- STORAGE RLS POLICIES: exam-exports
-- PDFs e DOCX gerados — {org_id}/{exam_id}/prova.pdf
-- ------------------------------------------------------------

CREATE POLICY "Professores podem baixar exports da sua escola"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'exam-exports'
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );

-- Inserção de exports via service_role apenas (feito pelo backend)
CREATE POLICY "Service role pode criar exports"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'exam-exports');

CREATE POLICY "Professores podem deletar exports"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'exam-exports'
    AND (storage.foldername(name))[1] = get_my_org_id()::text
  );
