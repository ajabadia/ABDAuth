"use client";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "../ThemeToggle";
import { cn } from "@/lib/utils";

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
