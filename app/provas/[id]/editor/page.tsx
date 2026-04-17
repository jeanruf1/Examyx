'use client'

import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  ChevronLeft, Wand2, Trash2, GripVertical,
  Plus, Check, X, Loader2, RotateCcw,
  CheckCircle2, Info, Brain, Save
} from 'lucide-react'
import { cn } from '@/lib/utils'

const BLOOM_PORTUGUESE: Record<string, string> = {
  memorization: 'Lembrar',
  comprehension: 'Compreender',
  application: 'Aplicar',
  analysis: 'Analisar',
  evaluation: 'Avaliar',
  synthesis: 'Criar',
}

type Option = { letter: string; text: string; is_correct: boolean }
type Question = {
  id: string
  type: string
  content: string
  options: Option[] | null
  answer: string
  explanation: string
  bloom_level: string | null
  bncc_code: string | null
  order_index: number
}

// ─────────────────────────────────────────────
// InlineEdit — clique para editar qualquer texto
// ─────────────────────────────────────────────
function InlineEdit({
  value,
  onSave,
  multiline = false,
  className = '',
}: {
  value: string
  onSave: (v: string) => void
  multiline?: boolean
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  function commit() {
    setEditing(false)
    if (draft.trim() !== value) onSave(draft.trim())
  }

  function cancel() {
    setDraft(value)
    setEditing(false)
  }

  if (!editing) {
    return (
      <span
        onClick={() => { setDraft(value); setEditing(true) }}
        className={cn('cursor-text hover:bg-indigo-50/60 rounded-lg px-1 -mx-1 transition-colors group relative', className)}
        title="Clique para editar"
      >
        {value}
        <span className="absolute -top-5 left-0 text-[9px] font-bold text-[#4F46E5] opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
          editar
        </span>
      </span>
    )
  }

  return (
    <span className="block">
      {multiline ? (
        <textarea
          ref={ref as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={4}
          className="w-full border-2 border-[#4F46E5] rounded-xl p-3 text-[16px] font-semibold text-[#1A1D2F] leading-relaxed resize-none focus:outline-none focus:ring-0 bg-indigo-50/30"
        />
      ) : (
        <input
          ref={ref as React.RefObject<HTMLInputElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          className="w-full border-2 border-[#4F46E5] rounded-xl p-3 text-[14px] text-[#1A1D2F] focus:outline-none focus:ring-0 bg-indigo-50/30"
        />
      )}
      <span className="flex items-center gap-2 mt-2">
        <button onClick={commit} className="flex items-center gap-1 px-3 py-1.5 bg-[#4F46E5] text-white rounded-lg text-[11px] font-bold hover:bg-indigo-700 transition-colors">
          <Check className="w-3 h-3" /> Salvar
        </button>
        <button onClick={cancel} className="flex items-center gap-1 px-3 py-1.5 bg-neutral-100 text-[#8E94BB] rounded-lg text-[11px] font-bold hover:bg-neutral-200 transition-colors">
          <X className="w-3 h-3" /> Cancelar
        </button>
      </span>
    </span>
  )
}

// ─────────────────────────────────────────────
// AIRewritePanel — instrução para reescrita com IA
// ─────────────────────────────────────────────
function AIRewritePanel({
  questionId,
  subject,
  grade,
  onRewritten,
}: {
  questionId: string
  subject: string
  grade: string
  onRewritten: (q: Question) => void
}) {
  const [open, setOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const presets = [
    'Torne mais fácil',
    'Torne mais difícil',
    'Use linguagem mais simples',
    'Adicione contexto ENEM',
    'Adapte para alunos com TEA',
  ]

  async function rewrite() {
    if (!instruction.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/rewrite-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, instruction, subject, grade }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro na reescrita')
      onRewritten(data.question)
      setOpen(false)
      setInstruction('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border',
          open
            ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
            : 'bg-indigo-50 text-[#4F46E5] border-indigo-100 hover:bg-indigo-100'
        )}
      >
        <Wand2 className="w-3.5 h-3.5" />
        Reescrever com IA
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-[#E9EAF2] rounded-3xl shadow-2xl shadow-indigo-500/10 p-5 z-50 animate-in fade-in slide-in-from-top-2">
          <h4 className="text-[13px] font-bold text-[#1A1D2F] mb-3">Como reescrever?</h4>

          {/* Presets rápidos */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setInstruction(p)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                  instruction === p
                    ? 'bg-[#4F46E5] text-white border-[#4F46E5]'
                    : 'bg-neutral-50 text-[#8E94BB] border-[#E9EAF2] hover:border-[#4F46E5] hover:text-[#4F46E5]'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          <textarea
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="Ou descreva sua instrução personalizada..."
            rows={3}
            className="w-full border border-[#E9EAF2] rounded-xl p-3 text-[13px] text-[#1A1D2F] focus:outline-none focus:border-[#4F46E5] resize-none mb-3"
          />

          {error && <p className="text-red-500 text-[11px] mb-2">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={rewrite}
              disabled={loading || !instruction.trim()}
              className="flex-1 h-10 bg-[#4F46E5] text-white rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              {loading ? 'Reescrevendo...' : 'Aplicar'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 h-10 bg-neutral-100 text-[#8E94BB] rounded-xl text-[12px] font-bold hover:bg-neutral-200 transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// QuestionCard — card de edição de uma questão
// ─────────────────────────────────────────────
function QuestionCard({
  question,
  index,
  total,
  subject,
  grade,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  saving,
}: {
  question: Question
  index: number
  total: number
  subject: string
  grade: string
  onUpdate: (q: Question) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  saving: boolean
}) {
  function updateField(field: keyof Question, value: any) {
    onUpdate({ ...question, [field]: value })
  }

  function updateOption(letter: string, newText: string) {
    const opts = (question.options || []).map(o =>
      o.letter === letter ? { ...o, text: newText } : o
    )
    onUpdate({ ...question, options: opts })
  }

  function setCorrectOption(letter: string) {
    const opts = (question.options || []).map(o => ({ ...o, is_correct: o.letter === letter }))
    onUpdate({ ...question, options: opts })
  }

  const isVF = question.type === 'true_false'

  return (
    <div className="group p-8 rounded-[32px] bg-white border-2 border-[#E9EAF2] hover:border-[#4F46E5]/30 transition-all shadow-sm relative">

      {/* Saving indicator */}
      {saving && (
        <div className="absolute top-4 right-4">
          <Loader2 className="w-4 h-4 text-[#4F46E5] animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* Drag handle + number */}
          <div className="flex items-center gap-2">
            <div className="cursor-grab active:cursor-grabbing text-[#D1D5DB] hover:text-[#8E94BB] transition-colors">
              <GripVertical className="w-5 h-5" />
            </div>
            <span className="w-10 h-10 rounded-2xl bg-[#F8F9FE] text-[#1A1D2F] flex items-center justify-center font-extrabold text-lg border border-[#E9EAF2] group-hover:bg-[#4F46E5] group-hover:text-white transition-all">
              {index + 1}
            </span>
          </div>

          {/* Move up / down */}
          <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="w-5 h-5 rounded-md bg-neutral-100 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-200 transition-colors"
            >
              <ChevronLeft className="w-3 h-3 rotate-90" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="w-5 h-5 rounded-md bg-neutral-100 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-200 transition-colors"
            >
              <ChevronLeft className="w-3 h-3 -rotate-90" />
            </button>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {question.bloom_level && (
            <span className="px-3 py-1.5 bg-neutral-100 text-[#8E94BB] text-[10px] font-bold rounded-full uppercase tracking-widest">
              {BLOOM_PORTUGUESE[question.bloom_level] || question.bloom_level}
            </span>
          )}
          {question.bncc_code && (
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-widest">
              {question.bncc_code}
            </span>
          )}

          <AIRewritePanel
            questionId={question.id}
            subject={subject}
            grade={grade}
            onRewritten={onUpdate}
          />

          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-red-50 text-red-400 border border-red-100 hover:bg-red-100 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question content — inline editable */}
      <div className="text-[18px] font-semibold text-[#1A1D2F] leading-relaxed mb-8">
        <InlineEdit
          value={question.content}
          onSave={v => updateField('content', v)}
          multiline
        />
      </div>

      {/* Options */}
      {question.options && (
        <div className="space-y-2.5 max-w-2xl mb-6">
          {question.options.map(opt => (
            <div
              key={opt.letter}
              className={cn(
                'flex items-center gap-3 p-3.5 rounded-2xl border transition-all',
                opt.is_correct
                  ? 'border-emerald-500 bg-emerald-50/30'
                  : 'border-[#F0F1F7] bg-white hover:border-[#8E94BB]'
              )}
            >
              {/* Correct toggle */}
              <button
                onClick={() => setCorrectOption(opt.letter)}
                className={cn(
                  'w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 transition-all border',
                  opt.is_correct
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-[#8E94BB] border-[#E9EAF2] hover:border-emerald-400 hover:text-emerald-500'
                )}
                title="Clique para marcar como correta"
              >
                {isVF ? (opt.text === 'Verdadeiro' ? 'V' : 'F') : opt.letter}
              </button>

              {/* Option text — inline editable */}
              <span className={cn(
                'flex-1 text-[14px] leading-snug',
                opt.is_correct ? 'text-emerald-700 font-bold' : 'text-[#1A1D2F] font-medium'
              )}>
                {isVF ? (
                  opt.text
                ) : (
                  <InlineEdit
                    value={opt.text}
                    onSave={v => updateOption(opt.letter, v)}
                  />
                )}
              </span>

              {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
            </div>
          ))}
        </div>
      )}

      {/* Explanation — inline editable */}
      {question.explanation && (
        <div className="p-5 rounded-2xl bg-neutral-50 border border-[#E9EAF2]">
          <div className="flex items-center gap-2 mb-2 text-[#4F46E5]">
            <Info className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Gabarito Comentado</span>
          </div>
          <p className="text-[13px] text-[#8E94BB] leading-relaxed">
            <InlineEdit
              value={question.explanation}
              onSave={v => updateField('explanation', v)}
              multiline
            />
          </p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Editor Page
// ─────────────────────────────────────────────
export default function ExamEditorPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function load() {
      const { data: examData } = await supabase
        .from('exams')
        .select('*')
        .eq('id', id)
        .single()

      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', id)
        .order('order_index', { ascending: true })

      setExam(examData)
      setQuestions(questionsData || [])
      setLoading(false)
    }
    load()
  }, [id])

  // Auto-save com debounce ao atualizar questão
  async function handleUpdateQuestion(updated: Question) {
    setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q))
    setSavingId(updated.id)
    setSaveStatus('saving')

    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('questions')
          .update({
            content:     updated.content,
            options:     updated.options,
            answer:      updated.answer,
            explanation: updated.explanation,
          })
          .eq('id', updated.id)

        if (error) throw error
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch {
        setSaveStatus('error')
      } finally {
        setSavingId(null)
      }
    }, 800)
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!confirm('Remover esta questão da prova?')) return
    setQuestions(prev => prev.filter(q => q.id !== questionId))
    await supabase.from('questions').delete().eq('id', questionId)
  }

  function moveQuestion(index: number, direction: 'up' | 'down') {
    const newList = [...questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newList.length) return
    ;[newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]]
    setQuestions(newList)
    // Salva os order_index atualizados
    newList.forEach(async (q, i) => {
      await supabase.from('questions').update({ order_index: i }).eq('id', q.id)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin mx-auto mb-4" />
          <p className="text-[#8E94BB] font-medium">Carregando editor...</p>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="p-20 text-center text-[#8E94BB]">
        Prova não encontrada
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between mb-10 sticky top-0 bg-[#F8F9FE]/90 backdrop-blur-sm py-4 z-30">
        <div className="flex items-center gap-4">
          <Link
            href={`/provas/${id}`}
            className="flex items-center gap-2 text-[14px] font-bold text-[#8E94BB] hover:text-[#4F46E5] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Link>
          <div>
            <h1 className="text-[22px] font-extrabold text-[#1A1D2F] tracking-tight">{exam.title}</h1>
            <p className="text-[13px] text-[#8E94BB]">{questions.length} questões · {exam.subject} · {exam.grade}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Save status */}
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all',
            saveStatus === 'saving' ? 'bg-amber-50 text-amber-600' :
            saveStatus === 'saved'  ? 'bg-emerald-50 text-emerald-600' :
            saveStatus === 'error'  ? 'bg-red-50 text-red-500' :
            'opacity-0'
          )}>
            {saveStatus === 'saving' && <><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</>}
            {saveStatus === 'saved'  && <><Check className="w-3 h-3" /> Salvo</>}
            {saveStatus === 'error'  && <><X className="w-3 h-3" /> Erro ao salvar</>}
          </div>

          <Link
            href={`/provas/${id}`}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1D2F] text-white rounded-full font-bold text-[13px] hover:scale-105 transition-all shadow-lg shadow-neutral-200"
          >
            <Save className="w-4 h-4" />
            Finalizar Edição
          </Link>
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 mb-8">
        <Brain className="w-4 h-4 text-[#4F46E5] shrink-0" />
        <p className="text-[13px] text-[#4F46E5]/80">
          <strong>Modo de Edição</strong> — Clique em qualquer texto para editar inline. Use o botão
          {' '}<em>Reescrever com IA</em> para pedir à IA que ajuste o nível ou linguagem da questão.
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-5">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            total={questions.length}
            subject={exam.subject}
            grade={exam.grade}
            onUpdate={handleUpdateQuestion}
            onDelete={() => handleDeleteQuestion(q.id)}
            onMoveUp={() => moveQuestion(idx, 'up')}
            onMoveDown={() => moveQuestion(idx, 'down')}
            saving={savingId === q.id}
          />
        ))}
      </div>

      {/* Rodapé de status */}
      <div className="mt-10 text-center">
        <p className="text-[13px] text-[#8E94BB]">
          {questions.length} questões • Edições salvas automaticamente
        </p>
      </div>
    </div>
  )
}
