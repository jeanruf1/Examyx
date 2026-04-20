import { createClient } from '@/lib/supabase/server'
import { FileText, Users, Brain, DollarSign, TrendingUp, Activity, AlertTriangle, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    rose: 'bg-rose-500/10 text-rose-400',
    sky: 'bg-sky-500/10 text-sky-400',
  }
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-4', colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[28px] font-extrabold text-white tracking-tight">{value}</p>
      <p className="text-[12px] font-bold text-white/40 uppercase tracking-widest mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-white/30 mt-1">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  // ── Métricas gerais ──────────────────────────────────────
  const [
    { count: totalOrgs },
    { count: totalExams },
    { count: totalQuestions },
    { count: totalDocs },
    { count: totalProfiles },
    { count: errorCount },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('exams').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('documents').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('error_logs').select('*', { count: 'exact', head: true }),
  ])

  // ── Custo total de tokens ────────────────────────────────
  const { data: tokenData } = await supabase
    .from('token_usage')
    .select('cost_usd, tokens_in, tokens_out, created_at')
    .order('created_at', { ascending: false })
    .limit(500)

  const totalCostUsd = tokenData?.reduce((acc, r) => acc + (r.cost_usd || 0), 0) ?? 0
  const totalTokens  = tokenData?.reduce((acc, r) => acc + (r.tokens_in || 0) + (r.tokens_out || 0), 0) ?? 0

  // ── Top escolas por uso ──────────────────────────────────
  const { data: topOrgs } = await supabase
    .from('token_usage')
    .select('org_id, cost_usd, organizations(name)')
    .limit(200)

  const orgCostMap: Record<string, { name: string; cost: number; ops: number }> = {}
  topOrgs?.forEach((r: any) => {
    const orgId = r.org_id
    if (!orgId) return
    if (!orgCostMap[orgId]) orgCostMap[orgId] = { name: r.organizations?.name ?? orgId, cost: 0, ops: 0 }
    orgCostMap[orgId].cost += r.cost_usd || 0
    orgCostMap[orgId].ops  += 1
  })
  const topOrgsList = Object.values(orgCostMap)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 8)

  // ── Atividade recente (exames) ───────────────────────────
  const { data: recentExams } = await supabase
    .from('exams')
    .select('id, title, subject, grade, created_at, organizations(name)')
    .order('created_at', { ascending: false })
    .limit(10)

  // ── Erros recentes ────────────────────────────────────────
  const { data: recentErrors } = await supabase
    .from('error_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  function fmt(d: string) {
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">Painel de Controle</p>
        <h1 className="text-[32px] font-extrabold text-white tracking-tight">Visão Geral</h1>
        <p className="text-white/40 text-[14px]">Métricas em tempo real da plataforma Examyx</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Building2}  label="Escolas"      value={totalOrgs ?? 0}      color="indigo" />
        <StatCard icon={Users}      label="Professores"  value={totalProfiles ?? 0}   color="sky" />
        <StatCard icon={FileText}   label="Provas"       value={totalExams ?? 0}      color="emerald" />
        <StatCard icon={Brain}      label="Questões"     value={totalQuestions ?? 0}  color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Activity}      label="Tokens Usados"  value={totalTokens.toLocaleString('pt-BR')}           color="indigo" />
        <StatCard icon={DollarSign}    label="Custo IA (USD)" value={`$${totalCostUsd.toFixed(4)}`}                  color="rose"   sub="OpenAI API" />
        <StatCard icon={FileText}      label="Documentos RAG" value={totalDocs ?? 0}                                  color="sky" />
        <StatCard icon={AlertTriangle} label="Erros Ativos"   value={errorCount ?? 0}                                 color={errorCount ? 'rose' : 'emerald'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

        {/* Top escolas por custo */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-[14px] font-bold text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Top Escolas por Consumo
          </h3>
          {topOrgsList.length === 0 && (
            <p className="text-white/30 text-[13px]">Nenhum dado disponível ainda.</p>
          )}
          <div className="space-y-3">
            {topOrgsList.map((org, i) => {
              const maxCost = topOrgsList[0]?.cost || 1
              const pct = Math.round((org.cost / maxCost) * 100)
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] text-white/80 font-medium truncate max-w-[180px]">{org.name}</span>
                    <div className="flex items-center gap-3 text-[11px] text-white/40">
                      <span>{org.ops} ops</span>
                      <span className="text-indigo-300 font-bold">${org.cost.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Atividade recente */}
        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h3 className="text-[14px] font-bold text-white mb-5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" /> Provas Recentes
          </h3>
          {(!recentExams || recentExams.length === 0) && (
            <p className="text-white/30 text-[13px]">Nenhuma prova gerada ainda.</p>
          )}
          <div className="space-y-2">
            {recentExams?.map(exam => (
              <div key={exam.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-none">
                <div className="min-w-0">
                  <p className="text-[12px] text-white/80 font-medium truncate">{exam.title}</p>
                  <p className="text-[10px] text-white/30">{(exam.organizations as any)?.name} · {exam.subject}</p>
                </div>
                <span className="text-[10px] text-white/30 ml-4 shrink-0">{fmt(exam.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Erros recentes */}
      {recentErrors && recentErrors.length > 0 && (
        <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/20">
          <h3 className="text-[14px] font-bold text-rose-400 mb-5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Erros Recentes
          </h3>
          <div className="space-y-2">
            {recentErrors.map(err => (
              <div key={err.id} className="flex items-start justify-between py-2 border-b border-white/5 last:border-none gap-4">
                <div>
                  <p className="text-[11px] font-bold text-white/60 uppercase tracking-widest mb-0.5">{err.operation}</p>
                  <p className="text-[12px] text-rose-300/80">{err.error_message}</p>
                </div>
                <span className="text-[10px] text-white/30 shrink-0">{fmt(err.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
