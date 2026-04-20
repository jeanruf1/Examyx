'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { PLAN_LIMITS } from '@/lib/config/plans'
import {
  Building2, CheckCircle2, XCircle, MoreVertical,
  Shield, ShieldOff, RefreshCw, Users, FileText, Loader2, Plus, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'

const PLAN_COLORS: Record<string, string> = {
  trial:      'bg-amber-500/15 text-amber-300 border-amber-500/20',
  basic:      'bg-sky-500/15 text-sky-300 border-sky-500/20',
  pro:        'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  enterprise: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
}

const PLAN_ORDER = ['trial', 'basic', 'pro', 'enterprise']

export default function AdminTenantsPage() {
  const supabase = createClient()
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newSchool, setNewSchool] = useState({ name: '', slug: '', plan: 'trial', contact_email: '' })
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function load() {
    setLoading(true)
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('*, profiles(count)')
      .order('created_at', { ascending: false })
    
    const { data: usageData } = await supabase
      .from('token_usage')
      .select('org_id, cost_usd, tokens_total')

    const usageMap: Record<string, { cost: number; tokens: number }> = {}
    usageData?.forEach(u => {
      if (!u.org_id) return
      if (!usageMap[u.org_id]) usageMap[u.org_id] = { cost: 0, tokens: 0 }
      usageMap[u.org_id].cost += Number(u.cost_usd) || 0
      usageMap[u.org_id].tokens += u.tokens_total || 0
    })

    const enrichedOrgs = orgsData?.map(org => ({
      ...org,
      usage: usageMap[org.id] || { cost: 0, tokens: 0 }
    }))

    setOrgs(enrichedOrgs || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleBlock(org: any) {
    setActionId(org.id)
    await supabase
      .from('organizations')
      .update({ is_blocked: !org.is_blocked })
      .eq('id', org.id)
    await load()
    setActionId(null)
  }

  async function resetTrial(org: any) {
    setActionId(org.id)
    const newEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    await supabase
      .from('organizations')
      .update({ plan: 'trial', trial_ends_at: newEnd })
      .eq('id', org.id)
    await load()
    setActionId(null)
  }

  async function upgradePlan(org: any, plan: string) {
    setActionId(org.id)
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 50000
    const { error } = await supabase
      .from('organizations')
      .update({ plan, monthly_token_limit: limit })
      .eq('id', org.id)
    
    if (!error) await load()
    setActionId(null)
  }

  async function handleCreateSchool(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const limit = PLAN_LIMITS[newSchool.plan as keyof typeof PLAN_LIMITS] || 50000
    const { error } = await supabase
      .from('organizations')
      .insert({
        ...newSchool,
        monthly_token_limit: limit,
        trial_ends_at: newSchool.plan === 'trial' 
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() 
          : null
      })

    if (!error) {
      setIsCreateModalOpen(false)
      setNewSchool({ name: '', slug: '', plan: 'trial', contact_email: '' })
      await load()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!deleteId) return
    setIsDeleting(true)
    try {
      const res = await fetch('/api/admin/tenants/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: deleteId })
      })
      if (res.ok) {
        await load()
      } else {
        const err = await res.json()
        alert('Erro ao excluir: ' + err.error)
      }
    } catch (err: any) {
      alert('Erro crítico ao excluir: ' + err.message)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading && !isCreateModalOpen) return (
    <div className="flex items-center justify-center h-[60vh]">
      <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
    </div>
  )

  return (
    <div className="max-w-[1100px] mx-auto pb-12 animate-fade-in">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-1">Gestão</p>
          <h1 className="text-[32px] font-extrabold text-white tracking-tight">Escolas</h1>
          <p className="text-white/40 text-[14px]">{orgs.length} tenants ativos na plataforma</p>
        </div>

        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="h-12 px-6 bg-indigo-500 text-white rounded-xl font-bold text-[13px] flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest"
        >
          <Plus className="w-5 h-5" />
          Nova Escola
        </button>
      </div>

      {/* Create School Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
          <div className="w-full max-w-[450px] bg-[#1A1D2F] rounded-[40px] shadow-2xl border border-white/10 p-10 animate-scale-in">
            <h2 className="text-[24px] font-black text-white mb-2 tracking-tight">Nova Escola</h2>
            <p className="text-white/40 text-[14px] mb-8 leading-relaxed">Cadastre uma nova instituição para liberar acessos.</p>

            <form onSubmit={handleCreateSchool} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">Nome da Instituição</label>
                <input 
                  required
                  value={newSchool.name}
                  onChange={e => setNewSchool({...newSchool, name: e.target.value})}
                  placeholder="Ex: Colégio Objetivo"
                  className="w-full h-14 px-5 bg-white/[0.03] border border-white/10 rounded-2xl text-[15px] text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">Identificador (Slug)</label>
                <input 
                  required
                  value={newSchool.slug}
                  onChange={e => setNewSchool({...newSchool, slug: e.target.value.toLowerCase().replace(/\s/g, '-')})}
                  placeholder="ex: colegio-objetivo"
                  className="w-full h-14 px-5 bg-white/[0.03] border border-white/10 rounded-2xl text-[15px] text-white font-mono focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">Plano Inicial</label>
                  <select 
                    value={newSchool.plan}
                    onChange={e => setNewSchool({...newSchool, plan: e.target.value})}
                    className="w-full h-14 px-4 bg-white/[0.03] border border-white/10 rounded-2xl text-[13px] text-white focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    {PLAN_ORDER.map(p => (
                      <option key={p} value={p} className="bg-[#1A1D2F]">{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">E-mail Contato</label>
                  <input 
                    type="email"
                    value={newSchool.contact_email}
                    onChange={e => setNewSchool({...newSchool, contact_email: e.target.value})}
                    placeholder="financeiro@..."
                    className="w-full h-14 px-5 bg-white/[0.03] border border-white/10 rounded-2xl text-[15px] text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 h-14 bg-white/5 text-white/40 rounded-2xl font-bold text-[13px] hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  disabled={loading}
                  className="flex-[2] h-14 bg-indigo-500 text-white rounded-2xl font-bold text-[13px] hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 uppercase tracking-widest"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar Instituição'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {orgs.map(org => {
          const isBlocked = org.is_blocked
          const trialEnd = org.trial_ends_at ? new Date(org.trial_ends_at) : null
          const daysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / 86_400_000) : null
          const isExpired = daysLeft !== null && daysLeft <= 0
          const busy = actionId === org.id

          return (
            <div
              key={org.id}
              className={cn(
                'p-6 rounded-2xl border transition-all',
                isBlocked
                  ? 'bg-rose-500/5 border-rose-500/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              )}
            >
              <div className="flex items-center justify-between gap-4">
                
                {/* Left: org info */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                    isBlocked ? 'bg-rose-500/20' : 'bg-indigo-500/15'
                  )}>
                    <Building2 className={cn('w-5 h-5', isBlocked ? 'text-rose-400' : 'text-indigo-400')} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[14px] font-bold text-white truncate">{org.name}</h3>
                      {isBlocked && (
                        <span className="text-[9px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Bloqueada
                        </span>
                      )}
                      {isExpired && !isBlocked && (
                        <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Trial Expirado
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/40">
                      <span>{org.slug}</span>
                      <span>·</span>
                      <span>{org.contact_email || 'sem email'}</span>
                      {daysLeft !== null && daysLeft > 0 && (
                        <><span>·</span><span className="text-amber-400">{daysLeft}d restantes</span></>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: stats */}
                <div className="hidden lg:flex items-center gap-8 px-8 border-x border-white/10">
                  <div className="text-center">
                    <p className="text-[14px] font-bold text-white">
                      {Array.isArray(org.profiles) ? org.profiles[0]?.count ?? 0 : '—'}
                    </p>
                    <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Logins Ativos</p>
                  </div>
                  
                  <div className="text-center w-24">
                    <p className="text-[14px] font-bold text-rose-400">
                      ${org.usage.cost.toFixed(3)}
                    </p>
                    <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Custo IA</p>
                  </div>

                  <div className="text-center w-32">
                    {(() => {
                      const currentLimit = org.monthly_token_limit || PLAN_LIMITS[org.plan as keyof typeof PLAN_LIMITS] || 50000
                      const usagePct = Math.min((org.usage.tokens / currentLimit) * 100, 100)
                      return (
                        <>
                          <div className="flex items-center justify-between mb-1">
                             <p className="text-[11px] font-bold text-white">{(org.usage.tokens / 1000).toFixed(0)}k</p>
                             <p className="text-[9px] text-white/30">/ {(currentLimit / 1000).toFixed(0)}k</p>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 transition-all" 
                              style={{ width: `${usagePct}%` }} 
                            />
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  <div className="text-center">
                    <span className={cn(
                      'text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest',
                      PLAN_COLORS[org.plan] ?? PLAN_COLORS.trial
                    )}>
                      {org.plan}
                    </span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link 
                    href={`/admin/tenants/${org.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-bold transition-all"
                  >
                    Gerenciar
                  </Link>

                  {/* Upgrade plan selector */}
                  <select
                    disabled={busy}
                    value={org.plan}
                    onChange={e => upgradePlan(org, e.target.value)}
                    className="bg-white/10 text-white/70 border border-white/20 rounded-lg px-2 py-1.5 text-[11px] font-bold focus:outline-none disabled:opacity-50 cursor-pointer"
                  >
                    {PLAN_ORDER.map(p => (
                      <option key={p} value={p} className="bg-[#1a1a2e] text-white">{p}</option>
                    ))}
                  </select>

                  {/* Reset trial */}
                  <button
                    onClick={() => resetTrial(org)}
                    disabled={busy}
                    className="flex items-center justify-center p-2 rounded-lg bg-white/8 text-white/60 hover:text-white hover:bg-white/15 transition-all disabled:opacity-50"
                    title="Reiniciar trial (14 dias)"
                  >
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                  </button>

                  {/* Block/Unblock */}
                  <button
                    onClick={() => toggleBlock(org)}
                    disabled={busy}
                    className={cn(
                      'flex items-center justify-center p-2 rounded-lg transition-all disabled:opacity-50',
                      isBlocked
                        ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                    )}
                  >
                    {isBlocked ? <CheckCircle2 className="w-3 h-3" /> : <ShieldOff className="w-3 h-3" />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteId(org.id)}
                    disabled={busy}
                    className="flex items-center justify-center p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                    title="Excluir instituição permanentemente"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => !isDeleting && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Instituição?"
        description="Esta ação é IRREVERSÍVEL. Todos os professores, provas, questões e documentos ligados a esta escola serão apagados permanentemente."
        confirmText={isDeleting ? 'Excluindo...' : 'Sim, Excluir Tudo'}
        variant="danger"
      />
    </div>
  )
}
