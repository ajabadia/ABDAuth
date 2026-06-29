/**
 * @purpose Renderiza un componente de diseño con soporte a la internacionalización, configuraciones específicas para el inquilino y elementos de navegación.
 * @purpose_en Renders a layout component with internationalization support, tenant-specific settings, and navigation elements.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:7,sig:9ab8cp
 * @lastUpdated 2026-06-29T00:00:00.000Z
 */

import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getServerSession } from '@/lib/get-session';
import { tenantRepository } from "@/lib/repositories/TenantRepository";
import type { TenantId } from '@/lib/schemas/common';
import type { IndustrialUser } from '@/types/auth';
import { generateTenantCss } from "@ajabadia/styles";
import { SidebarNavigation } from "@/components/SidebarNavigation";
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

  let branding: { logoUrl: string | null; styleTag: React.ReactNode } = { logoUrl: null, styleTag: null };
  const user = session?.user as unknown as IndustrialUser | undefined;
  if (user?.tenantId) {
    try {
      const tenant = await tenantRepository.findByTenantId(user.tenantId as TenantId);
      if (tenant?.branding) {
        branding = {
          logoUrl: tenant.branding.logoUrl || null,
          styleTag: tenant.branding.theme ? (
            <style id="tenant-branding-gateway" dangerouslySetInnerHTML={{ __html: generateTenantCss(tenant.branding.theme) }} />
          ) : null,
        };
      }
    } catch (err) {
      console.error("Failed to retrieve tenant branding from database:", err);
    }
  }

  const logsServiceUrl = process.env.LOGS_SERVICE_URL || 'http://localhost:5003/api/logs';
  let logsAuditUrl = '';
  try {
    const logsOrigin = new URL(logsServiceUrl).origin;
    logsAuditUrl = `${logsOrigin}/${locale}/admin/audit`;
  } catch (err) {
    console.error("Failed to parse LOGS_SERVICE_URL:", err);
    logsAuditUrl = `http://localhost:5003/${locale}/admin/audit`;
  }

  return (
    <AppShellLayout
      locale={locale}
      messages={messages}
      brandingStyles={branding.styleTag}
      sidebarNavigation={
        <SidebarNavigation
          session={session ? { authenticated: true, user } : { authenticated: false }}
          logoUrl={branding.logoUrl}
          logsAuditUrl={logsAuditUrl}
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
