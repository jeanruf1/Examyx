'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Search, LogOut } from 'lucide-react'

interface TopBarProps {
  profile: { full_name: string | null; organizations: { name: string } | null }
}

export default function TopBar({ profile }: TopBarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 flex items-center justify-between px-6"
      style={{
        background: 'rgba(255,255,255,0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>

      {/* Left side empty or branding could go here if needed */}
      <div />

      {/* Right */}
      <div className="flex items-center gap-1">
        <button onClick={handleLogout} id="btn-logout"
          className="btn-icon text-neutral-400 hover:text-red-500"
          title="Sair da conta">
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
