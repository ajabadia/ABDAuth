/**
 * @purpose Renderiza un componente de alerta personalizado para errores de Single Sign-On (SSO), mostrando mensajes de error según el código proporcionado y, opcionalmente, agregando detalles del aplicativo.
 * @purpose_en Renders a styled alert component for Single Sign-On (SSO) errors, displaying error messages based on the provided error code and optionally appending application details.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:13xbixm
 * @lastUpdated 2026-06-21T10:20:17.136Z
 */

import React from 'react';
import { ShieldAlert } from "lucide-react";

interface SsoErrorAlertProps {
  error: string;
  app?: string;
  t: (key: string) => string;
}

export function SsoErrorAlert({ error, app, t }: SsoErrorAlertProps) {
  const isKnownError = ['SELECT_TENANT_REQUIRED', 'APPLICATION_NOT_LICENSED', 'UNAUTHORIZED_TENANT_ACCESS', 'APPLICATION_INACTIVE'].includes(error);
  
  let errorMessage = isKnownError ? t(`errors.${error}`) : t('errors.DEFAULT');
  if (error === 'APPLICATION_NOT_LICENSED' && app) {
    errorMessage = `${errorMessage} [App ID: ${app}]`;
  }

  return (
    <div className="p-4 border border-destructive/15 bg-destructive/5 rounded-sm flex items-start gap-3 w-full text-destructive font-mono text-[10px] font-black uppercase tracking-wider animate-in fade-in duration-300" role="alert">
      <ShieldAlert size={16} className="shrink-0 animate-pulse mt-0.5" />
      <div className="flex-1 space-y-1">
        <div className="text-destructive/60 font-mono text-[8px] tracking-[0.2em] font-black">
          SYSTEM_SSO_FAULT // ERR_CODE: {error}
        </div>
        <div>
          {errorMessage}
        </div>
      </div>
    </div>
  );
}
