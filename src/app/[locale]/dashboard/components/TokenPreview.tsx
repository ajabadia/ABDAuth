/**
 * @purpose Renderiza un componente de previsualización para tokens de usuario, mostrando diversas afirmaciones como asunto, correo electrónico, rol, organización, estado de autenticación multifactorial y protocolo.
 * @purpose_en Renders a preview component for user tokens, displaying various claims such as subject, email, role, organization, MFA status, and protocol.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:t6w60m
 * @lastUpdated 2026-06-21T10:20:53.245Z
 */

import * as React from "react"
import { Key } from "lucide-react"
import type { IndustrialUser } from "@/types/auth"

interface TokenPreviewProps {
  user: IndustrialUser
  translations: {
    title: string
    v1_certified: string
    sub: string
    email: string
    role: string
    org: string
    mfa_status: string
    protocol: string
    standard_protocol: string
  }
}

export function TokenPreview({ user, translations: t }: TokenPreviewProps) {
  return (
    <div className="bg-card border border-border rounded-none p-8 relative overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col">
      <Key className="absolute -top-4 -right-4 w-36 h-36 opacity-5 pointer-events-none text-foreground group-hover:opacity-10 transition-opacity animate-pulse duration-[4s]" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-none flex items-center justify-center text-primary">
          <Key size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
            {t.title}
          </h3>
          <div className="sm:hidden text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest mt-0.5">{t.v1_certified}</div>
        </div>
        <div className="hidden sm:block text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest ml-auto border border-border px-2 py-0.5">{t.v1_certified}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4 relative z-10 border-t border-border pt-4">
        <div className="space-y-3">
          <ClaimItem label={t.sub} value={user.id} />
          <ClaimItem label={t.email} value={user.email} />
          <ClaimItem label={t.role} value={user.role} />
        </div>
        <div className="space-y-3">
          <ClaimItem label={t.org} value={user.tenantId} />
          <ClaimItem label={t.mfa_status} value={user.mfa_verified ? "VERIFIED" : "UNVERIFIED"} />
          <ClaimItem label={t.protocol} value={t.standard_protocol} />
        </div>
      </div>
    </div>
  )
}

function ClaimItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-border/30 pb-1.5">
      <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-mono font-bold truncate max-w-[200px] text-foreground">{value}</span>
    </div>
  )
}
