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
  questionMix: {
    multipleChoice: number
    openEnded: number
    fillInBlanks: number
    trueFalse: number
    complex: number
  }
  optionsCount: number
  optionsFormat: 'letters' | 'roman'
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
  questionMix: {
    multipleChoice: 5,
    openEnded: 2,
    fillInBlanks: 0,
    trueFalse: 0,
    complex: 0
  },
  optionsCount: 4,
  optionsFormat: 'letters',
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
    <div className="max-w-[1000px] mx-auto pb-20 animate-fade-in relative">
      
      {/* Top Header - Adjusted for Sidebar Layout */}
      <div className="flex items-center justify-between mb-12 pt-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-[13px] font-bold text-[#8E94BB] hover:text-[#4F46E5] transition-colors">
          <ChevronLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </Link>
        <div className="flex items-center gap-1.5 opacity-40">
           {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                step === s.id ? "w-6 bg-[#4F46E5]" : step > s.id ? "w-1.5 bg-emerald-500" : "w-1.5 bg-[#E9EAF2]"
              )}
            />
          ))}
        </div>
      </div>

      {/* Centered Content Section */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl">
           {/* Step Headers - More Compact */}
           <div className="text-center mb-10">
             {step === 1 && (
               <>
                 <h1 className="text-[32px] font-extrabold tracking-tight mb-2">Vamos começar.</h1>
                 <p className="text-[15px] text-[#8E94BB]">Defina os parâmetros base da avaliação.</p>
               </>
             )}
             {step === 2 && (
               <>
                 <h1 className="text-[32px] font-extrabold tracking-tight mb-2">Dê contexto.</h1>
                 <p className="text-[15px] text-[#8E94BB]">Escolha as fontes de conhecimento da IA.</p>
               </>
             )}
             {step === 3 && (
               <>
                 <h1 className="text-[32px] font-extrabold tracking-tight mb-2">Inclusão.</h1>
                 <p className="text-[15px] text-[#8E94BB]">Adapte a linguagem para necessidades específicas.</p>
               </>
             )}
             {step === 4 && (
               <>
                 <h1 className="text-[32px] font-extrabold tracking-tight mb-2">Resumo.</h1>
                 <p className="text-[15px] text-[#8E94BB]">Confirme as definições antes de gerar.</p>
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

        {/* Action Buttons - Non-fixed for better flow */}
        {!result && !generating && (
           <div className="flex items-center gap-4">
             {step > 1 && (
               <button
                 onClick={() => setStep(s => s - 1)}
                 className="w-12 h-12 rounded-full bg-white border border-[#E9EAF2] flex items-center justify-center text-[#8E94BB] hover:text-[#4F46E5] hover:scale-105 transition-all shadow-sm"
               >
                 <ArrowLeft className="w-4 h-4" />
               </button>
             )}
             
             {step < 4 ? (
               <button
                 onClick={() => setStep(s => s + 1)}
                 disabled={step === 1 && (!form.subject || !form.grade || !form.theme)}
                 className="h-12 px-8 rounded-full bg-[#4F46E5] text-white font-bold text-sm flex items-center gap-3 hover:bg-[#3F37C9] hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:scale-100"
               >
                 Próximo Passo
                 <ArrowRight className="w-4 h-4" />
               </button>
             ) : (
               <button
                 onClick={handleGenerate}
                 className="h-12 px-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center gap-3 hover:bg-emerald-700 hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
               >
                 Gerar Avaliação
                 <Sparkles className="w-4 h-4" />
               </button>
             )}
           </div>
        )}
      </div>
    </div>
  )
}
