export interface ExamPromptConfig {
  title?: string
  subject: string
  grade: string
  theme: string
  difficulty: 'facil' | 'medio' | 'dificil'
  style: 'regular' | 'enem' | 'homework'
  bloomLevel?: string
  questionMix: {
    multipleChoice: number
    openEnded: number
    fillInBlanks: number
    trueFalse: number
    complex: number
  }
  optionsCount: number
  optionsFormat: 'letters' | 'roman'
  accessibility: {
    tea: boolean
    dyslexia: boolean
    adhd: boolean
  }
  ragContext?: string        // chunks dos documentos do professor
  bnccCodes?: string[]      // competências BNCC relevantes
  useBncc: boolean
}

// ── Difficulty labels ──────────────────────────────────────────────────────

const DIFFICULTY_LABEL: Record<string, string> = {
  facil:  'fácil (vocabulário simples, enunciados curtos, conceitos básicos)',
  medio:  'médio (exige compreensão e aplicação de conceitos)',
  dificil:'difícil (análise crítica, interdisciplinaridade, situações-problema complexas)',
}

export const BLOOM_MAP: Record<string, string> = {
  'Lembrar': 'memorization',
  'Compreender': 'comprehension',
  'Aplicar': 'application',
  'Analisar': 'analysis',
  'Avaliar': 'evaluation',
  'Criar': 'synthesis',
}

const BLOOM_LABEL: Record<string, string> = {
  'Lembrar': 'Lembrar — identificar, recordar, listar fatos e definições',
  'Compreender': 'Compreensão — explicar, interpretar, classificar conceitos',
  'Aplicar': 'Aplicação — resolver problemas, usar conhecimento em situações novas',
  'Analisar': 'Análise — comparar, diferenciar, organizar informações complexas',
  'Avaliar': 'Avaliação — julgar, argumentar, emitir posições fundamentadas',
  'Criar': 'Criação — propor, elaborar, desenhar soluções a partir do conhecimento',
}

const STYLE_INSTRUCTIONS: Record<string, string> = {
  regular: `
- Linguagem direta e objetiva
- Enunciados claros e sem ambiguidade
- Contexto adequado para o nível escolar`,

  enem: `
- Cada questão deve ter um texto de apoio (notícia, trecho literário, dados estatísticos, charge, poema, etc.)
- Linguagem sofisticada e interdisciplinar
- As alternativas devem ser plausíveis, com distratores bem elaborados
- O enunciado deve relacionar o tema a questões sociais, ambientais ou culturais brasileiras
- Múltipla escolha com 5 alternativas (A, B, C, D, E)`,

  homework: `
- Tom investigativo e reflexivo
- Incentive o aluno a pesquisar e explorar além do livro
- Questões abertas com espaço para argumentação
- Evite questões que tenham uma única resposta correta óbvia`,
}

// ── Accessibility instructions ─────────────────────────────────────────────

function buildAccessibilityInstructions(a: ExamPromptConfig['accessibility']): string {
  const rules: string[] = []

  if (a.tea) {
    rules.push(`
ADAPTAÇÃO PARA AUTISMO (TEA):
- Use linguagem hiper-literal e concreta. Evite metáforas, ironias e linguagem figurada.
- Elimine duplas negativas.
- Enunciados curtos e com uma ideia por vez.
- Evite ambiguidade: cada questão deve ter interpretação única.
- Contextos devem ser explícitos — não presuma inferências do leitor.`)
  }

  if (a.dyslexia) {
    rules.push(`
ADAPTAÇÃO PARA DISLEXIA:
- Frases curtas (máximo 2 linhas por parágrafo).
- Vocabulário familiar e frequente.
- Estrutura lógica clara com transições explícitas.
- Alternativas em linhas separadas, numeradas ou com letras grandes.`)
  }

  if (a.adhd) {
    rules.push(`
ADAPTAÇÃO PARA TDAH:
- Destaque as palavras de comando do enunciado em CAIXA ALTA (ex: CALCULE, DESCREVA, IDENTIFIQUE).
- Enunciados concisos — elimine informações não essenciais.
- Divida questões longas em partes menores (a, b, c).
- Use verbos de ação no início do enunciado.`)
  }

  return rules.length > 0 ? '\n\nREGRAS DE ACESSIBILIDADE (APLICAR EM TODAS AS QUESTÕES):\n' + rules.join('\n') : ''
}

// ── Question count string ──────────────────────────────────────────────────

function buildQuestionCountString(q: ExamPromptConfig['questionMix']): string {
  const parts: string[] = []
  if (q.multipleChoice > 0) parts.push(`${q.multipleChoice} de múltipla escolha`)
  if (q.openEnded > 0)      parts.push(`${q.openEnded} dissertativa(s)`)
  if (q.trueFalse > 0)      parts.push(`${q.trueFalse} de verdadeiro ou falso. Para "true_false", use apenas duas opções: "Verdadeiro" e "Falso". Apenas UMA delas deve ser marcada como is_correct: true.`)
  if (q.fillInBlanks > 0)   parts.push(`${q.fillInBlanks} de preencher lacunas`)
  if (q.complex > 0)        parts.push(`${q.complex} complexas (com afirmativas I-IV para julgar)`)
  return parts.join(', ')
}

// ── System prompt ──────────────────────────────────────────────────────────

