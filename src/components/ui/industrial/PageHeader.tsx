/**
 * @purpose Renderiza un componente de encabezado para páginas industriales con título, subtítulo, breadcrumb, icono y botón de acción opcional.
 * @purpose_en Renders a header component for industrial pages with a title, subtitle, breadcrumb, icon, and optional action button.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:vmoovh
 * @lastUpdated 2026-06-21T12:05:19.671Z
 */

import * as React from "react"
import { ArrowLeft, LucideIcon } from "lucide-react"
import { Link } from "@/i18n/routing"

interface PageHeaderProps {
  title: React.ReactNode
  subtitle?: string
  breadcrumb: string
  icon: LucideIcon
  backHref?: string
  backAriaLabel?: string
  actionButton?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  icon: Icon,
  backHref,
  backAriaLabel = "Go back",
  actionButton
}: PageHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {/* Tag Monospace de Ubicación (Breadcrumb) */}
        <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
          <Icon size={14} className="text-primary animate-pulse" aria-hidden="true" />
          {breadcrumb}
        </div>
        
        {/* Fila de Título e Interacción */}
        <div className="flex items-center gap-4 mt-1">
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none flex-1 truncate">
            {title}
          </h1>
        </div>
        
        {/* Subtítulo descriptivo en Geist Sans */}
        {subtitle && (
          <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      
      {actionButton && (
        <div className="shrink-0">
          {actionButton}
        </div>
      )}
    </header>
  )
}
