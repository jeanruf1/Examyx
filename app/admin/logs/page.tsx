'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, Clock, Database, ChevronLeft, Search, Terminal } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface ErrorLog {
  id: string
  created_at: string
  operation: string
  error_message: string
  error_code: string | null
  metadata: any
  profiles?: {
    full_name: string
  }
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setLoading(true)
    const { data } = await supabase
      .from('error_logs')
      .select(`
        *,
        profiles:teacher_id (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) setLogs(data)
    setLoading(false)
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-[32px] font-bold text-white mb-2">Logs de Erros</h1>
        <p className="text-white/40">Monitoramento técnico de falhas e exceções do sistema.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[24px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">Operação / Código</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">Mensagem de Erro</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">Usuário</th>
                <th className="px-6 py-4 text-[11px] font-bold text-white/40 uppercase tracking-widest text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Database className="w-8 h-8 text-white/10 animate-pulse mx-auto mb-4" />
                    <p className="text-white/20">Carregando logs do servidor...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-white/20">Nenhum erro registrado recentemente.</td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm uppercase tracking-tight">{log.operation}</p>
                          <p className="text-[10px] text-white/30">{log.error_code || 'CODE_UNSET'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm text-white/80 max-w-[400px] line-clamp-2">{log.error_message}</p>
                    </td>
                    <td className="px-6 py-6">
                      <p className="text-sm text-white/60">{log.profiles?.full_name || 'Sistema'}</p>
                    </td>
                    <td className="px-6 py-6 text-right text-xs text-white/40 font-mono">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
