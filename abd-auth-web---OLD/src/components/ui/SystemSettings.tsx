"use client";

import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useSession, signIn, signOut } from "next-auth/react";
import { SystemSettings as SharedSystemSettings } from "@abd/styles";

/**
 * 🛠️ SystemSettings (Client Wrapper)
 * Wraps the shared, unificated SystemSettings from @abd/styles.
 * Injects local next-auth, next-intl, next-themes hooks and translations dynamically.
 */
export function SystemSettings({ isAuthenticated }: { isAuthenticated?: boolean }) {
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const { status } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const isAuth = isAuthenticated !== undefined ? isAuthenticated : (status === "authenticated");

  return (
    <SharedSystemSettings
      locale={locale}
      onLocaleChange={handleLocaleChange}
      theme={theme}
      onThemeChange={setTheme}
      isAuthenticated={isAuth}
      onLogin={() => signIn()}
      onLogout={() => signOut({ callbackUrl: "/" })}
      versionSignature="ABD_IDENTITY_V1.0"
      translations={{
        title: t("title"),
        close: t("close"),
        language: t("language"),
        theme: t("theme"),
        themeLight: t("theme_light"),
        themeDark: t("theme_dark"),
        themeSystem: t("theme_system"),
        logout: t("logout"),
        login: t("login"),
      }}
    />
  );
}
