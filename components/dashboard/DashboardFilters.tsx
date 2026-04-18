'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

export default function DashboardFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'active')
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedSearch) {
      params.set('q', debouncedSearch)
    } else {
      params.delete('q')
    }
    router.push(`?${params.toString()}`)
  }, [debouncedSearch, router])

  const toggleStatus = (newStatus: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('status', newStatus)
    setStatus(newStatus)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center justify-between mb-8 gap-6 bg-white p-2 rounded-[20px] border border-[#E9EAF2] shadow-sm">
      <div className="flex-1 relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E94BB]" />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar em sua biblioteca de provas..." 
          className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none pl-12 h-12 text-sm text-[#1A1D2F] placeholder:text-[#8E94BB]"
        />
      </div>
      <div className="flex items-center gap-2 pr-2">
        <div className="flex bg-[#F8F9FE] p-1 rounded-[12px] gap-1 mr-2">
          <button 
            onClick={() => toggleStatus('active')}
            className={cn(
              "px-4 py-1.5 rounded-[9px] text-xs font-bold transition-all",
              status === 'active' ? "bg-white text-[#4F46E5] shadow-sm" : "text-[#8E94BB]"
            )}
          >
            Ativas
          </button>
          <button 
            onClick={() => toggleStatus('archived')}
            className={cn(
              "px-4 py-1.5 rounded-[9px] text-xs font-bold transition-all",
              status === 'archived' ? "bg-white text-[#4F46E5] shadow-sm" : "text-[#8E94BB]"
            )}
          >
            Histórico
          </button>
        </div>
        <button className="btn-rabbu-secondary h-10 px-4 text-xs">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filtros
        </button>
      </div>
    </div>
  )
}
