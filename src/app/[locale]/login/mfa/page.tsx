/**
 * @purpose Renderiza una página para verificación de autenticación multifactorial.
 * @purpose_en Renders a page for Multi-Factor Authentication (MFA) verification.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:0e8wwb
 * @lastUpdated 2026-06-21T10:26:01.543Z
 */

import { MfaVerificationForm } from '@/components/auth/MfaVerificationForm';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'login.mfa' });
  return {
    title: `${t('title')} | ABDAuth`,
  };
}

export default function MfaLoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <MfaVerificationForm />
    </div>
  );
}
