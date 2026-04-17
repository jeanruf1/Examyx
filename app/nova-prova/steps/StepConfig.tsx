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
    <div className="space-y-10 animate-fade-in w-full max-w-2xl mx-auto">
      
      {/* Subject & Grade - Scaled Down */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-[0.2em] px-1">Disciplina</label>
          <div className="relative group">
            <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F46E5] group-focus-within:scale-110 transition-transform" />
            <select 
              value={form.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
              className="w-full h-14 pl-12 pr-6 bg-white border border-[#E9EAF2] rounded-2xl text-[15px] font-semibold focus:outline-none focus:border-[#4F46E5] transition-all appearance-none shadow-sm"
            >
              <option value="">Selecione...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-[0.2em] px-1">Série / Ano</label>
          <div className="relative group">
            <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F46E5] group-focus-within:scale-110 transition-transform" />
            <select 
              value={form.grade}
              onChange={(e) => onChange({ grade: e.target.value })}
              className="w-full h-14 pl-12 pr-6 bg-white border border-[#E9EAF2] rounded-2xl text-[15px] font-semibold focus:outline-none focus:border-[#4F46E5] transition-all appearance-none shadow-sm"
            >
              <option value="">Selecione...</option>
              {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Theme - Compacted */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-[0.2em] px-1 text-center block">Qual o tema central?</label>
        <div className="relative group">
          <Target className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4F46E5] group-focus-within:scale-110 transition-transform" />
          <input 
            type="text"
            placeholder="Ex: Mitocôndrias e respiração celular..."
            value={form.theme}
            onChange={(e) => onChange({ theme: e.target.value })}
            className="w-full h-16 pl-14 pr-6 bg-white border border-[#E9EAF2] rounded-3xl text-xl font-bold placeholder:text-neutral-200 focus:outline-none focus:border-[#4F46E5] transition-all shadow-sm text-center"
          />
        </div>
      </div>

      {/* Secondary Configs - Scaled & Centered */}
      <div className="flex flex-col items-center gap-4 pt-4">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="bg-white border border-[#E9EAF2] p-1.5 rounded-full flex gap-1 shadow-sm">
            {(['facil', 'medio', 'dificil'] as const).map(d => (
              <button
                key={d}
                onClick={() => onChange({ difficulty: d })}
                className={cn(
                  "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  form.difficulty === d ? "bg-[#4F46E5] text-white shadow-md" : "text-[#8E94BB] hover:bg-neutral-50"
                )}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="bg-white border border-[#E9EAF2] p-1.5 rounded-full flex gap-1 shadow-sm">
            {(['regular', 'enem', 'homework'] as const).map(s => (
              <button
                key={s}
                onClick={() => onChange({ style: s })}
                className={cn(
                  "px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                  form.style === s ? "bg-[#4F46E5] text-white shadow-md" : "text-[#8E94BB] hover:bg-neutral-50"
                )}
              >
                {s === 'regular' ? 'Padrão' : s === 'enem' ? 'ENEM' : 'Dever'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E9EAF2] pl-5 pr-1.5 py-1.5 rounded-full flex items-center gap-3 shadow-sm">
          <span className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-widest">Bloom:</span>
          <select 
            value={form.bloomLevel}
            onChange={(e) => onChange({ bloomLevel: e.target.value })}
            className="bg-neutral-50 border border-[#E9EAF2] rounded-full px-4 py-1.5 text-[10px] font-bold text-[#4F46E5] focus:outline-none cursor-pointer"
          >
            {BLOOM_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

    </div>
  )
}
