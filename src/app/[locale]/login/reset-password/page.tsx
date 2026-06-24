'use client';

/**
 * @purpose Gestiona el formulario de restablecimiento de contraseña y maneja el proceso de envío.
 * @purpose_en Renders a password reset form and handles the submission process.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Medium
 * @fingerprint exports:1,imports:8,sig:okr690
 * @lastUpdated 2026-06-21T10:29:58.252Z
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter as useIntlRouter } from "@/i18n/routing";
import { Shield } from "lucide-react";
import { useTranslations } from 'next-intl';
import { toast } from "sonner";
import { resetPasswordAction } from "@/services/auth/recovery-actions";
import { ResetPasswordForm } from "./components/ResetPasswordForm";

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
      
      {/* 🛡️ Header Branding */}
      <div className="mb-12 flex flex-col items-center animate-in slide-in-from-top duration-700">
        <div className="w-14 h-14 bg-primary rounded-sm flex items-center justify-center mb-4 shadow-xl shadow-primary/10 border border-primary/20">
          <Shield size={32} className="text-primary-foreground" />
        </div>
        <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">
          {t('title')}
        </h1>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em] mt-2 opacity-60">
          {t('subtitle')}
        </p>
      </div>

      {/* 🔐 Reset Terminal Container */}
      <div className="w-full max-w-[380px] bg-card border border-border rounded-sm shadow-xl overflow-hidden relative z-10">
        <div className="h-1.5 w-full bg-primary/10 flex">
          <div className="h-full bg-primary w-1/3 animate-pulse" />
        </div>
        
        <div className="p-8 space-y-6 relative z-10">
          <ResetPasswordForm 
            isSuccess={isSuccess}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            isLoading={isLoading}
            error={error}
            onSubmit={handleSubmit}
            token={token}
            t={t}
          />
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
