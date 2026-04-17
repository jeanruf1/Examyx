'use client'

import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft, Printer, Download, Edit3, 
  Brain, CheckCircle2, Info, Star,
  Share2, MoreHorizontal, Clock, Hash
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'

export default function ExamPreviewPage() {
  const { id } = useParams()
  const router = useRouter()
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
              <button className="btn-rabbu-secondary py-2 px-4 h-10">
                <Edit3 className="w-4 h-4" />
                Editar
              </button>
              <button className="btn-rabbu py-2 px-4 h-10">
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
           </div>
        </div>

        <div className="mb-10">
          <h1 className="text-[32px] font-bold text-[#1A1D2F] mb-2">{exam.title}</h1>
          <div className="flex items-center gap-4">
             <span className="badge-rabbu bg-indigo-50 text-[#4F46E5]">{exam.subject}</span>
             <span className="text-[14px] text-[#8E94BB]">{exam.grade} • {questions.length} Questões</span>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="rabbu-card p-8 group hover:border-[#4F46E5] transition-all">
              <div className="flex justify-between items-start mb-6">
                <span className="w-10 h-10 rounded-xl bg-[#F5F5FF] text-[#4F46E5] flex items-center justify-center font-bold text-lg">
                  {idx + 1}
                </span>
                <div className="flex gap-2">
                  <span className="px-2 py-1 bg-neutral-100 text-[#8E94BB] text-[10px] font-bold rounded-lg uppercase">{q.bloom_level}</span>
                  {q.bncc_code && <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg">{q.bncc_code}</span>}
                </div>
              </div>

              <div className="text-[17px] font-medium text-[#1A1D2F] leading-relaxed mb-8">
                {q.content}
              </div>

              {q.options && (
                <div className="space-y-3">
                  {q.options.map((opt: any) => (
                    <div key={opt.letter} className={cn(
                      "flex items-start gap-4 p-4 rounded-xl border transition-all",
                      opt.is_correct ? "border-[#4F46E5] bg-[#F5F5FF]" : "border-[#E9EAF2] hover:border-[#8E94BB]"
                    )}>
                      <span className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                        opt.is_correct ? "bg-[#4F46E5] text-white" : "bg-neutral-100 text-[#8E94BB]"
                      )}>
                        {opt.letter}
                      </span>
                      <span className="text-[15px] text-[#1A1D2F] leading-snug">{opt.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Side: Details Panel (Rabbu Style) */}
      <div className="w-[380px] shrink-0 sticky top-6 h-fit space-y-6">
        
        {/* Main Details Panel */}
        <div className="rabbu-card p-8 shadow-xl shadow-indigo-500/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[18px] font-bold text-[#1A1D2F]">Análise da IA</h2>
            <button className="p-2 hover:bg-neutral-50 rounded-full">
               <MoreHorizontal className="w-5 h-5 text-[#8E94BB]" />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
             <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#E9EAF2]">
                <Clock className="w-4 h-4 text-[#4F46E5] mb-2" />
                <p className="text-[18px] font-bold text-[#1A1D2F]">{exam.estimated_time_min}m</p>
                <p className="text-[11px] font-bold text-[#8E94BB] uppercase">Tempo Est.</p>
             </div>
             <div className="p-4 rounded-2xl bg-[#F8F9FE] border border-[#E9EAF2]">
                <Hash className="w-4 h-4 text-[#4F46E5] mb-2" />
                <p className="text-[18px] font-bold text-[#1A1D2F]">{questions.length}</p>
                <p className="text-[11px] font-bold text-[#8E94BB] uppercase">Itens</p>
             </div>
          </div>

          {/* Pedagogical Warning */}
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
               <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-[#4F46E5]" />
                  <span className="text-[12px] font-bold text-[#4F46E5] uppercase tracking-wider">Análise Pedagógica</span>
               </div>
               <p className="text-[13px] text-[#4F46E5]/80 leading-relaxed italic">
                 {exam.pedagogical_warning || "Nenhum alerta para esta prova."}
               </p>
            </div>

            <div className="space-y-4">
               <h4 className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-wider">Ações</h4>
               <button className="w-full btn-rabbu">
                 <Download className="w-4 h-4" />
                 Download PDF
               </button>
               <button className="w-full btn-rabbu-secondary">
                 <Share2 className="w-4 h-4" />
                 Compartilhar Link
               </button>
            </div>
          </div>
        </div>

        {/* Pro Plan Upsell Card */}
        <div className="p-8 rounded-[24px] bg-[#4F46E5] text-white relative overflow-hidden group">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full" />
          <Star className="w-6 h-6 mb-4 fill-white text-white" />
          <h4 className="text-[18px] font-bold mb-2">Plano Trial</h4>
          <p className="text-white/70 text-[13px] mb-6 leading-relaxed">Seu plano expira em 7 dias. Migre para o Pro para manter sua biblioteca ilimitada.</p>
          <button className="w-full py-3 bg-white text-[#4F46E5] rounded-[14px] font-bold text-sm hover:bg-indigo-50 transition-colors">
            Assinar agora
          </button>
        </div>
      </div>
    </div>
  )
}
