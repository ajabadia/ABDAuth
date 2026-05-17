'use client';

import * as React from 'react';
import { ShieldCheck, Key, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { changePasswordAction } from '@/services/auth/security-actions';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function PasswordManager() {
  const t = useTranslations('dashboard.security.password');
  const [isPending, setIsPending] = React.useState(false);
  const [currentPass, setCurrentPass] = React.useState('');
  const [newPass, setNewPass] = React.useState('');
  const [confirmPass, setConfirmPass] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPass.length < 8) {
      toast.error(t('error_length'));
      return;
    }

    if (newPass !== confirmPass) {
      toast.error(t('error_match'));
      return;
    }

    setIsPending(true);
    try {
      const result = await changePasswordAction(currentPass, newPass);
      if (result.success) {
        toast.success(t('success'));
        setCurrentPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        if (result.error === 'INVALID_CURRENT_PASSWORD') {
          toast.error(t('error_current'));
        } else {
          toast.error('Error al actualizar contraseña');
        }
      }
    } catch {
      toast.error('Critical failure in password update orchestration');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-none flex flex-col h-full transition-all duration-300">
      <div className="p-6 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Key size={18} />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
              <span className="w-1 h-1 bg-primary rounded-full" />
              {t('title')}
            </h2>
          </div>
          <div className="px-2 py-0.5 bg-muted rounded text-[9px] font-mono font-bold text-muted-foreground uppercase tracking-tighter border border-border/50">
            SECRET_GOVERNANCE_V1
          </div>
        </div>
        <p className="text-xs text-muted-foreground font-medium">
          {t('subtitle')}
        </p>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Lock size={12} />
              {t('current_label')}
            </label>
            <input
              type="password"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-mono text-foreground"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <ShieldCheck size={12} />
                {t('new_label')}
              </label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-mono text-foreground"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <AlertCircle size={12} />
                {t('confirm_label')}
              </label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary transition-all font-mono text-foreground"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <button
              type="submit"
              disabled={isPending || !currentPass || !newPass || !confirmPass}
              aria-label={t('button')}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isPending ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Key size={14} />
              )}
              {t('button')}
            </button>
          </div>
        </form>
      </div>

      <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="text-[8px] font-black text-primary uppercase tracking-widest">
            AUTHENTICATION_PROTOCOL_V1
          </span>
        </div>
        <div className="text-[8px] font-mono text-slate-400 dark:text-slate-600">
          HASH: BCRYPT_SALT_12
        </div>
      </div>
    </div>
  );
}
