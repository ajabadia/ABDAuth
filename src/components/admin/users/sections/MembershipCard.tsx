'use client';

/**
 * @purpose Renderiza una tarjeta que muestra detalles de membresía para un usuario en un inquilino, incluyendo opciones para establecer como default, actualizar y eliminar la membresía.
 * @purpose_en Renders a card displaying membership details for a user in a tenant, including options to set as default, update, and remove the membership.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:1jnx03c
 * @lastUpdated 2026-06-21T10:35:50.943Z
 */

import * as React from 'react';
import { Trash2, Shield, CheckCircle2 } from 'lucide-react';
import type { UserTenantMembershipDisplay, UserManagementTranslations } from '../types';
import { LicensedAppsSection } from './LicensedAppsSection';

interface MembershipCardProps {
  membership: UserTenantMembershipDisplay;
  tenants: { id: string; name: string; allowedApps?: string[] }[];
  defaultTenantId: string;
  isSuperAdmin: boolean;
  t: UserManagementTranslations;
  onUpdate: (tenantId: string, updates: Partial<UserTenantMembershipDisplay>) => void;
  onRemove: (tenantId: string) => void;
  onSetDefault: (tenantId: string) => void;
}

export function MembershipCard({ membership, tenants, defaultTenantId, isSuperAdmin, t, onUpdate, onRemove, onSetDefault }: MembershipCardProps) {
  const tenantMeta = tenants.find((tOrg) => tOrg.id === membership.tenantId);
  const tenantName = tenantMeta?.name || membership.tenantId;
  const licensedApps = tenantMeta?.allowedApps || [];
  const isDefault = defaultTenantId === membership.tenantId;

  return (
    <div className={`border p-4 bg-card/40 transition-all duration-150 rounded-none relative ${isDefault ? 'border-primary/40 shadow-[0_0_15px_-3px_rgba(var(--primary),0.05)]' : 'border-border/60'}`}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/40 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <button type="button" disabled={!isSuperAdmin && !isDefault} onClick={() => onSetDefault(membership.tenantId)}
            className={`text-[9px] font-mono font-black uppercase px-2 py-1 transition-all rounded-none flex items-center gap-1.5 ${isDefault ? 'bg-primary/10 border border-primary/30 text-primary' : 'bg-transparent border border-border hover:border-border/80 text-muted-foreground'}`}
            title={t.form.default_tenant}>
            <CheckCircle2 size={10} className={isDefault ? 'animate-pulse' : ''} />
            {isDefault ? t.form.default_tenant : 'Set Default'}
          </button>
          <div>
            <h4 className="text-xs font-black uppercase text-foreground tracking-tight">{tenantName}</h4>
            <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">ID: {membership.tenantId}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-muted-foreground/50" />
            <select value={membership.role} onChange={(e) => onUpdate(membership.tenantId, { role: e.target.value as "owner" | "admin" | "student" })}
              className="bg-muted/10 border border-border/40 text-[10px] font-bold py-1 px-2 focus:outline-none rounded-none text-foreground uppercase tracking-wider">
              <option value="student" className="bg-card text-foreground">Student</option>
              <option value="admin" className="bg-card text-foreground">Admin</option>
              <option value="owner" className="bg-card text-foreground">Owner</option>
            </select>
          </div>

          <button type="button" onClick={() => onUpdate(membership.tenantId, { status: membership.status === 'active' ? 'suspended' : 'active' })}
            className={`text-[9px] font-mono font-black uppercase px-2 py-1 transition-all rounded-none border ${membership.status === 'active' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
            {membership.status === 'active' ? 'Active' : 'Suspended'}
          </button>

          {isSuperAdmin && (
            <button type="button" onClick={() => onRemove(membership.tenantId)}
              className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors rounded-none border border-transparent hover:border-destructive/20" title="Remove Membership">
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      <LicensedAppsSection
        licensedApps={licensedApps}
        allowedApps={membership.allowedApps}
        role={membership.role}
        onUpdate={(updates) => onUpdate(membership.tenantId, updates)}
        t={t}
      />
    </div>
  );
}
