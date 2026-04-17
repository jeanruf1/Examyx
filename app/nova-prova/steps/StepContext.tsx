'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ExamFormData } from '../page'
import { FileText, Loader2, BookOpen, Database, Check } from 'lucide-react'
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
    <div className="space-y-10 animate-fade-in">
      
      {/* BNCC Toggle Card */}
      <div 
        onClick={() => onChange({ useBncc: !form.useBncc })}
        className={cn(
          "relative overflow-hidden p-6 rounded-[24px] border transition-all duration-300 cursor-pointer group",
          form.useBncc ? "border-[#4F46E5] bg-[#F5F5FF]" : "border-[#E9EAF2] bg-white hover:border-[#8E94BB]"
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
            form.useBncc ? "bg-[#4F46E5] text-white" : "bg-neutral-100 text-[#8E94BB]"
          )}>
            <Database className="w-6 h-6" />
          </div>
          <div className={cn(
            "w-12 h-6 rounded-full relative transition-colors",
            form.useBncc ? "bg-[#4F46E5]" : "bg-neutral-200"
          )}>
            <div className={cn(
              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
              form.useBncc ? "right-1" : "left-1"
            )} />
          </div>
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-[#1A1D2F] mb-1">Base Nacional Comum Curricular (BNCC)</h3>
          <p className="text-[13px] text-[#8E94BB] leading-relaxed">
            A IA buscará automaticamente as competências para <strong>{form.grade || 'este ano'}</strong>.
          </p>
        </div>
      </div>

      {/* RAG Documents Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#8E94BB]" />
            <h3 className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-widest">Usar Materiais Próprios (RAG)</h3>
          </div>
          <span className="badge-rabbu bg-neutral-100 text-neutral-500">IA CONTEXT ENGINE</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-3 text-[#8E94BB]">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Buscando sua biblioteca...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-[#E9EAF2] rounded-[24px] text-center">
            <p className="text-[14px] text-[#8E94BB] mb-4">Nenhum material encontrado.</p>
            <Link href="/documentos" className="text-[#4F46E5] font-bold text-sm hover:underline">Subir Materiais Agora</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map(doc => {
              const selected = form.selectedDocumentIds.includes(doc.id)
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocument(doc.id)}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-[20px] border transition-all cursor-pointer group",
                    selected ? "border-[#4F46E5] bg-[#F5F5FF]" : "border-[#E9EAF2] bg-white hover:border-[#8E94BB]"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    selected ? "bg-[#4F46E5] text-white" : "bg-neutral-100 text-[#8E94BB]"
                  )}>
                    {selected ? <Check className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#1A1D2F] truncate">{doc.name}</p>
                    <p className="text-[11px] font-bold text-[#8E94BB] uppercase">{doc.type} • {doc.subject || 'Geral'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!form.useBncc && form.selectedDocumentIds.length === 0 && (
        <div className="p-5 rounded-[20px] bg-amber-50 border border-amber-100 flex gap-4">
           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-500" />
           </div>
           <div>
              <p className="text-[13px] text-amber-800 font-bold mb-0.5">Aviso de Contexto</p>
              <p className="text-[12px] text-amber-700/80 leading-relaxed">
                Sem fontes selecionadas, a IA criará questões baseadas em conhecimento geral.
              </p>
           </div>
        </div>
      )}
    </div>
  )
}
