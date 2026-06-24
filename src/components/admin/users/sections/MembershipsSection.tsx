'use client';

/**
 * @purpose Gestiona secciones para administrar membresías de usuarios, incluyendo agregar, eliminar y actualizar membresías.
 * @purpose_en Renders a section for managing user memberships, including adding, removing, and updating memberships.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:4,sig:16rc04v
 * @lastUpdated 2026-06-21T10:36:05.489Z
 */

import * as React from 'react';
import { Plus } from 'lucide-react';
import type { UserTenantMembershipDisplay, UserManagementTranslations } from '../types';
import { MembershipCard } from './MembershipCard';

interface MembershipsSectionProps {
  memberships: UserTenantMembershipDisplay[];
  onChange: (memberships: UserTenantMembershipDisplay[]) => void;
  defaultTenantId: string;
  onDefaultTenantChange: (tenantId: string) => void;
  tenants: { id: string; name: string; allowedApps?: string[] }[];
  t: UserManagementTranslations;
  isSuperAdmin: boolean;
}

export function MembershipsSection({
  memberships = [],
  onChange,
  defaultTenantId,
  onDefaultTenantChange,
  tenants,
  t,
  isSuperAdmin,
}: MembershipsSectionProps) {
  const [selectedNewTenant, setSelectedNewTenant] = React.useState('');

  // Filter available tenants that are not already added
  const availableTenants = tenants.filter(
    (tOrg) => !memberships.some((m) => m.tenantId === tOrg.id)
  );

  const handleAddMembership = () => {
    if (!selectedNewTenant) return;
    const tenantMeta = tenants.find((tOrg) => tOrg.id === selectedNewTenant);
    if (!tenantMeta) return;

    const newMembership: UserTenantMembershipDisplay = {
      tenantId: selectedNewTenant,
      role: 'student',
      status: 'active',
      allowedApps: [], // start with no allowed apps (explicit assignment required)
    };

    const updated = [...memberships, newMembership];
    onChange(updated);
    
    // If it's the first membership, automatically set as default
    if (!defaultTenantId || memberships.length === 0) {
      onDefaultTenantChange(selectedNewTenant);
    }
    
    setSelectedNewTenant('');
  };

  const handleRemoveMembership = (tenantId: string) => {
    const updated = memberships.filter((m) => m.tenantId !== tenantId);
    onChange(updated);
    
    // If the removed membership was the default, set another default
    if (defaultTenantId === tenantId) {
      onDefaultTenantChange(updated[0]?.tenantId || '');
    }
  };

  const handleUpdateMembership = (
    tenantId: string,
    updates: Partial<UserTenantMembershipDisplay>
  ) => {
    const updated = memberships.map((m) => {
      if (m.tenantId === tenantId) {
        return { ...m, ...updates };
      }
      return m;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">
          {t.form.memberships}
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* Add Membership form (Super Admin only) */}
      {isSuperAdmin && availableTenants.length > 0 && (
        <div className="flex gap-3 bg-secondary/10 border border-border/40 p-4 rounded-none items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              {t.form.tenant}
            </label>
            <select
              value={selectedNewTenant}
              onChange={(e) => setSelectedNewTenant(e.target.value)}
              className="w-full h-10 bg-muted/20 border border-border/50 rounded-none text-xs px-3 focus:outline-none focus:border-primary/50 transition-all font-bold"
            >
              <option value="" className="bg-card text-muted-foreground">
                {t.form.select_tenant_placeholder}
              </option>
              {availableTenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id} className="bg-card text-foreground">
                  {tenant.name} ({tenant.id})
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddMembership}
            disabled={!selectedNewTenant}
            className="h-10 px-4 bg-primary hover:bg-primary/80 disabled:opacity-40 text-primary-foreground font-black text-[10px] uppercase tracking-widest transition-all rounded-none flex items-center gap-2"
          >
            <Plus size={14} />
            {t.form.add_membership}
          </button>
        </div>
      )}

      {memberships.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border rounded-none">
          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
            {t.form.no_memberships}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {memberships.map((membership) => (
            <MembershipCard
              key={membership.tenantId}
              membership={membership}
              tenants={tenants}
              defaultTenantId={defaultTenantId}
              isSuperAdmin={isSuperAdmin}
              t={t}
              onUpdate={handleUpdateMembership}
              onRemove={handleRemoveMembership}
              onSetDefault={onDefaultTenantChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
