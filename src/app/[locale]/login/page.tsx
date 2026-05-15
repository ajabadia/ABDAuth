'use client';

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "@/i18n/routing";
import { Shield, Lock, Mail, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';
import { SystemSettings } from "@/components/ui/SystemSettings";

export default function LoginPage() {
  const t = useTranslations('login');
  const common = useTranslations('common');
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('error_invalid'));
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError(t('errors.invalid_credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 font-sans relative overflow-hidden transition-colors duration-300">
      <div className="bg-grain" />

      {/* 🛠️ Accessibility Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <SystemSettings />
      </div>
      
      {/* 🛡️ Branding Section */}
      <div className="mb-12 flex flex-col items-center animate-in slide-in-from-top duration-700">
        <div 
          role="button"
          tabIndex={0}
          className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/10 border border-blue-400/20 active:scale-95 transition-transform cursor-pointer"
        >
          <Shield size={32} className="text-white" />
        </div>
        <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">
          {common('brand')}
        </h1>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em] mt-2 opacity-60">
          {t('subtitle')}
        </p>
      </div>

      {/* 🔐 Login Terminal */}
      <div className="w-full max-w-[380px] bg-card border border-border rounded-xl shadow-xl overflow-hidden relative z-10">
        <div className="h-1.5 w-full bg-blue-600/10 flex">
          <div className="h-full bg-blue-600 w-1/3 animate-pulse" />
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5 relative z-10">
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('email_label')}</label>
            <div className="relative group/input">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-blue-500 transition-colors" size={14} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email_placeholder')}
                className="w-full bg-secondary/30 border-border border rounded-lg h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('password_label')}</label>
            <div className="relative group/input">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-blue-500 transition-colors" size={14} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password_placeholder')}
                className="w-full bg-secondary/30 border-border border rounded-lg h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg flex items-start gap-3 animate-in fade-in zoom-in duration-300">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold text-red-500 leading-relaxed uppercase tracking-tight">{error}</p>
            </div>
          )}

          <button aria-label={t('button')}
            type="submit"
            disabled={isLoading}
            className="w-full h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-blue-500/20"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><ArrowRight size={16} /> {t('button')}</>}
          </button>
        </form>

        <div className="p-4 bg-secondary/20 border-t border-border flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('shield_badge')}</span>
        </div>
      </div>

      {/* 📟 Lab Credentials (Demo) */}
      <div className="mt-8 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t('demo_title')}</span>
        <div className="flex gap-4">
          <div className="text-[9px] font-mono bg-secondary px-2 py-1 rounded border border-border">{t('demo_user')}</div>
          <div className="text-[9px] font-mono bg-secondary px-2 py-1 rounded border border-border">{t('demo_pass')}</div>
        </div>
      </div>

      {/* 🏁 Footer Specs */}
      <footer className="mt-auto py-8 flex items-center gap-6 opacity-20">
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-tight uppercase">
          <CheckCircle size={10} className="text-emerald-500" />
          {t('footer_text')}
        </div>
      </footer>
    </div>
  );
}
