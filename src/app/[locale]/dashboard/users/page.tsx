/**
 * @purpose Gestiona el renderizado de una página de administración de usuarios, maneja autenticación del servidor y carga de datos para usuarios industriales.
 * @purpose_en Orchestrates the rendering of a user management page, handling server-side authentication and data fetching for industrial users.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:zgpwy8
 * @lastUpdated 2026-06-23T22:40:02.384Z
 */

import { getMessages, getTranslations } from "next-intl/server";
import { getServerSession } from '@/lib/get-session';
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
        pending: string;
      };
    };
  };
}

/**
 * 👥 Industrial User Management Page
 * Orchestrates the transition between server-side data and client-side UI.
 */
export default async function UsersPage() {
  const session = await getServerSession() as unknown as { user: IndustrialSession } | null;
  
  if (!session?.user || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN' && session.user.role !== 'PROFESSOR')) {
    redirect('/login');
  }

  const t = await getTranslations("dashboard.users");
  const d = await getTranslations("dashboard");
  const messages = await getMessages() as unknown as LocalizedMessages;
  const dashboard = messages.dashboard;

  // Serialize translations for the client orchestrator to ensure zero-noise runtime
  const translations: UserManagementTranslations = {
    title: t("title"),
    subtitle: t("subtitle"),
    addUser: t("add_user"),
    editUser: t("edit_user"),
    controlConsole: d("control_console"),
    menuUsers: d("menu.users"),
    backToDashboard: d("back_to_dashboard"),
    columns: {
      user: t("columns.user"),
      role: t("columns.role"),
      tenant: t("columns.tenant"),
      status: t("columns.status"),
      actions: t("columns.actions"),
    },
    roles: dashboard.users.roles,
    status: dashboard.users.status,
    mfa: {
      enabled: t("mfa.enabled"),
      disabled: t("mfa.disabled"),
      reset: t("mfa.reset"),
      reset_confirm: t("mfa.reset_confirm"),
      reset_success: t("mfa.reset_success"),
      reset_error: t("mfa.reset_error"),
    },
    form: {
      email: t("form.email"),
      password: t("form.password"),
      role: t("form.role"),
      tenant: t("form.tenant"),
      save: t("form.save"),
      cancel: t("form.cancel"),
      name: t("form.name"),
      surname: t("form.surname"),
      core_identity: t("form.core_identity"),
      governance_policy: t("form.governance_policy"),
      enforce_mfa: t("form.enforce_mfa"),
      mandatory_onboarding: t("form.mandatory_onboarding"),
      standard_security: t("form.standard_security"),
      memberships: t("form.memberships"),
      add_membership: t("form.add_membership"),
      default_tenant: t("form.default_tenant"),
      no_memberships: t("form.no_memberships"),
      select_tenant_placeholder: t("form.select_tenant_placeholder"),
      membership_role: t("form.membership_role"),
      membership_status: t("form.membership_status"),
      allowed_apps: t("form.allowed_apps"),
      no_apps_for_tenant: t("form.no_apps_for_tenant"),
    },
    messages: {
      saveSuccess: t("messages.save_success"),
      saveError: t("messages.save_error"),
    }
  };

  return (
    <UserManagementContainer 
      t={translations} 
      isSuperAdmin={session.user.role === 'SUPER_ADMIN'} 
    />
  );
}
