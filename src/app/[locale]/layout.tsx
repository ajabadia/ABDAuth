/**
 * @purpose Renderiza el layout localizado con navegación, marca de tenant y i18n.
 * @purpose_en Renders the locale-scoped layout with navigation, tenant branding, and i18n.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:12,sig:c7b0o8
 * @lastUpdated 2026-06-30T11:38:54.915Z
 */

import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getServerSession } from '@/lib/get-session';
import { resolveBranding } from '@/lib/resolve-branding';
import type { IndustrialUser } from '@/types/auth';
import { generateTenantCss } from "@ajabadia/styles";
import { SidebarNavigation } from "@/components/layout/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { AuthCommandPalette } from "@/components/AuthCommandPalette";
import { AppShellLayout } from "@ajabadia/ecosystem-widgets";

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  const messages = await getMessages();
  const session = await getServerSession();
  const user = session?.user as unknown as IndustrialUser | undefined;
  const branding = await resolveBranding(user?.tenantId, locale);

  return (
    <AppShellLayout
      locale={locale}
      messages={messages}
      brandingStyles={branding.theme ? (
        <style id="tenant-branding-gateway" dangerouslySetInnerHTML={{ __html: generateTenantCss(branding.theme) }} />
      ) : null}
      sidebarNavigation={
        <SidebarNavigation
          session={session ? { authenticated: true, user } : { authenticated: false }}
          logoUrl={branding.logoUrl}
          logsAuditUrl={branding.logsAuditUrl}
          tenantSelectorSlot={user ? <TenantSelector sessionUser={user} /> : undefined}
          settingsSlot={<SystemSettings isAuthenticated={!!session} />}
        />
      }
      commandPalette={<AuthCommandPalette />}
    >
      {children}
    </AppShellLayout>
  );
}
