# ProvaAI — Plano de Implementação

## Visão Geral

**ProvaAI** é uma plataforma SaaS multi-tenant para escolas brasileiras que permite a professores gerar provas personalizadas com IA (OpenAI) em minutos. A plataforma suporta upload de material didático (RAG via Supabase pgvector), acessibilidade (TEA, Dislexia, TDAH), exportação em PDF/DOCX e um painel administrativo completo para gestão de custos e tokens.

---

## Stack Técnico Definido

| Camada | Tecnologia |
|---|---|
| **Frontend** | Next.js 14 (App Router) + TypeScript |
| **Estilização** | Tailwind CSS + shadcn/ui |
| **Backend/API** | Next.js API Routes (Edge/Node) |
| **Auth** | Supabase Auth (email + magic link) |
| **Banco de Dados** | Supabase PostgreSQL + RLS por tenant |
| **Vetorização/RAG** | Supabase pgvector + OpenAI Embeddings |
| **IA de Geração** | OpenAI GPT-4o (chat completions + vision) |
| **PDF** | Puppeteer / React-PDF |
| **DOCX** | docx.js |
| **OCR** | Tesseract.js |
| **Storage** | Supabase Storage (uploads de PDF/imagem) |
| **LaTeX** | KaTeX (render client-side) |
| **Fontes** | OpenDyslexic + Google Fonts (Inter) |

---

## Arquitetura Multi-Tenant

```
ProvaAI (SaaS)
  └── Tenant: Escola A (org_id = uuid)
       ├── Professores (user_id ligado ao org_id)
       ├── Banco de Questões (isolado por RLS)
       ├── Documentos RAG (vetores isolados)
       └── Provas Geradas
  └── Tenant: Escola B
       └── ...
```

Cada escola é um **tenant** com `org_id`. Todos os dados são isolados por Row Level Security (RLS) no Supabase. Professores só veem dados da sua escola.

---

## Estrutura de Pastas (Next.js)

```
ProvaProjeto/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (admin)/
│   │   └── admin/
│   │       ├── dashboard/       ← Métricas SaaS, MRR, tokens
│   │       ├── tenants/         ← Gestão de escolas
│   │       └── logs/            ← Erros e monitoramento
│   ├── (dashboard)/
│   │   ├── layout.tsx           ← Sidebar do professor
│   │   ├── dashboard/           ← Home do professor
│   │   ├── nova-prova/          ← Wizard de criação
│   │   ├── provas/              ← Histórico de provas
│   │   │   └── [id]/
│   │   │       ├── editor/      ← Editor visual pós-geração
│   │   │       └── preview/     ← Preview PDF
│   │   ├── banco-questoes/      ← Questões salvas
│   │   ├── documentos/          ← Upload RAG
│   │   └── configuracoes/       ← Logo, cabeçalho, perfil
│   └── api/
│       ├── ai/
│       │   ├── generate-exam/   ← Geração principal
│       │   ├── rewrite-question/
│       │   ├── image-question/  ← Vision API
│       │   └── embeddings/      ← Indexação RAG
│       ├── pdf/
│       │   └── export/          ← Puppeteer PDF
│       ├── docx/
│       │   └── export/
│       ├── ocr/
│       │   └── correct/
│       └── admin/
│           ├── metrics/
│           └── tenants/
├── components/
│   ├── exam/
│   │   ├── ExamWizard.tsx
│   │   ├── QuestionEditor.tsx
│   │   ├── AccessibilityPanel.tsx
│   │   └── PreviewPDF.tsx
│   ├── admin/
│   │   ├── RevenueMetrics.tsx
│   │   ├── TokenUsageChart.tsx
│   │   └── TenantManager.tsx
│   └── ui/                      ← shadcn components
├── lib/
│   ├── openai.ts                ← Client OpenAI
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── rag/
│   │   ├── embed.ts             ← Criar embeddings
│   │   └── search.ts            ← Busca vetorial
│   ├── pdf/
│   │   └── generator.ts
│   └── prompts/
│       ├── exam-generation.ts
│       ├── accessibility.ts     ← Prompts TEA/Dislexia/TDAH
│       └── bncc.ts
└── supabase/
    └── migrations/              ← Schema SQL
```

---

## Schema do Banco de Dados

### Tabelas Principais

