/**
 * @purpose Rendiza la página de aterrizaje para la aplicación ABDAuth, manejando la autenticación del usuario y mostrando las capacidades del sistema.
 * @purpose_en Renders the landing page for the ABDAuth application, handling user authentication and displaying system capabilities.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:1su6tmi
 * @lastUpdated 2026-06-30T10:58:24.349Z
 */

import { getServerSession } from '@/lib/get-session';
import { getTranslations } from 'next-intl/server';
import { Zap, Shield, Lock } from 'lucide-react';
import { HeroHeader, LandingPageLayout, SubtleLoginButton } from '@ajabadia/styles';
import { GlobalFooter } from '@ajabadia/ecosystem-widgets';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const session = await getServerSession();

  if (session) {
    redirect('/dashboard');
  }

  const t = await getTranslations('landing');
  const c = await getTranslations('common');

  const rawTitle = t('hero_title');
  const brandName = 'ABD';
  const restOfTitle = rawTitle.toLowerCase().startsWith(brandName.toLowerCase())
    ? rawTitle.slice(brandName.length).trim()
    : rawTitle;

  return (
    <LandingPageLayout>
      <HeroHeader
        statusText={c('soc2_monitoring')}
        title={<>{brandName} <span className="text-primary">{restOfTitle}</span></>}
        description={t('hero_subtitle')}
      />

      <main className="flex flex-col gap-16">
        <SubtleLoginButton
          href="/login"
          label={t('cta_login')}
          hint="SYS_GATEWAY_ACTIVE"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="region" aria-label="System Capabilities">
          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {t('features.federated')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('features.federated_desc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {t('features.isolation')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('features.isolation_desc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl flex flex-col gap-4">
            <div className="p-2.5 bg-secondary/10 border border-border text-primary w-fit rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {t('features.security')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('features.security_desc')}
            </p>
          </div>
        </div>
      </main>

      <GlobalFooter
        separatorWidth="short"
        telemetryItems={[
          { label: 'Core', value: t('footer.core') },
          { label: 'Auth', value: t('footer.auth') },
          { label: 'Ecosystem', value: c('industrial_ecosystem') },
        ]}
      />
    </LandingPageLayout>
  );
}
