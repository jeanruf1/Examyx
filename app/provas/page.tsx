import { createClient } from '@/lib/supabase/server'
import { FileText, Search, SlidersHorizontal, Plus } from 'lucide-react'
import Link from 'next/link'
import DashboardFilters from '@/components/dashboard/DashboardFilters'
import ExamList from '@/components/dashboard/ExamList'

export default async function ProvasLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string }>
}) {
  const { q, subject } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false })

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  if (subject && subject !== 'Todos') {
    query = query.eq('subject', subject)
  }

  const { data: exams } = await query

  return (
    <div className="max-w-[1200px] mx-auto py-12 px-6 animate-fade-in">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-[32px] font-extrabold text-[#1A1D2F] tracking-tight">Biblioteca de Provas</h1>
          <p className="text-[#8E94BB] text-[14px]">Gerencie e organize todas as suas avaliações criadas.</p>
        </div>
        
        <Link 
          href="/nova-prova"
          className="h-12 px-8 bg-[#4F46E5] text-white rounded-full font-bold text-[14px] flex items-center gap-2 hover:bg-[#4338CA] transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          Nova Prova
        </Link>
      </div>

      <DashboardFilters />

      <div className="mt-8">
        <ExamList initialExams={exams || []} />
      </div>
    </div>
  )
}
