/**
 * @purpose Gestiona tipos y interfaces de TypeScript para el manejo de usuarios en la aplicación ABDAuth.
 * @purpose_en Defines TypeScript types and interfaces for user management in the ABDAuth application.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:6,imports:1,sig:1sk59ir
 * @lastUpdated 2026-06-21T10:36:20.105Z
 */

import type { UserRole } from "@/lib/schemas/auth";

export interface UserTenantMembershipDisplay {
  tenantId: string;
  role: 'owner' | 'admin' | 'student';
  status: 'active' | 'suspended';
  allowedApps: string[];
}

export interface IndustrialUserDisplay {
  _id: string;
  email: string;
  name?: string;
  surname?: string;
  role: UserRole;
  tenantId: string;
  tenantIds?: string[];
  tenants?: UserTenantMembershipDisplay[];
  status?: 'ACTIVE' | 'SUSPENDED';
  mfaEnabled?: boolean;
  mfaEnforced?: boolean;
  emailVerified?: string;
  createdAt: string;
}

export interface UserManagementTranslations {
  title: string;
  subtitle: string;
  addUser: string;
  editUser: string;
  controlConsole?: string;
  menuUsers?: string;
  backToDashboard?: string;
  columns: {
    user: string;
    role: string;
    tenant: string;
    status: string;
    actions: string;
  };
  roles: Record<string, string>;
  status: {
    active: string;
    suspended: string;
    pending: string;
  };
  mfa: {
    enabled: string;
    disabled: string;
    reset: string;
    reset_confirm: string;
    reset_success: string;
    reset_error: string;
  };
  form: {
    email: string;
    password: string;
    role: string;
    tenant: string;
    save: string;
    cancel: string;
    name: string;
    surname: string;
    core_identity: string;
    governance_policy: string;
    enforce_mfa: string;
    mandatory_onboarding: string;
    standard_security: string;
    memberships: string;
    add_membership: string;
    default_tenant: string;
    no_memberships: string;
    select_tenant_placeholder: string;
    membership_role: string;
    membership_status: string;
    allowed_apps: string;
    no_apps_for_tenant: string;
  };
  messages: {
    saveSuccess: string;
    saveError: string;
  };
}

export type SaveUserAction = (data: Partial<IndustrialUserDisplay>) => Promise<void>;

export interface IndustrialUserFormValues {
  email: string;
  password?: string;
  name: string;
  surname: string;
  role: string;
  tenantId: string;
  tenants?: UserTenantMembershipDisplay[];
  mfaEnforced: boolean;
}

export type UserSubmitHandler = (data: IndustrialUserFormValues) => Promise<void>;

