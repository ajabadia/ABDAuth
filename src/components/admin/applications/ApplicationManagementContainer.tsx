"use client"

import * as React from "react"
import { Plus, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { IndustrialModalHeader } from "@/components/ui/industrial/ModalHeader"
import { IndustrialSearchInput } from "@/components/ui/industrial/SearchInput"
import { ApplicationCard } from "./ApplicationCard"
import { ApplicationForm } from "./ApplicationForm"
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
    <div className="space-y-6">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t.title}</h2>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] mt-1">
            {t.subtitle} • {apps.length} records
          </p>
        </div>
        
        <button 
          aria-label={t.add_app}
          onClick={() => { setEditingApp(null); setIsDialogOpen(true); }}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/10"
        >
          <Plus size={14} />
          {t.add_app}
        </button>
      </header>

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
        <div className="p-20 text-center border border-dashed border-border rounded-xl">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse font-bold">
            {t.no_apps}
          </p>
        </div>
      )}

      {/* Industrial Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsDialogOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <IndustrialModalHeader 
              title={editingApp ? t.edit_app : t.new_app} 
              subtitle="SATELLITE ORCHESTRATOR V1.0" 
              icon={Shield} 
              onClose={() => setIsDialogOpen(false)} 
            />
            <div className="p-0">
              <ApplicationForm 
                initialData={editingApp || undefined}
                t={t}
                onSubmit={handleSave}
                onCancel={() => setIsDialogOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
