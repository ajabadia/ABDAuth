'use client';

/**
 * @purpose Gestiona una sección de gobernanza con opciones de selección de rol y validación de MFA para el manejo de usuarios.
 * @purpose_en Renders a governance section with role selection and MFA enforcement options for user management.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:aw5v1n
 * @lastUpdated 2026-06-21T14:24:59.982Z
 */

import { Label } from "@/components/ui/label";
import { Shield, Briefcase, ChevronDown } from "lucide-react";
import type { UserManagementTranslations } from "../types";

interface GovernanceSectionProps {
  formData: {
    role: string;
    tenantId: string;
    mfaEnforced: boolean;
  };
  tenants: { id: string; name: string }[];
  isSuperAdmin: boolean;
  t: UserManagementTranslations;
  onChange: (name: string, value: string | boolean) => void;
}

export function GovernanceSection({ formData, tenants, isSuperAdmin, t, onChange }: GovernanceSectionProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">{t.form.governance_policy}</span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2.5">
          <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
            {t.form.role}
          </Label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={14} />
            <select 
              id="role"
              name="role"
              value={formData.role}
              onChange={(e) => onChange('role', e.target.value)}
              className="w-full pl-10 pr-10 h-11 bg-muted/20 border border-border/50 rounded-lg text-sm appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer font-bold"
            >
              {Object.entries(t.roles).map(([key, label]) => (
                (isSuperAdmin || key !== 'SUPER_ADMIN') && (
                  <option key={key} value={key} className="bg-card text-foreground">{label}</option>
                )
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" size={14} />
          </div>
        </div>

        {isSuperAdmin && (
          <div className="space-y-2.5">
            <Label htmlFor="tenantId" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
              {t.form.tenant}
            </Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={14} />
              <select 
                id="tenantId"
                name="tenantId"
                value={formData.tenantId}
                onChange={(e) => onChange('tenantId', e.target.value)}
                className="w-full pl-10 pr-10 h-11 bg-muted/20 border border-border/50 rounded-lg text-sm appearance-none focus:outline-none focus:border-primary/50 transition-all cursor-pointer font-bold"
                required
              >
                <option value="" disabled className="bg-card text-muted-foreground">{t.form.tenant}</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id} className="bg-card text-foreground">{tenant.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" size={14} />
            </div>
          </div>
        )}
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input 
              type="checkbox" 
              name="mfaEnforced"
              checked={formData.mfaEnforced}
              onChange={(e) => onChange('mfaEnforced', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-10 h-5 bg-muted/40 rounded-full border border-border/50 peer-checked:bg-primary/20 peer-checked:border-primary/50 transition-all duration-300 shadow-inner" />
            <div className="absolute left-1 top-1 w-3 h-3 bg-muted-foreground/30 rounded-full peer-checked:left-6 peer-checked:bg-primary transition-all duration-300 shadow-sm" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground group-hover:text-primary transition-colors">
              {t.form.enforce_mfa}
            </span>
            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight">
              {formData.mfaEnforced ? t.form.mandatory_onboarding : t.form.standard_security}
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
