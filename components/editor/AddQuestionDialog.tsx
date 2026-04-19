'use client'

import { useState } from 'react'
import { 
  X, Upload, Loader2, Zap, 
  Camera, CheckCircle2, Plus, 
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface AddQuestionDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (questions: any[]) => void
}

export default function AddQuestionDialog({ isOpen, onClose, onAdd }: AddQuestionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  
  const [formData, setFormData] = useState({
    content: '',
    options: [
      { letter: 'A', text: '', is_correct: true },
      { letter: 'B', text: '', is_correct: false },
      { letter: 'C', text: '', is_correct: false },
      { letter: 'D', text: '', is_correct: false },
    ],
    explanation: '',
    imageFile: null as File | null,
    imagePreview: null as string | null
  })

  if (!isOpen) return null

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imageFile: file, imagePreview: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const generateWithAi = async () => {
    if (!formData.imagePreview) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: [formData.imagePreview] }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      
      const aiQ = data.questions[0]
      if (aiQ) {
        setFormData(prev => ({
          ...prev,
          content: aiQ.content,
          options: aiQ.options && aiQ.options.length > 0 ? aiQ.options : prev.options,
          explanation: aiQ.explanation || prev.explanation
        }))
      }
    } catch (err: any) {
      setError('Erro na IA: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.content.trim()) return
    setLoading(true)
    setError(null)

    try {
      let finalContent = formData.content
      
      if (formData.imageFile) {
        const filePath = `question-assets/${Date.now()}-${formData.imageFile.name}`
        const { error: uploadError } = await supabase.storage.from('materials').upload(filePath, formData.imageFile)
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(filePath)
          finalContent += `\n\n![Figura](${publicUrl})`
        }
      }

      onAdd([{
        content: finalContent,
        options: formData.options,
        explanation: formData.explanation
      }])
      resetAndClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateOption = (idx: number, text: string) => {
    const newOpts = [...formData.options]
    newOpts[idx].text = text
    setFormData({ ...formData, options: newOpts })
  }

  const setCorrectOption = (idx: number) => {
    const newOpts = formData.options.map((o, i) => ({ ...o, is_correct: i === idx }))
    setFormData({ ...formData, options: newOpts })
  }

  const resetAndClose = () => {
    setFormData({
      content: '',
      options: [
        { letter: 'A', text: '', is_correct: true },
        { letter: 'B', text: '', is_correct: false },
        { letter: 'C', text: '', is_correct: false },
        { letter: 'D', text: '', is_correct: false },
      ],
      explanation: '',
      imageFile: null,
      imagePreview: null
    })
    setLoading(false)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#1A1D2F]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex h-[85vh] animate-in zoom-in-95 duration-300">
        
        {/* Lado Esquerdo: Imagem/Upload */}
        <div className="w-1/3 bg-[#F8F9FE] border-r border-[#E9EAF2] p-8 flex flex-col">
          <div className="mb-6">
            <h4 className="text-[14px] font-bold text-[#1A1D2F] mb-1">Anexar Imagem</h4>
            <p className="text-[11px] text-[#8E94BB]">Gráfico, mapa ou foto da questão.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-[#E9EAF2] rounded-[32px] bg-white relative overflow-hidden group">
            {formData.imagePreview ? (
              <div className="w-full h-full p-2 relative">
                <img src={formData.imagePreview} className="w-full h-full object-contain" alt="Preview" />
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, imageFile: null, imagePreview: null }))}
                  className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-all shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center gap-3 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#1A1D2F]">Subir Foto</p>
                  <p className="text-[10px] text-[#8E94BB]">Arraste ou clique</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            )}
          </div>

          {formData.imagePreview && (
            <button
              onClick={generateWithAi}
              disabled={loading}
              className="mt-6 w-full h-12 bg-indigo-50 text-[#4F46E5] rounded-2xl font-bold text-[13px] flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Preencher com IA
            </button>
          )}
        </div>

        {/* Lado Direito: Formulário */}
        <div className="flex-1 p-10 flex flex-col relative overflow-hidden">
          <button onClick={resetAndClose} className="absolute top-8 right-8 p-2 hover:bg-neutral-50 rounded-full transition-colors">
            <X className="w-5 h-5 text-[#8E94BB]" />
          </button>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8">
            <div>
              <h3 className="text-[24px] font-extrabold text-[#1A1D2F] tracking-tight mb-1">Nova Questão</h3>
              <p className="text-[#8E94BB] text-[14px]">Preencha os campos abaixo ou use a IA para ajudar.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-[#8E94BB] uppercase tracking-wider mb-2">Enunciado</label>
                <textarea 
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                  rows={4}
                  placeholder="Sobre o que é a questão?"
                  className="w-full border border-[#E9EAF2] rounded-2xl p-4 text-[15px] text-[#1A1D2F] focus:outline-none focus:border-[#4F46E5] resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-[#8E94BB] uppercase tracking-wider">Alternativas</label>
                {formData.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <button 
                      onClick={() => setCorrectOption(idx)}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px] border transition-all",
                        opt.is_correct ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-white text-[#8E94BB] border-[#E9EAF2] hover:border-emerald-400"
                      )}
                    >
                      {opt.letter}
                    </button>
                    <input 
                      type="text"
                      value={opt.text}
                      onChange={e => updateOption(idx, e.target.value)}
                      placeholder={`Texto da opção ${opt.letter}...`}
                      className="flex-1 border border-[#E9EAF2] rounded-xl px-4 h-10 text-[14px] focus:outline-none focus:border-[#4F46E5]"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#8E94BB] uppercase tracking-wider mb-2">Gabarito Comentado (Opcional)</label>
                <textarea 
                  value={formData.explanation}
                  onChange={e => setFormData({...formData, explanation: e.target.value})}
                  rows={2}
                  placeholder="Por que esta é a resposta correta?"
                  className="w-full border border-[#E9EAF2] rounded-xl p-3 text-[13px] text-[#1A1D2F] focus:outline-none focus:border-[#4F46E5] resize-none"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-[12px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-[#E9EAF2]">
            <button 
              onClick={handleSave}
              disabled={loading || !formData.content.trim()}
              className="w-full h-14 bg-[#1A1D2F] text-white rounded-full font-bold text-[16px] flex items-center justify-center gap-3 hover:bg-[#4F46E5] transition-all shadow-xl shadow-neutral-200"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              {loading ? 'Salvando...' : 'Adicionar Questão'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
