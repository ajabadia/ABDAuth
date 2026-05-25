'use client';

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { SystemSettings } from "@/components/ui/SystemSettings";
import { toast } from "sonner";
import { loginAction } from "./actions";
import { useTenantBranding } from "./hooks/useTenantBranding";
import { LoginBranding } from "./components/LoginBranding";
import { LoginForm } from "./components/LoginForm";
import { LoginDemoCredentials } from "./components/LoginDemoCredentials";

export default function LoginPage() {
  const t = useTranslations('login');
  const common = useTranslations('common');
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  const handlePasskeyLogin = async () => {
    if (!email) {
      setError(t('error_email_required'));
      toast.error(t('error_email_required'));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');
      const { 
        generatePasskeyAuthenticationOptionsAction, 
        verifyPasskeyAuthenticationAction 
      } = await import('@/services/auth/security-actions');

      const options = await generatePasskeyAuthenticationOptionsAction(email);
      const authResponse = await startAuthentication({ optionsJSON: options });
      const verification = await verifyPasskeyAuthenticationAction(email, authResponse);

      if (verification.success && verification.bypassToken) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('passkeyBypassToken', verification.bypassToken);

        const result = await loginAction(formData);

        if (result?.error) {
          setError(t('error_invalid'));
          toast.error(t('error_invalid'));
        } else {
          toast.success(common('brand'), {
            description: "Acceso biométrico concedido. Sincronizando..."
          });
          const params = new URLSearchParams(window.location.search);
          const callbackUrl = params.get('callbackUrl');
          if (callbackUrl) {
            window.location.href = callbackUrl;
          } else {
            router.push('/dashboard');
          }
        }
      } else {
        setError(verification.error || t('error_invalid'));
        toast.error(verification.error || t('error_invalid'));
      }
    } catch (err: unknown) {
      if (err instanceof Error && (err.message === 'NEXT_REDIRECT' || (err as { digest?: string }).digest?.includes('NEXT_REDIRECT'))) {
        return;
      }
      // eslint-disable-next-line no-console
      console.error('[Passkey Login Flow Error]', err);
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

      {/* 🛠️ Accessibility Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <SystemSettings isAuthenticated={false} />
      </div>
      
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
        onPasskeyLogin={handlePasskeyLogin}
        t={t}
      />

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
