"use client";

/**
 * @purpose Renderiza un menú de navegación lateral basado en autenticación del usuario y rol, utilizando el componente SmartNavbar de @ajabadia/ecosystem-widgets.
 * @purpose_en Renders a sidebar navigation menu based on user authentication and role, using the SmartNavbar component from @ajabadia/ecosystem-widgets.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:4e6qvn
 * @lastUpdated 2026-06-23T22:40:39.830Z
 */

import { useTranslations, useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { SmartNavbar, buildSidebarLinks } from "@ajabadia/ecosystem-widgets";
import type { NavLinkConfig } from "@ajabadia/ecosystem-widgets";
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

/**
 * 🛰️ SidebarNavigation (Client Wrapper)
 * Wraps SmartNavbar from @ajabadia/ecosystem-widgets,
 * passing local links, icons, and next-intl translations.
 */
export function SidebarNavigation({ session, logoUrl, logsAuditUrl, tenantSelectorSlot, settingsSlot }: SidebarNavigationProps) {
  const t = useTranslations("dashboard.menu");
  const common = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const isLoggedIn = session.authenticated && !!session.user;
  const user = session.user;

  // Define all links with auth guards for buildSidebarLinks to filter
  const allLinks: NavLinkConfig[] = [
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

  const links = buildSidebarLinks(allLinks, user?.role, isLoggedIn);

  const handleLocaleChange = (newLocale: string) => {
    let domainSuffix = "";
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        domainSuffix = `; domain=.${parts.slice(-2).join('.')}`;
      }
    }
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax${domainSuffix}`;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`${pathname}${search}`, { locale: newLocale });
  };

  const mappedSession = {
    authenticated: session.authenticated,
    user: session.user ? {
      name: session.user.name,
      role: session.user.role,
      tenantId: session.user.tenantId,
      email: session.user.email || undefined,
    } : undefined
  };

  return (
    <SmartNavbar
      session={mappedSession}
      links={links}
      logoUrl={logoUrl}
      onLogout={async () => { await authClient.signOut(); window.location.href = '/'; }}
      onLogin={() => { window.location.href = '/login'; }}
      onLocaleChange={handleLocaleChange}
      brandName={common("brand")}
      activeHref={pathname}
      locale={locale}
      tenantSelectorSlot={tenantSelectorSlot}
      settingsSlot={settingsSlot}
      appBadge="AUTH"
      onSearchTrigger={() => {
        window.dispatchEvent(new CustomEvent('abd-command-palette-open'));
      }}
      translations={{
        brandFallback: common("brand"),
        logoutBtn: "TERMINAR SESIÓN",
        identityProvider: "IDENTITY PROVIDER",
        statusOnline: "ONLINE",
        emailLabel: "EMAIL",
      }}
    />
  );
}
