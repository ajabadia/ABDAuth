import { auth, signOut } from "@/auth";
import { redirect, Link } from "@/i18n/routing";
import { Shield, LayoutDashboard, Users, Settings, LogOut, ScrollText, Database } from 'lucide-react';
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSwitcher } from "@/components/ui/LocaleSwitcher";
import { MobileNav } from "@/components/MobileNav";
import { getTranslations } from 'next-intl/server';
import NavItem from "@/components/NavItem";

import type { IndustrialSession } from "@/types/auth";

/**
 * 🏰 Dashboard Layout (Industrial Localized)
 * Shared sidebar and header with localized navigation and RBAC.
 */
export default async function DashboardLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const session = await auth();
  const t = await getTranslations('dashboard');
  const { locale } = await params;

  if (!session) {
    redirect({ href: '/login', locale });
    return null;
  }

  const user = session.user as unknown as IndustrialSession;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <div className="bg-grain" />

      {/* 🧭 Desktop Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-20 hidden md:flex flex-col">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3 mb-8">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center border border-blue-400/20">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold tracking-tighter text-lg uppercase">{t('menu.overview')}</span>
          </Link>

          <nav className="space-y-1">
            <NavItem href="/dashboard" icon={<LayoutDashboard size={16} />} label={t('menu.overview')} />
            
            {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
              <NavItem href="/dashboard/users" icon={<Users size={16} />} label={t('menu.users')} />
            )}
            
            {user.role === 'SUPER_ADMIN' && (
              <NavItem href="/dashboard/tenants" icon={<Database size={16} />} label={t('menu.tenants')} />
            )}

            {user.role === 'SUPER_ADMIN' && (
              <NavItem href="/dashboard/applications" icon={<Shield size={16} />} label={t('menu.applications')} />
            )}
            
            {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
              <NavItem href="/dashboard/audit" icon={<ScrollText size={16} />} label={t('menu.audit')} />
            )}
            
            <NavItem href="/dashboard/settings" icon={<Settings size={16} />} label={t('menu.settings')} />
          </nav>
        </div>

        <div className="mt-auto p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg border border-border">
            <div className="w-8 h-8 bg-background rounded flex items-center justify-center font-bold text-xs border border-border">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold truncate">{user.name}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <MobileNav user={user} />

      <main className="md:ml-64 p-6 md:p-8 relative z-10 pt-20 md:pt-8 min-h-screen">
        <header className="flex justify-end mb-6">
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <ThemeToggle />
            <form action={async () => {
              'use server';
              await signOut();
            }}>
              <button 
                aria-label={t('logout')}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/5 border border-red-500/10 text-red-500 rounded-md text-[9px] md:text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/10 transition-all active:scale-95"
              >
                <LogOut size={12} />
                <span className="hidden sm:inline">{t('logout')}</span>
              </button>
            </form>
          </div>
        </header>

        {children}
        
        <footer className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 opacity-30">
          <div className="text-[9px] font-mono tracking-tighter uppercase text-muted-foreground">{t('common.industrial_ecosystem')}</div>
          <div className="text-[9px] font-mono tracking-tighter uppercase text-muted-foreground">{t('common.soc2_monitoring')}</div>
        </footer>
      </main>
    </div>
  );
}
