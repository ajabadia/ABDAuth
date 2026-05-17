'use client';

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter as useIntlRouter } from "@/i18n/routing";
import { Shield, Lock, Loader2, AlertCircle, CheckCircle, Key } from "lucide-react";
import { useTranslations } from 'next-intl';
import { SystemSettings } from "@/components/ui/SystemSettings";
import { toast } from "sonner";
import { resetPasswordAction } from "@/services/auth/recovery-actions";

export default function ResetPasswordPage() {
  const t = useTranslations('login.reset_password');
  const common = useTranslations('common');
  const intlRouter = useIntlRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError(t('error_invalid_token'));
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await resetPasswordAction(token, password);

      if (result?.success) {
        setIsSuccess(true);
        toast.success(t('success'));
        setTimeout(() => {
          intlRouter.push('/login');
        }, 3000);
      } else {
        const errorMsg = result.error === 'INVALID_OR_EXPIRED_TOKEN' ? t('error_invalid_token') : 'Error al resetear contraseña';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch {
      toast.error(t('critical_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 font-sans relative overflow-hidden transition-colors duration-300">
      <div className="bg-grain" />

      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <SystemSettings />
      </div>
      
      <div className="mb-12 flex flex-col items-center animate-in slide-in-from-top duration-700">
        <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/10 border border-blue-400/20 shadow-blue-500/10">
          <Shield size={32} className="text-white" />
        </div>
        <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">
          {t('title')}
        </h1>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em] mt-2 opacity-60">
          {t('subtitle')}
        </p>
      </div>

      <div className="w-full max-w-[380px] bg-card border border-border rounded-xl shadow-xl overflow-hidden relative z-10">
        <div className="h-1.5 w-full bg-blue-600/10 flex">
          <div className="h-full bg-blue-600 w-1/3 animate-pulse" />
        </div>
        
        <div className="p-8 space-y-6 relative z-10">
          {isSuccess ? (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in duration-500">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-2">
                <CheckCircle size={24} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('success')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('new_password_label')}</label>
                <div className="relative group/input">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-blue-500 transition-colors" size={14} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-secondary/30 border-border border rounded-lg h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                    required
                    disabled={!token || isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('confirm_password_label')}</label>
                <div className="relative group/input">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-blue-500 transition-colors" size={14} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-secondary/30 border-border border rounded-lg h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                    required
                    disabled={!token || isLoading}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-red-500 leading-relaxed uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isLoading}
                aria-label={t('button')}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-lg border-b-2 border-blue-800 active:border-b-0 active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <>{t('button')}</>}
              </button>
            </form>
          )}
        </div>
      </div>
      
      <footer className="mt-auto py-8 opacity-20">
        <div className="text-[9px] font-mono font-bold tracking-tight uppercase">
          {common('brand')} Security Restoration Protocol
        </div>
      </footer>
    </div>
  );
}
