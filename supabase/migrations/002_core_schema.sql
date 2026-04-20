-- ============================================================
-- MIGRATION 002: Core Schema
-- Tabelas principais do ProvaAI (multi-tenant)
-- ============================================================

-- ------------------------------------------------------------
-- ENUM TYPES
-- ------------------------------------------------------------

CREATE TYPE plan_type AS ENUM ('trial', 'basic', 'pro', 'enterprise');
CREATE TYPE user_role AS ENUM ('superadmin', 'school_admin', 'teacher');
CREATE TYPE exam_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'essay', 'true_false', 'fill_blank');
CREATE TYPE difficulty_level AS ENUM ('facil', 'medio', 'dificil');
CREATE TYPE bloom_level AS ENUM ('memorization', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation');
CREATE TYPE exam_style AS ENUM ('regular', 'enem', 'vestibular', 'homework');
CREATE TYPE document_type AS ENUM ('pdf', 'slide', 'image', 'text');
CREATE TYPE ai_operation AS ENUM ('generate_exam', 'rewrite_question', 'image_question', 'embed_document', 'embed_bncc', 'review_pill');


-- ------------------------------------------------------------
-- ORGANIZATIONS (Escolas / Tenants)
-- ------------------------------------------------------------

CREATE TABLE organizations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,           -- ex: "colegio-abc"
  logo_url        text,
  plan            plan_type NOT NULL DEFAULT 'trial',
  trial_ends_at   timestamptz DEFAULT (now() + interval '14 days'),
  is_active       boolean NOT NULL DEFAULT true,
  is_blocked      boolean NOT NULL DEFAULT false,
  blocked_reason  text,

  -- Configuração do cabeçalho das provas
  header_config   jsonb NOT NULL DEFAULT '{
    "show_logo": true,
    "fields": ["nome", "turma", "data", "nota"],
    "custom_fields": []
  }'::jsonb,

  -- Metadados
  contact_email   text,
  contact_phone   text,
  city            text,
  state           text,                            -- ex: "SP", "RJ"

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_plan ON organizations(plan);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);


-- ------------------------------------------------------------
-- PROFILES (Professores / Admins)
-- Estende a tabela auth.users do Supabase
-- ------------------------------------------------------------

CREATE TABLE profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id          uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'teacher',
  full_name       text,
  avatar_url      text,
  subject_default text,                            -- disciplina padrão do professor
  is_active       boolean NOT NULL DEFAULT true,
  last_seen_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_profiles_org_id ON profiles(org_id);
CREATE INDEX idx_profiles_role ON profiles(role);


-- ------------------------------------------------------------
-- DOCUMENTS (Arquivos para RAG)
-- PDFs, slides, resumos que o professor faz upload
-- ------------------------------------------------------------

CREATE TABLE documents (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name            text NOT NULL,
  file_url        text NOT NULL,                   -- URL no Supabase Storage
  file_size_bytes bigint,
  type            document_type NOT NULL DEFAULT 'pdf',
  subject         text,                            -- disciplina relacionada
  grade           text,                            -- série/ano relacionado
  chunk_count     int NOT NULL DEFAULT 0,
  is_indexed      boolean NOT NULL DEFAULT false,  -- já foi vetorizado?
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_documents_org_id ON documents(org_id);
CREATE INDEX idx_documents_teacher_id ON documents(teacher_id);
CREATE INDEX idx_documents_is_indexed ON documents(is_indexed);


-- ------------------------------------------------------------
-- DOCUMENT CHUNKS (Vetores para RAG)
-- Chunks vetorizados dos documentos do professor
-- ------------------------------------------------------------

CREATE TABLE document_chunks (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id     uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content         text NOT NULL,                   -- texto do chunk
  embedding       vector(1536),                    -- OpenAI text-embedding-ada-002
  chunk_index     int NOT NULL,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,  -- página, seção, etc.
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_org_id ON document_chunks(org_id);

-- Índice HNSW para busca vetorial eficiente (melhor que ivfflat para <100k vetores)
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);


-- ------------------------------------------------------------
-- BNCC COMPETENCIES (Base Nacional Comum Curricular)
-- Tabela global — sem isolamento por org (leitura pública)
-- ------------------------------------------------------------

CREATE TABLE bncc_competencies (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            text UNIQUE NOT NULL,            -- ex: EF06MA01
  description     text NOT NULL,
  subject         text NOT NULL,                   -- ex: Matemática
  stage           text NOT NULL,                   -- ex: Ensino Fundamental
  grade_range     text NOT NULL,                   -- ex: 6º ao 9º ano
  grade           text,                            -- ex: 6º ano (se específico)
  theme           text,                            -- ex: Números
  embedding       vector(1536),                    -- para busca semântica
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_bncc_code ON bncc_competencies(code);
CREATE INDEX idx_bncc_subject ON bncc_competencies(subject);
CREATE INDEX idx_bncc_grade ON bncc_competencies(grade);

-- Índice HNSW para busca vetorial
CREATE INDEX idx_bncc_embedding ON bncc_competencies
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);


-- ------------------------------------------------------------
-- EXAMS (Provas)
-- ------------------------------------------------------------

CREATE TABLE exams (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  title           text NOT NULL,
  subject         text NOT NULL,
  grade           text NOT NULL,                   -- ex: "6º ano", "3º EM"
  theme           text,                            -- tema específico
  instructions    text,                            -- instruções gerais para o aluno

  -- Configurações de geração
  difficulty      difficulty_level NOT NULL DEFAULT 'medio',
  style           exam_style NOT NULL DEFAULT 'regular',
  bloom_level     bloom_level,
  question_config jsonb NOT NULL DEFAULT '{
    "multiple_choice": 5,
    "essay": 2,
    "true_false": 0,
    "fill_blank": 0
  }'::jsonb,

  -- Acessibilidade
  accessibility   jsonb NOT NULL DEFAULT '{
    "tea": false,
    "dyslexia": false,
    "adhd": false,
    "font_size": "normal",
    "line_spacing": "normal"
  }'::jsonb,

  -- RAG: documentos usados na geração
  source_documents uuid[],                         -- IDs dos documentos usados
  use_bncc        boolean NOT NULL DEFAULT false,

  -- Status e métricas
  status          exam_status NOT NULL DEFAULT 'draft',
  tokens_used     int NOT NULL DEFAULT 0,
  estimated_time_min int,                          -- tempo estimado em minutos

  -- Versões da prova (anti-cola)
  parent_exam_id  uuid REFERENCES exams(id),       -- NULL = versão original
  variant_label   text,                            -- ex: "Versão B", "Versão C"

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_exams_org_id ON exams(org_id);
CREATE INDEX idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_created_at ON exams(created_at DESC);
CREATE INDEX idx_exams_subject ON exams(subject);


