import { auth } from '@/auth';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { Shield, Zap, Lock, ChevronRight } from 'lucide-react';
import { SystemSettings } from '@/components/ui/SystemSettings';

/**
 * 🏭 Root Landing Page
 * Conforms 100% to the ABD Suite Landing Standard.
 * Industrial instrument console feel, theme-aware, and fully localized.
 */
export default async function RootPage() {
  const session = await auth();
  const t = await getTranslations('landing');
  const c = await getTranslations('common');

  // Dynamic brand title division for visual anchoring
  const rawTitle = t('hero_title');
  const brandName = "ABD";
  const restOfTitle = rawTitle.toLowerCase().startsWith(brandName.toLowerCase())
    ? rawTitle.slice(brandName.length).trim()
    : rawTitle;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-background text-foreground selection:bg-primary/30 overflow-hidden relative" role="main">
      {/* 🏗️ Atmosphere & Grid */}
      <div className="absolute inset-0 z-0 bg-industrial-grid mask-industrial-fade opacity-50 pointer-events-none" />
      
      {/* 🛰️ Glow Effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* 🛠️ System Settings Console */}
      <div className="absolute top-6 right-6 z-50">
        <SystemSettings isAuthenticated={!!session} />
      </div>

      {/* 📟 Main Console Screen */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl gap-12 animate-in fade-in duration-500">
        
        {/* 1. Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-muted/50 border border-border text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono rounded-sm select-none">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
          </span>
          {c('soc2_monitoring')}
        </div>

        {/* 2. Mega Título en Cursiva Negrita */}
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter italic uppercase antialiased text-foreground leading-none">
            {brandName} <span className="text-primary">{restOfTitle}</span>
          </h1>
          
          {/* 3. Subtítulo Delgado */}
          <p className="max-w-[650px] text-sm md:text-base text-muted-foreground font-light leading-relaxed mx-auto">
            {t('hero_subtitle')}
          </p>
        </div>

        {/* 4. Tactical Action Area (CTA) */}
        <div className="flex flex-col items-center gap-3 mt-4">
          {session ? (
            <Link 
              href="/dashboard"
              aria-label={t('cta_dashboard')}
              className="px-10 py-4 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-black rounded-none border border-primary/30 hover:bg-primary/95 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {t('cta_dashboard')}
              <ChevronRight className="w-4 h-4 animate-pulse" />
            </Link>
          ) : (
            <Link 
              href="/login"
              aria-label={t('cta_login')}
              className="px-10 py-4 bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest font-black rounded-none border border-primary/30 hover:bg-primary/95 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {t('cta_login')}
              <ChevronRight className="w-4 h-4 animate-pulse" />
            </Link>
          )}
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground/40">
            SYS_GATEWAY_ACTIVE
          </span>
        </div>

        {/* 5. Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
          <div className="p-6 bg-card border border-border rounded-sm flex flex-col gap-4 text-left">
            <div className="p-2.5 bg-primary/5 border border-primary/20 text-primary w-fit rounded-sm">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {t('features.federated')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('features.federated_desc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-sm flex flex-col gap-4 text-left">
            <div className="p-2.5 bg-primary/5 border border-primary/20 text-primary w-fit rounded-sm">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
              {t('features.isolation')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('features.isolation_desc')}
            </p>
          </div>

          <div className="p-6 bg-card border border-border rounded-sm flex flex-col gap-4 text-left">
            <div className="p-2.5 bg-primary/5 border border-primary/20 text-primary w-fit rounded-sm">
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

        {/* 6. Telemetry Footer */}
        <div className="mt-16 flex flex-col items-center gap-6 w-full">
          <div className="w-24 h-[1px] bg-border/60" />
          <div className="flex flex-wrap justify-center gap-12 font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground/30">
            <span>{t('footer.core')}</span>
            <span>{t('footer.auth')}</span>
            <span>{c('industrial_ecosystem')}</span>
          </div>
        </div>

      </div>
    </main>
  );
}
