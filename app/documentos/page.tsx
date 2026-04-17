'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  FileText, Upload, Plus, Search, 
  Trash2, Loader2, MoreVertical, 
  ChevronLeft, BookOpen, Clock
} from 'lucide-react'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { DeleteConfirmModal, DocumentDetailsModal } from '@/components/documentos/DocumentModals'

interface Document {
  id: string
  name: string
  type: string
  file_size_bytes: number
  subject: string | null
  is_indexed: boolean
  created_at: string
}

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [docToDetails, setDocToDetails] = useState<Document | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    setLoading(true)
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    setDocuments(data || [])
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('documents')
        .insert({
          name: file.name,
          file_url: 'temp_url',
          type: 'pdf',
          file_size_bytes: file.size,
          is_indexed: true,
          teacher_id: user?.id,
          org_id: (await supabase.from('profiles').select('org_id').eq('id', user?.id).single()).data?.org_id
        })

      if (error) throw error
      loadDocuments()
    } catch (err) {
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  async function confirmDelete() {
    if (!selectedDoc) return
    await supabase.from('documents').delete().eq('id', selectedDoc.id)
    setSelectedDoc(null)
    setShowDeleteModal(false)
    loadDocuments()
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-20 animate-fade-in">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-12">
        <div>
          <Link href="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-[#8E94BB] hover:text-[#4F46E5] transition-colors mb-4">
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>
          <h1 className="text-[36px] font-bold text-[#1A1D2F] tracking-tight">Biblioteca de Materiais</h1>
          <p className="text-[#8E94BB] text-[16px]">Suas apostilas, PDFs e referências para geração de provas.</p>
        </div>
        
        <label className="cursor-pointer group">
          <div className="btn-rabbu h-12 px-8 flex items-center gap-2 group-hover:scale-105 transition-all">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {uploading ? 'Subindo...' : 'Novo Material'}
          </div>
          <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Grid de Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="rabbu-card p-6">
           <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-[#4F46E5]" />
           </div>
           <p className="text-[20px] font-bold text-[#1A1D2F]">{documents.length}</p>
           <p className="text-[11px] font-bold text-[#8E94BB] uppercase">Arquivos Totais</p>
        </div>
        <div className="rabbu-card p-6">
           <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-emerald-600" />
           </div>
           <p className="text-[20px] font-bold text-[#1A1D2F]">Otimizado</p>
           <p className="text-[11px] font-bold text-[#8E94BB] uppercase">IA Pronta</p>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex items-center justify-between mb-8 gap-6 bg-white p-2 rounded-[20px] border border-[#E9EAF2] shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E94BB]" />
          <input 
            type="text" 
            placeholder="Pesquisar em seus materiais..." 
            className="w-full bg-transparent border-none focus:ring-0 pl-12 h-12 text-sm"
          />
        </div>
      </div>

      {/* Lista de Documentos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#4F46E5] mb-4" />
          <p className="text-[#8E94BB] font-medium">Carregando biblioteca...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border-2 border-dashed border-[#E9EAF2]">
           <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
              <FileText className="w-10 h-10 text-[#D1D5DB]" />
           </div>
           <h3 className="text-[20px] font-bold text-[#1A1D2F] mb-2">Sua biblioteca está vazia</h3>
           <p className="text-[#8E94BB] max-w-sm text-center mb-8">Suba suas apostilas em PDF para que a IA possa criar provas personalizadas com base no seu conteúdo.</p>
           <label className="cursor-pointer">
              <div className="btn-rabbu-secondary px-8">Subir primeiro arquivo</div>
              <input type="file" className="hidden" onChange={handleUpload} />
           </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map(doc => (
            <div key={doc.id} className="rabbu-card p-6 hover:rabbu-card-active group transition-all">
               <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#F8F9FE] flex items-center justify-center border border-[#E9EAF2] group-hover:bg-white transition-all">
                     <FileText className="w-6 h-6 text-[#4F46E5]" />
                  </div>
                  <button 
                    onClick={() => { setSelectedDoc(doc); setShowDeleteModal(true); }}
                    className="p-2 text-[#8E94BB] hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
               </div>
               <div className="mb-6">
                  <h3 className="font-bold text-[#1A1D2F] text-[16px] mb-1 truncate">{doc.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-neutral-100 text-[#8E94BB] text-[10px] font-bold rounded-md uppercase tracking-wider">{doc.type}</span>
                    <span className="text-[12px] text-[#8E94BB]">{formatDate(doc.created_at)}</span>
                  </div>
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-[#F0F1F7]">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      doc.is_indexed ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                    <span className="text-[12px] font-medium text-[#1A1D2F]">
                      {doc.is_indexed ? 'Pronto para uso' : 'Processando...'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setDocToDetails(doc)}
                    className="text-[#4F46E5] text-[13px] font-bold hover:underline"
                  >
                    Ver Detalhes
                  </button>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <DeleteConfirmModal 
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title={selectedDoc?.name || ''}
      />

      <DocumentDetailsModal 
        isOpen={!!docToDetails}
        onClose={() => setDocToDetails(null)}
        doc={docToDetails}
      />
    </div>
  )
}
