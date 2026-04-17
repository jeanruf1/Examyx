'use client'

import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ChevronLeft, Printer, Download, Edit3, 
  Brain, CheckCircle2, Info, Star,
  Clock, Hash, MoreHorizontal, Sparkles, X, Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Estilos para impressão da pílula
const PRINT_STYLES = `
  @media print {
    body * { visibility: hidden; }
    .printable-pill, .printable-pill * { visibility: visible; }
    .printable-pill {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: auto;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .no-print { display: none !important; }
    .printable-pill .bg-[#4F46E5] {
      background-color: #f3f4f6 !important;
      color: #000 !important;
      border-bottom: 2pt solid #000 !important;
    }
    .printable-pill .text-white\\/70 { color: #555 !important; }
    .printable-pill .fill-white\\/20 { display: none !important; }
    .printable-pill button { display: none !important; }
  }
`

// Mapeador inverso para exibir Bloom em português no preview
const BLOOM_PORTUGUESE: Record<string, string> = {
  memorization: 'Lembrar',
  comprehension: 'Compreender',
  application: 'Aplicar',
  analysis: 'Analisar',
  evaluation: 'Avaliar',
  synthesis: 'Criar'
}

export default function ExamPreviewPage() {
  const { id } = useParams()
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pillLoading, setPillLoading] = useState(false)
  const [pillData, setPillData] = useState<any>(null)
  const supabase = createClient()

  async function generateReviewPill() {
    setPillLoading(true)
    try {
      const res = await fetch('/api/ai/review-pill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId: id }),
      })
      const data = await res.json()
      setPillData(data)
    } catch (e) {
      console.error(e)
    } finally {
      setPillLoading(false)
    }
  }

  function openPDF(withKey = false, shuffle = false) {
    window.open(`/api/pdf/export?examId=${id}${withKey ? '&key=true' : ''}${shuffle ? '&shuffle=true' : ''}`, '_blank')
  }

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
      <style>{PRINT_STYLES}</style>
      
      {/* Left Side: Questions List */}
      <div className="flex-1 space-y-6 pb-20">
        <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard" className="flex items-center gap-2 text-[14px] font-bold text-[#8E94BB] hover:text-[#4F46E5] transition-colors">
               <ChevronLeft className="w-4 h-4" />
               Voltar
            </Link>
            <div className="flex items-center gap-3">
               <Link
                 href={`/provas/${id}/editor`}
                 className="flex items-center gap-2 px-6 py-2 bg-white border border-[#E9EAF2] text-[#1A1D2F] rounded-full font-bold text-[13px] hover:border-[#1A1D2F] transition-all"
               >
                 <Edit3 className="w-4 h-4" />
                 Editar Questões
               </Link>
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
                <span className="w-12 h-12 rounded-[18px] bg-[#F8F9FE] text-[#1A1D2F] flex items-center justify-center font-bold text-xl border border-[#E9EAF2] group-hover:bg-[#4F46E5] group-hover:text-white transition-all">
                  {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  {q.bloom_level && (
                    <span className="px-3 py-1.5 bg-neutral-100 text-[#8E94BB] text-[10px] font-bold rounded-full uppercase tracking-widest">
                      {BLOOM_PORTUGUESE[q.bloom_level] || q.bloom_level}
                    </span>
                  )}
                  {q.bncc_code && <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-widest">{q.bncc_code}</span>}
                </div>
              </div>

              <div className="text-[19px] font-semibold text-[#1A1D2F] leading-relaxed mb-10">
                {q.content}
              </div>

              {q.options && (
                <div className="space-y-3 max-w-2xl">
                  {q.options.map((opt: any) => {
                    const isVF = opt.text === 'Verdadeiro' || opt.text === 'Falso'
                    return (
                      <div key={opt.letter} className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                        opt.is_correct 
                          ? "border-emerald-500 bg-emerald-50/30" 
                          : "border-[#F0F1F7] bg-white"
                      )}>
                        <span className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 transition-all",
                          opt.is_correct 
                            ? "bg-emerald-500 text-white" 
                            : "bg-neutral-50 text-[#8E94BB] border border-[#E9EAF2]"
                        )}>
                          {isVF ? (
                            opt.text === 'Verdadeiro' ? 'V' : 'F'
                          ) : opt.letter}
                        </span>
                        <span className={cn(
                          "text-[15px] leading-snug",
                          opt.is_correct ? "text-emerald-700 font-bold" : "text-[#1A1D2F] font-medium"
                        )}>
                          {opt.text}
                        </span>
                        {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
                      </div>
                    )
                  })}
                </div>
              )}

              {q.explanation && (
                <div className="mt-8 p-6 rounded-3xl bg-neutral-50 border border-[#E9EAF2]">
                   <div className="flex items-center gap-2 mb-2 text-[#4F46E5]">
                      <Info className="w-4 h-4" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Gabarito Comentado</span>
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
                  <span className="text-[11px] font-bold text-[#4F46E5] uppercase tracking-wider">Parecer da IA</span>
               </div>
               <p className="text-[13px] text-[#4F46E5]/70 leading-relaxed italic">
                 {exam.pedagogical_warning || "Avaliação estruturada conforme diretrizes BNCC."}
               </p>
            </div>

            <div className="space-y-4 pt-4">
               <button
                 onClick={() => openPDF(false)}
                 className="w-full h-14 bg-[#1A1D2F] text-white rounded-full font-bold text-[15px] flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-neutral-200"
               >
                 <Printer className="w-5 h-5" />
                 Imprimir Prova
               </button>
               <button
                 onClick={() => openPDF(true)}
                 className="w-full h-14 bg-[#4F46E5] text-white rounded-full font-bold text-[15px] flex items-center justify-center gap-3 hover:scale-105 transition-all shadow-xl shadow-indigo-500/20"
               >
                 <Download className="w-5 h-5" />
                 Baixar com Gabarito
               </button>

               <div className="grid grid-cols-2 gap-3">
                 <button
                   onClick={() => openPDF(false, true)}
                   className="h-14 bg-white border border-[#E9EAF2] text-[#1A1D2F] rounded-full font-bold text-[13px] flex items-center justify-center gap-2 hover:border-[#1A1D2F] transition-all"
                 >
                   Versão B
                 </button>
                 <button
                   onClick={generateReviewPill}
                   disabled={pillLoading}
                   className="h-14 bg-indigo-50 text-[#4F46E5] rounded-full font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all disabled:opacity-50"
                 >
                   {pillLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                   Pílula
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* Modal da Pílula de Revisão */}
        {pillData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#1A1D2F]/60 backdrop-blur-sm animate-in fade-in duration-300 no-print">
            <div className="bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 printable-pill">
              <div className="bg-[#4F46E5] p-10 text-white relative">
                <button 
                  onClick={() => setPillData(null)}
                  className="absolute top-8 right-8 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <Sparkles className="w-8 h-8 mb-6 fill-white/20" />
                <h3 className="text-[26px] font-extrabold tracking-tight mb-2">{pillData.title}</h3>
                <p className="text-white/70 text-[14px]">Sua dose diária de conhecimento para gabaritar!</p>
              </div>

              <div className="p-10 space-y-8 overflow-y-auto max-h-[60vh]">
                <div>
                  <h4 className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-[0.2em] mb-4">Conceitos Essenciais</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {pillData.essential_concepts.map((c: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-[#F8F9FE] border border-[#E9EAF2]">
                        <div className="w-5 h-5 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i+1}</div>
                        <p className="text-[14px] text-[#1A1D2F] font-medium">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[12px] font-bold text-[#8E94BB] uppercase tracking-[0.2em] mb-4">Dicas de Mestre</h4>
                  <div className="space-y-4">
                    {pillData.quick_tips.map((t: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-[14px] text-[#1A1D2F] leading-relaxed">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100">
                  <h4 className="text-[12px] font-bold text-[#4F46E5] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> Desafio de Reflexão
                  </h4>
                  <p className="text-[14px] text-[#4F46E5] leading-relaxed font-medium">{pillData.challenge}</p>
                </div>
              </div>

              <div className="p-8 border-t border-[#E9EAF2] bg-[#F8F9FE] flex gap-4">
                 <button 
                   onClick={() => window.print()} 
                   className="flex-1 h-12 bg-[#1A1D2F] text-white rounded-full font-bold text-[14px] flex items-center justify-center gap-2"
                 >
                   <Printer className="w-4 h-4" /> Imprimir Pílula
                 </button>
                 <button 
                   onClick={() => setPillData(null)}
                   className="px-8 h-12 bg-white border border-[#E9EAF2] text-[#8E94BB] rounded-full font-bold text-[14px]"
                 >
                   Fechar
                 </button>
              </div>
            </div>
          </div>
        )}

        {/* Pro Plan Upsell Card */}
        <div className="p-8 rounded-[40px] bg-[#4F46E5] text-white relative overflow-hidden group">
          <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full" />
          <Star className="w-6 h-6 mb-4 fill-white text-white" />
          <h4 className="text-[18px] font-bold mb-2">Plano Trial</h4>
          <p className="text-white/70 text-[13px] mb-6 leading-relaxed">Sua licença expira em breve. Migre para o Pro para manter seu banco de questões.</p>
          <button className="w-full py-3 bg-white text-[#4F46E5] rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all">
            Assinar agora
          </button>
        </div>
      </div>
    </div>
  )
}
