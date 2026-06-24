"use client"

/**
 * @purpose Gestiona y muestra una lista de inquilinos con opciones para editar, eliminar y agregar nuevos inquilinos.
 * @purpose_en Manages and displays a list of tenants with options to edit, delete, and add new tenants.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:11,sig:ic8xwz
 * @lastUpdated 2026-06-21T10:33:34.631Z
 */

import * as React from "react"
import { Plus, Database } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog, useConfirmDialog } from '@ajabadia/ecosystem-widgets'
import type { Tenant } from "@/lib/schemas/auth"
import { TenantDialog } from "./TenantDialog"
import { TenantCard } from "./TenantCard"
import { useRouter } from "next/navigation"
import type { TenantManagementTranslations } from "./types"
import { PageHeader } from "@/components/ui/industrial/PageHeader"
import { IndustrialSearchInput } from "@ajabadia/ecosystem-widgets"

interface TenantManagementContainerProps {
  initialTenants: Tenant[]
  translations: TenantManagementTranslations
}

export function TenantManagementContainer({ initialTenants, translations: t }: TenantManagementContainerProps) {
  const [tenants, setTenants] = React.useState<Tenant[]>(initialTenants)
  const [search, setSearch] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingTenant, setEditingTenant] = React.useState<Tenant | null>(null)
  const deleteDialog = useConfirmDialog<string>({
    onConfirm: async (id) => {
      const promise = fetch(`/api/admin/tenants/${id}`, {
        method: 'DELETE',
      }).then(async response => {
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          throw new Error(errData.error || 'Error al eliminar organización')
        }
        router.refresh()
        setTenants(prev => prev.map(ten => ten._id?.toString() === id ? { ...ten, active: false } : ten))
      })
      toast.promise(promise, {
        loading: 'Eliminando organización...',
        success: 'Organización eliminada correctamente',
        error: (err: Error) => err.message || 'Error al eliminar organización',
      })
      await promise
    },
  })
  const router = useRouter()

  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(search.toLowerCase()) ||
    tenant.tenantId.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (data: Partial<Tenant>) => {
    const isEditing = !!editingTenant
    const url = isEditing ? `/api/admin/tenants/${editingTenant._id}` : '/api/admin/tenants'
    const method = isEditing ? 'PATCH' : 'POST'

    const promise = fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(async response => {
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Error ${response.status} al guardar tenant`)
      }
      router.refresh()
      const updatedResponse = await fetch('/api/admin/tenants')
      if (updatedResponse.ok) {
        const newData = await updatedResponse.json()
        setTenants(newData)
      }
      return response
    })

    toast.promise(promise, {
      loading: isEditing ? 'Actualizando organización...' : 'Creando organización...',
      success: isEditing ? 'Organización actualizada correctamente' : 'Organización creada correctamente',
      error: (err: Error) => err.message || 'Error al guardar organización',
    })
  }

  const handleDelete = (id: string) => {
    deleteDialog.trigger(id)
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

      <ConfirmDialog
        open={deleteDialog.open}
        title="ELIMINAR ORGANIZACIÓN"
        message={t.confirm_delete}
        confirmLabel="ELIMINAR"
        cancelLabel="CANCELAR"
        variant="danger"
        isLoading={deleteDialog.isLoading}
        onConfirm={deleteDialog.confirm}
        onCancel={deleteDialog.cancel}
      />
    </div>
  )
}
