"use client"

/**
 * @purpose Renderiza un modal para crear o editar aplicaciones con validación de formularios y manejo de envío.
 * @purpose_en Renders a modal for creating or editing applications with form validation and submission handling.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:7,sig:7bgh2l
 * @lastUpdated 2026-06-21T10:30:53.043Z
 */

import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { Shield } from "lucide-react"
import { IndustrialModalHeader } from "@ajabadia/ecosystem-widgets"
import { ApplicationForm } from "./ApplicationForm"
import { ANIM_DURATION } from "@ajabadia/ecosystem-widgets"
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
  // -- Mount / unmount lifecycle for exit animation --
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevOpenRef = useRef(isOpen)
  const [mounted, setMounted] = useState(isOpen)

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      setMounted(true)
    } else if (prevOpenRef.current) {
      closeTimerRef.current = setTimeout(() => {
        setMounted(false)
      }, ANIM_DURATION)
    }

    prevOpenRef.current = isOpen

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [isOpen])

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? 'animate-in fade-in duration-200' : 'animate-out fade-out duration-150'
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative w-full max-w-lg bg-card border border-border rounded-none shadow-xl overflow-y-auto max-h-[95vh] md:max-h-[90vh] ${
          isOpen ? 'animate-in zoom-in-95 duration-200' : 'animate-out zoom-out-95 duration-150'
        }`}
      >
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
