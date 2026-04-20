import { createClient } from '@/lib/supabase/server'

export interface TokenUsageRecord {
  orgId: string
  userId: string
  tokensTotal: number
  feature: 'exam_generation' | 'ocr' | 'review_pill' | 'chat'
}

export async function checkTokenLimit(orgId: string): Promise<{ allowed: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Buscar limite da organização e plano
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('monthly_token_limit, plan')
    .eq('id', orgId)
    .single()

  if (orgError || !org) return { allowed: false, error: 'Organização não encontrada.' }

  // 2. Buscar consumo total do mês atual
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const { data: usageData, error: usageError } = await supabase
    .from('token_usage')
    .select('tokens_total')
    .eq('org_id', orgId)
    .gte('created_at', firstDayOfMonth.toISOString())

  if (usageError) return { allowed: false, error: 'Erro ao verificar consumo.' }

  const totalUsed = usageData?.reduce((acc, curr) => acc + (curr.tokens_total || 0), 0) || 0

  if (totalUsed >= org.monthly_token_limit) {
    return { 
      allowed: false, 
      error: 'Limite mensal de tokens atingido para sua instituição. Entre em contato com a coordenação.' 
    }
  }

  return { allowed: true }
}

export async function recordTokenUsage(record: TokenUsageRecord) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('token_usage')
    .insert({
      org_id: record.orgId,
      user_id: record.userId,
      tokens_total: record.tokensTotal,
      feature: record.feature,
      metadata: { timestamp: new Date().toISOString() }
    })

  if (error) {
    console.error('[TokenService] Erro ao registrar uso:', error.message)
  }
}
