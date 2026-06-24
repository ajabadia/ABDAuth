/**
 * @purpose Gestiona el renderizado de un formulario de restablecimiento de contraseña con elementos de interfaz y lógica de validación.
 * @purpose_en Manages the rendering of a password reset form with UI elements and validation logic.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:2,sig:18teh3w
 * @lastUpdated 2026-06-21T10:29:43.388Z
 */

import React from 'react';
import { Lock, Loader2, AlertCircle, Key, CheckCircle } from "lucide-react";

interface ResetPasswordFormProps {
  isSuccess: boolean;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  isLoading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  token: string | null;
  t: (key: string) => string;
}

export function ResetPasswordForm({
  isSuccess,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  isLoading,
  error,
  onSubmit,
  token,
  t
}: ResetPasswordFormProps) {
  if (isSuccess) {
    return (
      <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in duration-500">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-2">
          <CheckCircle size={24} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('success')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('new_password_label')}</label>
        <div className="relative group/input">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" size={14} />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-secondary/30 border-border border rounded-sm h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
            required
            disabled={!token || isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('confirm_password_label')}</label>
        <div className="relative group/input">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" size={14} />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-secondary/30 border-border border rounded-sm h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
            required
            disabled={!token || isLoading}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-sm flex items-start gap-3 animate-in fade-in zoom-in duration-300">
          <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-red-500 leading-relaxed uppercase tracking-tight">{error}</p>
        </div>
      )}

      <button 
        type="submit"
        disabled={isLoading}
        aria-label={t('button')}
        className="w-full bg-primary hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-[10px] font-mono uppercase tracking-widest font-black py-3 rounded-none border border-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        {isLoading ? <Loader2 size={16} className="animate-spin text-primary-foreground" /> : <>{t('button')}</>}
      </button>
    </form>
  );
}
