'use client'

import type { ExamFormData } from '../page'
import { cn } from '@/lib/utils'
import { Check, Eye, HelpCircle } from 'lucide-react'

interface AccessibilityOption {
  key: keyof ExamFormData['accessibility']
  label: string
  subtitle: string
  changes: string[]
}

const OPTIONS: AccessibilityOption[] = [
  {
    key: 'tea',
    label: 'Autismo (TEA)',
    subtitle: 'Linguagem literal e direta.',
    changes: ['Sem metáforas', 'Frases curtas', 'Contexto explícito']
  },
  {
    key: 'dyslexia',
    label: 'Dislexia',
    subtitle: 'Foco na fluidez da leitura.',
    changes: ['Vocabulário simples', 'Espaçamento amplo', 'Alternativas numeradas']
  },
  {
    key: 'adhd',
    label: 'TDAH',
    subtitle: 'Direcionamento de atenção.',
    changes: ['Comandos em destaque', 'Sem redundâncias', 'Verbos no início']
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
    <div className="space-y-16 animate-fade-in max-w-5xl mx-auto">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {OPTIONS.map(opt => {
          const active = form.accessibility[opt.key]
          return (
            <div
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={cn(
                "group p-10 rounded-[40px] border transition-all duration-500 cursor-pointer flex flex-col items-center text-center",
                active 
                  ? "border-[#4F46E5] bg-white shadow-2xl shadow-indigo-500/10 scale-105" 
                  : "border-[#E9EAF2] bg-white/50 hover:bg-white hover:border-[#8E94BB]"
              )}
            >
              <div className={cn(
                "w-20 h-20 rounded-[28px] flex items-center justify-center mb-8 transition-all duration-500",
                active ? "bg-[#4F46E5] text-white rotate-6" : "bg-[#F8F9FE] text-[#8E94BB]"
              )}>
                {active ? <Check className="w-10 h-10" /> : <Eye className="w-10 h-10" />}
              </div>

              <div className="flex-1">
                <h4 className="text-2xl font-bold text-[#1A1D2F] mb-2">{opt.label}</h4>
                <p className="text-base text-[#8E94BB] mb-8 leading-relaxed">{opt.subtitle}</p>
                
                <div className="space-y-3">
                  {opt.changes.map((c, i) => (
                    <div key={i} className="flex items-center justify-center gap-2">
                      <div className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-[#4F46E5]" : "bg-neutral-200")} />
                      <span className="text-[11px] font-bold text-[#8E94BB] uppercase tracking-widest">{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {active && (
                <div className="mt-8 px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                  Ativado
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-4 py-8 border-t border-[#E9EAF2]">
         <HelpCircle className="w-6 h-6 text-[#8E94BB]" />
         <p className="text-lg text-[#8E94BB] italic">
           A IA adaptará a estrutura gramatical e o vocabulário automaticamente.
         </p>
      </div>
    </div>
  )
}
