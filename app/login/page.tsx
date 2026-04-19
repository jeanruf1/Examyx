'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Loader2, Eye, EyeOff, CheckCircle2, Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

const TESTIMONIALS = [
  {
    quote: "Criar uma prova que avalia de verdade sempre levou horas. Com o Examyx, levo menos de 5 minutos.",
    author: "Ana Moreira",
    role: "Professora de Matemática · 8 anos de carreira",
    initials: "AM"
  },
  {
    quote: "O OCR de imagens é impressionante. Ele entende até as fórmulas mais complexas que eu escaneio.",
    author: "Ricardo Santos",
    role: "Professor de Física · Ensino Médio",
    initials: "RS"
  },
  {
    quote: "A qualidade das alternativas geradas pela IA economiza meu final de semana inteiro.",
    author: "Carla Ferreira",
    role: "Coordenadora Pedagógica",
    initials: "CF"
  }
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const supabase = createClient()

  // Auto-slide testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message.includes('Invalid') ? 'Email ou senha incorretos.' : error.message)
      setLoading(false)
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left panel — Brand & Testimonials */}
      <div
        className="hidden lg:flex flex-col justify-between w-[40%] flex-shrink-0 p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)',
        }}
      >
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <span className="text-white font-black text-2xl tracking-tighter uppercase">Examyx</span>
        </div>

        <div className="relative z-10">
          <div className="mb-10 inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Plataforma Líder</span>
          </div>
          
          <div className="min-h-[200px] flex flex-col justify-center">
            {TESTIMONIALS.map((t, i) => (
              <div 
                key={i}
                className={cn(
                  "transition-all duration-1000 absolute",
                  activeTestimonial === i 
                    ? "opacity-100 translate-x-0 relative" 
                    : "opacity-0 -translate-x-8 pointer-events-none hidden"
                )}
              >
                <Quote className="w-10 h-10 text-white/20 mb-6" />
                <h2 className="text-white text-3xl font-bold leading-tight mb-8 pr-10">
                  "{t.quote}"
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
                    <span className="text-white text-sm font-bold">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-white text-[15px] font-bold">{t.author}</p>
                    <p className="text-white/50 text-[13px] font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <div 
              key={i} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                activeTestimonial === i ? "bg-white w-10" : "bg-white/20 w-4"
              )} 
            />
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F8F9FE]">
        <div className="w-full max-w-[400px] animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl text-[#1A1D2F] tracking-tight">Examyx</span>
          </div>

          <div className="bg-white p-10 rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white">
            <h1 className="text-[28px] font-extrabold text-[#1A1D2F] mb-2 tracking-tight">Bom te ver de volta</h1>
            <p className="text-[14px] font-medium text-[#8E94BB] mb-8">Entre com sua conta para continuar</p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-[12px] font-bold text-[#1A1D2F] uppercase tracking-wider mb-2 ml-1">Email Profissional</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="w-full h-14 px-5 rounded-2xl bg-neutral-50 border border-[#E9EAF2] text-[15px] text-[#1A1D2F] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-all placeholder:text-[#D1D5DB]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <label htmlFor="password" className="block text-[12px] font-bold text-[#1A1D2F] uppercase tracking-wider">Senha</label>
                  <Link href="#" className="text-[11px] font-bold text-[#4F46E5] hover:underline">Esqueceu a senha?</Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full h-14 px-5 pr-12 rounded-2xl bg-neutral-50 border border-[#E9EAF2] text-[15px] text-[#1A1D2F] focus:outline-none focus:border-[#4F46E5] focus:bg-white transition-all placeholder:text-[#D1D5DB]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D1D5DB] hover:text-[#8E94BB] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-3 items-center animate-shake">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <p className="text-[13px] font-medium text-rose-600">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#4F46E5] text-white rounded-2xl font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-[#4338CA] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {loading ? 'Entrando...' : 'Acessar Plataforma'}
              </button>
              
              <div className="text-center">
                <Link 
                  href="/primeiro-acesso" 
                  className="text-[12px] font-bold text-[#8E94BB] hover:text-[#4F46E5] transition-colors uppercase tracking-widest underline decoration-neutral-200 underline-offset-4"
                >
                  Primeiro Acesso? Ativar conta
                </Link>
              </div>
            </form>

            <div className="mt-8 pt-8 border-t border-neutral-100">
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                <p className="text-[13px] text-[#4F46E5] text-center font-bold leading-relaxed">
                  Acesso restrito a instituições parceiras.
                  <br />
                  <span className="text-[#8E94BB] font-medium">Para obter acesso, entre em contato em:</span>
                  <br />
                  <a href="mailto:examyxempresa@outlook.com" className="text-[#4F46E5] hover:underline">examyxempresa@outlook.com</a>
                </p>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-center text-[11px] text-[#D1D5DB] uppercase tracking-widest font-bold">
            Examyx © 2026 · Inteligência Pedagógica
          </p>
        </div>
      </div>
    </div>
  )
}