export function buildSystemPrompt(useBncc: boolean = true, hasMaterial: boolean = false): string {
  const bnccIntro = useBncc 
    ? 'Você é um especialista em pedagogia e elaboração de avaliações educacionais brasileiras (BNCC).'
    : 'Você é um especialista em pedagogia e elaboração de avaliações educacionais. ATENÇÃO: Está TOTALMENTE PROIBIDO mencionar a BNCC ou usar suas terminologias (como códigos de competência) nesta tarefa.'

  const bnccAnalysis = useBncc
    ? 'Antes de gerar as questões, você deve verificar se o TEMA solicitado pertence de fato ao ANO/SÉRIE selecionado de acordo com a BNCC.'
    : 'Ignore quaisquer diretrizes nacionais de ensino (BNCC). Foque apenas no rigor acadêmico e na clareza das questões.'

  const materialRule = hasMaterial
    ? '\nREGRA DE EXCLUSIVIDADE: Foi fornecido um MATERIAL DO PROFESSOR. Você deve criar as questões BASEANDO-SE EXCLUSIVAMENTE nesse conteúdo. Não use conhecimentos externos que não estejam no material fornecido.'
    : ''

  return `${bnccIntro}${materialRule}
Sua função é criar questões de provas de alta qualidade, pedagogicamente corretas, claras e bem estruturadas.

DIRETRIZ CRÍTICA DE ANÁLISE E ADEQUAÇÃO:
${bnccAnalysis}
- SE O TEMA FOR INADEQUADO (ex: Cálculo para 5º ano): Você DEVE obrigatoriamente preencher o campo "pedagogical_warning" com um alerta técnico. 
- PROIBIDO dizer apenas "Avaliação estruturada conforme diretrizes BNCC" se o tema original era de nível superior/médio. Você deve denunciar o mismatch e explicar como adaptou (ex: "O tema Cálculo é de nível universitário; a prova foi adaptada para focar apenas em frações e lógica do 5º ano").
${useBncc ? '- Se houver inconsistência com a BNCC, use o campo "pedagogical_warning" para detalhar.' : ''}

REGRAS DE MATÉRIA (CÁLCULOS):
- Se a disciplina for Matemática, Física ou Química, o campo "explanation" DEVE conter o passo a passo detalhado do cálculo.

Siga RIGOROSAMENTE o formato JSON solicitado.`
}


// ── User prompt ────────────────────────────────────────────────────────────

export function buildUserPrompt(config: ExamPromptConfig): string {
  const total = Object.values(config.questionMix).reduce((a, b) => a + b, 0)
  const styleInstr = STYLE_INSTRUCTIONS[config.style] || STYLE_INSTRUCTIONS.regular
  const accessInstr = buildAccessibilityInstructions(config.accessibility)
  const bloomInstr = config.bloomLevel && BLOOM_LABEL[config.bloomLevel as keyof typeof BLOOM_LABEL]
    ? `\nNível de pensamento (Taxonomia de Bloom): ${BLOOM_LABEL[config.bloomLevel as keyof typeof BLOOM_LABEL]}`
    : ''

  const optionsFormatLabel = config.optionsFormat === 'letters' ? 'Letras (A, B, C...)' : 'Algarismos Romanos (I, II, III...)'

  const bnccSection = config.useBncc && config.bnccCodes && config.bnccCodes.length > 0
    ? `\n\nCOMPETÊNCIAS DA BNCC RELACIONADAS (inclua o código no campo bncc_code de cada questão):\n${config.bnccCodes.join('\n')}`
    : ''

  const ragSection = config.ragContext
    ? `\n\nCONTEÚDO DO MATERIAL DO PROFESSOR (priorize este conteúdo):\n---\n${config.ragContext}\n---`
    : ''

  return `Crie uma prova com as seguintes especificações:

DISCIPLINA: ${config.subject}
SÉRIE/ANO: ${config.grade}
TEMA: ${config.theme}
DIFICULDADE: ${DIFFICULTY_LABEL[config.difficulty]}
ESTILO: ${config.style.toUpperCase()}${bloomInstr}
FORMATO DAS ALTERNATIVAS: ${optionsFormatLabel} (usar ${config.optionsCount} opções por questão de múltipla escolha)

MIX DE QUESTÕES: ${buildQuestionCountString(config.questionMix)} (total: ${total})

${styleInstr}
${accessInstr}
${bnccSection}
${ragSection}

FORMATO DE RESPOSTA (JSON estrito):
{
  "title": "Título descritivo da prova",
  "instructions": "Instruções gerais para o aluno.",
  "pedagogical_warning": ${config.useBncc ? '"Aviso técnico se o tema for inadequado para o ano conforme BNCC, senão null."' : '"Comentário sobre a fidelidade das questões ao material do professor fornecido (ex: Conteúdo 100% baseado no material anexado), senão null. PROIBIDO CITAR BNCC."'},
  "estimated_time_min": <número>,
  "questions": [
    {
      "type": "multiple_choice" | "essay" | "true_false" | "fill_blank" | "complex",
      "content": "Enunciado completo da questão. Se for complexa, inclua as afirmativas I, II, III... no corpo do texto para o aluno julgar.",
      "options": [
        {"letter": "A" ou "I", "text": "Texto da opção", "is_correct": boolean}
      ],
      "answer": "Resposta correta detalhada",
      "explanation": "CÁLCULO PASSO A PASSO (se aplicável) e justificativa pedagógica.",
      "bncc_code": ${config.useBncc ? '"Código BNCC"' : 'null (OBRIGATÓRIO: NÃO forneça códigos BNCC)'},
      "bloom_level": "Nível de Bloom",
      "estimated_time_sec": <segundos>
    }
  ]
}

REGRAS:
- Questões complexas devem seguir o estilo: "Analise as afirmativas abaixo: I... II... III... Agora marque a alternativa correta: a) I e II estão corretas...".
- Gere EXATAMENTE ${total} questões respeitando as quantidades solicitadas.`
}
