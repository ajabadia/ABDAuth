"use client"

import * as React from "react"
import { X, Building2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Tenant } from "@/lib/schemas/auth"
import type { SaveTenantAction } from "./types"
import { TenantForm } from "./TenantForm"

interface TenantDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: SaveTenantAction
  initialData?: Tenant | null
  title: string
}

export function TenantDialog({ isOpen, onClose, onSave, initialData, title }: TenantDialogProps) {
  const t = useTranslations('dashboard.tenants')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  if (!isOpen) return null

  const handleSubmit = async (data: Partial<Tenant>) => {
    setIsSubmitting(true)
    try {
      await onSave(data)
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center text-blue-500 border border-blue-500/10">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest">{title}</h3>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">{t('orchestrator_version')}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-muted rounded-full transition-colors"
            aria-label={t('actions.cancel')}
          >
            <X size={18} />
          </button>
        </header>

        <TenantForm 
          initialData={initialData} 
          onSubmit={handleSubmit} 
          onCancel={onClose} 
          isSubmitting={isSubmitting} 
        />
      </div>
    </div>
  )
}
