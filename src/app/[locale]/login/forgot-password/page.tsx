'use client';

/**
 * @purpose Gestiona el formulario de solicitud de reinicio de contraseña y maneja el proceso de envío.
 * @purpose_en Renders a password reset request form and handles the submission process.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:6,sig:7donuy
 * @lastUpdated 2026-06-21T10:25:32.360Z
 */

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Shield, Mail, Loader2, ArrowLeft, Send } from "lucide-react";
import { useTranslations } from 'next-intl';
import { toast } from "sonner";
import { requestPasswordResetAction } from "@/services/auth/recovery-actions";

export default function ForgotPasswordPage() {
  const t = useTranslations('login.request_reset');
  const common = useTranslations('common');
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await requestPasswordResetAction(email);

      if (result?.success) {
        setIsSuccess(true);
        toast.success(t('success'));
      } else {
        toast.error(t('error'));
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
      
      <div className="mb-12 flex flex-col items-center animate-in slide-in-from-top duration-700">
        <div 
          onClick={() => router.push('/login')}
          className="w-14 h-14 bg-primary rounded-sm flex items-center justify-center mb-4 shadow-xl shadow-primary/10 border border-primary/20 active:scale-95 transition-transform cursor-pointer"
        >
          <Shield size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">
          {t('title')}
        </h1>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em] mt-2 opacity-60">
          {t('subtitle')}
        </p>
      </div>

      <div className="w-full max-w-[380px] bg-card border border-border rounded-sm shadow-xl overflow-hidden relative z-10">
        <div className="h-1.5 w-full bg-primary/10 flex">
          <div className="h-full bg-primary w-1/3 animate-pulse" />
        </div>
        
        <div className="p-8 space-y-6 relative z-10">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('description')}
              </p>

              <div className="space-y-2">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  {t('identity_principal')}
                </label>
                <div className="relative group/input">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" size={14} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full bg-secondary/30 border-border border rounded-sm h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                aria-label={t('send_link')}
                className="w-full bg-primary hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-[10px] font-mono uppercase tracking-widest font-black py-3 rounded-none border border-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin text-primary-foreground" /> : <><Send size={14} /> {t('button')}</>}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4 animate-in fade-in zoom-in duration-500">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-2">
                <Mail size={24} />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed px-4">
                {t('success')}
              </p>
            </div>
          )}

          <button 
            aria-label={t('back_to_login')}
            onClick={() => router.push('/login')}
            className="w-full bg-transparent hover:bg-primary/5 text-muted-foreground hover:text-primary text-[9px] font-mono uppercase tracking-widest font-bold py-2 rounded-none transition-colors border border-transparent hover:border-primary/10 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={12} />
            {t('back_to_login')}
          </button>
        </div>
      </div>
      
      <footer className="mt-auto py-8 opacity-20">
        <div className="text-[9px] font-mono font-bold tracking-tight uppercase">
          {common('brand')} Identity Recovery Terminal
        </div>
      </footer>
    </div>
  );
}
