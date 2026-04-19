'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, ArrowRight, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface ExamListProps {
  initialExams: any[]
}

export default function ExamList({ initialExams }: ExamListProps) {
  const [exams, setExams] = useState(initialExams)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null })
  const supabase = createClient()

  async function handleDelete() {
    if (!deleteModal.id) return
    const { error } = await supabase.from('exams').delete().eq('id', deleteModal.id)
    if (!error) {
      setExams(prev => prev.filter(e => e.id !== deleteModal.id))
    }
    setDeleteModal({ open: false, id: null })
  }

  return (
    <div className="space-y-4">
      {exams.map(exam => (
        <div key={exam.id} className="relative group">
          <Link href={`/provas/${exam.id}`}
            className="rabbu-card p-6 flex items-center gap-8 group hover:rabbu-card-active">
            
            <div className="w-[110px] h-[80px] rounded-xl bg-neutral-50 flex-shrink-0 flex items-center justify-center border border-[#E9EAF2] group-hover:border-transparent transition-all">
              <FileText className="w-8 h-8 text-[#8E94BB] group-hover:scale-110 transition-transform" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-bold text-[#1A1D2F] truncate group-hover:text-[#4F46E5] transition-colors mb-1">{exam.title}</h3>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-[#8E94BB]">{exam.subject}</span>
                <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
                <span className="text-[13px] font-medium text-[#8E94BB]">{exam.grade}</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-12 px-12 border-x border-[#F0F1F7]">
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#1A1D2F] capitalize">{exam.difficulty}</p>
                <p className="text-[11px] text-[#8E94BB] uppercase font-bold tracking-widest">Dificuldade</p>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#1A1D2F]">{exam.estimated_time_min}m</p>
                <p className="text-[11px] text-[#8E94BB] uppercase font-bold tracking-widest">Duração</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className={cn(
                "badge-rabbu",
                exam.status === 'published' ? "bg-emerald-50 text-emerald-600" : "bg-neutral-50 text-neutral-400"
              )}>
                {exam.status === 'published' ? 'Ativa' : 'Rascunho'}
              </div>
              <div className="w-10 h-10 rounded-full border border-[#E9EAF2] flex items-center justify-center group-hover:bg-[#4F46E5] group-hover:border-[#4F46E5] transition-all">
                <ArrowRight className="w-4 h-4 text-[#8E94BB] group-hover:text-white transition-all" />
              </div>
            </div>
          </Link>

          {/* Botão de Deletar Absoluto */}
          <button 
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setDeleteModal({ open: true, id: exam.id })
            }}
            className="absolute -right-2 -top-2 w-8 h-8 bg-white border border-red-100 text-red-500 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white z-20"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {exams.length === 0 && (
        <div className="p-20 text-center rounded-[32px] border-2 border-dashed border-[#E9EAF2] bg-white">
          <p className="text-[#8E94BB]">Nenhuma prova encontrada.</p>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDelete}
        title="Excluir Prova"
        description="Deseja realmente excluir esta prova? Esta ação não pode ser desfeita."
        confirmText="Sim, excluir"
      />
    </div>
  )
}
