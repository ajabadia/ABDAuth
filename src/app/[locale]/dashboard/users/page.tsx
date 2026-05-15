import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { userRepository } from "@/lib/repositories/UserRepository";
import { Plus, Search, MoreHorizontal, Clock } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { User } from "@/lib/schemas/auth";
import type { IndustrialSession } from "@/types/auth";

/**
 * 👥 Industrial User Management Panel
 */
export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  
  const t = await getTranslations('dashboard.users');
  const user = session.user as unknown as IndustrialSession;

  // 🔌 Fetching filtered users (Security handled by Repository)
  const users = await userRepository.listForCurrentSession(user);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] mt-1">
            {t('subtitle')} • {users.length} records
          </p>
        </div>
        
        <button aria-label={t('new_user')}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/10"
        >
          <Plus size={14} />
          {t('new_user')}
        </button>
      </header>

      <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input type="text" placeholder={t('search_placeholder')} className="w-full bg-transparent border-none focus:ring-0 text-xs pl-10 h-8 text-foreground" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-border">
              <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.identity')}</th>
              <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.role')}</th>
              <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.tenant')}</th>
              <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center">{t('table.status')}</th>
              <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('table.last_access')}</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user: User) => (
              <tr key={user._id?.toString()} className="hover:bg-white/[0.01] transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-secondary/50 rounded flex items-center justify-center border border-border text-[10px] font-bold">
                      {(user.name || 'U').charAt(0)}{(user.surname || '').charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{user.name} {user.surname}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                    user.role === 'SUPER_ADMIN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                    user.role === 'ADMIN' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-mono text-muted-foreground">{user.tenantId}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock size={12} />
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '---'}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button aria-label="Opciones" className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground transition-colors opacity-0 group-hover:opacity-100">
                    <MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
