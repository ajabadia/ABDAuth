"use client"

import { useState } from "react";
import { Shield, Menu, X, LayoutDashboard, Users, Database, ScrollText, Settings } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { ThemeToggle } from "./ThemeToggle";
import { useTranslations } from "next-intl";

interface NavUser {
  name: string;
  role: string;
  tenantId: string;
}

/**
 * 📱 Mobile Navigation Drawer
 * High-fidelity responsive menu for small screens.
 */
export function MobileNav({ user }: { user: NavUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const common = useTranslations('common');
  const t = useTranslations('dashboard.menu');

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-30 px-4 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
          <Shield size={14} className="text-white" />
        </div>
        <span className="font-bold text-sm tracking-tighter uppercase">{user.tenantId}</span>
      </Link>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button aria-label="Open Menu"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-secondary rounded-md transition-colors"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 🌑 Overlay & Drawer */}
      {isOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-in fade-in duration-300">
          <aside className="fixed right-0 top-0 bottom-0 w-72 bg-card border-l border-border p-6 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold tracking-tighter text-xl uppercase">{common('brand')}</span>
              <button aria-label="Close" onClick={() => setIsOpen(false)} className="p-2 hover:bg-secondary rounded-md">
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-2">
              <MobileNavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label={t('overview')} onClick={() => setIsOpen(false)} />
              
              {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                <MobileNavItem href="/dashboard/users" icon={<Users size={18} />} label={t('users')} onClick={() => setIsOpen(false)} />
              )}
              
              {user.role === 'SUPER_ADMIN' && (
                <MobileNavItem href="/dashboard/tenants" icon={<Database size={18} />} label={t('tenants')} onClick={() => setIsOpen(false)} />
              )}
              
              {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
                <MobileNavItem href="/dashboard/audit" icon={<ScrollText size={18} />} label={t('audit')} onClick={() => setIsOpen(false)} />
              )}
              
              <MobileNavItem href="/dashboard/settings" icon={<Settings size={18} />} label={t('settings')} onClick={() => setIsOpen(false)} />
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}

function MobileNavItem({ href, icon, label, onClick }: { href: string, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary transition-colors group"
    >
      <span className="text-muted-foreground group-hover:text-blue-500 transition-colors">{icon}</span>
      <span className="font-bold text-sm">{label}</span>
    </Link>
  );
}
