'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Key, Loader2, CheckCircle2 } from 'lucide-react'

export default function SetPasswordPage() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // Pequeno delay para garantir que o Supabase processou o token da URL
    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        // Se não tem sessão, esperamos um pouco mais (pode ser delay de rede)
        setTimeout(async () => {
          const { data: secondTry } = await supabase.auth.getSession()
          if (!secondTry.session) {
            setError('Link expirado ou inválido. Peça um novo convite.')
          }
          setCheckingSession(false)
        }, 1500)
      } else {
        setCheckingSession(false)
      }
    }
    check()
  }, [])

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F111A] flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] bg-[#1A1D2F] rounded-[40px] border border-white/10 p-10 shadow-2xl animate-scale-in">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
            <Key className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="text-[24px] font-black text-white tracking-tight">Defina sua Senha</h1>
          <p className="text-white/40 text-[14px] mt-2 leading-relaxed">Para concluir seu acesso ao Examyx, escolha uma senha segura.</p>
        </div>

        {checkingSession ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Verificando convite...</p>
          </div>
        ) : success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center animate-shake">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
            <p className="text-emerald-400 font-bold">Senha definida com sucesso!</p>
            <p className="text-emerald-400/60 text-xs mt-1">Redirecionando para o painel...</p>
          </div>
        ) : (
          <form onSubmit={handleSetPassword} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 ml-1">Nova Senha</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-14 pl-12 pr-4 bg-white/[0.03] border border-white/10 rounded-2xl text-[15px] text-white focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05] transition-all placeholder:text-white/10"
                />
              </div>
            </div>

            {error && (
              <p className="text-rose-400 text-xs font-bold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>
            )}

            <button 
              disabled={loading}
              className="w-full h-14 bg-indigo-500 text-white rounded-2xl font-bold text-[14px] hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar e Entrar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
