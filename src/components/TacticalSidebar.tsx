"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { signOut } from "next-auth/react";
import { TacticalSidebar as SharedTacticalSidebar } from "@abd/styles";
import { LayoutDashboard, Users, Shield, ScrollText, Key, Settings } from "lucide-react";

interface NavUser {
  name: string;
  role: string;
  tenantId: string;
  email?: string;
}

interface TacticalSidebarProps {
  user: NavUser;
  logoUrl?: string | null;
  locale: string;
}

/**
 * 🛰️ TacticalSidebar (Client Wrapper)
 * Wraps the central TacticalSidebar component from @abd/styles,
 * passing local links, icons, next-intl translations, routing Link, and signOut.
 */
export function TacticalSidebar({ user, logoUrl, locale }: TacticalSidebarProps) {
  const t = useTranslations("dashboard.menu");
  const common = useTranslations("common");
  const pathname = usePathname();

  // Construct links dynamically based on user role
  const links = [
    { href: "/dashboard", label: t("overview"), icon: <LayoutDashboard size={14} /> },
  ];

  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    links.push({ href: "/dashboard/users", label: t("users"), icon: <Users size={14} /> });
  }

  if (user.role === "SUPER_ADMIN") {
    links.push({ href: "/dashboard/applications", label: t("applications"), icon: <Shield size={14} /> });
  }

  if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
    links.push({ href: "/dashboard/audit", label: t("audit"), icon: <ScrollText size={14} /> });
  }

  links.push({ href: "/dashboard/security", label: t("security"), icon: <Key size={14} /> });

  return (
    <SharedTacticalSidebar
      user={user}
      links={links}
      logoUrl={logoUrl}
      onLogout={() => signOut({ callbackUrl: "/" })}
      brandName={user.tenantId || common("brand")}
      LinkComponent={CustomLink}
      activeHref={pathname}
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

const CustomLink = ({ href, onClick, className, children }: { href: string; onClick?: () => void; className?: string; children: React.ReactNode }) => (
  <Link href={href} onClick={onClick} className={className}>
    {children}
  </Link>
);
