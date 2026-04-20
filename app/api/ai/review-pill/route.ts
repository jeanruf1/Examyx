import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { examId } = await req.json()
    if (!examId) return NextResponse.json({ error: 'examId é obrigatório' }, { status: 400 })

    // ── Verificar Perfil e Limite ──────────────────────────────────────────
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
    if (!profile?.org_id) return NextResponse.json({ error: 'Perfil sem organização' }, { status: 403 })

    const { checkTokenLimit } = await import('@/lib/ai/token-service')
    const limitCheck = await checkTokenLimit(profile.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 403 })
    }

    // Busca a prova e as questões para contexto
    const { data: exam } = await supabase
      .from('exams')
      .select('*, questions(*)')
      .eq('id', examId)
      .single()

    if (!exam) return NextResponse.json({ error: 'Prova não encontrada' }, { status: 404 })

    // Se já existir uma pílula, retorna ela
    if (exam.review_pill) {
      return NextResponse.json(exam.review_pill)
    }

    const systemPrompt = `Você é um tutor pedagógico de alto nível. 
Sua tarefa é criar uma "Pílula de Revisão" para alunos. 
Este é um resumo de 1 página que foca nos conceitos essenciais que serão cobrados na prova.
A linguagem deve ser clara, motivadora e estruturada em tópicos.`

    const userPrompt = `Baseado nesta prova de ${exam.subject} para o ${exam.grade}:
Tema: ${exam.theme}
Conteúdo das questões: ${exam.questions.map((q: any) => q.content).join(' | ')}

Crie a Pílula de Revisão com os seguintes campos em JSON:
1. "title": Um título chamativo (ex: "Missão Revisão: [Tema]")
2. "essential_concepts": Uma lista de 4 a 6 conceitos que o aluno PRECISA saber.
3. "quick_tips": 3 dicas práticas para resolver as questões desse tema.
4. "challenge": Um pequeno desafio ou pergunta reflexiva para o aluno testar o conhecimento.

Retorne APENAS o JSON.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const pillData = JSON.parse(completion.choices[0].message.content || '{}')

    // Salva a pílula gerada no banco de dados
    await supabase
      .from('exams')
      .update({ review_pill: pillData })
      .eq('id', examId)

    // ── Registrar tokens (Pílula de Revisão) ─────────────────────────────────
    const usage = completion.usage
    if (usage) {
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      const { logApiUsage } = await import('@/lib/ai/logger')
      await logApiUsage({
        userId: user.id,
        orgId: profile?.org_id,
        examId: examId,
        modelName: 'gpt-4o',
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        operation: 'review_pill'
      })
    }

    return NextResponse.json(pillData)
  } catch (err: any) {
    console.error('[review-pill]', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
