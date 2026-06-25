/**
 * @purpose Renderiza una página de inicio de sesión federada que lista los proveedores de identidad disponibles y permite a los usuarios iniciar sesión utilizando ellos.
 * @purpose_en Renders a federated login page that lists available identity providers and allows users to log in using them.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:2,imports:7,sig:1a482mo
 * @lastUpdated 2026-06-25T10:16:51.619Z
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { connectDB } from '@ajabadia/satellite-sdk/db';
import { identityProviderRepository } from '@/lib/repositories/IdentityProviderRepository';
import { FederatedProviderList } from './components/FederatedProviderList';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface FederatedLoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; provider?: string }>;
}

async function FederatedProviderListWrapper({ email }: { email?: string }) {
  let providers: Array<{
    _id: string;
    name: string;
    description: string;
    providerType: 'OIDC' | 'SAML';
    issuerUrl?: string;
    entityId?: string;
  }> = [];

  try {
    await connectDB();
    const allProviders = await identityProviderRepository.list({ active: true } as unknown as Parameters<typeof identityProviderRepository.list>[0]);
    providers = allProviders
      .filter((p) => p.providerType === 'OIDC') // SAML init endpoint pending implementation
      .map((p) => ({
        _id: p._id?.toString?.() ?? String(p._id),
        name: p.name,
        description: p.description ?? '',
        providerType: p.providerType,
        issuerUrl: p.issuerUrl,
        entityId: p.entityId,
      }));
  } catch (err) {
    console.error('[FEDERATED_LOGIN] Failed to fetch providers:', err);
  }

  return <FederatedProviderList providers={providers} prefillEmail={email} />;
}

export default async function FederatedLoginPage({
  params,
  searchParams,
}: FederatedLoginPageProps) {
  const { locale } = await params;
  const { email, provider } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'login.federated' });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground selection:bg-primary/30 overflow-hidden relative" role="main">
      {/* Atmosphere & Grid */}
      <div className="absolute inset-0 z-0 bg-industrial-grid mask-industrial-fade opacity-50 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Branding */}
      <div className="mb-8 flex flex-col items-center text-center animate-in slide-in-from-top duration-700 relative z-10 gap-4">
        <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-muted/50 border border-border text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono rounded-sm select-none">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
          </span>
          FEDERATED ACCESS
        </div>

        <div className="w-14 h-14 bg-primary/5 text-primary rounded-none flex items-center justify-center mb-2 shadow-xl border border-primary/20">
          <Shield size={28} className="text-primary" />
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase antialiased text-foreground leading-none">
          ABD <span className="text-primary">Federation</span>
        </h1>
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em] mt-1 opacity-60">
          {t('subtitle')}
        </p>
      </div>

      {/* Back to login */}
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-[9px] font-mono font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest relative z-10"
        aria-label={t('back_to_login')}
      >
        <ArrowLeft size={12} />
        {t('back_to_login')}
      </Link>

      {/* Federated Providers */}
      <div className="w-full max-w-[420px] relative z-10">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          }
        >
          <FederatedProviderListWrapper email={email} />
        </Suspense>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-8 flex items-center gap-6 opacity-20 relative z-10">
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-[0.2em] uppercase">
          <Shield size={10} className="text-emerald-500" />
          {t('footer_text')}
        </div>
      </footer>
    </main>
  );
}
