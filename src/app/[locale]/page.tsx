import { auth } from '@/auth';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Shield, Zap, Lock, ChevronRight, Globe } from 'lucide-react';

/**
 * 🏭 Root Landing Page
 * Premium industrial entry point for the ABD Identity Gateway.
 */
export default async function RootPage() {
  const session = await auth();
  const t = useTranslations('landing');
  const c = useTranslations('common');

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-primary/30 overflow-hidden relative font-sans">
      {/* 🏗️ Industrial Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* 🛰️ Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* 🛡️ Header */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center font-black text-black italic">
            A
          </div>
          <span className="font-mono text-sm font-bold tracking-[0.3em] uppercase opacity-80">
            {c('brand')}
          </span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/5 rounded-full text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            {c('soc2_monitoring')}
          </div>
        </div>
      </nav>

      {/* 🚀 Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 bg-primary/5 border border-primary/20 rounded-full text-xs font-mono text-primary uppercase tracking-widest animate-fade-in">
          <Globe className="w-3 h-3" />
          Certified Identity System v1.0
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic uppercase mb-8 leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
          {t('hero_title')}
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-neutral-400 font-light leading-relaxed mb-12">
          {t('hero_subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {session ? (
            <Link 
              href="/dashboard" 
              className="px-10 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-primary transition-all duration-300 flex items-center gap-2 group"
            >
              {t('cta_dashboard')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="px-10 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-primary transition-all duration-300 flex items-center gap-2 group"
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
          <div className="p-8 bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
            <Zap className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-3 italic">{t('features.federated')}</h3>
            <p className="text-neutral-500 leading-relaxed text-sm">{t('features.federated_desc')}</p>
          </div>
          
          <div className="p-8 bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
            <Shield className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-3 italic">{t('features.isolation')}</h3>
            <p className="text-neutral-500 leading-relaxed text-sm">{t('features.isolation_desc')}</p>
          </div>
          
          <div className="p-8 bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all group">
            <Lock className="w-10 h-10 text-primary mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-bold uppercase tracking-tight mb-3 italic">{t('features.security')}</h3>
            <p className="text-neutral-500 leading-relaxed text-sm">{t('features.security_desc')}</p>
          </div>
        </div>
      </section>

      {/* 🏁 Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="font-mono text-[10px] text-neutral-600 uppercase tracking-[0.4em]">
            {c('industrial_ecosystem')}
          </div>
          <div className="flex gap-8 font-mono text-[10px] text-neutral-600 uppercase tracking-widest">
            <span>Core: Next.js 16</span>
            <span>Auth: Industry-Federated</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
