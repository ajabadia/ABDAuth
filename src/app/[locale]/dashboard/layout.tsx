import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import { getTranslations } from 'next-intl/server';
import { tenantRepository } from "@/lib/repositories/TenantRepository";
import type { TenantId } from '@/lib/schemas/common';
import { TacticalSidebar } from "@/components/TacticalSidebar";
import { SystemSettings } from "@/components/ui/SystemSettings";

import type { IndustrialSession } from "@/types/auth";

/**
 * 🏰 Dashboard Layout (Industrial Localized)
 * Shared sidebar and header with localized navigation and RBAC.
 */
export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const t = await getTranslations('dashboard');
  const { locale } = await params;

  if (!session) {
    redirect({ href: '/login', locale });
    return null;
  }

  const user = session.user as unknown as IndustrialSession;

  // 🎨 Resolve active tenant logo dynamically for unified dashboard branding
  let logoUrl: string | null = null;
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

  // 🔍 Derive central logs audit URL dynamically
  const logsServiceUrl = process.env.LOGS_SERVICE_URL || 'http://localhost:3600/api/logs';
  let logsAuditUrl = '';
  try {
    const logsOrigin = new URL(logsServiceUrl).origin;
    logsAuditUrl = `${logsOrigin}/${locale}/admin/audit`;
  } catch (err) {
    console.error("Failed to parse LOGS_SERVICE_URL:", err);
    logsAuditUrl = `http://localhost:3600/${locale}/admin/audit`;
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 transition-colors duration-300">
      <div className="bg-grain" />

      <TacticalSidebar user={user} logoUrl={logoUrl} locale={locale} logsAuditUrl={logsAuditUrl} />

      {/* ⚙️ Floating System Settings Trigger (Top-Right) */}
      <div className="fixed top-6 right-6 z-40">
        <SystemSettings isAuthenticated={!!session} />
      </div>

      <main className="min-h-screen bg-background text-foreground pt-24 pb-12 px-6 md:px-12 selection:bg-primary/30 relative z-10" role="main">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          {children}
          
          <footer className="mt-auto pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 opacity-30">
            <div className="text-[9px] font-mono tracking-tighter uppercase text-muted-foreground">{t('common.industrial_ecosystem')}</div>
            <div className="text-[9px] font-mono tracking-tighter uppercase text-muted-foreground">{t('common.soc2_monitoring')}</div>
          </footer>
        </div>
      </main>
    </div>
  );
}
