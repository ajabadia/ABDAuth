/**
 * @purpose Renderiza el layout del panel de control con área centralizada y pie de página.
 * @purpose_en Renders the dashboard layout with centered content area and footer.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:5,sig:1hpaboi
 * @lastUpdated 2026-06-30T14:20:25.674Z
 */

import { getServerSession } from '@/lib/get-session';
import { redirect } from "@/i18n/routing";
import { getTranslations } from 'next-intl/server';
import { GlobalFooter } from "@ajabadia/ecosystem-widgets";

import type { IndustrialSession } from "@/types/auth";

/**
 * 🏰 Dashboard Layout (Industrial Localized)
 * Content area scoped to dashboard pages, leveraging AppShellLayout from parent locale layout.
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

  return (
    <div className="pb-12 px-6 md:px-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {children}

        <GlobalFooter
          leftLabel={t('common.industrial_ecosystem')}
          rightLabel={t('common.soc2_monitoring')}
        />
      </div>
    </div>
  );
}
