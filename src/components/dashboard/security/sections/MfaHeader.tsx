'use client';

import { Key } from 'lucide-react';

interface MfaHeaderProps {
  enabled: boolean;
  t: (key: string) => string;
}

export function MfaHeader({ enabled, t }: MfaHeaderProps) {
  return (
    <div className="p-6 border-b border-border bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Key size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('title')}</h2>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{t('subtitle')}</p>
          </div>
        </div>
        <div className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-tighter border ${
          enabled 
            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        }`}>
          {enabled ? t('status_active') : t('status_inactive')}
        </div>
      </div>
    </div>
  );
}
