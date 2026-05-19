import React from 'react';
import { ShieldAlert } from "lucide-react";

interface SsoErrorAlertProps {
  error: string;
  t: (key: string) => string;
}

export function SsoErrorAlert({ error, t }: SsoErrorAlertProps) {
  const isKnownError = ['SELECT_TENANT_REQUIRED', 'APPLICATION_NOT_LICENSED', 'UNAUTHORIZED_TENANT_ACCESS', 'APPLICATION_INACTIVE'].includes(error);
  return (
    <div className="p-4 border border-destructive/15 bg-destructive/5 rounded-sm flex items-start gap-3 w-full text-destructive font-mono text-[10px] font-black uppercase tracking-wider animate-in fade-in duration-300" role="alert">
      <ShieldAlert size={16} className="shrink-0 animate-pulse mt-0.5" />
      <div className="flex-1 space-y-1">
        <div className="text-destructive/60 font-mono text-[8px] tracking-[0.2em] font-black">
          SYSTEM_SSO_FAULT // ERR_CODE: {error}
        </div>
        <div>
          {isKnownError ? t(`errors.${error}`) : t('errors.DEFAULT')}
        </div>
      </div>
    </div>
  );
}
