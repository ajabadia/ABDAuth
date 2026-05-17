"use client"

import * as React from "react"
import { Shield, Edit3, Briefcase, RefreshCw, Loader2 } from 'lucide-react'
import type { IndustrialUserDisplay, UserManagementTranslations } from "./types"
import { adminResetMfaAction } from "@/services/auth/security-actions"
import { toast } from "sonner"

interface UserCardProps {
  user: IndustrialUserDisplay
  t: UserManagementTranslations
  isSuperAdmin: boolean
  onEdit: (user: IndustrialUserDisplay) => void
}

export function UserCard({ user, t, isSuperAdmin, onEdit }: UserCardProps) {
  const [loading, setLoading] = React.useState(false);
  const initials = `${(user.name || 'U').charAt(0)}${(user.surname || '').charAt(0)}`.toUpperCase();
  
  const handleResetMfa = async () => {
    if (!confirm(t.mfa.reset_confirm)) return;
    setLoading(true);
    try {
      await adminResetMfaAction(user._id);
      toast.success('MFA Reseteado correctamente');
      // The page will revalidate via server action
    } catch (err: unknown) {
      toast.error('Error al resetear MFA', {
        description: err instanceof Error ? err.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card p-5 rounded-xl border border-border hover:border-blue-500/30 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        {user.mfaEnabled && (
           <button 
             aria-label={t.mfa.reset}
             onClick={handleResetMfa}
             disabled={loading}
             className="p-1.5 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 rounded transition-colors"
             title={t.mfa.reset}
           >
             {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
           </button>
        )}
        <button 
          aria-label={t.editUser}
          onClick={() => onEdit(user)}
          className="p-1.5 hover:bg-blue-500/10 text-muted-foreground hover:text-blue-500 rounded transition-colors"
        >
          <Edit3 size={14} />
        </button>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-600/5 rounded-lg flex items-center justify-center border border-blue-500/10 text-blue-500">
          <span className="font-black text-xs tracking-tighter">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm truncate">{user.name} {user.surname}</h3>
            <div className="flex gap-1">
              {user.status === 'SUSPENDED' ? (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-red-500/10 text-red-500 uppercase tracking-widest border border-red-500/10">
                  {t.status.suspended}
                </span>
              ) : !user.emailVerified ? (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500/10 text-amber-500 uppercase tracking-widest border border-amber-500/10 animate-pulse">
                  {t.status.pending}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-emerald-500/10 text-emerald-500 uppercase tracking-widest border border-emerald-500/10">
                  {t.status.active}
                </span>
              )}
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${user.mfaEnabled ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-500'} uppercase tracking-widest border border-current/10`}>
                {user.mfaEnabled ? t.mfa.enabled : t.mfa.disabled}
              </span>
              {user.mfaEnforced && !user.mfaEnabled && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-amber-500/10 text-amber-500 uppercase tracking-widest border border-amber-500/20 animate-pulse">
                  Mandatory
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{user.email}</p>
          <p className="text-[8px] text-muted-foreground/50 font-mono mt-1">
            REG: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '---'}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.columns.role}</p>
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <Shield size={10} className="text-blue-500" />
                {t.roles[user.role] || user.role}
              </div>
            </div>
            
            {isSuperAdmin && (
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.columns.tenant}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <Briefcase size={10} className="text-blue-500" />
                  <span className="truncate">{user.tenantId}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
