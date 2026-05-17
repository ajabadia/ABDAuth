import { auth } from "@/auth";
import { redirect } from "@/i18n/routing";
import { Users, Activity, Key, Database } from "lucide-react";
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t('welcome')}, {user.name}</h2>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] mt-1">{t('subtitle')} • INDUSTRIAL_MODE_ACTIVE</p>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{t('status_online')}</span>
        </div>
      </div>

      {/* 🗝️ Identity Token Preview */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-blue-600/10 rounded flex items-center justify-center text-blue-500 border border-blue-500/10">
            <Key size={18} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full" />
            {t('jwt.title')}
          </h3>
          <div className="hidden sm:block text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest">{t('jwt.v1_certified')}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4">
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
          <StatCard icon={<Users size={18} />} label={t('menu.users')} value={allUsers.length.toString()} color="blue" />
          <StatCard icon={<Database size={18} />} label={t('menu.tenants')} value={allTenants.length.toString()} color="purple" />
          <StatCard icon={<Activity size={18} />} label={t('menu.audit')} value="SOC2_COMPLIANT" color="emerald" isText />
        </div>
      )}
    </div>
  );
}

function ClaimItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-border/30 pb-1.5">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-mono font-bold truncate max-w-[200px]">{value}</span>
    </div>
  );
}

function StatCard({ icon, label, value, color, isText = false }: { icon: React.ReactNode, label: string, value: string, color: string, isText?: boolean }) {
  const colors: Record<string, string> = {
    blue: "text-blue-500 bg-blue-500/5 border-blue-500/10",
    purple: "text-purple-500 bg-purple-500/5 border-purple-500/10",
    emerald: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10",
  };

  return (
    <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 group hover:border-border/80 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className={`font-bold ${isText ? 'text-[10px] font-mono' : 'text-xl tracking-tighter'}`}>{value}</p>
      </div>
    </div>
  );
}
