'use client';

import React, { useState } from 'react';
import { Database, ShieldAlert, Check } from 'lucide-react';
import { switchTenantAction } from '../actions';
import { useRouter } from '@/i18n/routing';

interface TenantItem {
  tenantId: string;
  name: string;
  industry?: string;
  active: boolean;
}

export function TenantSelector({
  tenants,
  activeTenantId,
  translations,
}: {
  tenants: TenantItem[];
  activeTenantId: string;
  translations: {
    select_tenant: string;
    active_context: string;
    loading: string;
    error_switching: string;
  };
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === activeTenantId || loadingId) return;
    
    setLoadingId(tenantId);
    setError(null);
    
    const res = await switchTenantAction(tenantId);
    
    if (res.success) {
      router.refresh();
    } else {
      setError(res.error || 'Failed to switch context');
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-none p-6 space-y-6 relative overflow-hidden group transition-all duration-300">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-none flex items-center justify-center text-primary">
          <Database size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
            {translations.select_tenant}
          </h3>
          <div className="text-[8px] font-mono text-muted-foreground/50 uppercase tracking-widest mt-0.5">
            {translations.active_context}: <span className="text-primary font-bold">{activeTenantId}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-mono px-3 py-2 flex items-center gap-2 rounded-none">
          <ShieldAlert size={14} className="shrink-0" />
          <span className="uppercase">{translations.error_switching}: {error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tenants.map((tenant) => {
          const isActive = tenant.tenantId === activeTenantId;
          const isLoading = loadingId === tenant.tenantId;

          return (
            <button aria-label={`Switch context to tenant ${tenant.name}`}
              key={tenant.tenantId}
              onClick={() => handleSwitch(tenant.tenantId)}
              disabled={!!loadingId || !tenant.active}
              className={`text-left p-4 border transition-all duration-300 rounded-none flex flex-col justify-between relative cursor-pointer group/item
                ${isActive 
                  ? 'bg-primary/5 border-primary/40 text-foreground' 
                  : 'bg-secondary/15 border-border hover:border-border/80 hover:bg-secondary/30 text-muted-foreground hover:text-foreground'
                }
                ${!tenant.active ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <div className="flex justify-between items-start w-full">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground">
                  {tenant.tenantId}
                </span>
                {isActive && (
                  <span className="text-primary">
                    <Check size={14} />
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-tight text-foreground group-hover/item:text-primary transition-colors">
                  {tenant.name}
                </div>
                <div className="text-[8px] font-mono text-muted-foreground/60 uppercase mt-1 tracking-wider">
                  {tenant.industry || 'INDUSTRIAL'} • {tenant.active ? 'ONLINE' : 'SUSPENDED'}
                </div>
              </div>

              {isLoading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <span className="text-[9px] font-mono font-black text-primary uppercase animate-pulse">
                    {translations.loading}...
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
