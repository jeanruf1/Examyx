'use client'

import { useState } from 'react'
import { 
  X, Camera, Upload, Loader2, 
  CheckCircle2, AlertCircle, Sparkles,
  FileSearch, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ScannerModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ScannerModal({ isOpen, onClose }: ScannerModalProps) {
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (!isOpen) return null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type === 'application/pdf') {
      setLoading(true)
      try {
        // Carrega PDF.js dinamicamente via CDN para conversão
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
        document.head.appendChild(script)

        script.onload = async () => {
          const reader = new FileReader()
          reader.onload = async () => {
            const typedarray = new Uint8Array(reader.result as ArrayBuffer)
            // @ts-ignore
            const pdfjsLib = window['pdfjs-dist/build/pdf']
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
            
            const pdf = await pdfjsLib.getDocument(typedarray).promise
            const page = await pdf.getPage(1) // Pega a primeira página
            const viewport = page.getViewport({ scale: 2.0 }) // Alta qualidade
            
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            canvas.height = viewport.height
            canvas.width = viewport.width

            await page.render({ canvasContext: context, viewport }).promise
            setImage(canvas.toDataURL('image/jpeg', 0.8))
            setLoading(false)
            setError(null)
          }
          reader.readAsArrayBuffer(file)
        }
      } catch (err) {
        setError('Erro ao processar PDF. Tente uma imagem.')
        setLoading(false)
      }
    } else {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImage(reader.result as string)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const startScanning = async () => {
    if (!image) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data.questions)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!results) return
    setLoading(true)
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. Criar a prova (Rascunho via OCR)
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: `Importado via Foto - ${new Date().toLocaleDateString()}`,
          subject: 'A definir',
          grade: 'A definir',
          status: 'draft',
          organization_id: (await supabase.from('profiles').select('organization_id').eq('id', user?.id).single()).data?.organization_id
        })
        .select()
        .single()

      if (examError) throw examError

      // 2. Inserir as questões
      const questionsToInsert = results.map(q => ({
        exam_id: exam.id,
        content: q.content,
        bloom_level: q.bloom_level,
        bncc_code: q.bncc_code,
        explanation: q.explanation,
        options: q.options
      }))

      const { error: qError } = await supabase.from('questions').insert(questionsToInsert)
      if (qError) throw qError

      router.push(`/provas/${exam.id}/editor`)
      onClose()
    } catch (err: any) {
      setError('Erro ao salvar prova: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1D2F]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex h-[80vh] animate-in zoom-in-95 duration-300">
        
        {/* Left Side: Upload/Preview */}
        <div className="w-1/2 bg-[#F8F9FE] border-r border-[#E9EAF2] p-10 flex flex-col">
          <div className="mb-8">
            <h3 className="text-[24px] font-bold text-[#1A1D2F] mb-2 flex items-center gap-3">
              <Camera className="w-6 h-6 text-[#4F46E5]" />
              Digitalizar Prova
            </h3>
            <p className="text-[#8E94BB] text-[14px]">Tire uma foto ou suba um arquivo da sua prova antiga.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#E9EAF2] rounded-[32px] bg-white relative overflow-hidden group">
            {image ? (
              <>
                <img src={image} className="w-full h-full object-contain p-4" alt="Preview" />
                <button 
                  onClick={() => { setImage(null); setResults(null); }}
                  className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-4 group">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-[#4F46E5]" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-[#1A1D2F]">Clique para subir</p>
                  <p className="text-[12px] text-[#8E94BB]">PNG, JPG ou PDF</p>
                </div>
                <input type="file" className="hidden" accept="image/png, image/jpeg, application/pdf" onChange={handleFileUpload} />
              </label>
            )}
          </div>

          <button
            onClick={startScanning}
            disabled={!image || loading || !!results}
            className="mt-8 w-full h-14 bg-[#4F46E5] text-white rounded-full font-bold text-[16px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Lendo Prova...' : 'Iniciar Escaneamento'}
          </button>
        </div>

        {/* Right Side: Results */}
        <div className="w-1/2 p-10 flex flex-col relative">
          <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-neutral-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-[#8E94BB]" />
          </button>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {!results && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-center px-10">
                <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-6">
                  <FileSearch className="w-10 h-10 text-[#D1D5DB]" />
                </div>
                <h4 className="text-[18px] font-bold text-[#1A1D2F] mb-2">Aguardando Imagem</h4>
                <p className="text-[#8E94BB] text-[14px]">Suba uma foto para que nossa IA possa extrair as questões automaticamente.</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-center px-10">
                <div className="relative mb-8">
                   <div className="w-24 h-24 rounded-full border-4 border-indigo-100 border-t-[#4F46E5] animate-spin" />
                   <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-[#4F46E5]" />
                </div>
                <h4 className="text-[18px] font-bold text-[#1A1D2F] mb-2">Processando Visão</h4>
                <p className="text-[#8E94BB] text-[14px]">Analisando textos, fórmulas e alternativas. Isso leva alguns segundos...</p>
              </div>
            )}

            {error && (
              <div className="h-full flex flex-col items-center justify-center text-center px-10 text-red-500">
                <AlertCircle className="w-12 h-12 mb-4" />
                <h4 className="text-[18px] font-bold mb-2">Ops! Falha na leitura</h4>
                <p className="text-[14px] opacity-80">{error}</p>
                <button onClick={() => setError(null)} className="mt-6 text-sm font-bold underline">Tentar novamente</button>
              </div>
            )}

            {results && (
              <div className="animate-in slide-in-from-right-10 duration-500">
                <div className="flex items-center justify-between mb-8">
                  <h4 className="text-[18px] font-bold text-[#1A1D2F]">Questões Identificadas</h4>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-full">{results.length} itens</span>
                </div>
                <div className="space-y-4">
                  {results.map((q, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-[#F8F9FE] border border-[#E9EAF2] relative group">
                      <div className="flex items-start gap-3 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-[13px] font-medium text-[#1A1D2F] line-clamp-2">{q.content}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-[#8E94BB] uppercase tracking-wider">{q.bloom_level}</span>
                        <div className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
                        <span className="text-[10px] font-bold text-[#8E94BB]">{q.options?.length || 0} Alternativas</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {results && (
            <div className="pt-8 mt-8 border-t border-[#E9EAF2]">
              <button 
                onClick={handleConfirm}
                className="w-full h-14 bg-[#1A1D2F] text-white rounded-full font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-[#4F46E5] transition-all shadow-xl"
              >
                Importar Questões
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
