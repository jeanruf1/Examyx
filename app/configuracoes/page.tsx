'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import {
  Upload, Check, X, Loader2, Building2,
  ImagePlus, Trash2, Save, AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function ConfiguracoesPage() {
  const supabase = createClient()

  const [profile, setProfile]   = useState<any>(null)
  const [org, setOrg]           = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus]     = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Form state
  const [orgName, setOrgName]   = useState('')
  const [logoUrl, setLogoUrl]   = useState<string | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .single()

      setProfile(prof)
      const o = prof?.organizations
      setOrg(o)
      setOrgName(o?.name ?? '')
      setLogoUrl(o?.logo_url ?? null)
      setLogoPreview(o?.logo_url ?? null)
      setLoading(false)
    }
    load()
  }, [])

  // ── Upload da logo ─────────────────────────────────────────
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !org) return

    // Preview imediato
    const reader = new FileReader()
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const ext  = file.name.split('.').pop()
      const path = `logos/${org.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('org-assets')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('org-assets')
        .getPublicUrl(path)

      setLogoUrl(publicUrl)
    } catch (err: any) {
      setErrorMsg('Erro no upload: ' + err.message)
      setLogoPreview(logoUrl) // reverte preview
    } finally {
      setUploading(false)
    }
  }

  async function removeLogo() {
    setLogoUrl(null)
    setLogoPreview(null)
  }

  // ── Salvar configurações ────────────────────────────────────
  async function handleSave() {
    if (!org) return
    setSaving(true)
    setErrorMsg('')

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name:     orgName.trim(),
          logo_url: logoUrl,
        })
        .eq('id', org.id)

      if (error) throw error

      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err: any) {
      setErrorMsg(err.message)
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-6 h-6 text-[#4F46E5] animate-spin" />
      </div>
    )
  }

  const canEdit = profile?.role === 'school_admin' || profile?.role === 'superadmin'

  return (
    <div className="max-w-2xl mx-auto pb-20 animate-fade-in">

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[30px] font-extrabold text-[#1A1D2F] tracking-tight">Configurações</h1>
        <p className="text-[14px] text-[#8E94BB] mt-1">Gerencie as informações da sua escola</p>
      </div>

      {/* Aviso para professores sem permissão */}
      {!canEdit && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 mb-8">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-[13px] text-amber-700 font-medium">
            Apenas o administrador da escola pode alterar estas configurações.
          </p>
        </div>
      )}

      {/* Card: Identidade Visual */}
      <div className="p-8 rounded-[32px] bg-white border border-[#E9EAF2] shadow-sm mb-6">
        <h2 className="text-[16px] font-bold text-[#1A1D2F] mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#4F46E5]" />
          Identidade Visual
        </h2>

        {/* Logo upload */}
        <div className="mb-8">
          <label className="block text-[13px] font-bold text-[#1A1D2F] mb-3 uppercase tracking-widest">
            Logo da Escola
          </label>
          <p className="text-[12px] text-[#8E94BB] mb-4">
            Aparece na capa das provas geradas em PDF. Recomendado: PNG ou SVG quadrado, mínimo 200×200px.
          </p>

          <div className="flex items-start gap-6">
            {/* Preview */}
            <div className={cn(
              'w-28 h-28 rounded-2xl border-2 flex items-center justify-center overflow-hidden flex-shrink-0 transition-all',
              logoPreview
                ? 'border-[#4F46E5]/30 bg-[#F8F9FE]'
                : 'border-dashed border-[#D1D5DB] bg-neutral-50'
            )}>
              {uploading ? (
                <Loader2 className="w-6 h-6 text-[#4F46E5] animate-spin" />
              ) : logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <ImagePlus className="w-6 h-6 text-[#C4C9E2] mx-auto mb-1" />
                  <p className="text-[9px] text-[#C4C9E2] font-bold uppercase tracking-wider">Sem logo</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3 pt-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={!canEdit || uploading}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={!canEdit || uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white rounded-full font-bold text-[13px] hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                <Upload className="w-4 h-4" />
                {uploading ? 'Enviando...' : 'Enviar Logo'}
              </button>

              {logoPreview && canEdit && (
                <button
                  onClick={removeLogo}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#E9EAF2] text-red-400 rounded-full font-bold text-[13px] hover:border-red-200 hover:text-red-600 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  Remover
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nome da escola */}
        <div>
          <label className="block text-[13px] font-bold text-[#1A1D2F] mb-2 uppercase tracking-widest">
            Nome da Escola
          </label>
          <input
            type="text"
            value={orgName}
            onChange={e => setOrgName(e.target.value)}
            disabled={!canEdit}
            placeholder="Ex: Colégio Estadual João da Silva"
            className="w-full h-12 px-4 rounded-2xl border border-[#E9EAF2] text-[14px] text-[#1A1D2F] font-medium focus:outline-none focus:border-[#4F46E5] disabled:bg-neutral-50 disabled:text-[#8E94BB] transition-colors"
          />
          <p className="text-[11px] text-[#8E94BB] mt-2">
            Este nome aparecerá na capa das provas exportadas em PDF.
          </p>
        </div>
      </div>

      {/* Feedback de erro */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 mb-6">
          <X className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[13px] text-red-600">{errorMsg}</p>
        </div>
      )}

      {/* Save button */}
      {canEdit && (
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className={cn(
            'w-full h-14 rounded-full font-bold text-[15px] flex items-center justify-center gap-3 transition-all',
            status === 'saved'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-[#1A1D2F] text-white hover:scale-[1.02] shadow-xl shadow-neutral-200 disabled:opacity-60'
          )}
        >
          {saving
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
            : status === 'saved'
              ? <><Check className="w-5 h-5" /> Configurações Salvas!</>
              : <><Save className="w-5 h-5" /> Salvar Configurações</>
          }
        </button>
      )}
    </div>
  )
}
