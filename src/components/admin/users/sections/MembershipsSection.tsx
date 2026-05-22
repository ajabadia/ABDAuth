'use client';

import * as React from 'react';
import { Plus, Trash2, Shield, Eye, Settings, HelpCircle, CheckCircle2 } from 'lucide-react';
import type { UserTenantMembershipDisplay, UserManagementTranslations } from '../types';

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
          {memberships.map((membership) => {
            const tenantMeta = tenants.find((tOrg) => tOrg.id === membership.tenantId);
            const tenantName = tenantMeta?.name || membership.tenantId;
            const licensedApps = tenantMeta?.allowedApps || [];
            const isDefault = defaultTenantId === membership.tenantId;

            return (
              <div
                key={membership.tenantId}
                className={`border p-4 bg-card/40 transition-all duration-150 rounded-none relative ${
                  isDefault ? 'border-primary/40 shadow-[0_0_15px_-3px_rgba(var(--primary),0.05)]' : 'border-border/60'
                }`}
              >
                {/* Header of Tenant membership */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-border/40 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    {/* Default selector */}
                    <button
                      type="button"
                      disabled={!isSuperAdmin && !isDefault}
                      onClick={() => onDefaultTenantChange(membership.tenantId)}
                      className={`text-[9px] font-mono font-black uppercase px-2 py-1 transition-all rounded-none flex items-center gap-1.5 ${
                        isDefault
                          ? 'bg-primary/10 border border-primary/30 text-primary'
                          : 'bg-transparent border border-border hover:border-border/80 text-muted-foreground'
                      }`}
                      title={t.form.default_tenant}
                    >
                      <CheckCircle2 size={10} className={isDefault ? 'animate-pulse' : ''} />
                      {isDefault ? t.form.default_tenant : 'Set Default'}
                    </button>
                    <div>
                      <h4 className="text-xs font-black uppercase text-foreground tracking-tight">
                        {tenantName}
                      </h4>
                      <span className="text-[9px] font-mono text-muted-foreground/60 uppercase">
                        ID: {membership.tenantId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role select */}
                    <div className="flex items-center gap-1.5">
                      <Shield size={12} className="text-muted-foreground/50" />
                      <select
                        value={membership.role}
                        onChange={(e) =>
                          handleUpdateMembership(membership.tenantId, {
                            role: e.target.value as "owner" | "admin" | "student",
                          })
                        }
                        className="bg-muted/10 border border-border/40 text-[10px] font-bold py-1 px-2 focus:outline-none rounded-none text-foreground uppercase tracking-wider"
                      >
                        <option value="student" className="bg-card text-foreground">Student</option>
                        <option value="admin" className="bg-card text-foreground">Admin</option>
                        <option value="owner" className="bg-card text-foreground">Owner</option>
                      </select>
                    </div>

                    {/* Status Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateMembership(membership.tenantId, {
                          status: membership.status === 'active' ? 'suspended' : 'active',
                        })
                      }
                      className={`text-[9px] font-mono font-black uppercase px-2 py-1 transition-all rounded-none border ${
                        membership.status === 'active'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                          : 'bg-destructive/10 border-destructive/20 text-destructive'
                      }`}
                    >
                      {membership.status === 'active' ? 'Active' : 'Suspended'}
                    </button>

                    {/* Remove button (Super Admin only, and cannot delete if it is the only membership) */}
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMembership(membership.tenantId)}
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors rounded-none border border-transparent hover:border-destructive/20"
                        title="Remove Membership"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Licensed apps checkboxes */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1.5">
                    <Settings size={10} />
                    {t.form.allowed_apps}
                  </span>
                  
                  {licensedApps.length === 0 ? (
                    <p className="text-[10px] text-destructive/80 italic pl-1 font-semibold flex items-center gap-1.5">
                      <HelpCircle size={12} />
                      {t.form.no_apps_for_tenant}
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-secondary/5 border border-border/40 rounded-none">
                      {licensedApps.map((app) => {
                        const isChecked = membership.allowedApps.includes(app);
                        const isInherited = membership.role === 'admin' || membership.role === 'owner';
                        return (
                          <label
                            key={app}
                            className={`flex items-center gap-2 select-none group text-xs text-foreground ${
                              isInherited ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isInherited ? true : isChecked}
                              disabled={isInherited}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const currentApps = membership.allowedApps || [];
                                const updatedApps = checked
                                  ? [...currentApps, app]
                                  : currentApps.filter((a) => a !== app);
                                handleUpdateMembership(membership.tenantId, {
                                  allowedApps: updatedApps,
                                });
                              }}
                              className="rounded-none border-border text-primary focus:ring-primary focus:ring-offset-background"
                            />
                            <span className="font-mono text-[9px] tracking-wide text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                              {app} {isInherited && <span className="text-[8px] text-primary/70 font-sans italic lowercase">(inherited)</span>}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
