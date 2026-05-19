"use client"

import * as React from "react"
import { Plus, Shield, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Link } from "@/i18n/routing"
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
    <div className="flex flex-col gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div className="flex flex-col gap-2">
          {/* Tag Monospace de Ubicación (Breadcrumb) de acuerdo con la guía de estilo */}
          <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
            <Shield size={14} className="text-primary animate-pulse" aria-hidden="true" />
            {t.controlConsole || "CONSOLA DE CONTROL"} • {t.menuApplications || "APPLICATIONS"}
          </div>
          
          {/* Fila de Título e Interacción */}
          <div className="flex items-center gap-4 mt-1">
            <Link
              href="/dashboard"
              aria-label={t.backToDashboard || "Back to dashboard"}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <ArrowLeft size={14} />
            </Link>
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none flex-1 truncate">
              {t.title}
            </h1>
          </div>
          
          {/* Subtítulo descriptivo en Geist Sans, tamaño normal y sentence-case */}
          <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
            {t.subtitle} • <span className="text-primary font-bold">{apps.length} records</span>
          </p>
        </div>
        
        <button 
          aria-label={t.add_app}
          onClick={() => { setEditingApp(null); setIsDialogOpen(true); }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-transparent text-primary border border-primary/40 hover:border-primary hover:bg-primary/10 font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer rounded-none active:scale-[0.98]"
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
        <div className="p-20 text-center border border-dashed border-border rounded-none">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground animate-pulse font-bold">
            {t.no_apps}
          </p>
        </div>
      )}

      {/* Industrial Modal */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsDialogOpen(false)} />
          
          <div className="relative w-full max-w-lg bg-card border border-border rounded-none shadow-xl overflow-y-auto max-h-[95vh] md:max-h-[90vh] animate-in zoom-in-95 duration-200">
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
