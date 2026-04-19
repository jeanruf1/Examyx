'use client'

import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null

  const colors = {
    danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
    info: 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20',
  }

  const iconColors = {
    danger: 'bg-red-50 text-red-500',
    warning: 'bg-amber-50 text-amber-500',
    info: 'bg-indigo-50 text-indigo-500',
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#1A1D2F]/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", iconColors[variant])}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-full transition-colors">
              <X className="w-5 h-5 text-[#8E94BB]" />
            </button>
          </div>

          <h3 className="text-[20px] font-extrabold text-[#1A1D2F] tracking-tight mb-2">{title}</h3>
          <p className="text-[#8E94BB] text-[14px] leading-relaxed mb-8">{description}</p>

          <div className="flex gap-3">
            <button 
              onClick={onConfirm}
              className={cn(
                "flex-1 h-12 text-white rounded-2xl font-bold text-[14px] transition-all shadow-lg",
                colors[variant]
              )}
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose}
              className="flex-1 h-12 bg-neutral-100 text-[#8E94BB] rounded-2xl font-bold text-[14px] hover:bg-neutral-200 transition-all"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
