'use client';

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { Shield, Lock, Mail, Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useTranslations } from 'next-intl';
import { SystemSettings } from "@/components/ui/SystemSettings";
import { toast } from "sonner";
import { loginAction } from "./actions";
import { generateTenantCss } from "@abd/styles";

export default function LoginPage() {
  const t = useTranslations('login');
  const common = useTranslations('common');
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 🎨 Dynamic White-Label States
  const [brandingCss, setBrandingCss] = useState("");
  const [tenantBranding, setTenantBranding] = useState<any>(null);
  const [tenantName, setTenantName] = useState("");

  // 🔄 Load Tenant Branding on mount if provided in search parameters
  useEffect(() => {
    const fetchTenantBranding = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        let tenantId = params.get('tenant');
        
        if (!tenantId) {
          const callbackUrl = params.get('callbackUrl');
          if (callbackUrl) {
            try {
              const cbParams = new URL(callbackUrl).searchParams;
              tenantId = cbParams.get('tenant');
            } catch {}
          }
        }
        
        if (tenantId) {
          const res = await fetch(`/api/auth/tenant/info?tenantId=${tenantId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.active && data.branding?.theme) {
              const css = generateTenantCss(data.branding.theme);
              setBrandingCss(css);
              setTenantBranding(data.branding);
              setTenantName(data.name);
            }
          }
        }
      } catch (err) {
        console.error('[LOGIN_BRANDING_ERROR]', err);
      }
    };
    
    fetchTenantBranding();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);

    try {
      const result = await loginAction(formData);

      if (result?.error) {
        setError(t('error_invalid'));
        toast.error(t('error_invalid'), {
          description: common('brand'),
        });
      } else {
        toast.success(common('brand'), {
          description: "Acceso concedido. Sincronizando..."
        });
        
        // 🌐 Robust Federated SSO Redirection
        const params = new URLSearchParams(window.location.search);
        const callbackUrl = params.get('callbackUrl');
        
        if (callbackUrl) {
          window.location.href = callbackUrl;
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.message === 'NEXT_REDIRECT' || (err as { digest?: string }).digest?.includes('NEXT_REDIRECT'))) {
        return;
      }
      setError(t('error_generic'));
      toast.error(t('error_generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 font-sans relative overflow-hidden transition-colors duration-300">
      {brandingCss && (
        <style id="tenant-branding-gateway" dangerouslySetInnerHTML={{ __html: brandingCss }} />
      )}
      <div className="bg-grain" />

      {/* 🛠️ Accessibility Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <SystemSettings />
      </div>
      
      {/* 🛡️ Branding Section */}
      <div className="mb-12 flex flex-col items-center animate-in slide-in-from-top duration-700">
        {tenantBranding?.logoUrl ? (
          <img src={tenantBranding.logoUrl} alt={tenantName} className="h-14 mb-4 object-contain max-w-[220px]" />
        ) : (
          <div 
            role="button"
            tabIndex={0}
            className="w-14 h-14 bg-primary text-primary-foreground rounded-xl flex items-center justify-center mb-4 shadow-xl shadow-primary/10 border border-primary/20 active:scale-95 transition-transform cursor-pointer"
          >
            <Shield size={32} className="text-primary-foreground" />
          </div>
        )}
        <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">
          {tenantName || common('brand')}
        </h1>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em] mt-2 opacity-60">
          {t('subtitle')}
        </p>
      </div>

      {/* 🔐 Login Terminal */}
      <div className="w-full max-w-[380px] bg-card border border-border rounded-xl shadow-xl overflow-hidden relative z-10">
        <div className="h-1.5 w-full bg-primary/10 flex">
          <div className="h-full bg-primary w-1/3 animate-pulse" />
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5 relative z-10">
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('email_label')}</label>
            <div className="relative group/input">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" size={14} />
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('email_placeholder')}
                className="w-full bg-secondary/30 border-border border rounded-lg h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">{t('password_label')}</label>
            <div className="relative group/input">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors" size={14} />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password_placeholder')}
                className="w-full bg-secondary/30 border-border border rounded-lg h-10 pl-10 pr-4 text-xs focus:ring-1 focus:ring-primary/30 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/30 text-foreground"
                required
              />
            </div>
            <div className="flex justify-end pt-1">
              <button 
                aria-label={t('forgot_password_link')}
                type="button"
                onClick={() => router.push('/login/forgot-password')}
                className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              >
                {t('forgot_password_link')}
              </button>
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
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-widest py-3 rounded-lg border-b-2 border-primary/80 active:border-b-0 active:translate-y-[1px] transition-all flex items-center justify-center gap-2"
              >
            {isLoading ? <Loader2 size={16} className="animate-spin text-primary-foreground" /> : <><ArrowRight size={16} /> {t('button')}</>}
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
