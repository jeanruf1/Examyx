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
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-8">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-[28px] font-bold text-[#1A1D2F] mb-2">Tudo Pronto!</h2>
        <p className="text-[#8E94BB] mb-10 max-w-sm mx-auto">
          Sua avaliação de <strong>{result.title}</strong> foi gerada com {result.questionCount} questões.
        </p>
        <button onClick={onGoToExam} className="btn-rabbu px-12 py-4 h-auto text-base">
          Ver e Revisar Prova
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    )
  }

  // ── Generating state ─────────────────────────────────────────────────────
  if (generating) {
    return (
      <div className="flex flex-col items-center text-center py-20 animate-fade-in">
        <div className="relative mb-10">
          <div className="w-24 h-24 rounded-full border-4 border-neutral-100 border-t-[#4F46E5] animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#4F46E5] animate-pulse" />
          </div>
        </div>
        <h2 className="text-[24px] font-bold text-[#1A1D2F] mb-3">Construindo Avaliação...</h2>
        <p className="text-[15px] text-[#8E94BB] max-w-xs mx-auto">
          Nossa IA está estruturando {totalQuestions} questões com base no tema <strong>{form.theme}</strong>.
        </p>
        <div className="mt-12 flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-[#E9EAF2] shadow-sm">
           <Loader2 className="w-4 h-4 text-[#4F46E5] animate-spin" />
           <span className="text-[11px] font-bold text-[#8E94BB] uppercase tracking-widest">Acessando Banco RAG e BNCC</span>
        </div>
      </div>
    )
  }

  const summaryItems = [
    { icon: BookOpen, label: 'Disciplina', value: form.subject },
    { icon: FileText, label: 'Ano Escolar', value: form.grade },
    { icon: Brain, label: 'Dificuldade', value: DIFFICULTY_LABEL[form.difficulty] },
    { icon: ShieldCheck, label: 'Fonte', value: form.useBncc ? 'BNCC + IA' : 'IA Geral' },
  ]

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-[#4F46E5]" />
        <h3 className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-widest">Sumário Final</h3>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {summaryItems.map((item) => (
          <div key={item.label} className="space-y-1">
            <p className="text-[11px] font-bold text-[#8E94BB] uppercase tracking-widest">{item.label}</p>
            <div className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-[#4F46E5]" />
              <p className="text-[16px] font-bold text-[#1A1D2F]">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 rounded-[24px] bg-[#F8F9FE] border border-[#E9EAF2]">
        <h4 className="text-[14px] font-bold text-[#1A1D2F] mb-2 uppercase tracking-tight">Análise de Tema</h4>
        <p className="text-[14px] text-[#1A1D2F] font-medium leading-relaxed italic">
          "{form.theme}"
        </p>
        <div className="divider my-6" />
        <div className="flex items-center gap-6">
           <div>
              <p className="text-[18px] font-bold text-[#1A1D2F]">{totalQuestions}</p>
              <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Itens</p>
           </div>
           <div>
              <p className="text-[18px] font-bold text-[#1A1D2F]">{form.bloomLevel}</p>
              <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Bloom</p>
           </div>
           <div>
              <p className="text-[18px] font-bold text-[#1A1D2F]">{form.style === 'enem' ? 'ENEM' : 'Padrão'}</p>
              <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Estilo</p>
           </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-5 rounded-[20px] bg-red-50 border border-red-100">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-[13px] text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="bg-[#4F46E5] p-1 rounded-[20px] shadow-xl shadow-indigo-500/20">
         <div className="bg-white/5 p-6 rounded-[18px] text-white">
            <p className="text-[12px] opacity-80 leading-relaxed">
              Pronto para gerar? Nossa IA usará todos os parâmetros acima para construir uma avaliação pedagogicamente sólida e formatada para impressão.
            </p>
         </div>
      </div>
    </div>
  )
}
