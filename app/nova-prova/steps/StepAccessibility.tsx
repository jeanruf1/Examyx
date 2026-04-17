'use client'

import { useState } from 'react'
import type { ExamFormData } from '../page'
import { cn } from '@/lib/utils'
import { Check, Eye, HelpCircle, Info, Lightbulb, X } from 'lucide-react'

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
  const [modalContent, setModalContent] = useState<{ title: string, text: string, type: 'info' | 'idea' } | null>(null)

  function toggle(key: keyof ExamFormData['accessibility']) {
    onChange({ accessibility: { ...form.accessibility, [key]: !form.accessibility[key] } })
  }

  return (
    <div className="space-y-12 animate-fade-in w-full max-w-5xl mx-auto pb-10 relative">
      
      {/* Cards Grid */}
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
                {active && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Ativado</span>}
              </div>

              <div className="flex-1 space-y-6 text-left">
                <div>
                  <h4 className="text-xl font-bold text-[#1A1D2F] mb-1">{opt.label}</h4>
                  <p className="text-sm text-[#8E94BB] leading-relaxed">{opt.subtitle}</p>
                </div>
                
                {/* Micro Buttons for details */}
                <div className="flex flex-wrap gap-2 pt-2">
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setModalContent({ title: `Identificando ${opt.label}`, text: opt.howToIdentify, type: 'info' })
                     }}
                     className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[9px] font-bold text-[#8E94BB] uppercase transition-colors flex items-center gap-1.5"
                   >
                     <Info className="w-3 h-3" />
                     Como Identificar
                   </button>
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       setModalContent({ title: `Impacto IA: ${opt.label}`, text: opt.pedagogicalImpact, type: 'idea' })
                     }}
                     className="px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-[9px] font-bold text-[#4F46E5] uppercase transition-colors flex items-center gap-1.5"
                   >
                     <Lightbulb className="w-3 h-3" />
                     Impacto IA
                   </button>
                </div>

                <div className="space-y-2 pt-6 border-t border-[#F0F1F7]">
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
              Protocolos de educação especial integrados para garantir equidade neurocognitiva.
            </p>
         </div>
      </div>

      {/* Modal / Popup Detail (Apple Style) */}
      {modalContent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#1A1D2F]/40 backdrop-blur-sm" onClick={() => setModalContent(null)} />
           <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setModalContent(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
              >
                <X className="w-5 h-5 text-[#8E94BB]" />
              </button>
              
              <div className={cn(
                "w-16 h-16 rounded-[24px] flex items-center justify-center mb-8",
                modalContent.type === 'info' ? "bg-neutral-100 text-[#1A1D2F]" : "bg-indigo-50 text-[#4F46E5]"
              )}>
                {modalContent.type === 'info' ? <Info className="w-8 h-8" /> : <Lightbulb className="w-8 h-8" />}
              </div>

              <h3 className="text-2xl font-bold text-[#1A1D2F] mb-4">{modalContent.title}</h3>
              <p className="text-lg text-[#8E94BB] leading-relaxed italic">
                {modalContent.text}
              </p>
              
              <button 
                onClick={() => setModalContent(null)}
                className="mt-10 w-full py-4 bg-[#1A1D2F] text-white rounded-full font-bold hover:scale-105 transition-all"
              >
                Entendido
              </button>
           </div>
        </div>
      )}
    </div>
  )
}
