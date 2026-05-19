import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import { Users, Activity, Key, Database, LayoutDashboard } from "lucide-react";
import { getTranslations } from 'next-intl/server';
import type { IndustrialSession } from "@/types/auth";
import { userRepository } from "@/lib/repositories/UserRepository";
import { tenantRepository } from "@/lib/repositories/TenantRepository";

import { MfaPromotion } from "@/components/dashboard/MfaPromotion";

/**
 * 📊 Dashboard Overview (Industrial Localized)
 * Monitoring and quick access panel with strict RBAC enforcement.
 */
export default async function DashboardPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const locale = (await params).locale;
  const t = await getTranslations('dashboard');

  if (!session) {
    redirect({ href: '/login', locale });
    return null;
  }

  const user = session.user as unknown as IndustrialSession;

  // 1. Fetch filtered users (Security handled by Repository)
  const allUsers = await userRepository.listForCurrentSession(user);

  // 2. Fetch filtered tenants (Security handled by Repository)
  const allTenants = await tenantRepository.listForCurrentSession(user);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 🛡️ MFA Promotion (Industrial Recommendation) */}
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

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div className="flex flex-col gap-2">
          {/* Monospace Breadcrumb */}
          <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
            <LayoutDashboard size={14} className="text-primary animate-pulse" aria-hidden="true" />
            {t('control_console')} • {t('menu.overview')}
          </div>
          
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none">
            {t('welcome')}, <span className="text-primary">{user.name}</span>
          </h1>
          
          <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
            {t('subtitle')} • <span className="text-primary font-bold">INDUSTRIAL_MODE_ACTIVE</span>
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-none w-fit">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-primary uppercase tracking-widest">{t('status_online')}</span>
        </div>
      </header>

      {/* 🗝️ Identity Token Preview */}
      <div className="bg-card border border-border rounded-none p-8 relative overflow-hidden group hover:border-primary/40 transition-all duration-500 flex flex-col">
        {/* Giant Watermark Key Icon */}
        <Key className="absolute -top-4 -right-4 w-36 h-36 opacity-5 pointer-events-none text-foreground group-hover:opacity-10 transition-opacity animate-pulse duration-[4s]" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-none flex items-center justify-center text-primary">
            <Key size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-foreground">
              {t('jwt.title')}
            </h3>
            <div className="sm:hidden text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest mt-0.5">{t('jwt.v1_certified')}</div>
          </div>
          <div className="hidden sm:block text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest ml-auto border border-border px-2 py-0.5">{t('jwt.v1_certified')}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4 relative z-10 border-t border-border pt-4">
          <div className="space-y-3">
            <ClaimItem label={t('jwt.sub')} value={user.id} />
            <ClaimItem label={t('jwt.email')} value={user.email} />
            <ClaimItem label={t('jwt.role')} value={user.role} />
          </div>
          <div className="space-y-3">
            <ClaimItem label={t('jwt.org')} value={user.tenantId} />
            <ClaimItem label={t('jwt.mfa_status')} value={user.mfa_verified ? "VERIFIED" : "UNVERIFIED"} />
            <ClaimItem label={t('jwt.protocol')} value={t('jwt.standard_protocol')} />
          </div>
        </div>
      </div>

      {/* 📊 REAL Stats from Cloud DB (Admin Only) */}
      {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={<Users size={18} />} label={t('menu.users')} value={allUsers.length.toString()} color="primary" />
          <StatCard icon={<Database size={18} />} label={t('menu.tenants')} value={allTenants.length.toString()} color="secondary" />
          <StatCard icon={<Activity size={18} />} label={t('menu.audit')} value="SOC2_COMPLIANT" color="muted" isText />
        </div>
      )}
    </div>
  );
}

function ClaimItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-border/30 pb-1.5">
      <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-mono font-bold truncate max-w-[200px] text-foreground">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value, color, isText = false }: { icon: React.ReactNode, label: string, value: string, color: 'primary' | 'secondary' | 'muted', isText?: boolean }) {
  const colors = {
    primary: "text-primary bg-primary/5 border-primary/10 group-hover:border-primary/30",
    secondary: "text-secondary bg-secondary/5 border-secondary/10 group-hover:border-secondary/30",
    muted: "text-muted-foreground bg-muted/10 border-border group-hover:border-primary/20",
  };

  return (
    <div className="bg-card border border-border p-5 rounded-none flex items-center gap-4 group hover:border-border/80 transition-all duration-300 relative overflow-hidden">
      {/* Small subtle watermark icon in stat card */}
      <div className="absolute -bottom-2 -right-2 opacity-5 text-foreground group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className={`w-10 h-10 rounded-none flex items-center justify-center border transition-all duration-300 ${colors[color]}`}>
        {icon}
      </div>
      <div className="relative z-10">
        <p className="text-[8px] font-mono font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className={`font-mono font-bold uppercase mt-1 ${isText ? 'text-[10px] text-primary' : 'text-xl tracking-tight text-foreground'}`}>{value}</p>
      </div>
    </div>
  );
}
