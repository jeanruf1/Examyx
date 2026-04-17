import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Buscar perfil do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(name, logo_url, plan, trial_ends_at)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')


  return (
    <div className="min-h-screen bg-page flex">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col min-h-screen ml-60">
        <TopBar profile={profile} />
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
