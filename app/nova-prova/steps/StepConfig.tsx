'use client'

import type { ExamFormData } from '../page'
import { cn } from '@/lib/utils'
import { BookOpen, GraduationCap, Target, Hash, ListTodo, Plus, Minus, Type } from 'lucide-react'

const SUBJECTS = [
  'Matemática', 'Língua Portuguesa', 'Ciências', 'História', 'Geografia', 
  'Arte', 'Educação Física', 'Ensino Religioso', 'Língua Inglesa', 'Física', 
  'Química', 'Biologia', 'Filosofia', 'Sociologia'
]

const BLOOM_LEVELS = [
  'Lembrar', 'Compreender', 'Aplicar', 'Analisar', 'Avaliar', 'Criar'
]

interface Props {
  form: ExamFormData
  onChange: (partial: Partial<ExamFormData>) => void
}

export default function StepConfig({ form, onChange }: Props) {
  
  const updateMix = (key: keyof ExamFormData['questionMix'], delta: number) => {
    const val = Math.max(0, form.questionMix[key] + delta)
    onChange({ questionMix: { ...form.questionMix, [key]: val } })
  }

  const totalQuestions = Object.values(form.questionMix).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-8 animate-fade-in w-full">
      
      {/* Subject & Grade Duo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-[0.2em] px-1">Disciplina</label>
          <div className="relative group">
            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F46E5]" />
            <select 
              value={form.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
              className="w-full h-12 pl-11 pr-4 bg-white border border-[#E9EAF2] rounded-xl text-[14px] font-semibold focus:outline-none focus:border-[#4F46E5] transition-all appearance-none shadow-sm cursor-pointer"
            >
              <option value="">Selecione...</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-[0.2em] px-1">Série / Ano</label>
          <div className="relative group">
            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F46E5]" />
            <select 
              value={form.grade}
              onChange={(e) => onChange({ grade: e.target.value })}
              className="w-full h-12 pl-11 pr-4 bg-white border border-[#E9EAF2] rounded-xl text-[14px] font-semibold focus:outline-none focus:border-[#4F46E5] transition-all appearance-none shadow-sm cursor-pointer"
            >
              <option value="">Selecione...</option>
              <optgroup label="Ensino Fundamental I">
                <option value="1º ano EF">1º ano EF</option>
                <option value="2º ano EF">2º ano EF</option>
                <option value="3º ano EF">3º ano EF</option>
                <option value="4º ano EF">4º ano EF</option>
                <option value="5º ano EF">5º ano EF</option>
              </optgroup>
              <optgroup label="Ensino Fundamental II">
                <option value="6º ano EF">6º ano EF</option>
                <option value="7º ano EF">7º ano EF</option>
                <option value="8º ano EF">8º ano EF</option>
                <option value="9º ano EF">9º ano EF</option>
              </optgroup>
              <optgroup label="Ensino Médio">
                <option value="1ª série EM">1ª série EM</option>
                <option value="2ª série EM">2ª série EM</option>
                <option value="3ª série EM">3ª série EM</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="space-y-2 text-center">
        <label className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-[0.2em]">Tema Central</label>
        <div className="relative group">
          <Target className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4F46E5]" />
          <input 
            type="text"
            placeholder="Ex: Mitocôndrias e respiração celular..."
            value={form.theme}
            onChange={(e) => onChange({ theme: e.target.value })}
            className="w-full h-14 pl-12 pr-6 bg-white border border-[#E9EAF2] rounded-2xl text-lg font-bold placeholder:text-neutral-200 focus:outline-none focus:border-[#4F46E5] transition-all shadow-sm text-center"
          />
        </div>
      </div>

      {/* Mix de Questões Section */}
      <div className="p-6 rounded-[28px] bg-white border border-[#E9EAF2] shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#F0F1F7] pb-4">
           <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#4F46E5]" />
              <h3 className="text-[11px] font-bold text-[#1A1D2F] uppercase tracking-widest">Mix de Questões</h3>
           </div>
           <span className="text-[11px] font-bold text-[#4F46E5] bg-indigo-50 px-3 py-1 rounded-full uppercase">Total: {totalQuestions}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
          {[
            { key: 'multipleChoice', label: 'Alternativas' },
            { key: 'openEnded', label: 'Dissertativas' },
            { key: 'fillInBlanks', label: 'Lacunas' },
            { key: 'trueFalse', label: 'V / F' },
            { key: 'complex', label: 'Complexas (I-IV)' },
          ].map(item => (
            <div key={item.key} className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-[#8E94BB] uppercase text-center">{item.label}</span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => updateMix(item.key as any, -1)}
                  className="w-8 h-8 rounded-full border border-[#E9EAF2] flex items-center justify-center hover:bg-neutral-50 transition-colors"
                >
                  <Minus className="w-3 h-3 text-[#1A1D2F]" />
                </button>
                <span className="text-lg font-bold text-[#1A1D2F] w-4 text-center">{form.questionMix[item.key as keyof ExamFormData['questionMix']]}</span>
                <button 
                  onClick={() => updateMix(item.key as any, 1)}
                  className="w-8 h-8 rounded-full bg-[#F5F5FF] flex items-center justify-center hover:bg-indigo-100 transition-colors"
                >
                  <Plus className="w-3 h-3 text-[#4F46E5]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formatting Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ListTodo className="w-3.5 h-3.5 text-[#8E94BB]" />
            <label className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-wider">Formato & Qtd Alternativas</label>
          </div>
          <div className="flex flex-col gap-3">
             <div className="flex bg-[#F8F9FE] p-1.5 rounded-full gap-1 border border-[#E9EAF2]">
                {[4, 5].map(o => (
                  <button
                    key={o}
                    onClick={() => onChange({ optionsCount: o })}
                    className={cn(
                      "flex-1 py-2 rounded-full text-[10px] font-bold transition-all",
                      form.optionsCount === o ? "bg-[#4F46E5] text-white shadow-md" : "text-[#8E94BB] hover:text-[#4F46E5]"
                    )}
                  >
                    {o} Opções
                  </button>
                ))}
             </div>
             <div className="flex bg-[#F8F9FE] p-1.5 rounded-full gap-1 border border-[#E9EAF2]">
                {(['letters', 'roman'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => onChange({ optionsFormat: f })}
                    className={cn(
                      "flex-1 py-2 rounded-full text-[10px] font-bold transition-all uppercase",
                      form.optionsFormat === f ? "bg-white text-[#4F46E5] shadow-sm border border-[#E9EAF2]" : "text-[#8E94BB]"
                    )}
                  >
                    {f === 'letters' ? 'A, B, C...' : 'I, II, III...'}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Difficulty & Bloom - Minimalist Row */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Hash className="w-3.5 h-3.5 text-[#8E94BB]" />
            <label className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-wider">Complexidade Pedagógica</label>
          </div>
          <div className="flex flex-col gap-3">
            <div className="bg-white border border-[#E9EAF2] p-1.5 rounded-full flex gap-1 shadow-sm">
              {(['facil', 'medio', 'dificil'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => onChange({ difficulty: d })}
                  className={cn(
                    "flex-1 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all",
                    form.difficulty === d ? "bg-[#4F46E5] text-white shadow-md" : "text-[#8E94BB] hover:bg-neutral-50"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <select 
              value={form.bloomLevel}
              onChange={(e) => onChange({ bloomLevel: e.target.value })}
              className="w-full bg-neutral-50 border border-[#E9EAF2] rounded-full px-4 py-2 text-[10px] font-bold text-[#4F46E5] focus:outline-none cursor-pointer"
            >
              {BLOOM_LEVELS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>
      </div>

    </div>
  )
}
