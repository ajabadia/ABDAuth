"use client"

import * as React from "react"
import { Shield, Globe, Key, AlertTriangle } from "lucide-react"
import type { IndustrialApplicationDisplay, ApplicationManagementTranslations, IndustrialApplicationFormValues, ApplicationSubmitHandler } from "./types"

interface ApplicationFormProps {
  initialData?: IndustrialApplicationDisplay
  t: ApplicationManagementTranslations
  onSubmit: ApplicationSubmitHandler
  onCancel: () => void
}

export function ApplicationForm({ initialData, t, onSubmit, onCancel }: ApplicationFormProps) {
  const [formData, setFormData] = React.useState<IndustrialApplicationFormValues>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    clientId: initialData?.clientId || crypto.randomUUID(),
    clientSecret: initialData?.clientSecret || Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''),
    redirectUris: initialData?.redirectUris || [""],
    active: initialData?.active ?? true,
  })

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleUriChange = (index: number, value: string) => {
    const newUris = [...formData.redirectUris]
    newUris[index] = value
    setFormData({ ...formData, redirectUris: newUris })
  }

  const addUri = () => setFormData({ ...formData, redirectUris: [...formData.redirectUris, ""] })
  const removeUri = (index: number) => {
    if (formData.redirectUris.length === 1) return
    setFormData({ ...formData, redirectUris: formData.redirectUris.filter((_, i) => i !== index) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.form.name}</label>
          <input 
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
            placeholder={t.form.placeholder_name}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.form.description}</label>
          <textarea 
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 transition-all h-20 resize-none"
            placeholder={t.form.placeholder_description}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 bg-blue-500/5 p-4 rounded-xl border border-blue-500/10">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-blue-500/70 ml-1 flex items-center gap-1">
              <Key size={10} /> {t.form.client_id}
            </label>
            <input 
              readOnly
              value={formData.clientId}
              className="w-full bg-black/20 border border-blue-500/20 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-blue-500/70 ml-1 flex items-center gap-1">
              <Shield size={10} /> {t.form.client_secret}
            </label>
            <div className="relative group">
              <input 
                readOnly
                type="password"
                value={formData.clientSecret}
                className="w-full bg-black/20 border border-blue-500/20 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-400 cursor-not-allowed group-hover:blur-0 blur-sm transition-all"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 pointer-events-none transition-opacity text-[8px] font-black uppercase tracking-widest">
                {t.form.hover_reveal}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
            <Globe size={10} /> {t.form.redirect_uris}
          </label>
          <div className="space-y-2">
            {formData.redirectUris.map((uri, index) => (
              <div key={index} className="flex gap-2">
                <input 
                  required
                  type="url"
                  value={uri}
                  onChange={e => handleUriChange(index, e.target.value)}
                  className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-[10px] font-mono focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder={t.form.placeholder_uri}
                />
                <button 
                  type="button"
                  aria-label="Remove URI"
                  onClick={() => removeUri(index)}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <AlertTriangle size={14} />
                </button>
              </div>
            ))}
            <button 
              type="button"
              aria-label="Add Redirect URI"
              onClick={addUri}
              className="w-full py-2 border border-dashed border-border rounded-lg text-[9px] font-black uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-500 transition-all"
            >
              + Add Redirect URI
            </button>
          </div>
        </div>
      </div>

      <footer className="flex gap-3 pt-6 border-t border-border">
        <button 
          type="button"
          aria-label={t.form.cancel}
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          {t.form.cancel}
        </button>
        <button 
          type="submit"
          aria-label={t.form.save}
          disabled={isSubmitting}
          className="flex-2 px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {isSubmitting ? "..." : t.form.save}
        </button>
      </footer>
    </form>
  )
}
