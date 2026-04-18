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
import DashboardFilters from '@/components/dashboard/DashboardFilters'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, org_id, organizations(id, name, plan, trial_ends_at, monthly_token_limit)')
    .eq('id', user?.id)
    .single()

  const orgId = profile?.org_id
  const tokenLimit = (profile?.organizations as any)?.monthly_token_limit || 50000

  // Buscar uso total de tokens da organização
  const { data: usageData } = await supabase
    .from('token_usage')
    .select('tokens_total')
    .eq('org_id', orgId)

  const totalUsed = usageData?.reduce((acc, curr) => acc + (curr.tokens_total || 0), 0) || 0
  const remaining = Math.max(tokenLimit - totalUsed, 0)
  const pctUsed = Math.min((totalUsed / tokenLimit) * 100, 100)
  
  // Média estimada: 40k tokens por prova (OCR + Geração + Refinamento)
  const estExams = Math.floor(remaining / 40000)

  // Consulta base para provas recentes com filtros
  let query = supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  // Filtro de Busca
  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  // Filtro de Status
  if (status === 'archived') {
    query = query.eq('status', 'archived')
  } else {
    // Por padrão mostra publicados e rascunhos que não estão arquivados
    query = query.neq('status', 'archived')
  }

  const { data: recentExams } = await query

  const { count: examCount } = await supabase
    .from('exams')
    .select('*', { count: 'exact', head: true })

  const { count: questionCount } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })

  const { count: docCount } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })

  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <div className="max-w-[1200px] mx-auto pb-20 animate-fade-in">
      
      {/* Header with Actions */}
      <div className="flex items-start justify-between mb-12">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[14px] font-bold text-[#4F46E5] uppercase tracking-[0.15em]">Início</h2>
            <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
            <p className="text-[#8E94BB] text-[13px] font-medium">{(profile?.organizations as any)?.name}</p>
          </div>
          <h1 className="text-[36px] font-bold text-[#1A1D2F] tracking-tight">Olá, {firstName}</h1>
        </div>
        <DashboardActions />
      </div>

      {/* Cota e Avisos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        {/* Widget de Saldo IA */}
        <div className="lg:col-span-8 rabbu-card p-8 bg-[#1A1D2F] text-white overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <BrainCircuit className="w-40 h-40 text-white" />
           </div>
           
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-xl font-bold mb-1">Saldo de IA da Instituição</h3>
                    <p className="text-white/40 text-[13px]">Consumo compartilhado entre todos os professores.</p>
                 </div>
                 <div className="text-right">
                    <p className="text-2xl font-bold text-white">{estExams} Provas</p>
                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Capacidade Restante</p>
                 </div>
              </div>

              <div className="mb-4">
                 <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider mb-2">
                    <span className="text-white/40">Uso Atual</span>
                    <span className={cn(pctUsed > 80 ? "text-rose-400" : "text-indigo-400")}>
                       {totalUsed.toLocaleString('pt-BR')} / {tokenLimit.toLocaleString('pt-BR')} TOKENS
                    </span>
                 </div>
                 <div className="h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        pctUsed > 80 ? "bg-rose-500" : "bg-indigo-500"
                      )} 
                      style={{ width: `${pctUsed}%` }} 
                    />
                 </div>
              </div>
              <p className="text-[12px] text-white/30 italic">* A capacidade restante é baseada na média de tokens por prova gerada.</p>
           </div>
        </div>

        {/* Notificações Curtas */}
        <div className="lg:col-span-4 rabbu-card p-8 bg-white border border-[#E9EAF2] flex flex-col">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                 <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-bold text-[#1A1D2F]">Avisos</h3>
           </div>
           <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <p className="text-[#8E94BB] text-[13px] leading-relaxed">
                Nenhuma notificação importante da instituição para hoje.
              </p>
           </div>
           <button className="w-full py-3 mt-6 text-[12px] font-bold text-[#4F46E5] border border-indigo-100 rounded-xl hover:bg-indigo-50 transition-all">
              Ver Histórico
           </button>
        </div>
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
      <DashboardFilters />

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
