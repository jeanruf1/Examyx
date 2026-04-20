import { createClient } from '@/lib/supabase/server'
import { 
  BarChart3, Clock, DollarSign, 
  ArrowUpDown, Cpu, TrendingUp,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function AdminUsagePage() {
  const supabase = await createClient()

  // Buscar dados reais - Aumentando o limite para garantir soma correta
  const { data: logs, error } = await supabase
    .from('token_usage')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) {
    console.error('Erro ao buscar token_usage:', error)
  }

  const tokenLogs = logs || []
  
  // Totais baseados em todos os logs carregados
  const totalSpent = tokenLogs.reduce((acc, log) => acc + (Number(log.cost_usd) || 0), 0)
  const totalTokens = tokenLogs.reduce((acc, log) => acc + (log.tokens_in || 0) + (log.tokens_out || 0), 0)
  const totalCalls = tokenLogs.length

  function fmt(d: string) {
    return new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="max-w-[1200px] mx-auto pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">Financeiro & Consumo</p>
        <h1 className="text-[32px] font-extrabold text-white tracking-tight">Consumo de IA</h1>
        <p className="text-white/40 text-[14px]">Detalhamento de gastos da tabela oficial token_usage</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white/5 border border-white/10 rounded-[24px] p-8">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-6">
            <DollarSign className="w-5 h-5 text-rose-400" />
          </div>
          <p className="text-[28px] font-bold text-white mb-1">${totalSpent.toFixed(4)}</p>
          <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">Gasto Total (USD)</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[24px] p-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center mb-6">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-[28px] font-bold text-white mb-1">{totalTokens.toLocaleString('pt-BR')}</p>
          <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">Tokens Utilizados</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[24px] p-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-[28px] font-bold text-white mb-1">{tokenLogs.length}</p>
          <p className="text-white/30 text-[11px] font-bold uppercase tracking-widest">Total de Chamadas</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-[14px] font-bold text-white">Histórico de Transações</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.01]">
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-widest">Operação / Modelo</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-widest">Tokens (In/Out)</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-widest text-right">Custo USD</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/30 uppercase tracking-widest text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tokenLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-white/20 text-sm">Nenhum registro de uso encontrado.</td>
                </tr>
              ) : (
                tokenLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-[13px] uppercase tracking-tight">{log.operation.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-white/30">{log.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-[13px]">
                      <p className="text-white/80 font-medium">{log.teacher_id ? `Prof: ${log.teacher_id.substring(0, 8)}...` : 'Sistema'}</p>
                      <p className="text-[11px] text-white/30">{log.org_id ? `Org: ${log.org_id.substring(0, 8)}...` : 'Global'}</p>
                    </td>
                    <td className="px-6 py-6 text-xs text-white/60">
                      <span className="font-mono">{log.tokens_in}</span>
                      <span className="mx-2 opacity-30">/</span>
                      <span className="font-mono">{log.tokens_out}</span>
                    </td>
                    <td className="px-6 py-6 text-right font-mono text-sm">
                      <span className="text-rose-400 font-bold">${Number(log.cost_usd).toFixed(5)}</span>
                    </td>
                    <td className="px-6 py-6 text-right text-[11px] text-white/40 font-mono">
                      {fmt(log.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
