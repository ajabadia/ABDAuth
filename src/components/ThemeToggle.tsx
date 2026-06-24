"use client"

/**
 * @purpose Renderiza un botón que cambia entre temas claros y oscuros.
 * @purpose_en Renders a button that toggles the theme between light and dark.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:3,sig:5kj6r6
 * @lastUpdated 2026-06-21T12:05:02.705Z
 */

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  return (
    <button aria-label="Toggle Theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-md border border-border bg-background hover:bg-muted transition-all active:scale-90"
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-yellow-500" />
      ) : (
        <Moon size={18} className="text-slate-700" />
      )}
    </button>
  )
}
