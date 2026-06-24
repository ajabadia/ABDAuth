"use client";

/**
 * @purpose Renderiza un componente de configuración del sistema que integra con autenticación, localización y gestión de temas.
 * @purpose_en Renders a system settings component that integrates with authentication, localization, and theme management.
 * @refactorable false
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:5,sig:ga16rm
 * @lastUpdated 2026-06-23T22:40:55.128Z
 */

import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { authClient } from "@/lib/auth-client";
import { SystemSettings as SharedSystemSettings } from "@ajabadia/ecosystem-widgets";

/**
 * 🛠️ SystemSettings (Client Wrapper)
 * Wraps the shared, unificated SystemSettings from @ajabadia/styles.
 * Injects local better-auth, next-intl, next-themes hooks and translations dynamically.
 */
export function SystemSettings({ isAuthenticated }: { isAuthenticated?: boolean }) {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  // isAuthenticated prop takes precedence; fallback to false when not provided
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const isAuth = isAuthenticated === undefined ? false : isAuthenticated;

  return (
    <SharedSystemSettings
      locale={locale}
      onLocaleChange={handleLocaleChange}
      theme={theme}
      onThemeChange={setTheme}
      isAuthenticated={isAuth}
      onLogin={() => window.location.href = '/login'}
      onLogout={async () => { await authClient.signOut(); window.location.href = '/'; }}
      versionSignature="ABD_IDENTITY_V1.0"
    />
  );
}
