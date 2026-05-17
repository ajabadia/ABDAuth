import type { UserRole } from "@/lib/schemas/auth";

export interface IndustrialUserDisplay {
  _id: string;
  email: string;
  name?: string;
  surname?: string;
  role: UserRole;
  tenantId: string;
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
  mfaEnforced: boolean;
}

export type UserSubmitHandler = (data: IndustrialUserFormValues) => Promise<void>;
