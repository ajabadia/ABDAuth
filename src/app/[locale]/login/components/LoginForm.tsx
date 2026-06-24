/**
 * @purpose Gestiona el renderizado de un formulario de inicio de sesión con campos de correo electrónico y contraseña, junto con botones de inicio de sesión social y indicadores de carga.
 * @purpose_en Manages the rendering of a login form with email and password fields, along with social login buttons and loading indicators.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:3,sig:auhr6q
 * @lastUpdated 2026-06-21T10:24:34.129Z
 */

import React, { useState } from 'react';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { SocialLoginButtons } from './SocialLoginButtons';

interface LoginFormProps {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  isLoading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  t: (key: string) => string;
}

export function LoginForm({ email, setEmail, password, setPassword, isLoading, error, onSubmit, onForgotPassword, t }: LoginFormProps) {
  return (
    <div className="w-full max-w-[380px] bg-card/85 backdrop-blur-md border border-border rounded-none shadow-2xl overflow-hidden relative z-10">
      <div className="h-1 w-full bg-primary/10 flex">
        <div className="h-full bg-primary w-1/3 animate-pulse" />
      </div>

      <form onSubmit={onSubmit} className="p-8 space-y-5 relative z-10">
        <div className="space-y-2">
          <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest ml-1">{t('email_label')}</label>
          <div className="relative group/input">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" size={14} />
            <input type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t('email_placeholder')}
              className="w-full bg-secondary/30 border-border border rounded-none h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground font-sans" required />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-widest ml-1">{t('password_label')}</label>
          <div className="relative group/input">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" size={14} />
            <input type="password" name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={t('password_placeholder')}
              className="w-full bg-secondary/30 border-border border rounded-none h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground font-sans" required />
          </div>
          <div className="flex justify-end pt-1">
            <button aria-label={t('forgot_password_link')} type="button" onClick={onForgotPassword}
              className="text-[9px] font-mono font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
              {t('forgot_password_link')}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-none flex items-start gap-3 animate-in fade-in zoom-in duration-300">
            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-mono font-black text-red-500 leading-relaxed uppercase tracking-tight">{error}</p>
          </div>
        )}

        <button type="submit" disabled={isLoading} aria-label={t('button')}
          className="w-full bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-mono uppercase tracking-widest font-black py-3 rounded-none border border-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
          {isLoading ? <Loader2 size={16} className="animate-spin text-primary-foreground" /> : <><ArrowRight size={14} /> {t('button')}</>}
        </button>

        <SocialLoginButtons t={t} />
      </form>

      <div className="p-4 bg-secondary/20 border-t border-border flex items-center justify-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        <span className="text-[9px] font-mono font-black text-muted-foreground uppercase tracking-[0.2em]">{t('shield_badge')}</span>
      </div>
    </div>
  );
}
