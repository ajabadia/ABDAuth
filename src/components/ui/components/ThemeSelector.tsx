/**
 * @purpose Renderiza un componente selector de tema con opciones para temas de luz, oscuro y sistema.
 * @purpose_en Renders a theme selector component with options for light, dark, and system themes.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1d3x2df
 * @lastUpdated 2026-06-29T22:22:41.881Z
 */

import React from "react";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { Button } from "@ajabadia/ecosystem-widgets";

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
          <Button
            key={item.id}
            variant={theme === item.id ? "default" : "outline"}
            size="xs"
            onClick={() => onSelect(item.id)}
            aria-label={`${t('theme')}: ${item.label}`}
            className="justify-between w-full"
          >
            <item.icon size={12} />
            <span className="flex-1 text-left">{item.label}</span>
            {theme === item.id && <Check size={10} />}
          </Button>
        ))}
      </div>
    </div>
  );
}
