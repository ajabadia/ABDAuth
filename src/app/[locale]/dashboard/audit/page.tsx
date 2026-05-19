import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Link } from "@/i18n/routing";
import { auditRepository } from "@/lib/repositories/AuditRepository";
import { ShieldAlert, ShieldCheck, Info, Clock, User as UserIcon, ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { AuditLog } from "@/lib/schemas/audit";

import type { IndustrialSession } from "@/types/auth";

/**
 * 📜 Audit Log Visual Panel
 */
export default async function AuditPage() {
  const session = await auth();
  const t = await getTranslations('dashboard.audit');
  const d = await getTranslations('dashboard');

  if (!session) redirect("/login");

  const user = session.user as unknown as IndustrialSession;

  // 🔌 Fetching filtered logs (Security handled by Repository)
  const logs = await auditRepository.listForCurrentSession(user);

  const formatDate = (dateInput: unknown): string => {
    try {
      if (!dateInput) return '---';
      const d = new Date(dateInput as string | number | Date);
      if (isNaN(d.getTime())) return '---';
      return d.toISOString().replace('T', ' ').split('.')[0];
    } catch {
      return '---';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border pb-8">
        <div className="flex flex-col gap-2 w-full">
          {/* Monospace Breadcrumb */}
          <div className="text-[10px] font-mono font-black uppercase tracking-[0.25em] text-primary flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-primary animate-pulse" aria-hidden="true" />
            {d('control_console')} • {d('menu.audit')}
          </div>
          
          {/* Fila de Título e Interacción */}
          <div className="flex items-center gap-4 mt-1">
            <Link
              href="/dashboard"
              aria-label={d('back_to_dashboard')}
              className="inline-flex items-center justify-center p-2 bg-transparent text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-all duration-200 cursor-pointer rounded-none active:scale-[0.95] shrink-0 focus:outline-none focus:ring-1 focus:ring-primary/50"
            >
              <ArrowLeft size={14} />
            </Link>
            <h1 className="text-3xl font-black uppercase italic tracking-tight text-foreground leading-none flex-1 truncate">
              {t('title')}
            </h1>
          </div>
          
          <p className="text-sm text-muted-foreground font-sans mt-2 leading-relaxed">
            {t('subtitle')} • <span className="text-primary font-bold font-mono text-[10px]">SOC2_COMPLIANCE_MONITOR</span>
          </p>
        </div>
      </header>

      <div className="bg-card border border-border rounded-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('table.timestamp')}</th>
                <th className="px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('table.event')}</th>
                <th className="px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('table.actor')}</th>
                <th className="px-4 py-3 text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('table.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {logs.map((log: AuditLog) => (
                <tr key={log._id?.toString()} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
                      <Clock size={12} className="text-muted-foreground" />
                      {formatDate(log.timestamp)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] font-bold">{log.event}</td>
                  <td className="px-4 py-3 text-[10px]">
                    <div className="flex items-center gap-2">
                      <UserIcon size={12} className="text-primary" />
                      {log.actorEmail || log.actorId}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={log.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCESS: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    FAILURE: "bg-red-500/10 text-red-500 border-red-500/20",
    WARNING: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    INFO: "bg-primary/10 text-primary border-primary/20",
  };
  const Icon = status === 'SUCCESS' ? ShieldCheck : status === 'FAILURE' ? ShieldAlert : Info;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-none border ${styles[status] || styles.INFO}`}>
      <Icon size={10} />
      <span className="text-[8px] font-black uppercase tracking-widest">{status}</span>
    </div>
  );
}
