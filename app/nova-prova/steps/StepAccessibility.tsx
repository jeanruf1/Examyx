'use client'

import type { ExamFormData } from '../page'
import { cn } from '@/lib/utils'
import { Check, Eye, HelpCircle, UserPlus } from 'lucide-react'

interface AccessibilityOption {
  key: keyof ExamFormData['accessibility']
  label: string
  subtitle: string
  changes: string[]
}

const OPTIONS: AccessibilityOption[] = [
  {
    key: 'tea',
    label: 'TEA (Autismo)',
    subtitle: 'Linguagem literal e direta.',
    changes: ['Sem metáforas', 'Enunciados curtos', 'Contexto explícito']
  },
  {
    key: 'dyslexia',
    label: 'Dislexia',
    subtitle: 'Foco na fluidez da leitura.',
    changes: ['Vocabulário simples', 'Espaçamento amplo', 'Sem ambiguidades']
  },
  {
    key: 'adhd',
    label: 'TDAH',
    subtitle: 'Direcionamento de atenção.',
    changes: ['Comandos em destaque', 'Sem distrações', 'Passo a passo']
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
    <div className="space-y-10 animate-fade-in">
      <div className="flex items-center gap-3">
        <UserPlus className="w-4 h-4 text-[#8E94BB]" />
        <h3 className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-widest">Inclusão e Acessibilidade (Opcional)</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map(opt => {
          const active = form.accessibility[opt.key]
          return (
            <div
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={cn(
                "p-6 rounded-[24px] border transition-all duration-300 cursor-pointer flex flex-col h-full",
                active ? "border-[#4F46E5] bg-[#F5F5FF]" : "border-[#E9EAF2] bg-white hover:border-[#8E94BB]"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  active ? "bg-[#4F46E5] text-white" : "bg-neutral-100 text-[#8E94BB]"
                )}>
                  {active ? <Check className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </div>
                {active && <span className="text-[10px] font-bold text-[#4F46E5] uppercase">Ativado</span>}
              </div>

              <div className="flex-1">
                <h4 className="text-[15px] font-bold text-[#1A1D2F] mb-1">{opt.label}</h4>
                <p className="text-[12px] text-[#8E94BB] mb-4 leading-relaxed">{opt.subtitle}</p>
                
                <div className="space-y-1.5 mt-auto">
                  {opt.changes.map((c, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={cn("w-1 h-1 rounded-full", active ? "bg-[#4F46E5]" : "bg-neutral-200")} />
                      <span className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-tight">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-6 rounded-[24px] bg-[#F8F9FE] border border-[#E9EAF2] flex items-center gap-4">
         <HelpCircle className="w-5 h-5 text-[#8E94BB]" />
         <p className="text-[13px] text-[#8E94BB] italic">
           A IA adaptará a estrutura gramatical e o vocabulário automaticamente para as opções selecionadas.
         </p>
      </div>
    </div>
  )
}
