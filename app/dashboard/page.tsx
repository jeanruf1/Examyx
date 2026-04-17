import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  FileText, ChevronRight, 
  Search, SlidersHorizontal, 
  BrainCircuit, BookOpen, Clock,
  MoreVertical, Star, ArrowRight,
  Archive, Camera
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import DashboardActions from '@/components/dashboard/DashboardActions'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, organizations(name, plan, trial_ends_at)')
    .eq('id', user?.id)
    .single()

  const { count: examCount } = await supabase
    .from('exams')
    .select('*', { count: 'exact', head: true })

  const { count: questionCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })

  const { count: docCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })

  const { data: recentExams } = await supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="max-w-[1200px] mx-auto pb-20 animate-fade-in">
      
      {/* Header with Actions */}
      <div className="flex items-start justify-between mb-12">
        <div>
          <h2 className="text-[14px] font-bold text-[#4F46E5] uppercase tracking-[0.15em] mb-1">Início</h2>
          <h1 className="text-[36px] font-bold text-[#1A1D2F] tracking-tight">Olá, {firstName}</h1>
          <p className="text-[#8E94BB] text-[16px]">{profile?.organizations?.name}</p>
        </div>
        <DashboardActions />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="rabbu-card p-6 flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-[#4F46E5]" />
           </div>
           <div>
              <p className="text-[24px] font-bold text-[#1A1D2F]">{examCount || 0}</p>
              <p className="text-[13px] font-bold text-[#8E94BB] uppercase">Provas Geradas</p>
           </div>
        </div>
        <div className="rabbu-card p-6 flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <BrainCircuit className="w-6 h-6 text-emerald-600" />
           </div>
           <div>
              <p className="text-[24px] font-bold text-[#1A1D2F]">{questionCount || 0}</p>
              <p className="text-[13px] font-bold text-[#8E94BB] uppercase">Questões Criadas</p>
           </div>
        </div>
        <div className="rabbu-card p-6 flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-amber-600" />
           </div>
           <div>
              <p className="text-[24px] font-bold text-[#1A1D2F]">{docCount || 0}</p>
              <p className="text-[13px] font-bold text-[#8E94BB] uppercase">Materiais Ativos</p>
           </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between mb-8 gap-6 bg-white p-2 rounded-[20px] border border-[#E9EAF2] shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E94BB]" />
          <input 
            type="text" 
            placeholder="Pesquisar em sua biblioteca de provas..." 
            className="w-full bg-transparent border-none focus:ring-0 pl-12 h-12 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 pr-2">
          <div className="flex bg-[#F8F9FE] p-1 rounded-[12px] gap-1 mr-2">
            <button className="px-4 py-1.5 bg-white text-[#4F46E5] rounded-[9px] text-xs font-bold shadow-sm">Ativas</button>
            <button className="px-4 py-1.5 text-[#8E94BB] text-xs font-bold">Histórico</button>
          </div>
          <button className="btn-rabbu-secondary h-10 px-4 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
          </button>
        </div>
      </div>

      {/* List Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[20px] font-bold text-[#1A1D2F]">Provas Recentes</h2>
      </div>

      {/* Exam List */}
      <div className="space-y-4">
        {recentExams?.map(exam => (
          <Link key={exam.id} href={`/provas/${exam.id}`}
            className="rabbu-card p-6 flex items-center gap-8 group hover:rabbu-card-active">
            
            <div className="w-[110px] h-[80px] rounded-xl bg-neutral-50 flex-shrink-0 flex items-center justify-center border border-[#E9EAF2] group-hover:border-transparent transition-all">
              <FileText className="w-8 h-8 text-[#8E94BB] group-hover:scale-110 transition-transform" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-bold text-[#1A1D2F] truncate group-hover:text-[#4F46E5] transition-colors mb-1">{exam.title}</h3>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-medium text-[#8E94BB]">{exam.subject}</span>
                <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
                <span className="text-[13px] font-medium text-[#8E94BB]">{exam.grade}</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-12 px-12 border-x border-[#F0F1F7]">
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#1A1D2F] capitalize">{exam.difficulty}</p>
                <p className="text-[11px] text-[#8E94BB] uppercase font-bold tracking-widest">Dificuldade</p>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-bold text-[#1A1D2F]">{exam.estimated_time_min}m</p>
                <p className="text-[11px] text-[#8E94BB] uppercase font-bold tracking-widest">Duração</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className={cn(
                "badge-rabbu",
                exam.status === 'published' ? "bg-emerald-50 text-emerald-600" : "bg-neutral-50 text-neutral-400"
              )}>
                {exam.status === 'published' ? 'Ativa' : 'Rascunho'}
              </div>
              <div className="w-10 h-10 rounded-full border border-[#E9EAF2] flex items-center justify-center group-hover:bg-[#4F46E5] group-hover:border-[#4F46E5] transition-all">
                <ArrowRight className="w-4 h-4 text-[#8E94BB] group-hover:text-white transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
