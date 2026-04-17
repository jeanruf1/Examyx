'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ExamFormData } from '../page'
import { FileText, Loader2, BookOpen, Database, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Document {
  id: string
  name: string
  type: string
  subject: string | null
  created_at: string
}

interface Props {
  form: ExamFormData
  onChange: (partial: Partial<ExamFormData>) => void
}

export default function StepContext({ form, onChange }: Props) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadDocuments() {
      const { data } = await supabase
        .from('documents')
        .select('id, name, type, subject, created_at')
        .eq('is_indexed', true)
        .order('created_at', { ascending: false })
      setDocuments(data || [])
      setLoading(false)
    }
    loadDocuments()
  }, [])

  function toggleDocument(id: string) {
    const selected = form.selectedDocumentIds
    if (selected.includes(id)) {
      onChange({ selectedDocumentIds: selected.filter(d => d !== id) })
    } else {
      onChange({ selectedDocumentIds: [...selected, id] })
    }
  }

  return (
    <div className="space-y-16 animate-fade-in max-w-4xl mx-auto">
      
      {/* BNCC Apple Card */}
      <div 
        onClick={() => onChange({ useBncc: !form.useBncc })}
        className={cn(
          "relative overflow-hidden p-8 rounded-[40px] border transition-all duration-500 cursor-pointer group flex items-center gap-8",
          form.useBncc 
            ? "border-[#4F46E5] bg-white shadow-2xl shadow-indigo-500/10" 
            : "border-[#E9EAF2] bg-white/50 hover:bg-white hover:border-[#8E94BB]"
        )}
      >
        <div className={cn(
          "w-20 h-20 rounded-[28px] flex items-center justify-center transition-all duration-500",
          form.useBncc ? "bg-[#4F46E5] text-white rotate-6" : "bg-[#F8F9FE] text-[#8E94BB]"
        )}>
          <Database className="w-10 h-10" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-2xl font-bold text-[#1A1D2F]">Diretrizes da BNCC</h3>
            {form.useBncc && <Check className="w-6 h-6 text-emerald-500" />}
          </div>
          <p className="text-lg text-[#8E94BB]">
            A IA usará as competências oficiais para o <strong>{form.grade || 'ano selecionado'}</strong>.
          </p>
        </div>
        <div className={cn(
          "w-14 h-7 rounded-full relative transition-colors",
          form.useBncc ? "bg-emerald-500" : "bg-neutral-200"
        )}>
          <div className={cn(
            "absolute top-1 w-5 h-5 bg-white rounded-full transition-all",
            form.useBncc ? "right-1" : "left-1"
          )} />
        </div>
      </div>

      {/* RAG Section - Clean Grid */}
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-xs font-bold text-[#8E94BB] uppercase tracking-[0.2em] mb-2">Sua Biblioteca</p>
          <h3 className="text-3xl font-bold text-[#1A1D2F]">Usar Materiais de Apoio</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-[#8E94BB]">
            <Loader2 className="w-6 h-6 animate-spin text-[#4F46E5]" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-16 border-2 border-dashed border-[#E9EAF2] rounded-[40px] text-center bg-white/30 backdrop-blur-sm">
            <p className="text-xl text-[#8E94BB] mb-2">Nenhum material encontrado.</p>
            <p className="text-sm text-[#8E94BB]">Suba PDFs no Dashboard para usá-los aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map(doc => {
              const selected = form.selectedDocumentIds.includes(doc.id)
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocument(doc.id)}
                  className={cn(
                    "flex items-center gap-6 p-6 rounded-[32px] border transition-all duration-300 cursor-pointer",
                    selected 
                      ? "border-[#4F46E5] bg-white shadow-xl shadow-indigo-500/5" 
                      : "border-[#E9EAF2] bg-white/50 hover:bg-white hover:border-[#8E94BB]"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                    selected ? "bg-[#4F46E5] text-white" : "bg-[#F8F9FE] text-[#8E94BB]"
                  )}>
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-[#1A1D2F] truncate">{doc.name}</p>
                    <p className="text-xs font-bold text-[#8E94BB] uppercase tracking-wider">{doc.type} • {doc.subject || 'Geral'}</p>
                  </div>
                  {selected && <Check className="w-6 h-6 text-emerald-500" />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!form.useBncc && form.selectedDocumentIds.length === 0 && (
        <div className="p-8 rounded-[32px] bg-amber-50/50 border border-amber-100 flex items-center gap-6 animate-pulse">
           <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
              <Sparkles className="w-6 h-6" />
           </div>
           <p className="text-sm text-amber-800 font-medium leading-relaxed">
             <strong>Aviso:</strong> Sem fontes de contexto, a IA criará questões baseadas em conhecimento geral. Isso pode fugir do conteúdo dado em sala.
           </p>
        </div>
      )}
    </div>
  )
}
