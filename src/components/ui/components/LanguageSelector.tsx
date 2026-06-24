/**
 * @purpose Renderiza un componente selector de idioma que permite a los usuarios cambiar entre locales español e inglés.
 * @purpose_en Renders a language selector component that allows users to switch between Spanish and English locales.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1v6904l
 * @lastUpdated 2026-06-21T12:05:10.385Z
 */

import React from "react";
import { Languages, Check } from "lucide-react";
import { cn } from "@/lib/utils/tailwind";

interface LanguageSelectorProps {
  locale: string;
  onSelect: (locale: string) => void;
  t: (key: string) => string;
}

export function LanguageSelector({ locale, onSelect, t }: LanguageSelectorProps) {
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center gap-2 text-[9px] font-bold text-primary uppercase tracking-widest mb-3">
        <Languages size={12} />
        {t('language')}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {["es", "en"].map((loc) => (
          <button
            key={loc}
            aria-label={`${t('language')}: ${loc.toUpperCase()}`}
            onClick={() => onSelect(loc)}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-none text-[10px] font-bold uppercase transition-all border",
              locale === loc 
                ? "bg-primary/10 border-primary/30 text-primary" 
                : "bg-card border-border hover:bg-muted text-muted-foreground"
            )}
          >
            {loc}
            {locale === loc && <Check size={10} />}
          </button>
        ))}
      </div>
    </div>
  );
}
