import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { buildSystemPrompt, buildUserPrompt, type ExamPromptConfig, BLOOM_MAP } from '@/lib/prompts/exam-generation'
import { searchDocumentChunks, searchBNCC } from '@/lib/rag/search'
import { calculateCost } from '@/lib/utils'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, organizations(plan, is_active, is_blocked)')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) return NextResponse.json({ error: 'Perfil inválido' }, { status: 403 })

    const org = profile.organizations as { plan: string; is_active: boolean; is_blocked: boolean } | null
    if (org?.is_blocked) return NextResponse.json({ error: 'Escola bloqueada' }, { status: 403 })

    // ── Parse body ──────────────────────────────────────────────────────────
    const {
      subject, grade, theme, difficulty, style,
      bloomLevel, questionMix, optionsCount, optionsFormat,
      accessibility, useBncc, selectedDocumentIds = [], examTitle,
    } = await req.json()

    // ── Verificar Limite de Tokens ──────────────────────────────────────────
    const { checkTokenLimit, recordTokenUsage } = await import('@/lib/ai/token-service')
    const limitCheck = await checkTokenLimit(profile.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 403 })
    }

    if (!subject || !grade || !theme) {
      return NextResponse.json({ error: 'Disciplina, série e tema são obrigatórios' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // ── RAG: buscar contexto dos documentos ─────────────────────────────────
    const ragQuery = `${subject} ${grade} ${theme}`
    let ragContext = ''

    if (selectedDocumentIds.length > 0) {
      // Busca nos documentos selecionados especificamente - Threshold mais baixo (0.40) para garantir que pegue o conteúdo
      ragContext = await searchDocumentChunks(ragQuery, profile.org_id, user.id, selectedDocumentIds, 15, 0.40)
      
      // Log para debug
      await serviceClient.from('debug_logs').insert({
        event: 'rag_context_found',
        data: { 
          query: ragQuery, 
          contextLength: ragContext.length,
          preview: ragContext.substring(0, 200)
        }
      })
    }

    // ── BNCC: buscar competências relevantes ────────────────────────────────
    let bnccCodes: string[] = []
    if (useBncc) {
      bnccCodes = await searchBNCC(ragQuery, user.id, subject, grade, 5, 0.65)
    }

    // ── Build prompts ───────────────────────────────────────────────────────
    const config: ExamPromptConfig = {
      subject, grade, theme, difficulty, style,
      bloomLevel, questionMix, optionsCount, optionsFormat,
      accessibility,
      ragContext: ragContext || undefined,
      bnccCodes: bnccCodes.length > 0 ? bnccCodes : undefined,
      useBncc,
    }

    const systemPrompt = buildSystemPrompt(useBncc, selectedDocumentIds.length > 0)
    const userPrompt   = buildUserPrompt(config)

    // ── Call GPT-4o ─────────────────────────────────────────────────────────
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('Resposta vazia da IA')

    let examData: {
      title: string
      instructions: string
      pedagogical_warning: string | null
      estimated_time_min: number

      questions: Array<{
        type: string
        content: string
        options: Array<{ letter: string; text: string; is_correct: boolean }> | null
        answer: string
        explanation: string
        bncc_code: string | null
        bloom_level: string
        estimated_time_sec: number
      }>
    }

    try {
      examData = JSON.parse(content)
    } catch {
      throw new Error('IA retornou JSON inválido')
    }

    // ── Registrar uso de tokens ─────────────────────────────────────────────
    const tokensIn  = completion.usage?.prompt_tokens    ?? 0
    const tokensOut = completion.usage?.completion_tokens ?? 0
    const costUsd   = calculateCost('gpt-4o', tokensIn, tokensOut)

    // ── Salvar prova no banco ───────────────────────────────────────────────
    const { data: exam, error: examError } = await serviceClient
      .from('exams')
      .insert({
        org_id:         profile.org_id,
        teacher_id:     user.id,
        title:          examTitle || examData.title,
        subject,
        grade,
        theme,
        instructions:   examData.instructions,
        pedagogical_warning: examData.pedagogical_warning,
        difficulty,
        style,
        bloom_level:    bloomLevel ? (BLOOM_MAP[bloomLevel] || null) : null,
        question_config: questionMix,
        accessibility,
        use_bncc:       useBncc,
        source_documents: selectedDocumentIds.length > 0 ? selectedDocumentIds : null,
        status:         'draft',
        tokens_used:    tokensIn + tokensOut,
        estimated_time_min: examData.estimated_time_min ?? null,
      })
      .select()
      .single()

    if (examError) throw new Error('Erro ao salvar prova: ' + examError.message)

    // ── Salvar questões ─────────────────────────────────────────────────────
    const questionsToInsert = examData.questions.map((q, idx) => ({
      exam_id:           exam.id,
      org_id:            profile.org_id,
      type:              q.type === 'complex' ? 'multiple_choice' : q.type,
      content:           q.content,
      options:           q.options ?? null,
      answer:            q.answer,
      explanation:       q.explanation,
      bncc_code:         q.bncc_code ?? null,
      bloom_level:       bloomLevel ? (BLOOM_MAP[bloomLevel] || null) : null,
      estimated_time_sec:q.estimated_time_sec ?? null,
      order_index:       idx,
      tokens_used:       0,
    }))

    const { error: questionsError } = await serviceClient
      .from('questions')
      .insert(questionsToInsert)

    if (questionsError) throw new Error('Erro ao salvar questões: ' + questionsError.message)

    // ── Registrar tokens ────────────────────────────────────────────────────
    await serviceClient.from('token_usage').insert({
      org_id:     profile.org_id,
      teacher_id: user.id,
      exam_id:    exam.id,
      operation:  'generate_exam',
      model:      'gpt-4o',
      tokens_in:  tokensIn,
      tokens_out: tokensOut,
      cost_usd:   costUsd,
    })

    return NextResponse.json({
      success: true,
      examId: exam.id,
      title: exam.title,
      questionCount: questionsToInsert.length,
      tokensUsed: tokensIn + tokensOut,
      estimatedTimeMin: examData.estimated_time_min,
    })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[generate-exam]', message)

    // Log do erro
    try {
      const serviceClient = createServiceClient()
      await serviceClient.from('error_logs').insert({
        operation: 'generate_exam',
        error_message: message,
      })
    } catch {}

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
