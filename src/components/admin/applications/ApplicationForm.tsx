"use client"

/**
 * @purpose Renderiza una forma para crear o actualizar aplicaciones industriales, incluyendo campos para detalles de aplicación y URIs de redirección.
 * @purpose_en Renders a form for creating or updating industrial applications, including fields for application details and redirect URIs.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:rk847k
 * @lastUpdated 2026-06-21T10:30:37.545Z
 */

import * as React from "react"
import type { IndustrialApplicationDisplay, ApplicationManagementTranslations, IndustrialApplicationFormValues, ApplicationSubmitHandler } from "./types"
import { ApplicationCredentialsCard } from "./components/ApplicationCredentialsCard"
import { RedirectUrisField } from "./components/RedirectUrisField"

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
            className="w-full bg-muted/50 border border-border rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none transition-all text-foreground"
            placeholder={t.form.placeholder_name}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t.form.description}</label>
          <textarea 
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-muted/50 border border-border rounded-none px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none transition-all h-20 resize-none text-foreground"
            placeholder={t.form.placeholder_description}
          />
        </div>

        <ApplicationCredentialsCard 
          clientId={formData.clientId}
          clientSecret={formData.clientSecret}
          t={t.form}
        />

        <RedirectUrisField 
          redirectUris={formData.redirectUris}
          onUriChange={handleUriChange}
          onAddUri={addUri}
          onRemoveUri={removeUri}
          t={t.form}
        />
      </div>

      <footer className="flex gap-3 pt-6 border-t border-border">
        <button 
          type="button"
          aria-label={t.form.cancel}
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-none text-[10px] font-black uppercase tracking-widest transition-colors text-foreground"
        >
          {t.form.cancel}
        </button>
        <button 
          type="submit"
          aria-label={t.form.save}
          disabled={isSubmitting}
          className="flex-2 px-8 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
        >
          {isSubmitting ? "..." : t.form.save}
        </button>
      </footer>
    </form>
  )
}
