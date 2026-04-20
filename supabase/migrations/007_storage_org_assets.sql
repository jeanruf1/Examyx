-- ============================================================
-- MIGRATION 007: Storage bucket para assets das organizações
-- Permite upload de logos via Supabase Storage
-- ============================================================

-- Cria o bucket público 'org-assets' (logos das escolas)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-assets',
  'org-assets',
  true,                          -- público: URLs acessíveis no PDF sem autenticação
  2097152,                       -- 2 MB máximo por arquivo
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ── Policies de acesso ───────────────────────────────────────

-- Qualquer usuário autenticado pode fazer upload na sua pasta
CREATE POLICY "org_members_can_upload_logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-assets'
  AND name LIKE 'logos/%'
);

-- Qualquer usuário autenticado pode atualizar (upsert) sua logo
CREATE POLICY "org_members_can_update_logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'org-assets' AND name LIKE 'logos/%');

-- Qualquer usuário autenticado pode deletar sua logo
CREATE POLICY "org_members_can_delete_logo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'org-assets' AND name LIKE 'logos/%');

-- Leitura pública para que o PDF possa exibir a logo sem auth
CREATE POLICY "public_read_org_assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'org-assets');
