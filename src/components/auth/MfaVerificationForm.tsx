"use client";

/**
 * @purpose Renderiza un formulario para verificar la autenticación multifactor (MFA), permitiendo a los usuarios ingresar un código de tiempo basado en una contraseña única (TOTP) o un código de respaldo.
 * @purpose_en Renders a form for Multi-Factor Authentication (MFA) verification, allowing users to enter either a Time-Based One-Time Password (TOTP) or a backup code.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:9,sig:qb5gnv
 * @lastUpdated 2026-06-26T09:59:24.434Z
 */

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { verifyMfaAction, verifyBackupCodeAction } from '@/app/[locale]/login/actions';

/**
 * 🔐 MFA Verification Form
 * Uses authClient.twoFactor.verifyTotp() for TOTP verification and
 * authClient.twoFactor.verifyBackupCode() for backup codes.
 * Sign-out uses authClient.signOut() — better-auth handles session cleanup.
 */
export function MfaVerificationForm() {
  const t = useTranslations('login.mfa');
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingBackupCode, setUsingBackupCode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      if (usingBackupCode) {
        result = await verifyBackupCodeAction(token);
      } else {
        result = await verifyMfaAction(token);
      }

      if (result?.error) {
        setError(t('error_invalid'));
        return;
      }

      // ✅ Successful verification — redirect to dashboard
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
      setError(t('error_invalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-primary/10 text-primary mb-4">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <p className="text-muted-foreground font-medium">
          {t('subtitle')}
        </p>
      </div>

      <div className="bg-card p-8 rounded-sm border border-border space-y-6">
        <p className="text-sm text-center text-muted-foreground leading-relaxed font-medium">
          {t('description')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder={usingBackupCode ? t('backup_placeholder') || 'XXXX-XXXXXX' : t('placeholder')}
              className="h-14 text-center text-2xl font-mono tracking-[0.2em] bg-muted/20 border-border rounded-sm focus:ring-primary/20 transition-all uppercase shadow-none"
              maxLength={usingBackupCode ? 12 : 8}
              value={token}
              onChange={(e) => {
                if (usingBackupCode) {
                  setToken(e.target.value.toUpperCase());
                } else {
                  setToken(e.target.value.replace(/\D/g, '').slice(0, 6));
                }
              }}
              autoFocus
              required
              disabled={loading}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-sm bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 bg-primary text-primary-foreground hover:opacity-95 rounded-none font-mono font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-none border border-primary/30 active:scale-95"
            disabled={loading || token.length < (usingBackupCode ? 6 : 1)}
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
            {usingBackupCode ? t('verify_backup') || 'Verify Backup Code' : t('button')}
          </Button>
        </form>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setUsingBackupCode(!usingBackupCode);
              setToken('');
              setError(null);
            }}
            className="text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1 underline underline-offset-4 decoration-dotted"
          >
            {usingBackupCode ? t('use_totp') || 'Use authenticator app' : t('use_backup') || 'Use backup code'}
          </button>

          <button 
            type="button"
            aria-label={t('back_to_login')}
            onClick={async () => { await authClient.signOut(); window.location.href = '/login'; }}
            className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            <ArrowLeft size={14} />
            {t('back_to_login')}
          </button>
        </div>
      </div>
    </div>
  );
}
