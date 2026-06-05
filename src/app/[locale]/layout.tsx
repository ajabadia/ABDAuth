import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getServerSession } from '@/lib/get-session';
import { tenantRepository } from "@/lib/repositories/TenantRepository";
import type { TenantId } from '@/lib/schemas/common';
import { SidebarNavigation } from "@/components/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { AuthCommandPalette } from "@/components/AuthCommandPalette";

/**
 * 🌍 Locale Layout (Industrial)
 * Provides internationalization context to all localized routes.
 * Messages are fetched server-side and passed to the client provider.
 */
export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // 🛡️ Integrity Check
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  // 📦 Load messages with explicit typing
  const messages = (await getMessages()) as AbstractIntlMessages;
  const session = await getServerSession();

  // Resolve logo dynamically
  let logoUrl: string | null = null;
  const user = session?.user;
  if (user?.tenantId) {
    try {
      const tenant = await tenantRepository.findByTenantId(user.tenantId as TenantId);
      if (tenant?.branding?.logoUrl) {
        logoUrl = tenant.branding.logoUrl;
      }
    } catch (err) {
      console.error("Failed to retrieve tenant logo from database:", err);
    }
  }

  // Derive central logs audit URL
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
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
        <div className="bg-grain" />

        <SidebarNavigation
          session={session ? { authenticated: true, user } : { authenticated: false }}
          logoUrl={logoUrl}
          logsAuditUrl={logsAuditUrl}
          tenantSelectorSlot={user ? <TenantSelector sessionUser={user} /> : undefined}
          settingsSlot={<SystemSettings isAuthenticated={!!session} />}
        />

        <AuthCommandPalette />

        {children}
      </div>
    </NextIntlClientProvider>
  );
}
