"use client"

import * as React from "react"
import { Building2, Globe, Database, Trash2, Edit3 } from 'lucide-react'
import type { Tenant } from "@/lib/schemas/auth"
import type { TenantManagementTranslations } from "./types"

interface TenantCardProps {
  tenant: Tenant
  translations: TenantManagementTranslations
  onEdit: (tenant: Tenant) => void
  onDelete: (id: string) => void
}

export function TenantCard({ tenant, translations: t, onEdit, onDelete }: TenantCardProps) {
  return (
    <div className="bg-card p-5 rounded-xl border border-border hover:border-blue-500/30 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button 
          aria-label={t.edit_action}
          onClick={() => onEdit(tenant)}
          className="p-1.5 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 rounded transition-colors"
        >
          <Edit3 size={14} />
        </button>
        <button 
          aria-label={t.delete_action}
          onClick={() => onDelete(tenant._id?.toString() || '')}
          className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-600/5 rounded-lg flex items-center justify-center border border-blue-500/10 text-blue-500">
          <Building2 size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate">{tenant.name}</h3>
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${tenant.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} uppercase tracking-widest border border-current/10`}>
              {tenant.active ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {tenant.tenantId}</p>
          <p className="text-[8px] text-muted-foreground/50 font-mono mt-1">
            EST: {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '---'}
          </p>
          
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.industry}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <Globe size={10} className="text-blue-500" />
                {tenant.industry}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.database}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <Database size={10} className="text-blue-500" />
                {tenant.dbPrefix || '---'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
