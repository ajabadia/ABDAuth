/**
 * @purpose Renderiza un componente selector de tema que permite a los usuarios cambiar entre temas de luz, oscuro y sistema.
 * @purpose_en Renders a theme selector component that allows users to switch between light, dark, and system themes.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:5m11qd
 * @lastUpdated 2026-06-21T12:05:14.630Z
 */

import React from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";

interface ThemeSelectorProps {
  theme: string | undefined;
  onSelect: (theme: string) => void;
  t: (key: string) => string;
}

export function ThemeSelector({ theme, onSelect, t }: ThemeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[9px] font-bold text-primary uppercase tracking-widest mb-3">
        <Monitor size={12} />
        {t('theme')}
      </div>
      <div className="flex flex-col gap-1.5">
        {[
          { id: 'light', icon: Sun, label: t('theme_light') },
          { id: 'dark', icon: Moon, label: t('theme_dark') },
          { id: 'system', icon: Monitor, label: t('theme_system') }
        ].map((item) => (
          <button
            key={item.id}
            aria-label={`${t('theme')}: ${item.label}`}
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-none text-[10px] font-bold uppercase transition-all border",
              theme === item.id 
                ? "bg-primary/10 border-primary/30 text-primary" 
                : "bg-card border-border hover:bg-muted text-muted-foreground"
            )}
          >
            <item.icon size={12} />
            <span className="flex-1 text-left">{item.label}</span>
            {theme === item.id && <Check size={10} />}
          </button>
        ))}
      </div>
    </div>
  );
}
