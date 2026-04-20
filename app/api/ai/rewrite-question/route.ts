import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { questionId, instruction, subject, grade } = await req.json()
    if (!questionId || !instruction) {
      return NextResponse.json({ error: 'questionId e instruction são obrigatórios' }, { status: 400 })
    }

    // ── Verificar Perfil e Limite ──────────────────────────────────────────
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
    if (!profile?.org_id) return NextResponse.json({ error: 'Perfil sem organização' }, { status: 403 })

    const { checkTokenLimit } = await import('@/lib/ai/token-service')
    const limitCheck = await checkTokenLimit(profile.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 403 })
    }

    // Busca a questão atual
    const { data: question, error: fetchError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (fetchError || !question) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 })
    }

    const systemPrompt = `Você é um especialista em pedagogia brasileira e criação de avaliações.
Sua tarefa é reescrever uma questão de prova seguindo a instrução do professor.
Retorne APENAS um JSON válido com a estrutura da questão reescrita.`

    const userPrompt = `Questão atual:
Tipo: ${question.type}
Conteúdo: ${question.content}
Opções: ${JSON.stringify(question.options)}
Resposta: ${question.answer}
Explicação: ${question.explanation}

Disciplina: ${subject || 'não especificada'}
Série: ${grade || 'não especificada'}

Instrução do professor: "${instruction}"

Retorne um JSON com esta estrutura exata:
{
  "content": "enunciado reescrito",
  "options": [{"letter": "A", "text": "...", "is_correct": false}, ...] ou null para dissertativas,
  "answer": "resposta/gabarito",
  "explanation": "explicação pedagógica detalhada"
}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) throw new Error('Resposta vazia da IA')

    const rewritten = JSON.parse(content)

    // Atualiza a questão no banco
    const serviceClient = createServiceClient()
    const { data: updated, error: updateError } = await serviceClient
      .from('questions')
      .update({
        content:     rewritten.content,
        options:     rewritten.options ?? question.options,
        answer:      rewritten.answer,
        explanation: rewritten.explanation,
      })
      .eq('id', questionId)
      .select()
      .single()

    if (updateError) throw new Error('Erro ao salvar reescrita: ' + updateError.message)

    // ── Registrar tokens (Reescrita) ─────────────────────────────────────────
    const usage = completion.usage
    if (usage) {
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      const { logApiUsage } = await import('@/lib/ai/logger')
      await logApiUsage({
        userId: user.id,
        orgId: profile?.org_id,
        examId: question.exam_id,
        modelName: 'gpt-4o',
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        operation: 'rewrite_question'
      })
    }

    return NextResponse.json({ success: true, question: updated })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    console.error('[rewrite-question]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