-- ------------------------------------------------------------
-- QUESTIONS (Questões das provas)
-- ------------------------------------------------------------

CREATE TABLE questions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id         uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type            question_type NOT NULL,
  content         text NOT NULL,                   -- enunciado da questão
  options         jsonb,                           -- [{letter, text, is_correct}]
  answer          text,                            -- resposta correta
  explanation     text,                            -- gabarito comentado
  bncc_code       text,                            -- ex: EF06MA01
  image_url       text,                            -- imagem injetada (tirinha, mapa, etc.)
  order_index     int NOT NULL DEFAULT 0,
  bloom_level     bloom_level,
  estimated_time_sec int,                          -- tempo estimado para resolver
  tokens_used     int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_questions_org_id ON questions(org_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_bncc ON questions(bncc_code);


-- ------------------------------------------------------------
-- QUESTION BANK (Banco de Questões reutilizáveis)
-- Questões aprovadas pelo professor, salvas para reuso
-- ------------------------------------------------------------

CREATE TABLE question_bank (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id     uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tags            text[] NOT NULL DEFAULT '{}',
  subject         text,
  grade           text,
  times_used      int NOT NULL DEFAULT 0,
  embedding       vector(1536),                    -- para detector de repetição
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_question_bank_org_id ON question_bank(org_id);
CREATE INDEX idx_question_bank_teacher_id ON question_bank(teacher_id);
CREATE INDEX idx_question_bank_tags ON question_bank USING gin(tags);

-- Índice vetorial para detector de repetição
CREATE INDEX idx_question_bank_embedding ON question_bank
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);


-- ------------------------------------------------------------
-- TOKEN USAGE (Controle de custos de IA)
-- Registra cada chamada à OpenAI para controle de margem
-- ------------------------------------------------------------

CREATE TABLE token_usage (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  teacher_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  exam_id         uuid REFERENCES exams(id) ON DELETE SET NULL,
  operation       ai_operation NOT NULL,
  model           text NOT NULL DEFAULT 'gpt-4o',  -- modelo usado
  tokens_in       int NOT NULL DEFAULT 0,           -- prompt tokens
  tokens_out      int NOT NULL DEFAULT 0,           -- completion tokens
  tokens_total    int GENERATED ALWAYS AS (tokens_in + tokens_out) STORED,
  cost_usd        numeric(10,6) NOT NULL DEFAULT 0, -- custo calculado em USD
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices para o dashboard admin
CREATE INDEX idx_token_usage_org_id ON token_usage(org_id);
CREATE INDEX idx_token_usage_created_at ON token_usage(created_at DESC);
CREATE INDEX idx_token_usage_operation ON token_usage(operation);


-- ------------------------------------------------------------
-- ERROR LOGS (Monitoramento de erros)
-- ------------------------------------------------------------

CREATE TABLE error_logs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid REFERENCES organizations(id) ON DELETE SET NULL,
  teacher_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  operation       text NOT NULL,                   -- ex: 'pdf_export', 'ai_generate'
  error_code      text,
  error_message   text NOT NULL,
  stack_trace     text,
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_error_logs_org_id ON error_logs(org_id);
CREATE INDEX idx_error_logs_operation ON error_logs(operation);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);


-- ------------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
-- Atualiza automaticamente o campo updated_at
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas que têm updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
