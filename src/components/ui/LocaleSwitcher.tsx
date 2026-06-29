"use client";

/**
 * @purpose Renderiza un botón que cambia entre locales español e inglés utilizando la ruta de Next-Intl.
 * @purpose_en Renders a button that toggles between Spanish and English locales using Next-Intl routing.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1oy4tko
 * @lastUpdated 2026-06-23T22:40:50.680Z
 */

import { usePathname, useRouter } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { Button } from "@ajabadia/ecosystem-widgets";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === "es" ? "en" : "es";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={toggleLocale}
      aria-label="Change Language"
    >
      <Languages size={14} className="text-primary opacity-70 group-hover/button:opacity-100 transition-opacity" />
      <span className="font-mono text-[9px] font-bold uppercase tracking-widest">
        {locale}
      </span>
    </Button>
  );
}
