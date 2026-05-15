import { getMessages, getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserManagementContainer } from "@/components/admin/users/UserManagementContainer";
import type { IndustrialSession } from "@/types/auth";
import type { UserManagementTranslations } from "@/components/admin/users/types";

interface LocalizedMessages {
  dashboard: {
    users: {
      roles: Record<string, string>;
      status: {
        active: string;
        suspended: string;
      };
    };
  };
}

/**
 * 👥 Industrial User Management Page
 * Orchestrates the transition between server-side data and client-side UI.
 */
export default async function UsersPage() {
  const session = await auth() as unknown as { user: IndustrialSession } | null;
  
  if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
    redirect('/login');
  }

  const t = await getTranslations("dashboard.users");
  const messages = await getMessages() as unknown as LocalizedMessages;
  const dashboard = messages.dashboard;

  // Serialize translations for the client orchestrator to ensure zero-noise runtime
  const translations: UserManagementTranslations = {
    title: t("title"),
    subtitle: t("subtitle"),
    addUser: t("add_user"),
    editUser: t("edit_user"),
    columns: {
      user: t("columns.user"),
      role: t("columns.role"),
      tenant: t("columns.tenant"),
      status: t("columns.status"),
      actions: t("columns.actions"),
    },
    roles: dashboard.users.roles,
    status: dashboard.users.status,
    form: {
      email: t("form.email"),
      password: t("form.password"),
      role: t("form.role"),
      tenant: t("form.tenant"),
      save: t("form.save"),
      cancel: t("form.cancel"),
      name: t("form.name"),
      surname: t("form.surname"),
    },
    messages: {
      saveSuccess: t("messages.save_success"),
      saveError: t("messages.save_error"),
    }
  };

  return (
    <div className="container mx-auto py-10">
      <UserManagementContainer 
        t={translations} 
        isSuperAdmin={session.user.role === 'SUPER_ADMIN'} 
      />
    </div>
  );
}