```sql
-- Organizações (Escolas/Tenants)
organizations (
  id uuid PK,
  name text,
  logo_url text,
  plan text,           -- 'trial' | 'basic' | 'pro' | 'enterprise'
  trial_ends_at timestamptz,
  is_active boolean,
  header_config jsonb, -- {nome, turma, data, nota, campos extras}
  created_at timestamptz
)

-- Usuários/Professores
profiles (
  id uuid PK → auth.users,
  org_id uuid → organizations,
  role text,           -- 'admin' | 'teacher' | 'superadmin'
  full_name text,
  avatar_url text
)

-- Documentos para RAG
documents (
  id uuid PK,
  org_id uuid,
  teacher_id uuid,
  name text,
  file_url text,
  type text,           -- 'pdf' | 'slide' | 'text'
  chunk_count int,
  created_at timestamptz
)

-- Chunks vetorizados (pgvector)
document_chunks (
  id uuid PK,
  document_id uuid,
  org_id uuid,
  content text,
  embedding vector(1536),  -- OpenAI ada-002
  metadata jsonb
)

-- BNCC (global, sem RLS)
bncc_competencies (
  id uuid PK,
  code text,           -- ex: EF06MA01
  description text,
  subject text,
  grade text,
  embedding vector(1536)
)

-- Provas
exams (
  id uuid PK,
  org_id uuid,
  teacher_id uuid,
  title text,
  subject text,
  grade text,
  theme text,
  difficulty text,     -- 'facil' | 'medio' | 'dificil'
  style text,          -- 'regular' | 'enem' | 'homework'
  accessibility jsonb, -- {tea: bool, dyslexia: bool, adhd: bool}
  bloom_level text,    -- 'memorization' | 'application' | 'critical'
  status text,         -- 'draft' | 'published'
  tokens_used int,
  estimated_time_min int,
  created_at timestamptz
)

-- Questões
questions (
  id uuid PK,
  exam_id uuid,
  org_id uuid,
  type text,           -- 'multiple_choice' | 'essay' | 'true_false'
  content text,
  options jsonb,       -- [{letter, text, is_correct}]
  answer text,
  explanation text,    -- gabarito comentado
  bncc_code text,
  image_url text,
  order_index int,
  bloom_level text,
  tokens_used int
)

-- Banco de Questões (reutilizável)
question_bank (
  id uuid PK,
  org_id uuid,
  question_id uuid → questions,
  tags text[],
  times_used int
)

-- Uso de tokens (para admin)
token_usage (
  id uuid PK,
  org_id uuid,
  teacher_id uuid,
  operation text,      -- 'generate_exam' | 'rewrite' | 'embed' | 'image'
  tokens_in int,
  tokens_out int,
  cost_usd numeric,
  created_at timestamptz
)

-- Logs de erros
error_logs (
  id uuid PK,
  org_id uuid,
  operation text,
  error_message text,
  stack text,
  created_at timestamptz
)
```

---

## Proposed Changes

### Phase 1 — Fundação & Auth

#### [NEW] `app/(auth)/login/page.tsx`
Página de login com Supabase Auth. Magic link + email/senha.

#### [NEW] `app/(auth)/register/page.tsx`
Cadastro de escola (cria org) + professor admin.

#### [NEW] `supabase/migrations/001_initial_schema.sql`
Schema completo com RLS policies.

---

### Phase 2 — Dashboard do Professor

#### [NEW] `app/(dashboard)/nova-prova/page.tsx`
**Wizard em 4 etapas:**
1. **Configurações** — Disciplina, série, tema, dificuldade, tipos de questão, nível Bloom
2. **Contexto (RAG)** — Upload de PDFs/slides ou busca BNCC vetorial
3. **Acessibilidade** — Toggle TEA / Dislexia / TDAH
4. **Geração** — Loading animado → preview em tempo real (streaming)

#### [NEW] `app/(dashboard)/provas/[id]/editor/page.tsx`
**Editor visual pós-geração:**
- Editar texto de qualquer questão inline
- Botão "Reescrever com IA" (mais fácil / mais difícil)
- Drag-and-drop para reordenar questões
- Adicionar/remover questões
- Preview ao lado (split screen)

#### [NEW] `app/(dashboard)/provas/[id]/preview/page.tsx`
Preview A4 do PDF com botões de export (PDF, DOCX, Versão Inclusiva).

---

### Phase 3 — Motor de IA

#### [NEW] `app/api/ai/generate-exam/route.ts`
Endpoint principal. Fluxo:
1. Busca chunks relevantes via pgvector (RAG)
2. Busca competências BNCC relevantes
3. Monta prompt com contexto + configurações
4. Chama GPT-4o com streaming
5. Registra tokens em `token_usage`
6. Retorna questões estruturadas em JSON

#### [NEW] `lib/prompts/exam-generation.ts`
Sistema de prompts em português, adaptáveis por:
- Disciplina e série
- Nível de dificuldade
- Tipos de questão
- Nível Bloom (memorização / aplicação / análise crítica)
- Modo ENEM / Trabalho de Casa
- Linguagem inclusiva (TEA/Dislexia/TDAH)
- Alinhamento BNCC

#### [NEW] `app/api/ai/image-question/route.ts`
GPT-4o Vision: recebe imagem (mapa, gráfico, tirinha) e gera perguntas interpretativas.

#### [NEW] `app/api/ai/rewrite-question/route.ts`
Reescreve uma questão específica com instrução do professor.

---

### Phase 4 — RAG & Vetorização

#### [NEW] `app/api/ai/embeddings/route.ts`
- Recebe PDF/texto do Supabase Storage
- Faz chunking (1000 tokens, overlap 200)
- Gera embeddings via OpenAI `text-embedding-ada-002`
- Salva em `document_chunks` com pgvector

#### [NEW] `lib/rag/search.ts`
Busca semântica em `document_chunks` + `bncc_competencies` filtrada por `org_id` e parâmetros da prova.

