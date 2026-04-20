import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Building2, ScrollText, LogOut, DollarSign, FileText, ArrowLeft } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'superadmin') redirect('/dashboard')

  const NAV = [
    { href: '/dashboard', label: 'Sair do Admin', icon: ArrowLeft },
    { href: '/admin', label: 'Visão Geral', icon: LayoutDashboard },
    { href: '/admin/tenants', label: 'Escolas', icon: Building2 },
    { href: '/admin/exams', label: 'Provas Criadas', icon: FileText },
    { href: '/admin/usage', label: 'Consumo IA', icon: DollarSign },
    { href: '/admin/logs', label: 'Logs de Erros', icon: ScrollText },
  ]

  return (
    <div className="min-h-screen bg-[#0F1117] flex text-white">
      {/* Admin Sidebar */}
      <aside className="w-[240px] shrink-0 flex flex-col border-r border-white/10 fixed top-0 left-0 h-full">
        <div className="p-8 border-b border-white/10">
          <h1 className="text-white font-black text-[18px] tracking-tight uppercase mb-1">Examyx Admin</h1>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Painel de Controle</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-3">
            <p className="text-[12px] font-bold text-white/80">{profile.full_name || 'Admin'}</p>
            <p className="text-[10px] text-white/30">superadmin</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-[240px] p-8 min-h-screen bg-[#0F1117]">
        {children}
      </main>
    </div>
  )
}
