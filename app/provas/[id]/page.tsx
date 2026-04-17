'use client'

import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft, Printer, Download, Edit3, 
  Brain, CheckCircle2, Info, Star,
  Share2, MoreHorizontal, Clock, Hash,
  Eye, EyeOff
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

export default function ExamPreviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showGabarito, setShowGabarito] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: examData } = await supabase
        .from('exams')
        .select('*, organizations(name)')
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
    loadData()
  }, [id])

  if (loading) return <div className="p-20 text-center text-[#8E94BB]">Carregando prova...</div>
  if (!exam) return <div className="p-20 text-center text-[#8E94BB]">Prova não encontrada</div>

  return (
    <div className="max-w-[1400px] mx-auto animate-fade-in flex gap-8">
      
      {/* Left Side: Questions List */}
      <div className="flex-1 space-y-6 pb-20">
        <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-[14px] font-bold text-[#8E94BB] hover:text-[#4F46E5] transition-colors">
               <ChevronLeft className="w-4 h-4" />
               Voltar
            </Link>
            <div className="flex items-center gap-3">
               <button 
                 onClick={() => setShowGabarito(!showGabarito)}
                 className={cn(
                   "flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[13px] transition-all border",
                   showGabarito 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                    : "bg-white text-[#8E94BB] border-[#E9EAF2] hover:border-[#8E94BB]"
                 )}
               >
                 {showGabarito ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                 {showGabarito ? 'Ocultar Gabarito' : 'Ver Gabarito'}
               </button>
               <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E9EAF2] text-[#8E94BB] rounded-full font-bold text-[13px] hover:border-[#8E94BB]">
                 <Edit3 className="w-4 h-4" />
                 Editar
               </button>
               <button className="flex items-center gap-2 px-6 py-2 bg-[#1A1D2F] text-white rounded-full font-bold text-[13px] hover:scale-105 transition-all shadow-lg shadow-neutral-200">
                 <Printer className="w-4 h-4" />
                 Imprimir
               </button>
            </div>
        </div>

        <div className="mb-10">
          <h1 className="text-[32px] font-extrabold text-[#1A1D2F] mb-3 tracking-tight">{exam.title}</h1>
          <div className="flex items-center gap-4">
             <span className="px-3 py-1 bg-indigo-50 text-[#4F46E5] text-[11px] font-bold rounded-full uppercase tracking-wider">{exam.subject}</span>
             <span className="text-[14px] font-medium text-[#8E94BB] flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-[#E9EAF2]" />
               {exam.grade}
               <div className="w-1 h-1 rounded-full bg-[#E9EAF2]" />
               {questions.length} Questões
             </span>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-10 rounded-[40px] bg-white border border-[#E9EAF2] shadow-sm hover:border-[#4F46E5] transition-all group">
              <div className="flex justify-between items-start mb-8">
                <span className="w-12 h-12 rounded-[18px] bg-[#F8F9FE] text-[#1A1D2F] flex items-center justify-center font-bold text-xl border border-[#E9EAF2] group-hover:bg-[#4F46E5] group-hover:text-white transition-all group-hover:rotate-3">
                  {idx + 1}
                </span>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-neutral-100 text-[#8E94BB] text-[10px] font-bold rounded-full uppercase tracking-widest">{q.bloom_level}</span>
                  {q.bncc_code && <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-widest">{q.bncc_code}</span>}
                </div>
              </div>

              <div className="text-[19px] font-semibold text-[#1A1D2F] leading-relaxed mb-10">
                {q.content}
              </div>

              {q.options && (
                <div className="space-y-3 max-w-2xl">
                  {q.options.map((opt: any) => (
                    <div key={opt.letter} className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                      showGabarito && opt.is_correct 
                        ? "border-emerald-500 bg-emerald-50/30" 
                        : "border-[#F0F1F7] hover:border-[#8E94BB] bg-white"
                    )}>
                      <span className={cn(
                        "w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 transition-all",
                        showGabarito && opt.is_correct 
                          ? "bg-emerald-500 text-white" 
                          : "bg-neutral-50 text-[#8E94BB] border border-[#E9EAF2]"
                      )}>
                        {opt.letter}
                      </span>
                      <span className={cn(
                        "text-[15px] leading-snug",
                        showGabarito && opt.is_correct ? "text-emerald-700 font-bold" : "text-[#1A1D2F] font-medium"
                      )}>
                        {opt.text}
                      </span>
                      {showGabarito && opt.is_correct && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                    </div>
                  ))}
                </div>
              )}

              {showGabarito && q.explanation && (
                <div className="mt-8 p-6 rounded-3xl bg-neutral-50 border border-[#E9EAF2] animate-in fade-in slide-in-from-top-2">
                   <div className="flex items-center gap-2 mb-2 text-[#4F46E5]">
                      <Info className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Explicação do Professor</span>
                   </div>
                   <p className="text-[13px] text-[#8E94BB] leading-relaxed">
                     {q.explanation}
                   </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Side Panel */}
      <div className="w-[380px] shrink-0 sticky top-6 h-fit space-y-6">
        <div className="p-8 rounded-[40px] bg-white border border-[#E9EAF2] shadow-xl shadow-indigo-500/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[18px] font-extrabold text-[#1A1D2F]">Resumo Técnico</h2>
            <button className="p-2 hover:bg-neutral-50 rounded-full transition-colors">
               <MoreHorizontal className="w-5 h-5 text-[#8E94BB]" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
             <div className="p-5 rounded-3xl bg-[#F8F9FE] border border-[#E9EAF2]">
                <Clock className="w-4 h-4 text-[#4F46E5] mb-2" />
                <p className="text-[20px] font-bold text-[#1A1D2F]">{exam.estimated_time_min}m</p>
                <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Tempo Est.</p>
             </div>
             <div className="p-5 rounded-3xl bg-[#F8F9FE] border border-[#E9EAF2]">
                <Hash className="w-4 h-4 text-[#4F46E5] mb-2" />
                <p className="text-[20px] font-bold text-[#1A1D2F]">{questions.length}</p>
                <p className="text-[10px] font-bold text-[#8E94BB] uppercase">Total Itens</p>
             </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100">
               <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider">Parecer Pedagógico</span>
               </div>
               <p className="text-[13px] text-[#4F46E5]/70 leading-relaxed italic">
                 {exam.pedagogical_warning || "Avaliação estruturada conforme diretrizes BNCC."}
               </p>
            </div>

            <div className="space-y-4 pt-4">
               <button className="w-full h-14 bg-[#4F46E5] text-white rounded-full font-bold text-[15px] flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-indigo-500/20">
                 <Download className="w-5 h-5" />
                 Gerar PDF Final
               </button>
               <button className="w-full h-14 bg-white border border-[#E9EAF2] text-[#8E94BB] rounded-full font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-neutral-50 transition-all">
                 <Share2 className="w-5 h-5" />
                 Compartilhar
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
