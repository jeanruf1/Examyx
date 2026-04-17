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
      <div className="flex flex-col items-center text-center py-20 animate-fade-in">
        <div className="w-24 h-24 rounded-[32px] bg-emerald-500 flex items-center justify-center mb-10 shadow-2xl shadow-emerald-500/20 rotate-6">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-5xl font-extrabold text-[#1A1D2F] mb-4">Avaliação Concluída.</h2>
        <p className="text-xl text-[#8E94BB] mb-12 max-w-sm">
          Sua prova de <strong>{result.title}</strong> está pronta para revisão.
        </p>
        <button onClick={onGoToExam} className="h-20 px-12 rounded-full bg-[#4F46E5] text-white font-bold text-xl flex items-center gap-4 hover:scale-105 transition-all shadow-2xl shadow-indigo-500/20">
          Revisar e Editar
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    )
  }

  // ── Generating state ─────────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="flex flex-col items-center text-center py-32 animate-fade-in">
        <div className="relative mb-12">
          <div className="w-32 h-32 rounded-full border-4 border-[#E9EAF2] border-t-[#4F46E5] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-[#4F46E5] animate-pulse" />
          </div>
        </div>
        <h2 className="text-4xl font-bold text-[#1A1D2F] mb-4">Construindo Itens...</h2>
        <p className="text-lg text-[#8E94BB] max-w-xs mx-auto">
          Estamos estruturando as questões com base em <strong>{form.theme}</strong>.
        </p>
      </div>
    )
  }

  const summaryItems = [
    { icon: BookOpen, label: 'Disciplina', value: form.subject },
    { icon: FileText, label: 'Ano Escolar', value: form.grade },
    { icon: Brain, label: 'Dificuldade', value: DIFFICULTY_LABEL[form.difficulty] },
    { icon: ShieldCheck, label: 'Contexto', value: form.useBncc ? 'BNCC' : 'Conhecimento IA' },
  ]

  return (
    <div className="space-y-12 animate-fade-in max-w-4xl mx-auto text-center">
      
      {/* Grid of Summary Pills */}
      <div className="flex flex-wrap justify-center gap-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="px-8 py-4 bg-white border border-[#E9EAF2] rounded-full shadow-sm flex items-center gap-4 hover:scale-105 transition-transform">
            <item.icon className="w-5 h-5 text-[#4F46E5]" />
            <div className="text-left">
              <p className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-[0.1em]">{item.label}</p>
              <p className="text-base font-bold text-[#1A1D2F]">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Theme Box */}
      <div className="p-12 rounded-[48px] bg-white border border-[#E9EAF2] shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16" />
        <h4 className="text-xs font-bold text-[#8E94BB] uppercase tracking-[0.2em] mb-6">Tema da Avaliação</h4>
        <p className="text-3xl font-extrabold text-[#1A1D2F] leading-tight mb-8 italic">
          "{form.theme}"
        </p>
        
        <div className="flex items-center justify-center gap-12 pt-8 border-t border-[#F0F1F7]">
           <div>
              <p className="text-2xl font-bold text-[#1A1D2F]">{totalQuestions}</p>
              <p className="text-xs font-bold text-[#8E94BB] uppercase tracking-widest">Questões</p>
           </div>
           <div>
              <p className="text-2xl font-bold text-[#1A1D2F]">{form.bloomLevel}</p>
              <p className="text-xs font-bold text-[#8E94BB] uppercase tracking-widest">Bloom</p>
           </div>
           <div>
              <p className="text-2xl font-bold text-[#1A1D2F]">{form.style === 'enem' ? 'ENEM' : 'Padrão'}</p>
              <p className="text-xs font-bold text-[#8E94BB] uppercase tracking-widest">Estilo</p>
           </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-4 p-6 rounded-[32px] bg-red-50 border border-red-100 text-red-800 text-left">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      <p className="text-base text-[#8E94BB] max-w-sm mx-auto italic">
        Ao confirmar, nossa IA pedagógica estruturará sua prova em poucos segundos.
      </p>
    </div>
  )
}
