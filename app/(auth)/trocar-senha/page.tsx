'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Key, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Atualizar senha no Auth
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) throw authError

      // 2. Remover flag no Profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ force_password_reset: false })
          .eq('id', user.id)
        
        if (profileError) throw profileError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6">
      <div className="w-full max-w-[450px] animate-fade-in">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8 text-[#4F46E5]" />
          </div>

          <h1 className="text-[28px] font-black text-[#1A1D2F] mb-2 tracking-tight">Definir Nova Senha</h1>
          <p className="text-[14px] text-[#8E94BB] mb-8 font-medium">
            Sua conta utiliza uma senha temporária. Por segurança, crie uma senha definitiva agora.
          </p>

          {success ? (
            <div className="p-8 rounded-3xl bg-emerald-50 border border-emerald-100 flex flex-col items-center gap-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
              <p className="text-emerald-600 font-bold">Senha alterada com sucesso!</p>
              <p className="text-[12px] text-emerald-600/60 font-medium">Redirecionando para o painel...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 text-left">
              <div>
                <label className="block text-[11px] font-black text-[#1A1D2F] uppercase tracking-widest mb-2 ml-1">Nova Senha</label>
                <input 
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-14 px-5 rounded-2xl bg-neutral-50 border border-[#E9EAF2] text-[15px] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-[#1A1D2F] uppercase tracking-widest mb-2 ml-1">Confirmar Senha</label>
                <input 
                  required
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full h-14 px-5 rounded-2xl bg-neutral-50 border border-[#E9EAF2] text-[15px] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-all"
                />
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-3 items-center animate-shake">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  <p className="text-[13px] font-medium text-rose-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#4F46E5] text-white rounded-2xl font-bold text-[16px] hover:bg-[#4338CA] transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar Senha Definitiva'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
