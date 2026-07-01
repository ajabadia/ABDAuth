"use client";

/**
 * @purpose Renderiza un componente de navegación lateral basado en sesión del usuario y rol.
 * @purpose_en Renders a sidebar navigation component based on user session and role.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:ynjgiq
 * @lastUpdated 2026-07-01T05:17:12.335Z
 */

import { useTranslations, useLocale } from "next-intl";
import { AppSidebarNavigation, type AppSidebarLink } from "@ajabadia/ecosystem-widgets";
import { LayoutDashboard, Users, Shield, ScrollText, Key, Globe } from "lucide-react";

interface UserSession {
  authenticated: boolean;
  user?: {
    name: string;
    surname?: string | null;
    email?: string | null;
    role: string;
    tenantId: string;
  };
}

interface SidebarNavigationProps {
  session: UserSession;
  logoUrl?: string | null;
  logsAuditUrl?: string;
  tenantSelectorSlot?: React.ReactNode;
  settingsSlot?: React.ReactNode;
}

export function SidebarNavigation({ session, logoUrl, logsAuditUrl, tenantSelectorSlot, settingsSlot }: SidebarNavigationProps) {
  const t = useTranslations("dashboard.menu");
  const common = useTranslations("common");
  const locale = useLocale();

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;

  const mappedSession = {
    authenticated: session.authenticated,
    user: session.user ? {
      name: session.user.name,
      role: session.user.role,
      tenantId: session.user.tenantId,
      email: session.user.email || undefined,
    } : undefined
  };

  const allLinks: AppSidebarLink[] = [
    { href: "/dashboard", label: t("overview"), icon: <LayoutDashboard size={14} />, requiresAuth: true },
  ];

  if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "PROFESSOR") {
    allLinks.push({ href: "/dashboard/users", label: t("users"), icon: <Users size={14} />, requiresAdmin: true });
  }

  if (user?.role === "SUPER_ADMIN") {
    allLinks.push({ href: "/dashboard/applications", label: t("applications"), icon: <Shield size={14} />, requiresAdmin: true });
    allLinks.push({ href: "/dashboard/identity-providers", label: t("identity_providers"), icon: <Globe size={14} />, requiresAdmin: true });
  }

  if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "PROFESSOR") {
    allLinks.push({ href: logsAuditUrl || "/dashboard/security", label: t("audit"), icon: <ScrollText size={14} />, requiresAdmin: true });
  }

  allLinks.push({ href: "/dashboard/security", label: t("security"), icon: <Key size={14} />, requiresAuth: true });

  return (
    <AppSidebarNavigation
      session={mappedSession}
      logoUrl={logoUrl}
      links={allLinks}
      brandName={common("brand")}
      appBadge="AUTH"
      onLogin={() => { window.location.href = '/login'; }}
      onLogout={() => { window.location.href = '/api/auth/logout?redirectUri=/login'; }}
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
    />
  );
}
