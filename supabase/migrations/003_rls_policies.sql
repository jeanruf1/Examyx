-- ============================================================
-- MIGRATION 003: Row Level Security (RLS)
-- Isolamento total entre tenants (escolas)
-- ============================================================


-- ------------------------------------------------------------
-- HELPER FUNCTION: Pegar org_id do usuário autenticado
-- Evita N+1 queries em cada policy
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  )
$$;


-- ============================================================
-- ORGANIZATIONS
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
CREATE POLICY "superadmin_all_organizations"
  ON organizations FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- School admin vê apenas sua própria escola
CREATE POLICY "school_admin_own_organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = get_my_org_id());

-- School admin pode atualizar apenas sua escola (campos limitados)
CREATE POLICY "school_admin_update_own_organization"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id = get_my_org_id() AND get_my_role() = 'school_admin')
  WITH CHECK (id = get_my_org_id());

-- Teacher vê apenas sua escola (read only)
CREATE POLICY "teacher_view_own_organization"
  ON organizations FOR SELECT
  TO authenticated
  USING (id = get_my_org_id());


-- ============================================================
-- PROFILES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Superadmin vê todos
CREATE POLICY "superadmin_all_profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Usuário vê e edita apenas seu próprio perfil
CREATE POLICY "user_own_profile"
  ON profiles FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- School admin vê todos os professores da sua escola
CREATE POLICY "school_admin_view_org_profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    org_id = get_my_org_id()
    AND get_my_role() IN ('school_admin', 'superadmin')
  );

-- School admin pode gerenciar professores da sua escola
CREATE POLICY "school_admin_manage_org_profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    org_id = get_my_org_id()
    AND get_my_role() = 'school_admin'
    AND id != auth.uid()  -- não pode editar a si mesmo por aqui
  )
  WITH CHECK (org_id = get_my_org_id());


-- ============================================================
-- DOCUMENTS
-- ============================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
CREATE POLICY "superadmin_all_documents"
  ON documents FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Professor vê e gerencia documentos da sua escola
CREATE POLICY "teacher_own_org_documents"
  ON documents FOR ALL
  TO authenticated
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());


-- ============================================================
-- DOCUMENT CHUNKS
-- ============================================================

ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
CREATE POLICY "superadmin_all_chunks"
  ON document_chunks FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Professores da mesma escola acessam os chunks
CREATE POLICY "teacher_own_org_chunks"
  ON document_chunks FOR ALL
  TO authenticated
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());


-- ============================================================
-- BNCC COMPETENCIES
-- Leitura pública para todos os autenticados (global)
-- Escrita apenas para superadmin (via seed script)
-- ============================================================

ALTER TABLE bncc_competencies ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados podem ler
CREATE POLICY "authenticated_read_bncc"
  ON bncc_competencies FOR SELECT
  TO authenticated
  USING (true);

-- Apenas superadmin pode inserir/atualizar
CREATE POLICY "superadmin_manage_bncc"
  ON bncc_competencies FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Service role pode inserir (para o script de seed)
CREATE POLICY "service_role_manage_bncc"
  ON bncc_competencies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- EXAMS
-- ============================================================

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
CREATE POLICY "superadmin_all_exams"
  ON exams FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Professores gerenciam provas da sua escola
CREATE POLICY "teacher_own_org_exams"
  ON exams FOR ALL
  TO authenticated
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());


-- ============================================================
-- QUESTIONS
-- ============================================================

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
CREATE POLICY "superadmin_all_questions"
  ON questions FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Professores gerenciam questões da sua escola
CREATE POLICY "teacher_own_org_questions"
  ON questions FOR ALL
  TO authenticated
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());


-- ============================================================
-- QUESTION BANK
-- ============================================================

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
CREATE POLICY "superadmin_all_question_bank"
  ON question_bank FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Professores gerenciam banco de questões da sua escola
CREATE POLICY "teacher_own_org_question_bank"
  ON question_bank FOR ALL
  TO authenticated
  USING (org_id = get_my_org_id())
  WITH CHECK (org_id = get_my_org_id());


-- ============================================================
-- TOKEN USAGE
-- ============================================================

ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo (para o painel admin)
CREATE POLICY "superadmin_all_token_usage"
  ON token_usage FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- School admin vê uso da sua escola
CREATE POLICY "school_admin_view_token_usage"
  ON token_usage FOR SELECT
  TO authenticated
  USING (
    org_id = get_my_org_id()
    AND get_my_role() IN ('school_admin', 'superadmin')
  );

-- Inserção via service_role apenas (feito pelo backend, não pelo cliente)
CREATE POLICY "service_role_insert_token_usage"
  ON token_usage FOR INSERT
  TO service_role
  WITH CHECK (true);


-- ============================================================
-- ERROR LOGS
-- ============================================================

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Superadmin vê tudo
CREATE POLICY "superadmin_all_error_logs"
  ON error_logs FOR ALL
  TO authenticated
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- Inserção via service_role apenas (feito pelo backend)
CREATE POLICY "service_role_insert_error_logs"
  ON error_logs FOR INSERT
  TO service_role
  WITH CHECK (true);
