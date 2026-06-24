"use client"

/**
 * @purpose Renderiza un elemento de navegación localizado con detección automática del estado activo.
 * @purpose_en Renders a localized navigation item with automatic active state detection.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:1r993j9
 * @lastUpdated 2026-06-23T22:40:33.951Z
 */

import { Link, usePathname } from "@/i18n/routing";

/**
 * 🧭 NavItem (Localized)
 * Shared navigation component with automatic active state detection.
 * Uses localized utilities for architectural consistency.
 */
export default function NavItem({ icon, label, href }: { icon: React.ReactNode, label: string, href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all ${
        isActive 
          ? 'bg-blue-600/5 text-blue-500 border border-blue-500/10' 
          : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent'
      }`}
    >
      {icon}
      <span className="text-[11px] font-bold">{label}</span>
    </Link>
  );
}
