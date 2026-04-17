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
    <div className="fixed inset-0 bg-[#F8F9FE] text-[#1A1D2F] z-[100] overflow-y-auto selection:bg-[#4F46E5]/10">
      
      {/* Top Bar - Minimalist */}
      <nav className="absolute top-0 left-0 w-full p-8 flex items-center justify-between pointer-events-none">
        <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white shadow-sm border border-[#E9EAF2] flex items-center justify-center hover:scale-110 transition-all text-[#8E94BB] hover:text-[#4F46E5] pointer-events-auto">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2 opacity-50">
          <Sparkles className="w-4 h-4 text-[#4F46E5]" />
          <span className="font-bold text-sm tracking-tight">Examyx Wizard</span>
        </div>
        <div className="w-10" />
      </nav>

      {/* Center Focused Content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
        
        {/* Progress Dots */}
        <div className="flex items-center gap-1.5 mb-10">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                step === s.id ? "w-8 bg-[#4F46E5]" : step > s.id ? "w-2 bg-emerald-500" : "w-2 bg-[#E9EAF2]"
              )}
            />
          ))}
        </div>

        <div className="w-full max-w-3xl mx-auto">
           {/* Step Headers - Adjusted Scale */}
           <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {step === 1 && (
               <>
                 <h1 className="text-4xl font-extrabold tracking-tight mb-3">Vamos começar.</h1>
                 <p className="text-lg text-[#8E94BB]">Defina a base da sua nova avaliação.</p>
               </>
             )}
             {step === 2 && (
               <>
                 <h1 className="text-4xl font-extrabold tracking-tight mb-3">Dê contexto à IA.</h1>
                 <p className="text-lg text-[#8E94BB]">Escolha entre a BNCC ou seus próprios materiais.</p>
               </>
             )}
             {step === 3 && (
               <>
                 <h1 className="text-4xl font-extrabold tracking-tight mb-3">Inclusão para todos.</h1>
                 <p className="text-lg text-[#8E94BB]">Adapte a linguagem para necessidades específicas.</p>
               </>
             )}
             {step === 4 && (
               <>
                 <h1 className="text-4xl font-extrabold tracking-tight mb-3">Tudo pronto.</h1>
                 <p className="text-lg text-[#8E94BB]">Revise as configurações antes de gerar.</p>
               </>
             )}
           </div>

           {/* Step Content */}
           <div className="mb-12">
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
        </div>

        {/* Fixed Bottom Actions - Better positioning */}
        {!result && !generating && (
           <div className="mt-8 flex items-center gap-4">
             {step > 1 && (
               <button
                 onClick={() => setStep(s => s - 1)}
                 className="w-14 h-14 rounded-full bg-white border border-[#E9EAF2] flex items-center justify-center text-[#8E94BB] hover:text-[#4F46E5] hover:scale-105 transition-all shadow-sm"
               >
                 <ArrowLeft className="w-5 h-5" />
               </button>
             )}
             
             {step < 4 ? (
               <button
                 onClick={() => setStep(s => s + 1)}
                 disabled={step === 1 && (!form.subject || !form.grade || !form.theme)}
                 className="h-14 px-10 rounded-full bg-[#4F46E5] text-white font-bold text-base flex items-center gap-3 hover:bg-[#3F37C9] hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:scale-100"
               >
                 Próximo Passo
                 <ArrowRight className="w-5 h-5" />
               </button>
             ) : (
               <button
                 onClick={handleGenerate}
                 className="h-14 px-10 rounded-full bg-emerald-600 text-white font-bold text-base flex items-center gap-3 hover:bg-emerald-700 hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
               >
                 Gerar Avaliação
                 <Sparkles className="w-5 h-5" />
               </button>
             )}
           </div>
        )}
      </div>
    </div>
  )
}
