"use client"

/**
 * @purpose Proporciona un componente del proveedor de temas para gestionar y aplicar temas en la aplicación.
 * @purpose_en Provides a theme provider component for managing and applying themes in the application.
 * @refactorable false
 * @classification Context/Provider
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:15s0237
 * @lastUpdated 2026-06-21T12:04:59.135Z
 */

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const orig = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Encountered a script tag')) return;
    orig.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}
