import type { UserRole } from "@/lib/schemas/auth";

export interface IndustrialUserDisplay {
  _id: string;
  email: string;
  name?: string;
  surname?: string;
  role: UserRole;
  tenantId: string;
  status?: 'ACTIVE' | 'SUSPENDED';
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
}

export type UserSubmitHandler = (data: IndustrialUserFormValues) => Promise<void>;
