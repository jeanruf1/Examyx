import { createServiceClient } from '@/lib/supabase/server'
import { TOKEN_COSTS } from '@/lib/utils'

interface LogUsageParams {
  userId: string
  orgId?: string
  examId?: string
  modelName: string
  promptTokens: number
  completionTokens: number
  operation: 'generate_exam' | 'rewrite_question' | 'image_question' | 'embed_document' | 'embed_bncc' | 'review_pill' | 'search_context' | 'ocr'
}

export async function logApiUsage({
  userId,
  orgId,
  examId,
  modelName,
  promptTokens,
  completionTokens,
  operation
}: LogUsageParams) {
  const supabase = createServiceClient()

  // Buscar custo da tabela centralizada
  const pricing = TOKEN_COSTS[modelName as keyof typeof TOKEN_COSTS] || { input: 0.005, output: 0.015 }
  
  // Cálculo: (tokens / 1000) * preço_por_1k
  const cost = (promptTokens / 1000 * pricing.input) + (completionTokens / 1000 * pricing.output)

  try {
    const { error } = await supabase
      .from('token_usage')
      .insert({
        teacher_id: userId,
        org_id: orgId,
        exam_id: examId,
        model: modelName,
        tokens_in: promptTokens,
        tokens_out: completionTokens,
        cost_usd: cost,
        operation: operation
      })

    if (error) console.error('[LogUsage Error]', error)
  } catch (err) {
    console.error('[LogUsage Critical Error]', err)
  }
}
