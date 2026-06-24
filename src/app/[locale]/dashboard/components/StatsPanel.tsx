/**
 * @purpose Renderiza un panel que muestra estadísticas como el número de usuarios, el número de inquilinos y el estado de cumplimiento.
 * @purpose_en Renders a panel displaying statistics such as user count, tenant count, and compliance status.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:vgvd0y
 * @lastUpdated 2026-06-21T10:20:33.225Z
 */

import * as React from "react"
import { Users, Database, Activity } from "lucide-react"

interface StatsPanelProps {
  usersCount: number
  tenantsCount: number
  translations: {
    usersLabel: string
    tenantsLabel: string
    complianceLabel: string
  }
}

export function StatsPanel({ usersCount, tenantsCount, translations: t }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard 
        icon={<Users size={18} />} 
        label={t.usersLabel} 
        value={usersCount.toString()} 
        color="primary" 
      />
      <StatCard 
        icon={<Database size={18} />} 
        label={t.tenantsLabel} 
        value={tenantsCount.toString()} 
        color="secondary" 
      />
      <StatCard 
        icon={<Activity size={18} />} 
        label={t.complianceLabel} 
        value="SOC2_COMPLIANT" 
        color="muted" 
        isText 
      />
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color, 
  isText = false 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  color: 'primary' | 'secondary' | 'muted'
  isText?: boolean 
}) {
  const colors = {
    primary: "text-primary bg-primary/5 border-primary/10 group-hover:border-primary/30",
    secondary: "text-secondary bg-secondary/5 border-secondary/10 group-hover:border-secondary/30",
    muted: "text-muted-foreground bg-muted/10 border-border group-hover:border-primary/20",
  }

  return (
    <div className="bg-card border border-border p-5 rounded-none flex items-center gap-4 group hover:border-border/80 transition-all duration-300 relative overflow-hidden">
      <div className="absolute -bottom-2 -right-2 opacity-5 text-foreground group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className={`w-10 h-10 rounded-none flex items-center justify-center border transition-all duration-300 ${colors[color]}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-[8px] font-mono font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className={`font-mono font-bold uppercase mt-1 ${isText ? 'text-[10px] text-primary' : 'text-xl tracking-tight text-foreground'}`}>{value}</p>
      </div>
    </div>
  )
}
