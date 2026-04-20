'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Trash2, Search, Building2, Calendar } from 'lucide-react'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function AdminExamsPage() {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const supabase = createClient()

  useEffect(() => {
    fetchExams()
  }, [])

  async function fetchExams() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('exams')
        .select(`
          id, 
          title, 
          subject, 
          grade, 
          created_at, 
          organizations (
            name
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao buscar provas:', error)
        return
      }
      
      setExams(data || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteModal.id) return
    const { error } = await supabase.from('exams').delete().eq('id', deleteModal.id)
    if (!error) {
      setExams(prev => prev.filter(e => e.id !== deleteModal.id))
    }
    setDeleteModal({ open: false, id: null })
  }

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-[1200px] mx-auto animate-fade-in">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">Administração</p>
          <h1 className="text-[32px] font-extrabold text-white tracking-tight">Provas Criadas</h1>
          <p className="text-white/40 text-[14px]">Gerencie todas as avaliações geradas na plataforma</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <input 
            type="text" 
            placeholder="Buscar prova, escola ou matéria..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-[350px] bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-[14px] text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-20">
          <p className="text-white/30 animate-pulse">Carregando lista de provas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredExams.map(exam => (
            <div key={exam.id} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all group flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-indigo-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-bold text-white truncate mb-1">{exam.title}</h3>
                <div className="flex items-center gap-4 text-[12px] text-white/40 font-medium">
                  <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> {exam.organizations?.name}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span>{exam.subject} · {exam.grade}</span>
                  <span className="w-1 h-1 rounded-full bg-white/10" />
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(exam.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <button 
                onClick={() => setDeleteModal({ open: true, id: exam.id })}
                className="p-3 bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {filteredExams.length === 0 && (
            <div className="p-20 text-center rounded-3xl bg-white/5 border border-white/10 border-dashed">
              <p className="text-white/30">Nenhuma prova encontrada.</p>
            </div>
          )}
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Excluir Prova"
        description="Você tem certeza que deseja excluir esta prova permanentemente? Esta ação removerá também todas as questões associadas e não poderá ser desfeita."
        confirmText="Sim, excluir para sempre"
      />
    </div>
  )
}
