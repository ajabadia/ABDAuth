"use client";

/**
 * @purpose Gestiona un componente de control unificado para el manejo de locales y temas.
 * @purpose_en Renders a unified system controls component for locale and theme management.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:1cgqtg
 * @lastUpdated 2026-06-23T22:40:43.603Z
 */

import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "../ThemeToggle";
import { cn } from "@/lib/utils/tailwind";

interface IndustrialControlsProps {
  className?: string;
}

/**
 * 🛠️ IndustrialControls
 * Unified system controls for locale and theme management.
 * Ensures DRY principles across the industrial ecosystem.
 */
export function IndustrialControls({ className }: IndustrialControlsProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LocaleSwitcher />
      <ThemeToggle />
    </div>
  );
}
