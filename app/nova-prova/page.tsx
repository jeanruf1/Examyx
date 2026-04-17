'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Sparkles, Check, ArrowRight, ArrowLeft } from 'lucide-react'
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
  { id: 1, name: 'Configuração' },
  { id: 2, name: 'Contexto' },
  { id: 3, name: 'Acessibilidade' },
  { id: 4, name: 'Gerar' },
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
    <div className="min-h-screen bg-[#F8F9FE] text-[#1A1D2F] selection:bg-[#4F46E5]/10">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full p-8 flex items-center justify-between z-50">
        <Link href="/dashboard" className="w-12 h-12 rounded-full bg-white shadow-sm border border-[#E9EAF2] flex items-center justify-center hover:scale-110 transition-all text-[#8E94BB] hover:text-[#4F46E5]">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
          <span className="font-bold text-xl tracking-tight">Examyx</span>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </nav>

      {/* Main Wizard Content */}
      <div className="max-w-4xl mx-auto pt-40 pb-20 px-6">
        
        {/* Progress Indicator (Apple Style) */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                step === s.id ? "w-12 bg-[#4F46E5]" : step > s.id ? "w-4 bg-emerald-500" : "w-4 bg-[#E9EAF2]"
              )}
            />
          ))}
        </div>

        {/* Step Transition Wrapper */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           {step === 1 && (
             <div className="text-center mb-16">
               <h1 className="text-5xl font-extrabold tracking-tight mb-4">Vamos começar.</h1>
               <p className="text-xl text-[#8E94BB]">Defina a base da sua nova avaliação.</p>
             </div>
           )}
           {step === 2 && (
             <div className="text-center mb-16">
               <h1 className="text-5xl font-extrabold tracking-tight mb-4">Dê contexto à IA.</h1>
               <p className="text-xl text-[#8E94BB]">Escolha entre a BNCC ou seus próprios materiais.</p>
             </div>
           )}
           {step === 3 && (
             <div className="text-center mb-16">
               <h1 className="text-5xl font-extrabold tracking-tight mb-4">Inclusão para todos.</h1>
               <p className="text-xl text-[#8E94BB]">Adapte a linguagem para necessidades específicas.</p>
             </div>
           )}
           {step === 4 && (
             <div className="text-center mb-16">
               <h1 className="text-5xl font-extrabold tracking-tight mb-4">Tudo pronto.</h1>
               <p className="text-xl text-[#8E94BB]">Revise as configurações antes de gerar.</p>
             </div>
           )}

           {/* Step Content */}
           <div className="mb-20">
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

           {/* Actions */}
           {!result && !generating && (
             <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
               {step > 1 && (
                 <button
                   onClick={() => setStep(s => s - 1)}
                   className="w-16 h-16 rounded-full bg-white border border-[#E9EAF2] flex items-center justify-center text-[#8E94BB] hover:text-[#4F46E5] hover:scale-105 transition-all shadow-sm"
                 >
                   <ArrowLeft className="w-6 h-6" />
                 </button>
               )}
               
               {step < 4 ? (
                 <button
                   onClick={() => setStep(s => s + 1)}
                   disabled={step === 1 && (!form.subject || !form.grade || !form.theme)}
                   className="h-16 px-12 rounded-full bg-[#4F46E5] text-white font-bold text-lg flex items-center gap-3 hover:bg-[#3F37C9] hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:scale-100"
                 >
                   Próximo Passo
                   <ArrowRight className="w-6 h-6" />
                 </button>
               ) : (
                 <button
                   onClick={handleGenerate}
                   className="h-16 px-12 rounded-full bg-emerald-600 text-white font-bold text-lg flex items-center gap-3 hover:bg-emerald-700 hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
                 >
                   Gerar Avaliação
                   <Sparkles className="w-6 h-6" />
                 </button>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  )
}
