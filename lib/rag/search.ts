import { createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── Busca chunks relevantes nos documentos do professor ────────────────────

export async function searchDocumentChunks(
  query: string,
  orgId: string,
  userId: string,
  documentIds?: string[],
  matchCount = 10,
  threshold = 0.70
): Promise<string> {
  try {
    const supabase = createServiceClient()

    // Gerar embedding da query
    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    })
    const embedding = embeddingRes.data[0].embedding

    // Busca vetorial via função RPC
    const { data, error } = await supabase.rpc('search_document_chunks', {
      p_query_embedding: embedding,
      p_org_id: orgId,
      p_document_ids: documentIds || null,
      p_match_count: matchCount,
      p_similarity_threshold: threshold,
    })

    // Log de uso (Embeddings gastam pouco, mas gastam!)
    try {
      const { logApiUsage } = await import('@/lib/ai/logger')
      await logApiUsage({
        userId,
        orgId,
        modelName: 'text-embedding-ada-002',
        promptTokens: embeddingRes.usage.prompt_tokens,
        completionTokens: 0,
        operation: 'search_context'
      })
    } catch {}

    if (error || !data || data.length === 0) return ''

    // Concatenar chunks em contexto único
    return data
      .map((chunk: { content: string; similarity: number }) =>
        chunk.content.trim()
      )
      .join('\n\n---\n\n')
  } catch {
    return ''
  }
}

// ── Busca competências BNCC relevantes ─────────────────────────────────────

export async function searchBNCC(
  query: string,
  userId: string,
  subject?: string,
  grade?: string,
  matchCount = 5,
  threshold = 0.68
): Promise<string[]> {
  try {
    const supabase = createServiceClient()

    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    })
    const embedding = embeddingRes.data[0].embedding

    const { data, error } = await supabase.rpc('search_bncc', {
      p_query_embedding: embedding,
      p_subject: subject || null,
      p_grade: grade || null,
      p_match_count: matchCount,
      p_similarity_threshold: threshold,
    })

    // Log de uso
    try {
      const { logApiUsage } = await import('@/lib/ai/logger')
      await logApiUsage({
        userId,
        modelName: 'text-embedding-ada-002',
        promptTokens: embeddingRes.usage.prompt_tokens,
        completionTokens: 0,
        operation: 'search_context'
      })
    } catch {}

    if (error || !data || data.length === 0) return []

    return data.map(
      (item: { code: string; description: string }) =>
        `${item.code}: ${item.description}`
    )
  } catch {
    return []
  }
}
