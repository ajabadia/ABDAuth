import { auth } from '@/auth';
import { Link } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';
import { Shield, Zap, Lock, ChevronRight, Globe } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';

/**
 * 🏭 Root Landing Page
 * Premium industrial entry point for the ABD Identity Gateway.
 * Fully theme-aware and multi-language.
 */
export default async function RootPage() {
  const session = await auth();
  const t = await getTranslations('landing');
  const c = await getTranslations('common');

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-hidden relative transition-colors duration-500">
      {/* 🏗️ Industrial Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.1]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* 🛰️ Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 dark:bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* 🛡️ Header */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center font-black text-primary-foreground italic">
            A
          </div>
          <span className="font-mono text-sm font-bold tracking-[0.3em] uppercase opacity-80">
            {c('brand')}
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-muted border border-border rounded-full text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            {c('soc2_monitoring')}
          </div>
          <div className="h-6 w-[1px] bg-border mx-2" />
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
      </nav>

      {/* 🚀 Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-primary/5 border border-primary/20 rounded-full text-xs font-mono text-primary uppercase tracking-widest animate-fade-in">
          <Globe className="w-3 h-3" />
          Certified Identity System v1.0
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase mb-8 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/40">
          {t('hero_title')}
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-muted-foreground font-light leading-relaxed mb-12">
          {t('hero_subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {session ? (
            <Link 
              href="/dashboard" 
              className="px-10 py-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:opacity-90 transition-all duration-300 flex items-center gap-2 group"
            >
              {t('cta_dashboard')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="px-10 py-4 bg-primary text-primary-foreground font-bold uppercase tracking-widest hover:opacity-90 transition-all duration-300 flex items-center gap-2 group"
            >
              {t('cta_login')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </section>

      {/* 🛠️ Features Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-card border border-border hover:border-primary/20 transition-all group shadow-sm">
            <Zap className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-3 italic">{t('features.federated')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">{t('features.federated_desc')}</p>
          </div>
          
          <div className="p-8 bg-card border border-border hover:border-primary/20 transition-all group shadow-sm">
            <Shield className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-3 italic">{t('features.isolation')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">{t('features.isolation_desc')}</p>
          </div>
          
          <div className="p-8 bg-card border border-border hover:border-primary/20 transition-all group shadow-sm">
            <Lock className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-3 italic">{t('features.security')}</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">{t('features.security_desc')}</p>
          </div>
        </div>
      </section>

      {/* 🏁 Footer */}
      <footer className="relative z-10 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.4em]">
            {c('industrial_ecosystem')}
          </div>
          <div className="flex gap-8 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
            <span>{t('footer.core')}</span>
            <span>{t('footer.auth')}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
