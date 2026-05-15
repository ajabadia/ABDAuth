import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { tenantRepository } from "@/lib/repositories/TenantRepository";
import { Building2, Globe, Database, Plus, Search, ExternalLink } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Tenant } from "@/lib/schemas/auth";

import type { IndustrialSession } from "@/types/auth";

/**
 * 🏢 Industrial Tenant Management Panel
 */
export default async function TenantsPage() {
  const session = await auth();
  const t = await getTranslations('dashboard.tenants');

  if (!session) {
    redirect("/login");
  }

  const user = session.user as unknown as IndustrialSession;

  // 🔌 Fetching normalized data (Security handled by Repository)
  const tenants = await tenantRepository.listForCurrentSession(user);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h2>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.2em] mt-1">{t('subtitle')} • {tenants.length} records</p>
        </div>
        
        <button aria-label={t('new_tenant')}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/10"
        >
          <Plus size={14} />
          {t('new_tenant')}
        </button>
      </header>

      <div className="flex items-center gap-4 bg-card p-2 rounded-lg border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input type="text" placeholder="Search..." className="w-full bg-transparent border-none focus:ring-0 text-xs pl-10 h-8 text-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tenants.map((tenant: Tenant) => (
          <div key={tenant._id?.toString()} className="bg-card p-5 rounded-xl border border-border hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <button aria-label="Details">
                <ExternalLink size={14} className="text-muted-foreground hover:text-blue-500 cursor-pointer" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600/5 rounded-lg flex items-center justify-center border border-blue-500/10 text-blue-500">
                <Building2 size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm truncate">{tenant.name}</h3>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${tenant.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} uppercase tracking-widest border border-current/10`}>
                    {tenant.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {tenant.tenantId}</p>
                <p className="text-[8px] text-muted-foreground/50 font-mono mt-1">
                  EST: {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : '---'}
                </p>
                
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t('industry')}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <Globe size={10} className="text-blue-500" />
                      {tenant.industry}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t('database')}</p>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                      <Database size={10} className="text-blue-500" />
                      {tenant.dbPrefix || 'abd_default'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
