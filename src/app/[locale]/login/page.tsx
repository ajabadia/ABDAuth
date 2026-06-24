'use client';

/**
 * @purpose Renderiza la página de inicio de sesión con manejo de formularios, enlace de SSO federado y marca de identidad del tenant.
 * @purpose_en Renders the login page with form handling, federated SSO link, and tenant branding.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:12,sig:104zu2b
 * @lastUpdated 2026-06-21T12:03:13.781Z
 */

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { toast } from "sonner";
import { loginAction } from "./actions";
import { useTenantBranding } from "./hooks/useTenantBranding";
import { LoginBranding } from "./components/LoginBranding";
import { LoginForm } from "./components/LoginForm";
import { LoginDemoCredentials } from "./components/LoginDemoCredentials";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const t = useTranslations('login');
  const common = useTranslations('common');
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 🌐 Federated SSO link — preserve current query params
  const searchParams = useSearchParams();
  const federatedUrl = `/login/federated${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

  // 🎨 White-label styling state & dynamic CSS injection hook
  const { brandingCss, tenantBranding, tenantName } = useTenantBranding();

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
        if (result.error === 'ACCOUNT_LOCKED') {
          setError(t('error_locked'));
          toast.error(t('error_locked'), {
            description: common('brand'),
          });
        } else {
          setError(t('error_invalid'));
          toast.error(t('error_invalid'), {
            description: common('brand'),
          });
        }
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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground selection:bg-primary/30 overflow-hidden relative" role="main">
      {brandingCss && (
        <style id="tenant-branding-gateway" dangerouslySetInnerHTML={{ __html: brandingCss }} />
      )}
      
      {/* 🏗️ Atmosphere & Grid */}
      <div className="absolute inset-0 z-0 bg-industrial-grid mask-industrial-fade opacity-50 pointer-events-none" />
      
      {/* 🛰️ Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none" />


      
      {/* 🛡️ Branding Header */}
      <LoginBranding 
        tenantBranding={tenantBranding}
        tenantName={tenantName}
        defaultBrand={common('brand')}
        subtitle={t('subtitle')}
      />

      {/* 🔐 Login Terminal Form */}
      <LoginForm 
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
        error={error}
        onSubmit={handleSubmit}
        onForgotPassword={() => router.push('/login/forgot-password')}
        t={t}
      />

      {/* 🌐 SSO Federation Link */}
      <div className="relative z-10 mt-4 mb-2">
        <Link
          href={federatedUrl}
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/20 border border-border hover:border-primary/40 hover:bg-secondary/30 hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.15)] active:scale-95 transition-all duration-200 text-[9px] font-mono font-black text-muted-foreground hover:text-primary uppercase tracking-widest rounded-none"
          aria-label={t('federated_login')}
        >
          <ExternalLink size={12} />
          {t('federated_login')}
        </Link>
      </div>

      {/* 📟 Lab Credentials & Footer Specs */}
      <LoginDemoCredentials 
        demoTitle={t('demo_title')}
        demoUser={t('demo_user')}
        demoPass={t('demo_pass')}
        footerText={t('footer_text')}
      />
    </main>
  );
}
