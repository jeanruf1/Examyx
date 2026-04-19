'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Key, Loader2, CheckCircle2, Quote, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function FirstAccessPage() {
  const [step, setStep] = useState(1) // 1: Email, 2: Password
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const router = useRouter()

  // Etapa 1: Verificar e-mail
  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    try {
      const res = await fetch('/api/auth/first-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, checkOnly: true }) // Enviamos flag para apenas verificar
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setStep(2)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  // Etapa 2: Ativar com a senha
  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)

    try {
      const res = await fetch('/api/auth/first-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setMsg({ type: 'success', text: 'Senha definida! Redirecionando...' })
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Left panel — Indigo Gradient (Fixo igual ao login) */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] flex-shrink-0 p-12 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)' }}>
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="relative z-10"><Link href="/login" className="text-white font-black text-2xl tracking-tighter uppercase">Examyx</Link></div>
        <div className="relative z-10">
          <Quote className="w-10 h-10 text-white/20 mb-6" />
          <h2 className="text-white text-3xl font-bold leading-tight mb-8 pr-10">"O Examyx transforma horas de trabalho em minutos de criatividade."</h2>
        </div>
        <div className="relative z-10 text-white/30 text-[11px] font-bold uppercase tracking-[0.2em]">Ativação de Conta</div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8F9FE]">
        <div className="w-full max-w-[420px] animate-fade-in">
          <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white">
            <Link href="/login" className="inline-flex items-center gap-2 text-[#8E94BB] hover:text-[#4F46E5] mb-8 transition-colors text-[11px] font-bold uppercase tracking-widest">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>

            <h1 className="text-[28px] font-extrabold text-[#1A1D2F] mb-2 tracking-tight">
              {step === 1 ? 'Primeiro Acesso' : 'Crie sua senha'}
            </h1>
            <p className="text-[14px] font-medium text-[#8E94BB] mb-10">
              {step === 1 ? 'Informe seu e-mail para validar seu cadastro.' : 'Perfeito! Agora defina sua senha de acesso.'}
            </p>

            <form onSubmit={step === 1 ? handleCheckEmail : handleActivate} className="space-y-6">
              {step === 1 ? (
                <div>
                  <label className="block text-[12px] font-bold text-[#1A1D2F] uppercase tracking-wider mb-2 ml-1">E-mail Profissional</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D1D5DB]" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-neutral-50 border border-[#E9EAF2] text-[15px] text-[#1A1D2F] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-all placeholder:text-[#D1D5DB]"
                    />
                  </div>
                </div>
              ) : (
                <div className="animate-in slide-in-from-right-4 duration-300">
                  <div className="mb-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                    <span className="text-[13px] text-indigo-700 font-bold">{email}</span>
                  </div>
                  <label className="block text-[12px] font-bold text-[#1A1D2F] uppercase tracking-wider mb-2 ml-1">Sua nova senha</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D1D5DB]" />
                    <input
                      required
                      autoFocus
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full h-14 pl-12 pr-4 rounded-2xl bg-neutral-50 border border-[#E9EAF2] text-[15px] text-[#1A1D2F] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-all placeholder:text-[#D1D5DB]"
                    />
                  </div>
                </div>
              )}

              {msg && (
                <div className={cn(
                  "p-4 rounded-2xl flex items-center gap-3 border animate-shake",
                  msg.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                )}>
                  <p className="text-[13px] font-medium">{msg.text}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#4F46E5] text-white rounded-2xl font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-[#4338CA] hover:scale-[1.02] transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {step === 1 ? 'Verificar e-mail' : 'Ativar minha conta'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
