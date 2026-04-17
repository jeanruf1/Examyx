'use client'

import { X, AlertTriangle, FileText, Calendar, HardDrive, CheckCircle2 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

/* -------------------------------------------------------------------------- */
/* DELETE CONFIRM MODAL                                                       */
/* -------------------------------------------------------------------------- */
export function DeleteConfirmModal({ isOpen, onClose, onConfirm, title }: ModalProps & { onConfirm: () => void, title: string }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#1A1D2F]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6 mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-[20px] font-bold text-[#1A1D2F] text-center mb-2">Excluir Material?</h3>
        <p className="text-[#8E94BB] text-center text-sm mb-8">
          Você está prestes a remover <strong>{title}</strong>. Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 h-12 rounded-2xl font-bold text-[#8E94BB] hover:bg-neutral-50 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 h-12 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          >
            Excluir Agora
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* DOCUMENT DETAILS MODAL                                                     */
/* -------------------------------------------------------------------------- */
export function DocumentDetailsModal({ isOpen, onClose, doc }: ModalProps & { doc: any }) {
  if (!isOpen || !doc) return null

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#1A1D2F]/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
        <div className="p-10">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <FileText className="w-8 h-8 text-[#4F46E5]" />
              </div>
              <div>
                <h3 className="text-[24px] font-bold text-[#1A1D2F] leading-tight mb-1">{doc.name}</h3>
                <span className="px-3 py-1 bg-neutral-100 text-[#8E94BB] text-[10px] font-bold rounded-full uppercase tracking-widest">{doc.type}</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-full transition-colors">
              <X className="w-5 h-5 text-[#8E94BB]" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8F9FE] border border-[#E9EAF2]">
               <Calendar className="w-5 h-5 text-[#8E94BB]" />
               <div>
                  <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Subido em</p>
                  <p className="text-sm font-bold text-[#1A1D2F]">{formatDate(doc.created_at)}</p>
               </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8F9FE] border border-[#E9EAF2]">
               <HardDrive className="w-5 h-5 text-[#8E94BB]" />
               <div>
                  <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Tamanho</p>
                  <p className="text-sm font-bold text-[#1A1D2F]">{(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB</p>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-[#1A1D2F]">Status da Indexação</h4>
            </div>
            <div className="p-6 rounded-3xl bg-neutral-50 text-[#8E94BB] text-sm leading-relaxed border border-[#F0F1F7]">
              O conteúdo deste documento foi processado e está pronto para ser utilizado como base na geração de novas provas. A IA utilizará os conceitos e dados aqui presentes para garantir fidelidade ao seu material didático.
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full h-14 bg-[#1A1D2F] text-white rounded-full font-bold text-[16px] mt-10 hover:bg-[#4F46E5] transition-all shadow-xl shadow-indigo-500/10"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  )
}
