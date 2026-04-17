'use client'

import type { ExamFormData } from '../page'
import { cn } from '@/lib/utils'
import { BookOpen, GraduationCap, Lightbulb, Target, Sparkles } from 'lucide-react'

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
    <div className="space-y-10 animate-fade-in">
      
      {/* Subject & Grade Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#4F46E5]" />
            Disciplina
          </label>
          <select 
            value={form.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            className="search-input h-14 bg-[#F8F9FE] border-transparent focus:bg-white focus:border-[#4F46E5]"
          >
            <option value="">Selecione a matéria</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-[#4F46E5]" />
            Série / Ano
          </label>
          <select 
            value={form.grade}
            onChange={(e) => onChange({ grade: e.target.value })}
            className="search-input h-14 bg-[#F8F9FE] border-transparent focus:bg-white focus:border-[#4F46E5]"
          >
            <option value="">Selecione o ano</option>
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Theme Input */}
      <div className="space-y-3">
        <label className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-wider flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-[#4F46E5]" />
          Tema da Avaliação
        </label>
        <input 
          type="text"
          placeholder="Ex: Revolução Industrial, Equações de 2º Grau, Fotossíntese..."
          value={form.theme}
          onChange={(e) => onChange({ theme: e.target.value })}
          className="search-input h-14 bg-[#F8F9FE] border-transparent focus:bg-white focus:border-[#4F46E5]"
        />
        <p className="text-[11px] text-[#8E94BB] italic font-medium">Quanto mais específico, mais precisos serão os enunciados.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Difficulty Selector */}
        <div className="space-y-4">
          <label className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-wider flex items-center gap-2">
             <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
             Nível de Dificuldade
          </label>
          <div className="flex bg-[#F8F9FE] p-1.5 rounded-[18px] gap-2 border border-[#E9EAF2]">
            {(['facil', 'medio', 'dificil'] as const).map(d => (
              <button
                key={d}
                onClick={() => onChange({ difficulty: d })}
                className={cn(
                  "flex-1 py-3 px-4 rounded-[14px] text-xs font-bold transition-all uppercase tracking-widest",
                  form.difficulty === d 
                    ? "bg-white text-[#4F46E5] shadow-sm ring-1 ring-[#E9EAF2]" 
                    : "text-[#8E94BB] hover:text-[#4F46E5]"
                )}
              >
                {d === 'facil' ? 'Fácil' : d === 'medio' ? 'Médio' : 'Difícil'}
              </button>
            ))}
          </div>
        </div>

        {/* Style Selector */}
        <div className="space-y-4">
          <label className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-wider flex items-center gap-2">
             <Lightbulb className="w-3.5 h-3.5 text-[#4F46E5]" />
             Taxonomia de Bloom
          </label>
          <select 
            value={form.bloomLevel}
            onChange={(e) => onChange({ bloomLevel: e.target.value })}
            className="search-input h-14 bg-[#F8F9FE] border-transparent focus:bg-white focus:border-[#4F46E5]"
          >
            {BLOOM_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Style Toggle (ENEM / Regular) */}
      <div className="space-y-4">
          <label className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-wider">Estilo de Enunciado</label>
          <div className="grid grid-cols-3 gap-3">
             {(['regular', 'enem', 'homework'] as const).map(s => (
               <button
                 key={s}
                 onClick={() => onChange({ style: s })}
                 className={cn(
                   "py-4 px-6 rounded-2xl border transition-all text-center flex flex-col items-center gap-2",
                   form.style === s 
                    ? "border-[#4F46E5] bg-[#F5F5FF] text-[#4F46E5]" 
                    : "border-[#E9EAF2] bg-white text-[#8E94BB] hover:border-[#8E94BB]"
                 )}
               >
                 <span className="text-xs font-bold uppercase tracking-widest">
                   {s === 'regular' ? 'Tradicional' : s === 'enem' ? 'Estilo ENEM' : 'Dever de Casa'}
                 </span>
               </button>
             ))}
          </div>
      </div>

    </div>
  )
}
