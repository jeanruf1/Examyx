'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BookOpen, LayoutDashboard, FileText, 
  Settings, Users, CreditCard, ShieldCheck, 
  Sparkles, ArrowUpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/provas', label: 'Provas', icon: FileText },
  { href: '/documentos', label: 'Materiais', icon: BookOpen },
  { href: '/professores', label: 'Usuários', icon: Users },
  { href: '/pagamento', label: 'Faturamento', icon: CreditCard },
  { href: '/configuracoes', label: 'Ajustes', icon: Settings },
]

export default function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname()

  const org = profile.organizations
  const trialEndsAt = org?.trial_ends_at ? new Date(org.trial_ends_at) : null
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
  const isTrial = org?.plan === 'trial'

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] flex flex-col z-40 bg-white border-r border-[#E9EAF2]">
      
      {/* Brand Logo */}
      <div className="p-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#4F46E5] flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-5 h-5 fill-current" />
        </div>
        <span className="font-bold text-[20px] tracking-tight text-[#1A1D2F]">Examyx</span>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 mt-4">
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-4 px-8 py-4 text-[15px] font-medium transition-all duration-200 group border-r-4",
                isActive 
                  ? "text-[#4F46E5] border-[#4F46E5] bg-[#F5F5FF]" 
                  : "text-[#8E94BB] border-transparent hover:text-[#1A1D2F] hover:bg-neutral-50"
              )}>
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-[#4F46E5]" : "text-[#8E94BB] group-hover:text-[#1A1D2F]")} />
              {item.label}
            </Link>
          )
        })}

        {profile.role === 'superadmin' && (
          <Link href="/admin"
            className={cn(
              "flex items-center gap-4 px-8 py-4 text-[15px] font-medium transition-all duration-200 group border-r-4",
              pathname.startsWith('/admin') ? "text-[#4F46E5] border-[#4F46E5] bg-[#F5F5FF]" : "text-[#8E94BB] border-transparent hover:text-[#1A1D2F] hover:bg-neutral-50"
            )}>
            <ShieldCheck className="w-5 h-5" />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Upgrade Card (Dinâmico) */}
      {profile.role !== 'superadmin' && (
        <div className="p-6">
          <div className="bg-[#F5F5FF] rounded-[24px] p-6 text-center relative overflow-hidden group">
            <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-indigo-500/5 rounded-full" />
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <ArrowUpCircle className="w-6 h-6 text-[#4F46E5]" />
              </div>
              <h4 className="text-[15px] font-bold text-[#1A1D2F] mb-1">
                {isTrial ? 'Período Trial' : 'Assinar Pro'}
              </h4>
              <p className="text-[12px] text-[#8E94BB] mb-4">
                {isTrial 
                  ? `Restam ${daysLeft > 0 ? daysLeft : 0} dias de teste gratuito.` 
                  : 'Acesse IA ilimitada e relatórios pedagógicos.'}
              </p>
              <button className="w-full py-2.5 bg-[#4F46E5] text-white rounded-[14px] text-[13px] font-bold hover:bg-[#3F37C9] transition-colors shadow-md shadow-indigo-500/20">
                {isTrial ? 'Mudar para Pro' : 'Upgrade'}
              </button>
            </div>
          </div>
        </div>
      )}

    </aside>
  )
}

