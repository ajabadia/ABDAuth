import * as React from "react"
import { Shield } from "lucide-react"
import { IndustrialModalHeader } from "@/components/ui/industrial/ModalHeader"
import { ApplicationForm } from "./ApplicationForm"
import type { IndustrialApplicationDisplay, ApplicationManagementTranslations, ApplicationSubmitHandler } from "./types"

interface ApplicationFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingApp: IndustrialApplicationDisplay | null
  t: ApplicationManagementTranslations
  onSubmit: ApplicationSubmitHandler
}

export function ApplicationFormModal({
  isOpen,
  onClose,
  editingApp,
  t,
  onSubmit
}: ApplicationFormModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-card border border-border rounded-none shadow-xl overflow-y-auto max-h-[95vh] md:max-h-[90vh] animate-in zoom-in-95 duration-200">
        <IndustrialModalHeader 
          title={editingApp ? t.edit_app : t.new_app} 
          subtitle="SATELLITE ORCHESTRATOR V1.0" 
          icon={Shield} 
          onClose={onClose} 
        />
        <div className="p-0">
          <ApplicationForm 
            initialData={editingApp || undefined}
            t={t}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
