import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { auditRepository } from "@/lib/repositories/AuditRepository";
import { ShieldAlert, ShieldCheck, Info, Clock, User as UserIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { AuditLog } from "@/lib/schemas/audit";

import type { IndustrialSession } from "@/types/auth";

/**
 * 📜 Audit Log Visual Panel
 */
export default async function AuditPage() {
  const session = await auth();
  const t = await getTranslations('dashboard.audit');

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
      <header>
        <h2 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h2>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] mt-1">{t('subtitle')} • SOC2_COMPLIANCE_MONITOR</p>
      </header>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
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
                      <UserIcon size={12} className="text-blue-500" />
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
    INFO: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  };
  const Icon = status === 'SUCCESS' ? ShieldCheck : status === 'FAILURE' ? ShieldAlert : Info;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${styles[status] || styles.INFO}`}>
      <Icon size={10} />
      <span className="text-[8px] font-black uppercase tracking-widest">{status}</span>
    </div>
  );
}
