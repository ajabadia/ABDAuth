"use client"

import * as React from "react"
import { Plus, Database } from 'lucide-react'
import type { Tenant } from "@/lib/schemas/auth"
import { TenantDialog } from "./TenantDialog"
import { TenantCard } from "./TenantCard"
import { useRouter } from "next/navigation"
import type { TenantManagementTranslations } from "./types"
import { PageHeader } from "@/components/ui/industrial/PageHeader"
import { IndustrialSearchInput } from "@/components/ui/industrial/SearchInput"

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
      <PageHeader 
        title={t.title}
        subtitle={`${t.subtitle} • ${tenants.length} records`}
        breadcrumb="CONSOLA DE CONTROL • ORGANIZATIONS"
        icon={Database}
        backHref="/dashboard"
        backAriaLabel="Back to dashboard"
        actionButton={
          <button 
            aria-label={t.new_tenant}
            onClick={() => { setEditingTenant(null); setIsDialogOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98]"
          >
            <Plus size={14} />
            {t.new_tenant}
          </button>
        }
      />

      <IndustrialSearchInput 
        value={search} 
        onChange={setSearch} 
        placeholder="Search organizations..." 
        ariaLabel="Search organizations" 
      />

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
