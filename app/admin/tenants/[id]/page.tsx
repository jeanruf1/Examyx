'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, UserPlus, ArrowLeft, Mail, 
  Key, Shield, Trash2, Loader2, CheckCircle2 
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import ConfirmModal from '@/components/ui/ConfirmModal'

export default function TenantDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [tenant, setTenant] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  async function fetchData() {
    try {
      setLoading(true)
      // 1. Escola
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()
      setTenant(org)

      // 2. Usuários
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', id)
        .order('created_at', { ascending: false })
      setUsers(profiles || [])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setIsCreating(true)
    setMsg(null)

    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, orgId: id })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMsg({ type: 'success', text: 'Convite enviado com sucesso!' })
      setEmail('')
      setFullName('')
      fetchData()
      setTimeout(() => setIsAddModalOpen(false), 2000)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setIsCreating(false)
    }
  }

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  async function handleDeleteUser() {
    if (!deletingUserId) return
    
    setIsDeleting(deletingUserId)
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deletingUserId })
      })

      if (!res.ok) throw new Error('Erro ao deletar')
      
      setDeletingUserId(null)
      fetchData()
    } catch (err: any) {
      console.error(err.message)
    } finally {
      setIsDeleting(null)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  )

  return (
    <div className="max-w-[1000px] mx-auto animate-fade-in pb-20">
      <Link href="/admin/tenants" className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors text-[13px] font-bold uppercase tracking-widest">
        <ArrowLeft className="w-4 h-4" />
        Voltar para Escolas
      </Link>

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-[32px] font-black text-white tracking-tight">{tenant?.name}</h1>
          <p className="text-white/40 text-[14px]">Gestão de professores e acessos da instituição.</p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="h-12 px-6 bg-indigo-500 text-white rounded-xl font-bold text-[13px] flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 uppercase tracking-widest"
        >
          <UserPlus className="w-5 h-5" />
          Adicionar Professor
        </button>
      </div>

      {/* Branding Section */}
      <div className="bg-[#1A1D2F] rounded-[32px] border border-[#2A2D3E] p-8 mb-10">
        <div className="flex flex-col md:flex-row gap-10">
          {/* Logo Upload */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Logo da Escola</p>
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-500/50">
                {tenant?.logo_url ? (
                  <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-contain p-4" />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-white/20">
                    <Shield className="w-8 h-8" />
                    <span className="text-[10px] font-bold">SEM LOGO</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      setUploadingLogo(true)
                      setLogoError(null)

                      const fileExt = file.name.split('.').pop()
                      const filePath = `${tenant.id}/logo.${fileExt}`
                      
                      const { data, error: uploadError } = await supabase.storage
                        .from('school-logos')
                        .upload(filePath, file, { upsert: true })
                      
                      if (uploadError) {
                        setLogoError(uploadError.message)
                        setUploadingLogo(false)
                        return
                      }

                      if (data) {
                        const { data: { publicUrl } } = supabase.storage
                          .from('school-logos')
                          .getPublicUrl(filePath)
                        
                        await supabase
                          .from('organizations')
                          .update({ logo_url: publicUrl })
                          .eq('id', tenant.id)
                        
                        fetchData()
                        setUploadingLogo(false)
                      }
                    }}
                  />
                  <span className="text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
                    {uploadingLogo ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Alterar'}
                  </span>
                </label>
              </div>
            </div>
            {logoError && (
              <p className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20">
                {logoError}
              </p>
            )}
          </div>

          {/* School Name Edit */}
          <div className="flex-1 flex flex-col justify-end gap-6">
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">Nome Oficial da Instituição</label>
              <div className="flex gap-3">
                <input 
                  defaultValue={tenant?.name}
                  id="school-name-input"
                  className="flex-1 h-14 px-6 bg-white/[0.03] border border-white/10 rounded-2xl text-[16px] text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button 
                  onClick={async () => {
                    const newName = (document.getElementById('school-name-input') as HTMLInputElement).value
                    await supabase
                      .from('organizations')
                      .update({ name: newName })
                      .eq('id', tenant.id)
                    fetchData()
                  }}
                  className="px-6 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Mini Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-3xl bg-[#1A1D2F] border border-[#2A2D3E]">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Plano Ativo</p>
          <p className="text-[20px] font-black text-indigo-400 capitalize">{tenant?.plan}</p>
        </div>
        <div className="p-6 rounded-3xl bg-[#1A1D2F] border border-[#2A2D3E]">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Logins Ativos</p>
          <p className="text-[20px] font-black text-white">{users.length}</p>
        </div>
        <div className="p-6 rounded-3xl bg-[#1A1D2F] border border-[#2A2D3E]">
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">ID da Escola</p>
          <p className="text-[13px] font-mono text-white/20 truncate">{tenant?.id}</p>
        </div>
      </div>

      <div className="bg-[#1A1D2F] rounded-[32px] border border-[#2A2D3E] overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[#2A2D3E] bg-white/[0.02]">
          <h3 className="text-[15px] font-bold text-white flex items-center gap-2 uppercase tracking-widest">
            <Users className="w-5 h-5 text-indigo-400" />
            Professores Vinculados
          </h3>
        </div>

        <div className="divide-y divide-[#2A2D3E]">
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-white/20 text-sm italic">Nenhum professor cadastrado nesta escola.</p>
            </div>
          ) : (
            users.map(u => (
              <div key={u.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                    {u.full_name?.charAt(0) || 'P'}
                  </div>
                  <div>
                    <h4 className="text-[16px] font-bold text-white">{u.full_name}</h4>
                    <p className="text-[13px] text-white/40">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {u.force_password_reset && (
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-[9px] font-bold rounded-full border border-amber-500/20 uppercase tracking-[0.15em]">
                      Senha Temporária
                    </span>
                  )}
                  <button 
                    onClick={() => setDeletingUserId(u.id)}
                    disabled={isDeleting === u.id}
                    className="p-2 text-white/10 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Remover Professor"
                  >
                    {isDeleting === u.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
          <div className="w-full max-w-[450px] bg-[#1A1D2F] rounded-[40px] shadow-2xl border border-white/10 p-10 animate-scale-in">
            <h2 className="text-[24px] font-black text-white mb-2 tracking-tight">Novo Professor</h2>
            <p className="text-white/40 text-[14px] mb-8 leading-relaxed">O usuário herdará o plano <span className="text-indigo-400 font-bold uppercase">{tenant?.plan}</span> automaticamente.</p>

            <form onSubmit={handleCreateUser} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">Nome Completo</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full h-14 pl-12 pr-4 bg-white/[0.03] border border-white/10 rounded-2xl text-[15px] text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">E-mail de Acesso</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="professor@escola.com"
                    className="w-full h-14 pl-12 pr-4 bg-white/[0.03] border border-white/10 rounded-2xl text-[15px] text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                  />
                </div>
              </div>

              {msg && (
                <div className={cn(
                  "p-4 rounded-2xl flex items-center gap-3 border animate-shake",
                  msg.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : null}
                  <p className="text-[13px] font-bold">{msg.text}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-14 bg-white/5 text-white/40 rounded-2xl font-bold text-[13px] hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  disabled={isCreating}
                  className="flex-[2] h-14 bg-indigo-500 text-white rounded-2xl font-bold text-[13px] hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 uppercase tracking-widest"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal 
        isOpen={!!deletingUserId}
        onClose={() => setDeletingUserId(null)}
        onConfirm={handleDeleteUser}
        title="Remover Professor"
        description="Tem certeza que deseja remover este professor? O acesso dele será cancelado imediatamente e ele será desvinculado desta escola."
        confirmText="Sim, Remover"
        cancelText="Não, Cancelar"
        variant="danger"
      />
    </div>
  )
}
