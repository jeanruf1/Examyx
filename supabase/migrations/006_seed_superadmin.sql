-- ============================================================
-- MIGRATION 006: Seed — Superadmin e dados iniciais
-- ============================================================
-- ATENÇÃO: Substitua os valores em MAIÚSCULO pelos seus dados reais
-- Execute APÓS criar o usuário admin pelo painel do Supabase Auth
-- ============================================================


-- ------------------------------------------------------------
-- PROMOVER UM USUÁRIO PARA SUPERADMIN
-- Depois de criar o usuário no Supabase Auth, rode isso:
-- ------------------------------------------------------------

-- Passo 1: Criar organização interna (para o superadmin)
INSERT INTO organizations (id, name, slug, plan, is_active)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',  -- ID fixo para a org interna
  'ProvaAI Admin',
  'provaai-admin',
  'enterprise',
  true
)
ON CONFLICT (slug) DO NOTHING;


-- Passo 2: Depois de fazer signup com seu email no app, rode:
-- Substitua SEU-USER-ID pelo UUID do seu usuário em auth.users
UPDATE profiles
SET
  role = 'superadmin',
  org_id = 'aaaaaaaa-0000-0000-0000-000000000001',
  full_name = 'Admin ProvaAI'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'SEU-EMAIL-AQUI@gmail.com'
  LIMIT 1
);


-- ------------------------------------------------------------
-- VERIFICAR SE TUDO ESTÁ CORRETO
-- ------------------------------------------------------------

-- Ver usuários e seus roles
SELECT
  u.email,
  p.full_name,
  p.role,
  o.name AS organization
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN organizations o ON o.id = p.org_id
ORDER BY p.role, u.created_at;


-- Ver RLS funcionando — cada query retorna só dados do tenant correto
-- (teste logado como professor de uma escola, deve ver apenas os dela)
SELECT COUNT(*) FROM exams;       -- deve ser 0 para nova escola
SELECT COUNT(*) FROM documents;   -- deve ser 0 para nova escola
