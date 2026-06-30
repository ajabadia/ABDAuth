/**
 * @purpose Renderiza un componente selector de idioma que permite a los usuarios cambiar entre locales en español e inglés.
 * @purpose_en Renders a language selector component that allows users to switch between Spanish and English locales.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:105b61v
 * @lastUpdated 2026-06-29T22:22:39.641Z
 */

import React from "react";
import { Languages, Check } from "lucide-react";
import { Button } from "@ajabadia/ecosystem-widgets";

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
          <Button
            key={loc}
            variant={locale === loc ? "default" : "outline"}
            size="xs"
            onClick={() => onSelect(loc)}
            aria-label={`${t('language')}: ${loc.toUpperCase()}`}
            className="justify-between w-full"
          >
            {loc}
            {locale === loc && <Check size={10} />}
          </Button>
        ))}
      </div>
    </div>
  );
}
