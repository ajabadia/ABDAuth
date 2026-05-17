'use client';

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { Shield, Mail, Loader2, ArrowLeft, Send } from "lucide-react";
import { useTranslations } from 'next-intl';
import { SystemSettings } from "@/components/ui/SystemSettings";
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

      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <SystemSettings />
      </div>
      
      <div className="mb-12 flex flex-col items-center animate-in slide-in-from-top duration-700">
        <div 
          onClick={() => router.push('/login')}
          className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/10 border border-blue-400/20 active:scale-95 transition-transform cursor-pointer"
        >
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
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-blue-500 transition-colors" size={14} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full bg-secondary/30 border-border border rounded-lg h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                aria-label={t('send_link')}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-lg border-b-2 border-blue-800 active:border-b-0 active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> {t('button')}</>}
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
            className="w-full bg-transparent hover:bg-blue-500/5 text-muted-foreground hover:text-blue-500 text-[9px] font-bold uppercase tracking-widest py-2 rounded-lg transition-colors border border-transparent hover:border-blue-500/10 flex items-center justify-center gap-2"
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
