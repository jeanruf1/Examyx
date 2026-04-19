'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

const SUBJECTS = ['Todos', 'Matemática', 'Português', 'História', 'Geografia', 'Ciências', 'Inglês', 'Física', 'Química', 'Biologia']

export default function DashboardFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [subject, setSubject] = useState(searchParams.get('subject') || 'Todos')
  const [showFilters, setShowFilters] = useState(false)
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

  const handleSubjectChange = (s: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (s === 'Todos') {
      params.delete('subject')
    } else {
      params.set('subject', s)
    }
    setSubject(s)
    setShowFilters(false)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="relative mb-8">
      <div className="flex items-center justify-between gap-6 bg-white p-2 rounded-[20px] border border-[#E9EAF2] shadow-sm relative z-20">
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
          {subject !== 'Todos' && (
            <span className="px-3 py-1.5 bg-indigo-50 text-[#4F46E5] text-[11px] font-bold rounded-full">
              {subject}
            </span>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "btn-rabbu-secondary h-10 px-4 text-xs transition-all",
              showFilters && "bg-[#1A1D2F] text-white"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {showFilters ? 'Fechar' : 'Filtros'}
          </button>
        </div>
      </div>

      {/* Dropdown de Filtros */}
      {showFilters && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[240px] bg-white rounded-[24px] border border-[#E9EAF2] shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-[11px] font-bold text-[#8E94BB] uppercase tracking-wider mb-3 px-2">Filtrar por Matéria</p>
          <div className="grid grid-cols-1 gap-1">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => handleSubjectChange(s)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-xl text-[13px] font-medium flex items-center justify-between transition-colors",
                  subject === s ? "bg-indigo-50 text-[#4F46E5]" : "text-[#1A1D2F] hover:bg-neutral-50"
                )}
              >
                {s}
                {subject === s && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
