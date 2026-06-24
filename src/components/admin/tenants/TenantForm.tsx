"use client"

/**
 * @purpose Renderiza una forma para crear o actualizar información de inquilino, incluyendo campos para nombre, ID, industria, prefijo de base de datos, estrategia de aislamiento y estado activo.
 * @purpose_en Renders a form for creating or updating tenant information, including fields for name, ID, industry, database prefix, isolation strategy, and active status.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:tphiw6
 * @lastUpdated 2026-06-21T10:33:20.842Z
 */

import * as React from "react"
import { Globe, Database, Shield } from "lucide-react"
import type { Tenant } from "@/lib/schemas/auth"
import type { TenantId } from "@/lib/schemas/common"
import { useTranslations } from "next-intl"
import type { SubmitTenantAction } from "./types"

interface TenantFormProps {
  initialData?: Tenant | null
  onSubmit: SubmitTenantAction
  onCancel: () => void
  isSubmitting: boolean
}

export function TenantForm({ initialData, onSubmit, onCancel, isSubmitting }: TenantFormProps) {
  const t = useTranslations('dashboard.tenants')
  
  const [formData, setFormData] = React.useState<Partial<Tenant>>({
    name: "",
    tenantId: "" as TenantId,
    industry: "Industrial",
    dbPrefix: "",
    isolationStrategy: "COLLECTION_PREFIX",
    active: true,
  })

  React.useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }))
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('name_label')}</label>
            <input 
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="Acme Corp"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('id_label')}</label>
            <input 
              required
              disabled={!!initialData}
              value={formData.tenantId}
              onChange={e => setFormData({ ...formData, tenantId: e.target.value.toUpperCase() as TenantId })}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
              placeholder="ACME_IND"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
              <Globe size={10} /> {t('industry')}
            </label>
            <select 
              value={formData.industry}
              onChange={e => setFormData({ ...formData, industry: e.target.value })}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500 transition-all appearance-none"
            >
              <option value="Industrial">{t('industries.industrial')}</option>
              <option value="Energy">{t('industries.energy')}</option>
              <option value="Logistics">{t('industries.logistics')}</option>
              <option value="Security">{t('industries.security')}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
              <Database size={10} /> {t('database')}
            </label>
            <input 
              required
              value={formData.dbPrefix}
              onChange={e => setFormData({ ...formData, dbPrefix: e.target.value.toLowerCase() })}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="acme_"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
            <Shield size={10} /> {t('isolation_label')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['COLLECTION_PREFIX', 'DATABASE_PER_TENANT'] as const).map((strategy) => (
              <button
                key={strategy}
                type="button"
                aria-label={strategy}
                onClick={() => setFormData({ ...formData, isolationStrategy: strategy })}
                className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                  formData.isolationStrategy === strategy 
                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-500' 
                    : 'bg-muted/30 border-border text-muted-foreground hover:border-border/80'
                }`}
              >
                {strategy.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className="flex gap-3 pt-4 border-t border-border">
        <button 
          type="button"
          onClick={onCancel}
          aria-label={t('actions.cancel')}
          className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
        >
          {t('actions.cancel')}
        </button>
        <button 
          type="submit"
          disabled={isSubmitting}
          aria-label={t('actions.save')}
          className="flex-2 px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {isSubmitting ? '...' : t('actions.save')}
        </button>
      </footer>
    </form>
  )
}
