import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { logApiUsage } from '@/lib/ai/logger'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { images } = await req.json() // Array de Base64 das imagens

    // ── Verificar Perfil e Limite ──────────────────────────────────────────
    const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
    if (!profile?.org_id) return NextResponse.json({ error: 'Perfil sem organização' }, { status: 403 })

    const { checkTokenLimit } = await import('@/lib/ai/token-service')
    const limitCheck = await checkTokenLimit(profile.org_id)
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 403 })
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'Nenhuma imagem fornecida' }, { status: 400 })
    }

    const imageMessages = images.map(img => ({
      type: "image_url" as const,
      image_url: { url: img }
    }))

    const promptText = `Você é um especialista em OCR pedagógico de altíssima precisão. 
Extraia TODAS as questões destas imagens de prova.

REGRAS CRÍTICAS:
1. SE NÃO HOUVER ALTERNATIVAS (A, B, C...) na imagem, você DEVE CRIAR 4 alternativas (A até D) pedagogicamente coerentes baseadas no texto extraído.
2. Se a questão contiver uma imagem, gráfico, tabela ou figura, você DEVE retornar o campo 'image_bbox' [ymin, xmin, ymax, xmax] (0-1000) e uma 'image_description'.
3. Identifique o gabarito correto entre as alternativas.

Para cada questão, retorne:
- content (enunciado)
- options (array com letter e text)
- is_correct (qual letra está certa)
- bloom_level
- bncc_code
- explanation
- page_index (0, 1...)
- image_bbox (se houver figura)

Retorne APENAS um JSON puro: { "questions": [...] }`

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            ...imageMessages
          ],
        },
      ],
      response_format: { type: "json_object" },
    })

    const usage = response.usage
    if (usage) {
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      await logApiUsage({
        userId: user.id,
        orgId: profile?.org_id,
        modelName: 'gpt-4o',
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        operation: 'image_question'
      })
    }

    const result = JSON.parse(response.choices[0].message.content || '{"questions": []}')
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[OCR Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
