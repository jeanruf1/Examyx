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
    console.log('>>> [DOCS] Iniciando upload:', file.name)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user?.id).single()
      const orgId = profile?.org_id
      
      console.log('>>> [DOCS] User/Org:', user?.id, orgId)

      // 1. Upload para o Storage
      const fileName = `${Date.now()}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('materials')
        .upload(`${orgId}/${fileName}`, file)

      if (uploadError) throw uploadError
      console.log('>>> [DOCS] Upload storage OK')

      const fileUrl = supabase.storage.from('materials').getPublicUrl(`${orgId}/${fileName}`).data.publicUrl

      // 2. Inserir registro
      const { data: docData, error: docError } = await supabase.from('documents').insert({
        name: file.name,
        file_url: fileUrl,
        type: 'pdf',
        file_size_bytes: file.size,
        is_indexed: false,
        teacher_id: user?.id,
        org_id: orgId
      }).select().single()

      if (docError) throw docError
      console.log('>>> [DOCS] Registro banco OK, ID:', docData.id)

      // 3. Indexar
      console.log('>>> [DOCS] Chamando API de Indexação...')
      const res = await fetch('/api/ai/documents/index', {
        method: 'POST',
        body: JSON.stringify({ documentId: docData.id })
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Erro na indexação')
      
      console.log('>>> [DOCS] Indexação OK:', result.chunks, 'fragmentos')
      
      loadDocuments()
    } catch (err: any) {
      console.error('Erro no upload/index:', err)
      alert(`Erro: ${err.message}`)
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
    <div className="animate-fade-in pb-20">
      
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="text-[42px] font-bold text-[#1A1D2F] tracking-tight leading-none mb-3">Biblioteca de Materiais</h1>
          <p className="text-[#8E94BB] text-[16px] font-medium">Suas apostilas, PDFs e referências para geração de provas.</p>
        </div>
        
        <label className="cursor-pointer group flex-shrink-0">
          <div className="btn-rabbu h-14 px-10 flex items-center gap-3 rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            <span className="text-[16px] font-bold">{uploading ? 'Subindo...' : 'Novo Material'}</span>
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
            className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none pl-12 h-12 text-sm text-[#1A1D2F] placeholder:text-[#8E94BB]"
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
