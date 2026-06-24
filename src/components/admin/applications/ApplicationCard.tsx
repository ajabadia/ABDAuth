"use client"

/**
 * @purpose Renderiza un componente de tarjeta para mostrar y gestionar aplicaciones industriales, incluyendo opciones para editar o eliminarlas.
 * @purpose_en Renders a card component for displaying and managing industrial applications, including options to edit or delete them.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:k3pz9y
 * @lastUpdated 2026-06-21T10:30:18.997Z
 */

import * as React from "react"
import { Shield, Key, Trash2, Edit3, Globe } from 'lucide-react'
import type { IndustrialApplicationDisplay, ApplicationManagementTranslations } from "./types"

interface ApplicationCardProps {
  app: IndustrialApplicationDisplay
  t: ApplicationManagementTranslations
  onEdit: (app: IndustrialApplicationDisplay) => void
  onDelete: (id: string) => void
}

export function ApplicationCard({ app, t, onEdit, onDelete }: ApplicationCardProps) {
  return (
    <div className="bg-card p-5 rounded-none border border-border hover:border-primary/40 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button 
          aria-label={t.edit_app}
          onClick={() => onEdit(app)}
          className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-none transition-colors"
        >
          <Edit3 size={14} />
        </button>
        <button 
          aria-label="Delete Satellite"
          onClick={() => onDelete(app._id)}
          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-none transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/5 rounded-none flex items-center justify-center border border-primary/20 text-primary">
          <Shield size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate">{app.name}</h3>
            <span className={`px-1.5 py-0.5 rounded-none text-[8px] font-black ${app.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'} uppercase tracking-widest border border-current/10`}>
              {app.active ? t.cards.active : t.cards.inactive}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{app.description}</p>
          <p className="text-[8px] text-muted-foreground/50 font-mono mt-1 uppercase tracking-tighter">
            EST: {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '---'}
          </p>
          
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/50 pt-4">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.cards.client_credentials}</p>
              <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded-none border border-border overflow-hidden">
                <Key size={10} className="text-primary shrink-0" />
                <code className="text-[8px] font-mono truncate opacity-60">{app.clientId}</code>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.cards.authorized_uris}</p>
              <div className="flex flex-wrap gap-1">
                {app.redirectUris.map((uri, i) => (
                  <div key={i} className="flex items-center gap-1 bg-primary/5 text-primary border border-primary/20 px-1.5 py-0.5 rounded-none text-[8px] font-mono">
                    <Globe size={8} />
                    {new URL(uri).hostname}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
