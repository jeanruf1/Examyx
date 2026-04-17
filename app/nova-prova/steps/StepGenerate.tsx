'use client'

import type { ExamFormData } from '../page'
import {
  Loader2, CheckCircle2, AlertCircle, Sparkles,
  FileText, BookOpen, Clock, Brain, ShieldCheck, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  form: ExamFormData
  totalQuestions: number
  generating: boolean
  result: { examId: string; title: string; questionCount: number } | null
  error: string | null
  onGenerate: () => void
  onGoToExam: () => void
}

const DIFFICULTY_LABEL: Record<string, string> = {
  facil: 'Fácil', medio: 'Médio', dificil: 'Difícil',
}

export default function StepGenerate({ form, totalQuestions, generating, result, error, onGenerate, onGoToExam }: Props) {

  // ── Success state ────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="flex flex-col items-center text-center py-12 animate-fade-in">
        <div className="w-16 h-16 rounded-[22px] bg-emerald-500 flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#1A1D2F] mb-2">Concluído.</h2>
        <p className="text-base text-[#8E94BB] mb-8 max-w-sm">
          A prova de <strong>{result.title}</strong> está pronta.
        </p>
        <button onClick={onGoToExam} className="h-14 px-10 rounded-full bg-[#4F46E5] text-white font-bold text-base flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-indigo-500/10">
          Revisar e Editar
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  // ── Generating state ─────────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="flex flex-col items-center text-center py-20 animate-fade-in">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full border-4 border-[#E9EAF2] border-t-[#4F46E5] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-[#4F46E5] animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[#1A1D2F] mb-3">Construindo...</h2>
        <p className="text-base text-[#8E94BB]">
          Processando <strong>{form.theme}</strong>.
        </p>
      </div>
    )
  }

  const summaryItems = [
    { icon: BookOpen, label: 'Materia', value: form.subject },
    { icon: FileText, label: 'Série', value: form.grade },
    { icon: Brain, label: 'Nível', value: DIFFICULTY_LABEL[form.difficulty] },
    { icon: ShieldCheck, label: 'Base', value: form.useBncc ? 'BNCC' : 'IA' },
  ]

  return (
    <div className="space-y-8 animate-fade-in w-full text-center">
      
      {/* Pills Summary */}
      <div className="flex flex-wrap justify-center gap-3">
        {summaryItems.map((item) => (
          <div key={item.label} className="px-5 py-2.5 bg-white border border-[#E9EAF2] rounded-full shadow-sm flex items-center gap-3">
            <item.icon className="w-3.5 h-3.5 text-[#4F46E5]" />
            <div className="text-left">
              <p className="text-[8px] font-bold text-[#8E94BB] uppercase tracking-wider">{item.label}</p>
              <p className="text-[12px] font-bold text-[#1A1D2F]">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Theme Box */}
      <div className="p-10 rounded-[32px] bg-white border border-[#E9EAF2] shadow-xl shadow-indigo-500/5 relative overflow-hidden">
        <h4 className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-[0.2em] mb-4">Tema Selecionado</h4>
        <p className="text-2xl font-extrabold text-[#1A1D2F] leading-tight mb-8">
          "{form.theme}"
        </p>
        
        <div className="flex items-center justify-center gap-10 pt-6 border-t border-[#F0F1F7]">
           <div>
              <p className="text-xl font-bold text-[#1A1D2F]">{totalQuestions}</p>
              <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Itens</p>
           </div>
           <div>
              <p className="text-xl font-bold text-[#1A1D2F]">{form.bloomLevel}</p>
              <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Bloom</p>
           </div>
           <div>
              <p className="text-xl font-bold text-[#1A1D2F]">{form.style === 'enem' ? 'ENEM' : 'Padrão'}</p>
              <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Estilo</p>
           </div>
        </div>
      </div>

      <p className="text-sm text-[#8E94BB] italic">
        IA pedagógica pronta para estruturar sua prova.
      </p>
    </div>
  )
}
