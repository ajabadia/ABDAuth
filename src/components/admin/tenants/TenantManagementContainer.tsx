"use client"

import * as React from "react"
import { Plus, Search } from 'lucide-react'
import type { Tenant } from "@/lib/schemas/auth"
import { TenantDialog } from "./TenantDialog"
import { TenantCard } from "./TenantCard"
import { useRouter } from "next/navigation"
import type { TenantManagementTranslations } from "./types"

interface TenantManagementContainerProps {
  initialTenants: Tenant[]
  translations: TenantManagementTranslations
}

export function TenantManagementContainer({ initialTenants, translations: t }: TenantManagementContainerProps) {
  const [tenants, setTenants] = React.useState<Tenant[]>(initialTenants)
  const [search, setSearch] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingTenant, setEditingTenant] = React.useState<Tenant | null>(null)
  const router = useRouter()

  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(search.toLowerCase()) ||
    tenant.tenantId.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (data: Partial<Tenant>) => {
    const isEditing = !!editingTenant
    const url = isEditing ? `/api/admin/tenants/${editingTenant._id}` : '/api/admin/tenants'
    const method = isEditing ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      router.refresh()
      const updatedResponse = await fetch('/api/admin/tenants')
      if (updatedResponse.ok) {
        const newData = await updatedResponse.json()
        setTenants(newData)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirm_delete)) return

    const response = await fetch(`/api/admin/tenants/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      router.refresh()
      setTenants(prev => prev.map(ten => ten._id?.toString() === id ? { ...ten, active: false } : ten))
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t.title}</h2>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] mt-1">
            {t.subtitle} • {tenants.length} records
          </p>
        </div>
        
        <button 
          aria-label={t.new_tenant}
          onClick={() => { setEditingTenant(null); setIsDialogOpen(true); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/10"
        >
          <Plus size={14} />
          {t.new_tenant}
        </button>
      </header>

      <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input 
            type="text" 
            aria-label="Search organizations"
            placeholder="Search organizations..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent border-none focus:ring-0 text-xs pl-10 h-8 text-foreground" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredTenants.map((tenant) => (
          <TenantCard 
            key={tenant._id?.toString()} 
            tenant={tenant} 
            translations={t} 
            onEdit={(ten) => { setEditingTenant(ten); setIsDialogOpen(true); }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <TenantDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        initialData={editingTenant}
        title={editingTenant ? t.edit_tenant : t.register_tenant}
      />
    </div>
  )
}
