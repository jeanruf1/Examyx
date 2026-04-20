-- ============================================================
-- MIGRATION 004: Auth Triggers
-- Cria o perfil automaticamente quando um usuário se registra
-- ============================================================


-- ------------------------------------------------------------
-- TRIGGER: Criar perfil automaticamente após signup
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- roda com permissões do owner, não do usuário
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_role user_role;
  v_full_name text;
BEGIN
  -- Pegar metadados passados no signup
  v_org_id    := (NEW.raw_user_meta_data->>'org_id')::uuid;
  v_role      := COALESCE(
                   (NEW.raw_user_meta_data->>'role')::user_role,
                   'teacher'
                 );
  v_full_name := COALESCE(
                   NEW.raw_user_meta_data->>'full_name',
                   split_part(NEW.email, '@', 1)
                 );

  INSERT INTO public.profiles (id, org_id, role, full_name)
  VALUES (NEW.id, v_org_id, v_role, v_full_name);

  RETURN NEW;
END;
$$;

-- Aplicar trigger no auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ------------------------------------------------------------
-- TRIGGER: Atualizar last_seen_at ao fazer login
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_seen_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Aplicar no auth.sessions (toda vez que uma sessão é criada)
CREATE OR REPLACE TRIGGER on_auth_user_login
  AFTER INSERT ON auth.sessions
  FOR EACH ROW EXECUTE FUNCTION handle_user_login();


-- ============================================================
-- MIGRATION 004b: Funções de Busca Vetorial (RAG)
-- ============================================================


-- ------------------------------------------------------------
-- FUNCTION: Busca semântica em documentos da escola (RAG)
-- Retorna os chunks mais relevantes para uma query
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION search_document_chunks(
  p_query_embedding  vector(1536),
  p_org_id           uuid,
  p_match_count      int DEFAULT 10,
  p_similarity_threshold float DEFAULT 0.75
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
    AND 1 - (dc.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY dc.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;


-- ------------------------------------------------------------
-- FUNCTION: Busca semântica na BNCC
-- Retorna competências mais relevantes para o tema da prova
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION search_bncc(
  p_query_embedding  vector(1536),
  p_subject          text DEFAULT NULL,
  p_grade            text DEFAULT NULL,
  p_match_count      int DEFAULT 5,
  p_similarity_threshold float DEFAULT 0.70
)
RETURNS TABLE (
  id          uuid,
  code        text,
  description text,
  subject     text,
  grade       text,
  grade_range text,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    bc.id,
    bc.code,
    bc.description,
    bc.subject,
    bc.grade,
    bc.grade_range,
    1 - (bc.embedding <=> p_query_embedding) AS similarity
  FROM bncc_competencies bc
  WHERE
    bc.embedding IS NOT NULL
    AND (p_subject IS NULL OR lower(bc.subject) = lower(p_subject))
    AND (p_grade IS NULL OR bc.grade ILIKE '%' || p_grade || '%' OR bc.grade_range ILIKE '%' || p_grade || '%')
    AND 1 - (bc.embedding <=> p_query_embedding) > p_similarity_threshold
  ORDER BY bc.embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;


-- ------------------------------------------------------------
-- FUNCTION: Verificar questão similar no banco (anti-repetição)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_question_similarity(
  p_query_embedding  vector(1536),
  p_org_id           uuid,
  p_threshold        float DEFAULT 0.92
)
RETURNS TABLE (
  question_bank_id uuid,
  question_id      uuid,
  similarity       float,
  content_preview  text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    qb.id AS question_bank_id,
    qb.question_id,
    1 - (qb.embedding <=> p_query_embedding) AS similarity,
    left(q.content, 150) AS content_preview
  FROM question_bank qb
  JOIN questions q ON q.id = qb.question_id
  WHERE
    qb.org_id = p_org_id
    AND qb.embedding IS NOT NULL
    AND 1 - (qb.embedding <=> p_query_embedding) > p_threshold
  ORDER BY qb.embedding <=> p_query_embedding
  LIMIT 3;
$$;


-- ============================================================
-- MIGRATION 004c: Views para o Dashboard Admin
-- ============================================================


-- ------------------------------------------------------------
-- VIEW: Métricas por organização (para admin)
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW admin_org_metrics AS
SELECT
  o.id,
  o.name,
  o.plan,
  o.is_active,
  o.is_blocked,
  o.created_at,
  o.trial_ends_at,

  -- Contagem de professores
  COUNT(DISTINCT p.id) FILTER (WHERE p.is_active = true) AS active_teachers,

  -- Provas geradas
  COUNT(DISTINCT e.id) AS total_exams,
  COUNT(DISTINCT e.id) FILTER (
    WHERE e.created_at >= date_trunc('month', now())
  ) AS exams_this_month,

  -- Tokens e custo
  COALESCE(SUM(tu.tokens_total), 0) AS total_tokens_used,
  COALESCE(SUM(tu.cost_usd), 0) AS total_cost_usd,
  COALESCE(SUM(tu.cost_usd) FILTER (
    WHERE tu.created_at >= date_trunc('month', now())
  ), 0) AS cost_this_month_usd,

  -- Documentos RAG
  COUNT(DISTINCT d.id) AS total_documents

FROM organizations o
LEFT JOIN profiles p ON p.org_id = o.id
LEFT JOIN exams e ON e.org_id = o.id
LEFT JOIN token_usage tu ON tu.org_id = o.id
LEFT JOIN documents d ON d.org_id = o.id
GROUP BY o.id;

-- Apenas superadmin pode ver
ALTER VIEW admin_org_metrics OWNER TO postgres;


-- ------------------------------------------------------------
-- VIEW: Uso de tokens por dia (para gráfico)
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW token_usage_daily AS
SELECT
  date_trunc('day', created_at) AS day,
  org_id,
  operation,
  COUNT(*) AS calls,
  SUM(tokens_total) AS tokens,
  SUM(cost_usd) AS cost_usd
FROM token_usage
GROUP BY 1, 2, 3;


-- ------------------------------------------------------------
-- VIEW: Professores mais ativos
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW teacher_activity AS
SELECT
  p.id,
  p.full_name,
  p.org_id,
  o.name AS org_name,
  COUNT(e.id) AS total_exams,
  COUNT(e.id) FILTER (
    WHERE e.created_at >= now() - interval '30 days'
  ) AS exams_last_30_days,
  p.last_seen_at
FROM profiles p
LEFT JOIN organizations o ON o.id = p.org_id
LEFT JOIN exams e ON e.teacher_id = p.id
WHERE p.role = 'teacher'
GROUP BY p.id, o.name;
