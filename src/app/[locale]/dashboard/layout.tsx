import { getServerSession } from '@/lib/get-session';
import { redirect } from "@/i18n/routing";
import { getTranslations } from 'next-intl/server';
import { tenantRepository } from "@/lib/repositories/TenantRepository";
import type { TenantId } from '@/lib/schemas/common';
import { SidebarNavigation } from "@/components/SidebarNavigation";
import { SystemSettings } from "@/components/ui/SystemSettings";
import { TenantSelector } from "@/components/ui/TenantSelector";
import { AuthCommandPalette } from "@/components/AuthCommandPalette";
import { GlobalFooter } from "@ajabadia/ecosystem-widgets";

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
  const session = await getServerSession();
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

  // 🔍 Derive central logs audit URL dynamically (cross-satellite navigation to ABDLogs)
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
    <main className="min-h-screen bg-background text-foreground pb-12 px-6 md:px-12 selection:bg-primary/30 relative z-10" role="main">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {children}
        
        <GlobalFooter
          leftLabel={t('common.industrial_ecosystem')}
          rightLabel={t('common.soc2_monitoring')}
        />
      </div>
    </main>
  );
}
