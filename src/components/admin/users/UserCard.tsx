"use client"

/**
 * @purpose Renderiza un componente tarjeta de usuario con detalles y acciones para gestionar usuarios, incluyendo resetear MFA.
 * @purpose_en Renders a user card component with details and actions for managing users, including resetting MFA.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:1ltu5l
 * @lastUpdated 2026-06-21T10:36:36.522Z
 */

import * as React from "react"
import { Shield, Edit3, Briefcase, RefreshCw, Loader2 } from 'lucide-react'
import type { IndustrialUserDisplay, UserManagementTranslations } from "./types"
import { adminResetMfaAction } from "@/services/auth/security-actions"
import { toast } from "sonner"
import { ConfirmDialog, useConfirmDialog } from "@ajabadia/ecosystem-widgets"

interface UserCardProps {
  user: IndustrialUserDisplay
  t: UserManagementTranslations
  isSuperAdmin: boolean
  onEdit: (user: IndustrialUserDisplay) => void
}

export function UserCard({ user, t, isSuperAdmin, onEdit }: UserCardProps) {
  const resetMfaDialog = useConfirmDialog({
    onConfirm: async () => {
      try {
        await adminResetMfaAction(user._id);
        toast.success(t.mfa.reset_success || 'MFA Reseteado correctamente');
      } catch (err: unknown) {
        toast.error(t.mfa.reset_error || 'Error al resetear MFA', {
          description: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    },
  });

  const handleResetMfa = () => {
    resetMfaDialog.trigger();
  };

  const loading = resetMfaDialog.isLoading;
  const initials = `${(user.name || 'U').charAt(0)}${(user.surname || '').charAt(0)}`.toUpperCase();

  return (
    <div className="bg-card p-5 rounded-none border border-border hover:border-primary/40 transition-all group relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        {user.mfaEnabled && (
           <button 
             aria-label={t.mfa.reset}
             onClick={handleResetMfa}
             disabled={loading}
             className="p-1.5 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 rounded-none transition-colors"
             title={t.mfa.reset}
           >
             {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
           </button>
        )}
        <button 
          aria-label={t.editUser}
          onClick={() => onEdit(user)}
          className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-none transition-colors"
        >
          <Edit3 size={14} />
        </button>
      </div>

      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-primary/5 rounded-none flex items-center justify-center border border-primary/20 text-primary">
          <span className="font-black text-xs tracking-tighter">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-sm truncate">{user.name} {user.surname}</h3>
            <div className="flex gap-1">
              {user.status === 'SUSPENDED' ? (
                <span className="px-1.5 py-0.5 rounded-none text-[8px] font-black bg-destructive/10 text-destructive uppercase tracking-widest border border-destructive/10">
                  {t.status.suspended}
                </span>
              ) : !user.emailVerified ? (
                <span className="px-1.5 py-0.5 rounded-none text-[8px] font-black bg-amber-500/10 text-amber-500 uppercase tracking-widest border border-amber-500/10 animate-pulse">
                  {t.status.pending}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-none text-[8px] font-black bg-emerald-500/10 text-emerald-500 uppercase tracking-widest border border-emerald-500/10">
                  {t.status.active}
                </span>
              )}
              <span className={`px-1.5 py-0.5 rounded-none text-[8px] font-black ${user.mfaEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} uppercase tracking-widest border border-current/10`}>
                {user.mfaEnabled ? t.mfa.enabled : t.mfa.disabled}
              </span>
              {user.mfaEnforced && !user.mfaEnabled && (
                <span className="px-1.5 py-0.5 rounded-none text-[8px] font-black bg-amber-500/10 text-amber-500 uppercase tracking-widest border border-amber-500/20 animate-pulse">
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
                <Shield size={10} className="text-primary" />
                {t.roles[user.role] || user.role}
              </div>
            </div>
            
            {isSuperAdmin && (
              <div className="space-y-1">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.columns.tenant}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <Briefcase size={10} className="text-primary" />
                  <span className="truncate">{user.tenantId}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={resetMfaDialog.open}
        title={t.mfa.reset || "RESET MFA"}
        message={t.mfa.reset_confirm}
        confirmLabel="RESET"
        cancelLabel="CANCELAR"
        variant="warning"
        isLoading={resetMfaDialog.isLoading}
        onConfirm={resetMfaDialog.confirm}
        onCancel={resetMfaDialog.cancel}
      />
    </div>
  )
}