---

### Phase 5 — Export PDF/DOCX

#### [NEW] `app/api/pdf/export/route.ts`
Usa Puppeteer para renderizar HTML → PDF A4 com:
- Templates de cabeçalho customizável (logo + campos)
- Suporte a LaTeX via KaTeX
- Fontes inclusivas (OpenDyslexic, Arial)
- Layout adaptado por modo de acessibilidade
- Folha de respostas opcional
- Gabarito comentado separado

#### [NEW] `app/api/docx/export/route.ts`
Exporta para DOCX usando `docx.js`.

---

### Phase 6 — Painel Admin

#### [NEW] `app/(admin)/admin/dashboard/page.tsx`
**Métricas SaaS:**
- MRR, ARR, churn, inadimplência
- Trials ativos vs. convertidos
- Provas geradas por dia/semana (gráfico)
- Escolas ativas, professores mais ativos

**Custos de IA:**
- Tokens consumidos por escola (gráfico de barras)
- Custo total vs. receita → margem por escola
- Operações mais caras (geração vs. embeddings)

#### [NEW] `app/(admin)/admin/tenants/page.tsx`
- Listar todas as escolas
- Bloquear/desbloquear tenant
- Upgrade/downgrade de plano manual
- Resetar trial
- Impersonar professor (para suporte)

#### [NEW] `app/(admin)/admin/logs/page.tsx`
- Erros de PDF (timeout Puppeteer)
- Timeouts OpenAI API
- Falhas de embedding
- Filtro por escola / período

---

### Phase 7 — Features Adicionais

#### Prova B/C (Anti-cola)
Embaralhamento automático de questões e alternativas. Para matemática: alteração de valores numéricos via prompt.

#### OCR de Gabarito
`app/api/ocr/correct/route.ts` — Tesseract.js lê foto da folha de respostas e compara com gabarito.

#### Estimativa de Tempo
Calculada na geração: média de palavras por tipo de questão → tempo estimado em minutos.

#### Detector de Repetição
Query no `question_bank` por similaridade semântica antes de salvar nova questão.

#### Pílulas de Revisão
Endpoint separado: resume o conteúdo da prova em 1 página com bullet points.

---

## Open Questions

> [!IMPORTANT]
> **1. Planos e Preços**
> Qual é a estrutura de planos desejada? Sugestão:
> - **Trial**: 14 dias, 5 provas, sem RAG
> - **Basic (R$ 97/mês)**: 50 provas/mês, 1 professor, RAG com até 20 docs
> - **Pro (R$ 297/mês)**: ilimitado, 5 professores, todas as features
> - **Enterprise**: negociado por escola

> [!IMPORTANT]
> **2. Pagamentos**
> Integrar Stripe ou Pagar.me/Asaas (mais comum no Brasil)? Ou deixar pagamento manual inicialmente?

> [!WARNING]
> **3. Deploy inicial**
> Vercel (mais simples) + Supabase cloud, ou você quer rodar on-premise? O Puppeteer para PDF tem algumas limitações no Vercel — pode ser necessário usar uma função serverless separada (ex: Railway ou Render) para o gerador de PDF.

> [!NOTE]
> **4. Escopo da Fase 1 (MVP)**
> Dado o tamanho do projeto, sugiro construir em fases. O MVP inclui:
> - Auth + multi-tenant
> - Wizard de criação de prova (RAG + BNCC)
> - Geração com GPT-4o
> - Editor visual
> - Export PDF
> - Painel Admin básico
>
> As features avançadas (OCR, anti-cola, estimativa de tempo, etc.) ficam para Fase 2. **Confirma?**

> [!NOTE]
> **5. BNCC no Supabase**
> Você já tem a base da BNCC para popular no Supabase, ou preciso estruturar a importação dos dados públicos do MEC? Posso criar um script para popular automaticamente.

---

## Verification Plan

### Automated Tests
- `npm run build` — verificar sem erros de TypeScript
- Testes de API com dados mock para geração de prova
- Verificar RLS: professor da escola A não deve ver dados da escola B

### Manual Verification
- Fluxo completo: cadastro → upload PDF → gerar prova → editar → exportar PDF
- Verificar renderização A4 do PDF com LaTeX
- Testar modo acessibilidade (fonte OpenDyslexic, espaçamento)
- Admin: verificar métricas de token após geração

---

## Roadmap de Entrega

| Fase | O que será entregue | Estimativa |
|---|---|---|
| **Fase 1** | Projeto Next.js, Auth, multi-tenant, schema Supabase | Sessão 1 |
| **Fase 2** | Dashboard professor, Wizard de prova, integração OpenAI | Sessão 2 |
| **Fase 3** | RAG (upload + vetorização + busca), BNCC | Sessão 3 |
| **Fase 4** | Editor visual, export PDF/DOCX, acessibilidade | Sessão 4 |
| **Fase 5** | Painel Admin completo, métricas, gestão tenants | Sessão 5 |
| **Fase 6** | Features extras (OCR, anti-cola, banco de questões, etc.) | Sessão 6+ |
