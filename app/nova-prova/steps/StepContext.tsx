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
  const [uploading, setUploading] = useState(false)
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
    <div className="space-y-8 animate-fade-in w-full">
      
      {/* BNCC Compact Card */}
      <div 
        onClick={() => onChange({ useBncc: !form.useBncc })}
        className={cn(
          "relative overflow-hidden p-5 rounded-[24px] border transition-all duration-300 cursor-pointer group flex items-center gap-5",
          form.useBncc 
            ? "border-[#4F46E5] bg-white shadow-lg shadow-indigo-500/5" 
            : "border-[#E9EAF2] bg-white hover:border-[#8E94BB]"
        )}
      >
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
          form.useBncc ? "bg-[#4F46E5] text-white" : "bg-[#F8F9FE] text-[#8E94BB]"
        )}>
          <Database className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#1A1D2F]">Diretrizes da BNCC</h3>
          <p className="text-sm text-[#8E94BB]">
            Competências oficiais para o <strong>{form.grade || 'ano selecionado'}</strong>.
          </p>
        </div>
        <div className={cn(
          "w-10 h-5 rounded-full relative transition-colors",
          form.useBncc ? "bg-emerald-500" : "bg-neutral-200"
        )}>
          <div className={cn(
            "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
            form.useBncc ? "right-1" : "left-1"
          )} />
        </div>
      </div>

      {/* RAG Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#8E94BB]" />
            <h3 className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-widest">Sua Biblioteca</h3>
          </div>
          
          <label className="cursor-pointer">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#4F46E5] hover:opacity-70 transition-all uppercase tracking-widest">
              {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {uploading ? 'Subindo...' : 'Subir Novo'}
            </div>
            <input 
              type="file" 
              className="hidden" 
              accept=".pdf,.doc,.docx" 
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setUploading(true)
                const { data: { user } } = await supabase.auth.getUser()
                await supabase.from('documents').insert({
                  name: file.name,
                  file_url: 'temp_url',
                  type: 'pdf',
                  file_size_bytes: file.size,
                  is_indexed: true,
                  teacher_id: user?.id,
                  org_id: (await supabase.from('profiles').select('org_id').eq('id', user?.id).single()).data?.org_id
                })
                // Recarregar a lista (loadDocuments)
                const { data } = await supabase
                  .from('documents')
                  .select('id, name, type, subject, created_at')
                  .eq('is_indexed', true)
                  .order('created_at', { ascending: false })
                setDocuments(data || [])
                setUploading(false)
              }}
            />
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#4F46E5]" />
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 border border-dashed border-[#E9EAF2] rounded-[24px] text-center">
            <p className="text-sm text-[#8E94BB]">Nenhum material encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {documents.map(doc => {
              const selected = form.selectedDocumentIds.includes(doc.id)
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocument(doc.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-[18px] border transition-all cursor-pointer",
                    selected 
                      ? "border-[#4F46E5] bg-[#F5F5FF]" 
                      : "border-[#E9EAF2] bg-white hover:border-[#8E94BB]"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    selected ? "bg-[#4F46E5] text-white" : "bg-[#F8F9FE] text-[#8E94BB]"
                  )}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1A1D2F] truncate">{doc.name}</p>
                    <p className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-tight">{doc.type}</p>
                  </div>
                  {selected && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!form.useBncc && form.selectedDocumentIds.length === 0 && (
        <div className="p-5 rounded-[20px] bg-amber-50 border border-amber-100 flex items-center gap-4">
           <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
           <p className="text-xs text-amber-800 leading-relaxed italic">
             Sem fontes selecionadas, a IA criará questões baseadas em conhecimento geral.
           </p>
        </div>
      )}
    </div>
  )
}
