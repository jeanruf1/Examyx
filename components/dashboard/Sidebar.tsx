'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen, LayoutDashboard, FileText,
  Users, CreditCard, ShieldCheck,
  ArrowUpCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/provas', label: 'Provas', icon: FileText },
  { href: '/documentos', label: 'Materiais', icon: BookOpen },
  { href: '/dashboard/pagamento', label: 'Faturamento', icon: CreditCard },
]

export default function Sidebar({ profile }: { profile: any }) {
  const pathname = usePathname()
  const [org, setOrg] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    if (profile?.org_id) {
      supabase
        .from('organizations')
        .select('name, logo_url, plan, trial_ends_at')
        .eq('id', profile.org_id)
        .single()
        .then(({ data }) => setOrg(data))
    }
  }, [profile])

  const trialEndsAt = org?.trial_ends_at ? new Date(org.trial_ends_at) : null
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0
  const isTrial = org?.plan === 'trial'

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] flex flex-col z-40 bg-white border-r border-[#E9EAF2]">

      {/* Header / Brand */}
      <div className="p-8 pb-4">
        <div className="flex flex-col gap-3">
          {org?.logo_url && (
            <div className="h-10 w-fit relative">
              <img 
                src={org.logo_url} 
                alt={org.name}
                className="h-full w-auto object-contain object-left"
              />
            </div>
          )}
          <h1 className="text-[18px] font-extrabold text-[#1A1D2F] tracking-tight leading-tight uppercase">
            {org?.name || 'Carregando...'}
          </h1>
        </div>
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

      <div className="p-8 mt-auto flex items-center justify-center">
        <span className="text-[11px] font-bold text-[#1A1D2F] opacity-25 uppercase tracking-[0.3em]">
          Examyx
        </span>
      </div>
    </aside>
  )
}

