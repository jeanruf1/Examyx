'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Sparkles, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import StepConfig from './steps/StepConfig'
import StepContext from './steps/StepContext'
import StepAccessibility from './steps/StepAccessibility'
import StepGenerate from './steps/StepGenerate'

export type ExamFormData = {
  subject: string
  grade: string
  theme: string
  difficulty: 'facil' | 'medio' | 'dificil'
  style: 'regular' | 'enem' | 'homework'
  bloomLevel: string
  useBncc: boolean
  selectedDocumentIds: string[]
  accessibility: {
    tea: boolean
    dyslexia: boolean
    adhd: boolean
  }
}

const INITIAL_DATA: ExamFormData = {
  subject: '',
  grade: '',
  theme: '',
  difficulty: 'medio',
  style: 'regular',
  bloomLevel: 'Aplicação',
  useBncc: true,
  selectedDocumentIds: [],
  accessibility: { tea: false, dyslexia: false, adhd: false }
}

const STEPS = [
  { id: 1, name: 'Configuração', description: 'Base da prova' },
  { id: 2, name: 'Contexto', description: 'BNCC e Materiais' },
  { id: 3, name: 'Acessibilidade', description: 'Inclusão' },
  { id: 4, name: 'Gerar', description: 'Finalização' },
]

export default function NovaProvaPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<ExamFormData>(INITIAL_DATA)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ examId: string; title: string; questionCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateForm(partial: Partial<ExamFormData>) {
    setForm(prev => ({ ...prev, ...partial }))
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar prova')
      setResult({ examId: data.examId, title: data.title, questionCount: data.questionCount })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-20">
      {/* Header Fixo */}
      <header className="bg-white border-b border-[#E9EAF2] h-20 flex items-center sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto w-full px-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-[14px] font-bold text-[#8E94BB] hover:text-[#4F46E5] transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4 fill-current" />
             </div>
             <span className="font-bold text-[#1A1D2F]">Examyx - Criador de Avaliações</span>
          </div>
          <div className="w-[140px]" /> {/* Spacer */}
        </div>
      </header>

      <div className="max-w-[800px] mx-auto pt-12 px-6">
        {/* Stepper Premium */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-[18px] w-full h-[2px] bg-[#E9EAF2] -z-10" />
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2",
                  step === s.id 
                    ? "bg-[#4F46E5] border-[#4F46E5] text-white shadow-lg shadow-indigo-500/30 scale-110" 
                    : step > s.id 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "bg-white border-[#E9EAF2] text-[#8E94BB]"
                )}>
                  {step > s.id ? <Check className="w-5 h-5" /> : s.id}
                </div>
                <div className="text-center">
                  <p className={cn("text-[13px] font-bold", step === s.id ? "text-[#1A1D2F]" : "text-[#8E94BB]")}>
                    {s.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Card Content */}
        <div className="rabbu-card p-10 min-h-[500px] flex flex-col">
          <div className="flex-1">
            {step === 1 && <StepConfig form={form} onChange={updateForm} />}
            {step === 2 && <StepContext form={form} onChange={updateForm} />}
            {step === 3 && <StepAccessibility form={form} onChange={updateForm} />}
            {step === 4 && (
              <StepGenerate 
                form={form} 
                totalQuestions={8} 
                generating={generating} 
                result={result}
                error={error}
                onGenerate={handleGenerate}
                onGoToExam={() => router.push(`/provas/${result?.examId}`)}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          {!result && !generating && (
            <div className="flex items-center justify-between mt-12 pt-8 border-t border-[#F0F1F7]">
              <button
                disabled={step === 1}
                onClick={() => setStep(s => s - 1)}
                className={cn(
                  "btn-rabbu-secondary px-8",
                  step === 1 && "opacity-0 pointer-events-none"
                )}
              >
                Anterior
              </button>
              
              {step < 4 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 1 && (!form.subject || !form.grade || !form.theme)}
                  className="btn-rabbu px-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo Passo
                </button>
              ) : (
                <button
                  onClick={handleGenerate}
                  className="btn-rabbu px-10 bg-emerald-600 hover:bg-emerald-700"
                >
                  Gerar Prova Agora
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
