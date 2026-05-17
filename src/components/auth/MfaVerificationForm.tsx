"use client";

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyMfaLoginAction } from '@/services/auth/security-actions';
import { signOut } from 'next-auth/react';

export function MfaVerificationForm() {
  const t = useTranslations('login.mfa');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verifyMfaLoginAction(token);
      if (!result?.success) {
        setError(t('error_invalid'));
      }
    } catch (err: unknown) {
      // 🛡️ Next.js redirects throw an error that should not be handled as a failure
      if (err instanceof Error && err.message === 'NEXT_REDIRECT') throw err;
      setError(t('error_invalid'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10 text-primary mb-4">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t('title')}
        </h1>
        <p className="text-muted-foreground font-medium">
          {t('subtitle')}
        </p>
      </div>

      <div className="bg-card p-8 rounded-xl border border-border space-y-6">
        <p className="text-sm text-center text-muted-foreground leading-relaxed font-medium">
          {t('description')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder={t('placeholder')}
              className="h-14 text-center text-2xl font-mono tracking-[0.2em] bg-muted/20 border-border rounded-lg focus:ring-primary/20 transition-all uppercase shadow-none"
              maxLength={12}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
              autoFocus
              required
              disabled={loading}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 bg-primary text-primary-foreground hover:opacity-90 rounded-lg font-black text-[9px] uppercase tracking-[0.2em] transition-all shadow-none"
            disabled={loading || token.length < 1}
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={14} /> : null}
            {t('button')}
          </Button>
        </form>

        <div className="pt-2">
          <button 
            type="button"
            aria-label={t('back_to_login')}
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <ArrowLeft size={14} />
            {t('back_to_login')}
          </button>
        </div>
      </div>
    </div>
  );
}
