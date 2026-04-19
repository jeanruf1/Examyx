import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FileText, ChevronRight,
  Search, SlidersHorizontal,
  BrainCircuit, BookOpen, Clock,
  MoreVertical, Star, ArrowRight,
  Archive, Camera, AlertTriangle, Bell
} from 'lucide-react'
import { PLAN_LIMITS, AVG_TOKENS_PER_EXAM } from '@/lib/config/plans'
import { formatDate, cn } from '@/lib/utils'
import DashboardActions from '@/components/dashboard/DashboardActions'
import DashboardFilters from '@/components/dashboard/DashboardFilters'
import ExamList from '@/components/dashboard/ExamList'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; subject?: string }>
}) {
  const { q, status, subject } = await searchParams
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

  // Filtro de Matéria
  if (subject && subject !== 'Todos') {
    query = query.eq('subject', subject)
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

  // Lógica de Alerta de Cota
  let quotaAlert = null
  if (remaining <= 0) {
    quotaAlert = { type: 'error', message: 'Cota de IA esgotada! Fale com a coordenação para expandir o limite.', icon: AlertTriangle, bg: 'bg-rose-50 border-rose-100 text-rose-600' }
  } else if (remaining < 5000) {
    quotaAlert = { type: 'urgent', message: 'Sua cota de IA está quase no fim.', icon: Bell, bg: 'bg-amber-50 border-amber-100 text-amber-600' }
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-20 animate-fade-in">

      {/* Alerta de Cota Dinâmico */}
      {quotaAlert && (
        <div className={cn("mb-8 p-4 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm", quotaAlert.bg)}>
          <quotaAlert.icon className="w-5 h-5 flex-shrink-0" />
          <p className="text-[13px] font-bold tracking-tight">{quotaAlert.message}</p>
        </div>
      )}

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

      {/* Cota e Capacidade */}
      <div className="mb-12">
        <div className="rabbu-card p-8 bg-white border border-[#E9EAF2] relative overflow-hidden group">
          {/* Background Decoration */}
          <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <BrainCircuit className="w-64 h-64 text-[#4F46E5]" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#1A1D2F]">Saldo de Inteligência Artificial</h3>
                  <p className="text-[#8E94BB] text-[13px]">Limite mensal compartilhado com sua instituição.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                  <span className="text-[#8E94BB]">Consumo da Escola</span>
                  <span className="text-[#1A1D2F]">
                    {totalUsed.toLocaleString('pt-BR')} <span className="text-[#D1D5DB]">/</span> {tokenLimit.toLocaleString('pt-BR')} tokens
                  </span>
                </div>
                <div className="h-2 bg-neutral-50 rounded-full overflow-hidden border border-[#F0F1F7]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      pctUsed > 90 ? "bg-rose-500" : "bg-[#4F46E5]"
                    )}
                    style={{ width: `${pctUsed}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#8E94BB] italic font-medium">
                  * Estimativa baseada em um consumo médio de {AVG_TOKENS_PER_EXAM.toLocaleString('pt-BR')} tokens por prova.
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 bg-indigo-50/50 border border-indigo-100/50 rounded-[24px] p-6 text-center min-w-[200px]">
              <p className="text-[42px] font-black text-[#4F46E5] leading-none mb-2">~{Math.floor(remaining / AVG_TOKENS_PER_EXAM)}</p>
              <p className="text-[11px] font-extrabold text-[#4F46E5] uppercase tracking-[0.15em]">Provas Estimadas</p>
              <div className="mt-4 pt-4 border-t border-indigo-100/50">
                <span className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-widest">Capacidade Mensal</span>
              </div>
            </div>
          </div>
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
      <ExamList initialExams={recentExams || []} />
    </div>
  )
}
