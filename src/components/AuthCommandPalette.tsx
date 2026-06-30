'use client';

/**
 * @purpose Renderiza una pestaña de comandos con comandos relacionados a la autenticación.
 * @purpose_en Renders a command palette with authentication-related commands.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:6,sig:ewlgr1
 * @lastUpdated 2026-06-30T05:48:59.462Z
 */

import React from 'react';
import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { CommandPalette, type Command, buildCommonCommands } from '@ajabadia/ecosystem-widgets';
import { LayoutDashboard, Users, Shield, Building2, Key } from 'lucide-react';

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
    ...buildCommonCommands({ locale, pathname, router, onLogout: async () => { await authClient.signOut(); window.location.href = '/'; } })
  ];

  return (
    <CommandPalette
      commands={commands}
      placeholder={locale === 'es' ? 'Escribe un comando o busca...' : 'Type a command or search...'}
    />
  );
}
