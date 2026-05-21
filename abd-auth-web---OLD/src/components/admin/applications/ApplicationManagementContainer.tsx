"use client"

import * as React from "react"
import { Plus, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { IndustrialSearchInput } from "@/components/ui/industrial/SearchInput"
import { PageHeader } from "@/components/ui/industrial/PageHeader"
import { ApplicationCard } from "./ApplicationCard"
import { ApplicationFormModal } from "./ApplicationFormModal"
import type { IndustrialApplicationDisplay, ApplicationManagementTranslations, IndustrialApplicationFormValues } from "./types"

interface ApplicationManagementContainerProps {
  initialApplications: IndustrialApplicationDisplay[]
  t: ApplicationManagementTranslations
}

export function ApplicationManagementContainer({ initialApplications, t }: ApplicationManagementContainerProps) {
  const [apps, setApps] = React.useState<IndustrialApplicationDisplay[]>(initialApplications)
  const [search, setSearch] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingApp, setEditingApp] = React.useState<IndustrialApplicationDisplay | null>(null)
  const router = useRouter()

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    app.clientId.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (data: IndustrialApplicationFormValues) => {
    const isEditing = !!editingApp
    const url = isEditing ? `/api/admin/applications/${editingApp._id}` : '/api/admin/applications'
    const method = isEditing ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      router.refresh()
      const updatedResponse = await fetch('/api/admin/applications')
      if (updatedResponse.ok) {
        const newData = await updatedResponse.json()
        setApps(newData)
        setIsDialogOpen(false)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.delete_confirm)) return

    const response = await fetch(`/api/admin/applications/${id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      router.refresh()
      setApps(prev => prev.filter(a => a._id !== id))
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <PageHeader 
        title={t.title}
        subtitle={`${t.subtitle} • ${apps.length} records`}
        breadcrumb={`${t.controlConsole || "CONSOLA DE CONTROL"} • ${t.menuApplications || "APPLICATIONS"}`}
        icon={Shield}
        backHref="/dashboard"
        backAriaLabel={t.backToDashboard || "Back to dashboard"}
        actionButton={
          <button 
            aria-label={t.add_app}
            onClick={() => { setEditingApp(null); setIsDialogOpen(true); }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98]"
          >
            <Plus size={14} />
            {t.add_app}
          </button>
        }
      />

      <IndustrialSearchInput 
        value={search} 
        onChange={setSearch} 
        placeholder="Search satellites..." 
        ariaLabel="Search satellites" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredApps.map((app) => (
          <ApplicationCard 
            key={app._id} 
            app={app} 
            t={t} 
            onEdit={(a) => { setEditingApp(a); setIsDialogOpen(true); }}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {apps.length === 0 && (
        <div className="p-20 text-center border border-dashed border-border rounded-none">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse font-bold">
            {t.no_apps}
          </p>
        </div>
      )}

      <ApplicationFormModal 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        editingApp={editingApp}
        t={t}
        onSubmit={handleSave}
      />
    </div>
  )
}
