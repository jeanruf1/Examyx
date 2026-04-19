import { createClient } from '@/lib/supabase/server'
import { 
  CreditCard, Zap, Check, 
  ArrowUpCircle, History, 
  ShieldCheck, BrainCircuit,
  Calendar, FileText, Download,
  Mail, ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLAN_LIMITS } from '@/lib/config/plans'
import Link from 'next/link'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user?.id)
    .single()

  const org = profile?.organizations as any
  const currentPlan = (org?.plan || 'trial') as keyof typeof PLAN_LIMITS
  const tokenLimit = org?.monthly_token_limit || PLAN_LIMITS[currentPlan]

  // Buscar uso total de tokens
  const { data: usageData } = await supabase
    .from('token_usage')
    .select('tokens_total')
    .eq('org_id', org?.id)

  const totalUsed = usageData?.reduce((acc, curr) => acc + (curr.tokens_total || 0), 0) || 0
  const pctUsed = Math.min((totalUsed / tokenLimit) * 100, 100)

  // Buscar faturas reais (Assumindo que você terá uma tabela 'invoices' ou usará Stripe)
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('org_id', org?.id)
    .order('created_at', { ascending: false })
  
  const planInfo = {
    trial: { name: 'Trial', color: 'text-neutral-400', bg: 'bg-neutral-50', border: 'border-neutral-200' },
    basic: { name: 'Basic', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    pro: { name: 'Pro', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    enterprise: { name: 'Enterprise', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' }
  }[currentPlan]

  return (
    <div className="max-w-[1200px] mx-auto pb-20 animate-fade-in">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[32px] font-extrabold text-[#1A1D2F] tracking-tight">Status da Conta</h1>
        <p className="text-[#8E94BB] text-[14px]">Sua conta está vinculada ao plano institucional da sua escola.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Plan & Usage */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Current Plan Card */}
          <div className="p-8 rounded-[40px] bg-white border border-[#E9EAF2] shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
               <ShieldCheck className="w-32 h-32 text-[#4F46E5]" />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className={cn("px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-200")}>
                   Acesso Institucional
                </div>
                <span className="text-[13px] font-bold text-[#1A1D2F] flex items-center gap-2">
                  {org?.name}
                </span>
              </div>
            </div>

            <div className="mb-10 relative z-10">
              <h2 className="text-[24px] font-bold text-[#1A1D2F] mb-2">Consumo Mensal de IA</h2>
              <p className="text-[#8E94BB] text-[14px]">Sua escola possui um limite de {tokenLimit.toLocaleString('pt-BR')} tokens para geração de questões e OCR.</p>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between text-[12px] font-bold uppercase tracking-wider">
                <span className="text-[#8E94BB]">Uso do Período</span>
                <span className="text-[#1A1D2F]">{pctUsed.toFixed(1)}% utilizado</span>
              </div>
              <div className="h-4 bg-neutral-50 rounded-full overflow-hidden border border-[#F0F1F7] p-1">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    pctUsed > 90 ? "bg-rose-500" : "bg-[#4F46E5]"
                  )} 
                  style={{ width: `${pctUsed}%` }} 
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8E94BB] font-medium">
                <span>0 tokens</span>
                <span>{tokenLimit.toLocaleString('pt-BR')} tokens</span>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-indigo-50/30 border border-indigo-100/50">
             <div className="flex items-center gap-4 text-indigo-700">
                <BrainCircuit className="w-6 h-6 shrink-0" />
                <p className="text-[14px] font-medium leading-relaxed">
                  O consumo de IA é compartilhado entre todos os professores da sua instituição. 
                  Em caso de dúvidas sobre o limite, entre em contato com a coordenação.
                </p>
             </div>
          </div>
        </div>

        {/* Right Column: Benefits */}
        <div className="space-y-8">
           <div className="p-8 rounded-[40px] bg-white border border-[#E9EAF2] space-y-6 shadow-sm">
              <h4 className="text-[16px] font-bold text-[#1A1D2F]">Benefícios Ativos</h4>
              <ul className="space-y-4">
                {[
                  'Geração ilimitada de questões',
                  'OCR de alta precisão (Vision)',
                  'Exportação para PDF/LMS',
                  'Gabarito Comentado via IA',
                  'Relatórios Pedagógicos'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-[13px] text-[#8E94BB] font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                       <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
           </div>
        </div>

      </div>
    </div>
  )
}
