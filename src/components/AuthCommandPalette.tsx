'use client';

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { CommandPalette, type Command } from '@ajabadia/ecosystem-widgets';
import { LayoutDashboard, Users, Shield, Building2, Key, Globe, LogOut, Settings } from 'lucide-react';

export function AuthCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const commands: Command[] = [
    // Navigation Category
    {
      id: 'nav-dashboard',
      title: locale === 'es' ? 'Ir al Dashboard Central' : 'Go to Main Dashboard',
      description: locale === 'es' ? 'Volver a la vista general' : 'Return to overview',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'd'],
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard');
      }
    },
    {
      id: 'nav-users',
      title: locale === 'es' ? 'Usuarios y Perfiles' : 'Users & Profiles',
      description: locale === 'es' ? 'Gestionar identidades y roles' : 'Manage identities and roles',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'u'],
      icon: <Users className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard/users');
      }
    },
    {
      id: 'nav-applications',
      title: locale === 'es' ? 'Catálogo de Aplicaciones' : 'Applications Catalog',
      description: locale === 'es' ? 'Configurar clientes federados y SSO' : 'Configure federated clients and SSO',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 'a'],
      icon: <Shield className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard/applications');
      }
    },
    {
      id: 'nav-tenants',
      title: locale === 'es' ? 'Inquilinos (Tenants)' : 'Tenants',
      description: locale === 'es' ? 'Ver organizaciones suscritas' : 'View subscribed organizations',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 't'],
      icon: <Building2 className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard/tenants');
      }
    },
    {
      id: 'nav-security',
      title: locale === 'es' ? 'Seguridad y Criptografía' : 'Security & Crypto',
      description: locale === 'es' ? 'Ajustar políticas criptográficas' : 'Adjust cryptographic policies',
      category: locale === 'es' ? 'Navegación' : 'Navigation',
      shortcut: ['g', 's'],
      icon: <Key className="w-4 h-4" />,
      action: () => {
        router.push('/dashboard/security');
      }
    },
    // Configuration / Action Category
    {
      id: 'action-language',
      title: locale === 'es' ? 'Switch to English' : 'Cambiar a Español',
      description: locale === 'es' ? 'Change layout language to English' : 'Cambiar el idioma a Español',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['c', 'l'],
      icon: <Globe className="w-4 h-4" />,
      action: () => {
        const nextLocale = locale === 'es' ? 'en' : 'es';
        router.replace(pathname, { locale: nextLocale });
      }
    },
    {
      id: 'action-settings',
      title: locale === 'es' ? 'Abrir Panel de Configuración' : 'Open System Settings',
      description: locale === 'es' ? 'Ajustar temas visuales e idioma' : 'Adjust theme modes and language',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['c', 's'],
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        const settingsBtn = document.querySelector('[aria-label="Open Settings"]') as HTMLButtonElement;
        if (settingsBtn) {
          settingsBtn.click();
        }
      }
    },
    {
      id: 'action-logout',
      title: locale === 'es' ? 'Cerrar Sesión' : 'Sign Out',
      description: locale === 'es' ? 'Finalizar sesión de forma segura' : 'Securely end your session',
      category: locale === 'es' ? 'Configuración' : 'Settings',
      shortcut: ['q', 'q'],
      icon: <LogOut className="w-4 h-4" />,
      action: async () => {
        await authClient.signOut();
        window.location.href = '/';
      }
    }
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={locale === 'es' ? 'Escribe un comando o busca...' : 'Type a command or search...'}
    />
  );
}
