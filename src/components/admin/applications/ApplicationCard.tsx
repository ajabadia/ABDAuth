"use client"

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
    <div className="bg-card p-5 rounded-xl border border-border hover:border-blue-500/30 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button 
          aria-label={t.edit_app}
          onClick={() => onEdit(app)}
          className="p-1.5 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 rounded transition-colors"
        >
          <Edit3 size={14} />
        </button>
        <button 
          aria-label="Delete Satellite"
          onClick={() => onDelete(app._id)}
          className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-600/5 rounded-lg flex items-center justify-center border border-blue-500/10 text-blue-500">
          <Shield size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate">{app.name}</h3>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${app.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} uppercase tracking-widest border border-current/10`}>
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
              <div className="flex items-center gap-2 bg-secondary/30 p-1.5 rounded border border-border overflow-hidden">
                <Key size={10} className="text-blue-500 shrink-0" />
                <code className="text-[8px] font-mono truncate opacity-60">{app.clientId}</code>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.cards.authorized_uris}</p>
              <div className="flex flex-wrap gap-1">
                {app.redirectUris.map((uri, i) => (
                  <div key={i} className="flex items-center gap-1 bg-blue-500/5 text-blue-400 border border-blue-400/10 px-1.5 py-0.5 rounded text-[8px] font-mono">
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
