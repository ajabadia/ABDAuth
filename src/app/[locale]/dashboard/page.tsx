/**
 * @purpose Renderiza la página de dashboard para los usuarios, mostrando aplicaciones permitidas, promoción de MFA, previsualización de tokens y panel de estadísticas.
 * @purpose_en Renders the dashboard page for users, displaying allowed applications, MFA promotion, token preview, and stats panel.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:19,sig:1wq9o98
 * @lastUpdated 2026-06-26T09:59:14.067Z
 */

import { getServerSession } from "@/lib/get-session";
import { redirect } from "@/i18n/routing";
import { LayoutDashboard } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import type { IndustrialSession } from "@/types/auth";
import { userRepository } from "@/lib/repositories/UserRepository";
import { tenantRepository } from "@/lib/repositories/TenantRepository";
import { applicationRepository } from "@/lib/repositories/ApplicationRepository";
import { AppLauncherGrid } from "./components/AppLauncherGrid";
import { MfaPromotion } from "@/components/dashboard/MfaPromotion";
import { PageHeader } from "@/components/ui/industrial/PageHeader";
import { TokenPreview } from "./components/TokenPreview";
import { StatsPanel } from "./components/StatsPanel";
import { SsoErrorAlert } from "./components/SsoErrorAlert";
import { StorageProviderBadge } from "@/components/dashboard/storage-provider-badge";
import { getAppLauncherTranslations } from "./components/translations";
import type { TenantId } from "@/lib/schemas/common";
import type { Application } from "@/lib/schemas/auth";
import type { SafeFilter } from "@/lib/repositories/BaseRepository";

export default async function DashboardPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; app?: string }>;
}) {
  const session = await getServerSession();
  const { locale } = await params;
  const { error, app } = await searchParams;
  const t = await getTranslations('dashboard');

  if (!session) {
    redirect({ href: '/login', locale });
    return null;
  }

  const user = session.user as unknown as IndustrialSession;

  // 1. Fetch allowed apps for the currently active tenant
  let allowedApps: Application[] = [];
  if (user.tenantId) {
    if (user.tenantId === 'GLOBAL') {
      allowedApps = user.role === 'SUPER_ADMIN' ? await applicationRepository.list({ active: true }) : [];
    } else {
      const activeTenant = await tenantRepository.findByTenantId(user.tenantId as TenantId);
      if (activeTenant?.allowedApps) {
        allowedApps = (await Promise.all(activeTenant.allowedApps.map(slug => applicationRepository.findOne({ slug } as SafeFilter<Application>)))).filter((a): a is Application => !!a);
      }
    }
  }

  // 3. For stats, resolve users/tenants if admin
  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PROFESSOR';
  const allUsers = isAdmin ? await userRepository.listForCurrentSession(user) : [];
  const allTenants = isAdmin ? await tenantRepository.listForCurrentSession(user) : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {error && <SsoErrorAlert error={error} app={app} t={t} />}

      {!user.mfaEnabled && (
        <MfaPromotion 
          t={{
            mfa_title: t('promotion.mfa_title'),
            mfa_desc: t('promotion.mfa_desc'),
            mfa_cta: t('promotion.mfa_cta'),
            mfa_badge: t('promotion.mfa_badge'),
          }}
          locale={locale}
        />
      )}

      <PageHeader
        title={<>{t('welcome')}, <span className="text-primary">{user.name}</span></>}
        subtitle={`${t('subtitle')} • INDUSTRIAL_MODE_ACTIVE`}
        breadcrumb={`${t('control_console')} • ${t('menu.overview')}`}
        icon={LayoutDashboard}
        actionButton={
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-none w-fit">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-primary uppercase tracking-widest">{t('status_online')}</span>
          </div>
        }
      />

      {/* 🛰️ Part 2: Allowed Applications Launcher Grid */}
      {user.tenantId && (
        <AppLauncherGrid 
          apps={allowedApps}
          activeTenantId={user.tenantId}
          translations={getAppLauncherTranslations(locale)}
        />
      )}

      <StorageProviderBadge />

      {/* 🗝️ Identity Token Preview */}
      <TokenPreview 
        user={user}
        translations={{
          title: t('jwt.title'),
          v1_certified: t('jwt.v1_certified'),
          sub: t('jwt.sub'),
          email: t('jwt.email'),
          role: t('jwt.role'),
          org: t('jwt.org'),
          mfa_status: t('jwt.mfa_status'),
          protocol: t('jwt.protocol'),
          standard_protocol: t('jwt.standard_protocol'),
        }}
      />

      {/* Stats Panel (Admin only) */}
      {isAdmin && (
        <StatsPanel 
          usersCount={allUsers.length}
          tenantsCount={allTenants.length}
          translations={{
            usersLabel: t('menu.users'),
            tenantsLabel: t('menu.tenants'),
            complianceLabel: t('menu.audit'),
          }}
        />
      )}
    </div>
  );
}
