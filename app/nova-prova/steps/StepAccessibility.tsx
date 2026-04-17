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
    subtitle: 'Linguagem literal.',
    changes: ['Sem metáforas', 'Frases curtas']
  },
  {
    key: 'dyslexia',
    label: 'Dislexia',
    subtitle: 'Fluidez da leitura.',
    changes: ['Vocabulário simples', 'Espaçamento']
  },
  {
    key: 'adhd',
    label: 'TDAH',
    subtitle: 'Foco na atenção.',
    changes: ['Comandos claros', 'Sem distrações']
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
    <div className="space-y-8 animate-fade-in w-full">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map(opt => {
          const active = form.accessibility[opt.key]
          return (
            <div
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={cn(
                "group p-6 rounded-[24px] border transition-all duration-300 cursor-pointer flex flex-col items-center text-center",
                active 
                  ? "border-[#4F46E5] bg-[#F5F5FF] shadow-lg shadow-indigo-500/5" 
                  : "border-[#E9EAF2] bg-white hover:border-[#8E94BB]"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-[18px] flex items-center justify-center mb-4 transition-all duration-500",
                active ? "bg-[#4F46E5] text-white" : "bg-[#F8F9FE] text-[#8E94BB]"
              )}>
                {active ? <Check className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </div>

              <div className="flex-1">
                <h4 className="text-base font-bold text-[#1A1D2F] mb-1">{opt.label}</h4>
                <p className="text-xs text-[#8E94BB] mb-4">{opt.subtitle}</p>
                
                <div className="space-y-1.5">
                  {opt.changes.map((c, i) => (
                    <div key={i} className="flex items-center justify-center gap-1.5">
                      <div className={cn("w-1 h-1 rounded-full", active ? "bg-[#4F46E5]" : "bg-neutral-200")} />
                      <span className="text-[9px] font-bold text-[#8E94BB] uppercase tracking-widest">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-3 py-6 border-t border-[#F0F1F7]">
         <HelpCircle className="w-4 h-4 text-[#8E94BB]" />
         <p className="text-sm text-[#8E94BB] italic">IA adaptará a gramática automaticamente.</p>
      </div>
    </div>
  )
}
