import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  let documentId = ''

  try {
    const body = await req.json()
    documentId = body.documentId

    // LOG DE INÍCIO IMEDIATO
    await supabase.from('debug_logs').insert({ 
      event: 'api_called', 
      data: { documentId, timestamp: new Date().toISOString() } 
    })

    // 1. Buscar metadados
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !doc) throw new Error('Documento não encontrado no banco')

    // 2. Baixar arquivo
    const resFile = await fetch(doc.file_url)
    if (!resFile.ok) throw new Error('Erro ao baixar arquivo da URL: ' + doc.file_url)
    const buffer = Buffer.from(await resFile.arrayBuffer())
    
    await supabase.from('debug_logs').insert({ event: 'file_downloaded', data: { size: buffer.length } })

    // 3. Extrair texto usando a "Bala de Prata" (OpenAI Assistant)
    let fullText = ''
    try {
      await supabase.from('debug_logs').insert({ event: 'openai_parse_start', data: { size: buffer.length } })
      
      // Upload para a OpenAI
      const file = await openai.files.create({
        file: await fetch(doc.file_url),
        purpose: 'assistants'
      })

      // Criar um assistente temporário para ler o arquivo
      const assistant = await openai.beta.assistants.create({
        model: 'gpt-4o-mini',
        instructions: 'Você é um extrator de texto. Extraia TODO o texto contido no arquivo PDF anexado de forma literal. Não resuma, apenas transcreva o conteúdo.',
        tools: [{ type: 'file_search' }]
      })

      // Criar thread e rodar
      const thread = await openai.beta.threads.create({
        messages: [{ role: 'user', content: 'Por favor, extraia todo o texto deste arquivo.', attachments: [{ file_id: file.id, tools: [{ type: 'file_search' }] }] }]
      })

      const run = await openai.beta.threads.runs.createAndPoll(thread.id, { assistant_id: assistant.id })
      const assistantUsage = run.usage // Captura tokens reais do assistente

      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(thread.id)
        // @ts-ignore
        fullText = messages.data[0].content[0].text.value
      } else {
        throw new Error('Falha no processamento da OpenAI: ' + run.status)
      }

      // Cleanup (opcional mas recomendado)
      await openai.beta.assistants.del(assistant.id)
      await openai.files.del(file.id)

    } catch (e: any) {
      console.error('Erro na OpenAI Parse:', e.message)
      await supabase.from('debug_logs').insert({ event: 'openai_parse_error', data: { error: e.message } })
      throw new Error('Falha na IA ao ler PDF: ' + e.message)
    }

    await supabase.from('debug_logs').insert({ 
      event: 'text_extracted', 
      data: { length: fullText.length, preview: fullText.substring(0, 100) } 
    })

    if (fullText.trim().length < 20) {
      throw new Error('O PDF parece não conter texto legível (pode ser uma imagem/scan)')
    }

    // 4. Chunking
    const chunks = chunkText(fullText, 1000, 200)
    await supabase.from('debug_logs').insert({ event: 'chunks_created', data: { count: chunks.length } })

    let totalEmbeddingTokens = 0
    for (const chunk of chunks) {
      const content = chunk.trim()
      if (content.length < 10) continue

      try {
        const emb = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: content.replace(/\n/g, ' ')
        })

        await supabase.from('document_chunks').insert({
          document_id: documentId,
          org_id: doc.org_id,
          content,
          embedding: emb.data[0].embedding
        })
        successCount++
        totalEmbeddingTokens += emb.usage.total_tokens
      } catch (e: any) {
        console.error('Erro no embedding:', e.message)
      }
    }

    // 6. Finalizar
    if (successCount > 0) {
      const { error: updateErr } = await supabase
        .from('documents')
        .update({ 
          is_indexed: true
        })
        .eq('id', documentId)

      if (updateErr) {
        await supabase.from('debug_logs').insert({ 
          event: 'update_error', 
          data: { error: updateErr.message, id: documentId } 
        })
      } else {
        await supabase.from('debug_logs').insert({ 
          event: 'update_success', 
          data: { id: documentId } 
        })
      }
      
      // Log de custo real (Assistente + Embeddings)
      try {
        const { logApiUsage } = await import('@/lib/ai/logger')
        
        // 1. Log do Assistente (Parse do PDF)
        if (assistantUsage) {
          await logApiUsage({
            userId: doc.teacher_id,
            org_id: doc.org_id,
            modelName: 'gpt-4o-mini',
            promptTokens: assistantUsage.prompt_tokens,
            completionTokens: assistantUsage.completion_tokens,
            operation: 'embed_document'
          })
        }

        // 2. Log dos Embeddings (Vetorização)
        await logApiUsage({
          userId: doc.teacher_id,
          org_id: doc.org_id,
          modelName: 'text-embedding-ada-002',
          promptTokens: totalEmbeddingTokens,
          completionTokens: 0,
          operation: 'embed_document'
        })
      } catch (e) {
        console.error('Erro ao logar uso real:', e)
      }
    }

    await supabase.from('debug_logs').insert({ event: 'index_finished', data: { chunks: successCount } })
    return NextResponse.json({ success: true, chunks: successCount })

  } catch (err: any) {
    console.error('[index-error]', err.message)
    if (documentId) {
      await supabase.from('debug_logs').insert({ event: 'critical_failure', data: { error: err.message, documentId } })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function chunkText(text: string, size: number, overlap: number): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return []
  const result = []
  let i = 0
  while (i < clean.length) {
    const chunk = clean.slice(i, i + size)
    if (chunk.length > 50) result.push(chunk)
    i += size - overlap
  }
  return result
}
