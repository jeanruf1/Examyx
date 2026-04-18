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
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  if (!isOpen) return null

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setImages([])

    if (file.type === 'application/pdf') {
      try {
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
            const numPages = Math.min(pdf.numPages, 10) // Limite de 10 páginas para segurança
            const extractedImages: string[] = []

            for (let i = 1; i <= numPages; i++) {
              const page = await pdf.getPage(i)
              const viewport = page.getViewport({ scale: 1.5 })
              const canvas = document.createElement('canvas')
              const context = canvas.getContext('2d')
              canvas.height = viewport.height
              canvas.width = viewport.width

              await page.render({ canvasContext: context, viewport }).promise
              extractedImages.push(canvas.toDataURL('image/jpeg', 0.7))
            }

            setImages(extractedImages)
            setLoading(false)
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
        setImages([reader.result as string])
        setLoading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const startScanning = async () => {
    if (images.length === 0) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
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

  const cropAndUploadImage = async (pageDataUrl: string, bbox: number[], fileName: string) => {
    return new Promise<string>(async (resolve, reject) => {
      try {
        const img = new Image()
        img.onload = async () => {
          const [ymin, xmin, ymax, xmax] = bbox
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          
          const width = (xmax - xmin) * img.width / 1000
          const height = (ymax - ymin) * img.height / 1000
          const x = xmin * img.width / 1000
          const y = ymin * img.height / 1000

          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, x, y, width, height, 0, 0, width, height)
          
          const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.9))
          if (!blob) return resolve('')

          const supabase = createClient()
          const filePath = `ocr-assets/${Date.now()}-${fileName}.jpg`
          const { data, error } = await supabase.storage.from('materials').upload(filePath, blob)
          
          if (error) {
            console.error('Erro upload asset:', error)
            return resolve('')
          }
          
          const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(filePath)
          resolve(publicUrl)
        }
        img.src = pageDataUrl
      } catch (err) {
        console.error('Falha no crop/upload:', err)
        resolve('')
      }
    })
  }

  const handleConfirm = async () => {
    if (!results) return
    setLoading(true)
    const supabase = createClient()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')
      const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single()
      
      const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
          title: `Importado via OCR - ${new Date().toLocaleDateString()}`,
          subject: 'Matemática',
          grade: '8º Ano',
          status: 'draft',
          teacher_id: user.id,
          org_id: profile?.org_id
        })
        .select()
        .single()

      if (examError) throw examError

      // Processar questões e extrair imagens se houver
      const processedQuestions = []
      for (const q of results) {
        let finalContent = q.content
        
        if (q.image_bbox && q.page_index !== undefined && images[q.page_index]) {
          const imageUrl = await cropAndUploadImage(
            images[q.page_index], 
            q.image_bbox, 
            `q-${Math.random().toString(36).substr(2, 5)}`
          )
          if (imageUrl) {
            finalContent = `${q.content}\n\n![Figura](${imageUrl})`
          }
        }

        processedQuestions.push({
          exam_id: exam.id,
          org_id: profile?.org_id,
          content: finalContent,
          type: 'multiple_choice',
          bloom_level: q.bloom_level || 'application',
          bncc_code: q.bncc_code || null,
          explanation: q.explanation || '',
          options: q.options || []
        })
      }

      const { error: qError } = await supabase.from('questions').insert(processedQuestions)
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
            {images.length > 0 ? (
              <div className="w-full h-full p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-full aspect-[1/1.4] bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden shrink-0">
                    <img src={img} className="w-full h-full object-contain" alt={`Página ${idx + 1}`} />
                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-[10px] font-bold rounded-md backdrop-blur-md">
                      Página {idx + 1}
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => { setImages([]); setResults(null); }}
                  className="absolute top-4 right-4 z-10 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-all shadow-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-4 group">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-[#4F46E5]" />
                </div>
                <div className="text-center px-6">
                  <p className="font-bold text-[#1A1D2F]">Clique para subir sua prova</p>
                  <p className="text-[12px] text-[#8E94BB]">Suporta PDF (até 10 páginas) ou imagens PNG/JPG</p>
                </div>
                <input type="file" className="hidden" accept="image/png, image/jpeg, application/pdf" onChange={handleFileUpload} />
              </label>
            )}
          </div>

          <button
            onClick={startScanning}
            disabled={images.length === 0 || loading || !!results}
            className="mt-8 w-full h-14 bg-[#4F46E5] text-white rounded-full font-bold text-[16px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Analisando Páginas...' : `Iniciar Escaneamento (${images.length} pág.)`}
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
