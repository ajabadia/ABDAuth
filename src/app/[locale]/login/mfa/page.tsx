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
