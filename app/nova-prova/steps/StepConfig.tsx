'use client'

import type { ExamFormData } from '../page'
import { cn } from '@/lib/utils'
import { BookOpen, GraduationCap, Target } from 'lucide-react'

const SUBJECTS = [
  'Matemática', 'Língua Portuguesa', 'Ciências', 'História', 'Geografia', 
  'Arte', 'Educação Física', 'Ensino Religioso', 'Língua Inglesa', 'Física', 
  'Química', 'Biologia', 'Filosofia', 'Sociologia'
]

const GRADES = [
  '1º ano EF', '2º ano EF', '3º ano EF', '4º ano EF', '5º ano EF',
  '6º ano EF', '7º ano EF', '8º ano EF', '9º ano EF',
  '1ª série EM', '2ª série EM', '3ª série EM'
]

const BLOOM_LEVELS = [
  'Lembrar', 'Compreender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar'
]

interface Props {
  form: ExamFormData
  onChange: (partial: Partial<ExamFormData>) => void
}

export default function StepConfig({ form, onChange }: Props) {
  return (
    <div className="space-y-16 animate-fade-in max-w-3xl mx-auto">
      
      {/* Subject & Grade - Floating Duo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <label className="text-xs font-bold text-[#8E94BB] uppercase tracking-[0.2em] px-1">Disciplina</label>
          <div className="relative group">
            <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4F46E5] group-focus-within:scale-110 transition-transform" />
            <select 
              value={form.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
              className="w-full h-20 pl-16 pr-6 bg-white border border-[#E9EAF2] rounded-[32px] text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/5 focus:border-[#4F46E5] transition-all appearance-none shadow-sm"
            >
              <option value="">Selecione...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold text-[#8E94BB] uppercase tracking-[0.2em] px-1">Série / Ano</label>
          <div className="relative group">
            <GraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4F46E5] group-focus-within:scale-110 transition-transform" />
            <select 
              value={form.grade}
              onChange={(e) => onChange({ grade: e.target.value })}
              className="w-full h-20 pl-16 pr-6 bg-white border border-[#E9EAF2] rounded-[32px] text-lg font-semibold focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/5 focus:border-[#4F46E5] transition-all appearance-none shadow-sm"
            >
              <option value="">Selecione...</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Theme - The Big Input */}
      <div className="space-y-4">
        <label className="text-xs font-bold text-[#8E94BB] uppercase tracking-[0.2em] px-1 text-center block">Qual o tema central?</label>
        <div className="relative group">
          <Target className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-[#4F46E5] group-focus-within:scale-110 transition-transform" />
          <input 
            type="text"
            placeholder="Ex: Mitocôndrias e respiração celular..."
            value={form.theme}
            onChange={(e) => onChange({ theme: e.target.value })}
            className="w-full h-24 pl-20 pr-8 bg-white border border-[#E9EAF2] rounded-[40px] text-2xl font-bold placeholder:text-neutral-200 focus:outline-none focus:ring-4 focus:ring-[#4F46E5]/5 focus:border-[#4F46E5] transition-all shadow-sm text-center"
          />
        </div>
      </div>

      {/* Secondary Configs - Glass Pills */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="bg-white/50 backdrop-blur-sm border border-[#E9EAF2] p-2 rounded-full flex gap-1">
          {(['facil', 'medio', 'dificil'] as const).map(d => (
            <button
              key={d}
              onClick={() => onChange({ difficulty: d })}
              className={cn(
                "px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all",
                form.difficulty === d ? "bg-[#4F46E5] text-white shadow-lg" : "text-[#8E94BB] hover:bg-white"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="bg-white/50 backdrop-blur-sm border border-[#E9EAF2] p-2 rounded-full flex gap-1">
          {(['regular', 'enem', 'homework'] as const).map(s => (
            <button
              key={s}
              onClick={() => onChange({ style: s })}
              className={cn(
                "px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all",
                form.style === s ? "bg-[#4F46E5] text-white shadow-lg" : "text-[#8E94BB] hover:bg-white"
              )}
            >
              {s === 'regular' ? 'Padrão' : s === 'enem' ? 'ENEM' : 'Dever'}
            </button>
          ))}
        </div>

        <div className="bg-white/50 backdrop-blur-sm border border-[#E9EAF2] pl-6 pr-2 py-2 rounded-full flex items-center gap-3">
          <span className="text-[11px] font-bold text-[#8E94BB] uppercase tracking-widest">Bloom:</span>
          <select 
            value={form.bloomLevel}
            onChange={(e) => onChange({ bloomLevel: e.target.value })}
            className="bg-white border border-[#E9EAF2] rounded-full px-4 py-1 text-[11px] font-bold text-[#4F46E5] focus:outline-none"
          >
            {BLOOM_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

    </div>
  )
}
