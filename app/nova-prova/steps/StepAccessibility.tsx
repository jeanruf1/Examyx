'use client'

import type { ExamFormData } from '../page'
import { cn } from '@/lib/utils'
import { Check, Eye, HelpCircle, Info, Lightbulb } from 'lucide-react'

interface AccessibilityOption {
  key: keyof ExamFormData['accessibility']
  label: string
  subtitle: string
  howToIdentify: string
  pedagogicalImpact: string
  changes: string[]
}

const OPTIONS: AccessibilityOption[] = [
  {
    key: 'tea',
    label: 'Autismo (TEA)',
    subtitle: 'Linguagem literal e direta.',
    howToIdentify: 'Dificuldade com metáforas, sarcasmo ou enunciados com duplo sentido. Preferência por rotina e clareza absoluta.',
    pedagogicalImpact: 'Ao remover distrações e figuras de linguagem, a IA garante que o aluno seja avaliado pelo conhecimento técnico, não pela interpretação social.',
    changes: ['Sem metáforas', 'Frases curtas', 'Contexto explícito']
  },
  {
    key: 'dyslexia',
    label: 'Dislexia',
    subtitle: 'Foco na fluidez da leitura.',
    howToIdentify: 'Troca de letras (p/b, d/q), leitura lenta ou cansativa. Dificuldade em processar blocos densos de texto.',
    pedagogicalImpact: 'A IA utiliza vocabulário de alta frequência e espaçamento amplo, reduzindo a carga cognitiva e o esforço de decodificação.',
    changes: ['Vocabulário simples', 'Espaçamento amplo', 'Alternativas numeradas']
  },
  {
    key: 'adhd',
    label: 'TDAH',
    subtitle: 'Foco na atenção.',
    howToIdentify: 'Perda de foco em enunciados longos, esquecimento de comandos secundários ou erros por impulsividade na leitura.',
    pedagogicalImpact: 'O sistema destaca os comandos principais e estrutura a questão em passos lógicos, mantendo a atenção no que é essencial.',
    changes: ['Comandos claros', 'Sem distrações', 'Passo a passo']
  },
]

interface Props {
  form: ExamFormData
  onChange: (partial: Partial<ExamFormData>) => void
}

export default function StepAccessibility({ form, onChange }: Props) {
  function toggle(key: keyof ExamFormData['accessibility']) {
    onChange({ accessibility: { ...form.accessibility, [key]: !form.accessibility[key] } })
  }

  return (
    <div className="space-y-12 animate-fade-in w-full max-w-5xl mx-auto pb-10">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {OPTIONS.map(opt => {
          const active = form.accessibility[opt.key]
          return (
            <div
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={cn(
                "group p-8 rounded-[40px] border transition-all duration-500 cursor-pointer flex flex-col",
                active 
                  ? "border-[#4F46E5] bg-white shadow-2xl shadow-indigo-500/10" 
                  : "border-[#E9EAF2] bg-white hover:border-[#8E94BB]"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <div className={cn(
                  "w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-500",
                  active ? "bg-[#4F46E5] text-white rotate-6" : "bg-[#F8F9FE] text-[#8E94BB]"
                )}>
                  {active ? <Check className="w-8 h-8" /> : <Eye className="w-8 h-8" />}
                </div>
                {active && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Adaptando</span>}
              </div>

              <div className="flex-1 space-y-6 text-left">
                <div>
                  <h4 className="text-xl font-bold text-[#1A1D2F] mb-1">{opt.label}</h4>
                  <p className="text-sm text-[#8E94BB] leading-relaxed">{opt.subtitle}</p>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#E9EAF2]">
                     <div className="flex items-center gap-2 mb-2">
                        <Info className="w-3 h-3 text-[#4F46E5]" />
                        <span className="text-[9px] font-bold text-[#4F46E5] uppercase tracking-widest">Como Identificar</span>
                     </div>
                     <p className="text-[11px] text-[#8E94BB] leading-relaxed italic">{opt.howToIdentify}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-3 h-3 text-[#4F46E5]" />
                        <span className="text-[9px] font-bold text-[#4F46E5] uppercase tracking-widest">Impacto IA</span>
                     </div>
                     <p className="text-[11px] text-[#4F46E5] leading-relaxed">{opt.pedagogicalImpact}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-[#F0F1F7]">
                  {opt.changes.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={cn("w-1 h-1 rounded-full", active ? "bg-[#4F46E5]" : "bg-neutral-200")} />
                      <span className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-widest">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-8 rounded-[32px] bg-white border border-[#E9EAF2] flex items-center gap-6 shadow-sm">
         <HelpCircle className="w-6 h-6 text-[#4F46E5]" />
         <div className="text-left">
            <p className="text-sm text-[#1A1D2F] font-bold">Base Pedagógica Inclusiva</p>
            <p className="text-[13px] text-[#8E94BB]">
              O Examyx utiliza protocolos de educação especial para garantir que cada aluno tenha as mesmas chances de sucesso, respeitando suas particularidades neurocognitivas.
            </p>
         </div>
      </div>
    </div>
  )
}
