'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Loader2, Eye, EyeOff, Check } from 'lucide-react'
import { slugify } from '@/lib/utils'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [schoolName, setSchoolName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: schoolName,
          slug: slugify(schoolName) + '-' + Math.random().toString(36).slice(2, 6),
          city, state, plan: 'trial',
        })
        .select().single()
      if (orgError) throw new Error('Erro ao criar escola: ' + orgError.message)

      const { error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, org_id: org.id, role: 'school_admin' } },
      })
      if (authError) throw new Error(authError.message)
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 mb-1">Conta criada com sucesso</h2>
          <p className="text-sm text-neutral-400">Redirecionando para o dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-neutral-800">ProvaAI</span>
        </div>

        {/* Step header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className={step >= 1 ? 'step-dot-active' : 'step-dot-idle'}>1</div>
            <div className="flex-1 h-px bg-neutral-200" />
            <div className={step >= 2 ? 'step-dot-active' : 'step-dot-idle'}>2</div>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {step === 1 ? 'Dados da escola' : 'Seu acesso'}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            {step === 1 ? 'Informações da instituição' : 'Credenciais do administrador'}
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleRegister}>
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="label">Nome da escola</label>
                  <input value={schoolName} onChange={e => setSchoolName(e.target.value)}
                    placeholder="Ex: Colégio Estadual São Paulo" required className="input" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Cidade</label>
                    <input value={city} onChange={e => setCity(e.target.value)}
                      placeholder="São Paulo" className="input" />
                  </div>
                  <div>
                    <label className="label">Estado</label>
                    <input value={state} onChange={e => setState(e.target.value.toUpperCase())}
                      placeholder="SP" maxLength={2} className="input uppercase" />
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full justify-center mt-2">
                  Continuar
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="label">Nome completo</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Maria da Silva" required className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" required className="input" />
                </div>
                <div>
                  <label className="label">Senha</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres" minLength={8} required className="input pr-10" />
                    <button type="button" tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">{error}</p>
                )}

                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">
                    Voltar
                  </button>
                  <button type="submit" id="btn-register" disabled={loading} className="btn-primary flex-1 justify-center">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loading ? 'Criando...' : 'Criar conta'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex items-center justify-between mt-5 text-xs text-neutral-400">
          <span>14 dias grátis, sem cartão</span>
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            Ja tenho conta
          </Link>
        </div>
      </div>
    </div>
  )
}
