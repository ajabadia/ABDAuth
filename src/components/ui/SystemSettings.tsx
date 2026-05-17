"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, Sun, Moon, Monitor, Languages, Check, X, LogIn, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useSession, signIn, signOut } from "next-auth/react";

/**
 * 🛠️ SystemSettings
 * Unified dropdown for industrial system configuration (Theme & Language).
 * Designed for scalability and DRY compliance.
 */
export function SystemSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // 🛡️ Guard de Hidratación
  const containerRef = useRef<HTMLDivElement>(null);
  
  const t = useTranslations("settings");
  const { theme, setTheme } = useTheme();
  const { status } = useSession();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // 🛡️ Activar montaje en cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🚪 Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  // Renderizar un esqueleto inerte durante el SSR para evitar el crash de hidratación
  if (!mounted) {
    return (
      <button
        aria-label="Loading Settings"
        className="p-2 rounded-md border border-border bg-background opacity-60 cursor-not-allowed"
      >
        <Settings size={18} className="text-muted-foreground animate-pulse" />
      </button>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label="Open Settings"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-md border border-border bg-background hover:bg-muted transition-all active:scale-90",
          isOpen && "bg-muted ring-1 ring-primary/20"
        )}
      >
        <Settings size={18} className={cn("text-foreground transition-transform duration-500", isOpen && "rotate-90 text-primary")} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-64 glass-panel z-[100] overflow-hidden rounded-xl shadow-2xl p-4 origin-top-right transition-all duration-200 animate-in fade-in slide-in-from-top-2"
        >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                {t('title')}
              </span>
              <button 
                aria-label={t('close')}
                onClick={() => setIsOpen(false)} 
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>

            {/* 🌐 Language Section */}
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
                    onClick={() => toggleLocale(loc)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md text-[10px] font-bold uppercase transition-all border",
                      locale === loc 
                        ? "bg-primary/10 border-primary/30 text-primary" 
                        : "bg-secondary/30 border-border hover:bg-secondary text-muted-foreground"
                    )}
                  >
                    {loc}
                    {locale === loc && <Check size={10} />}
                  </button>
                ))}
              </div>
            </div>

            {/* 🌑 Theme Section */}
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
                    onClick={() => setTheme(item.id)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-md text-[10px] font-bold uppercase transition-all border",
                      theme === item.id 
                        ? "bg-primary/10 border-primary/30 text-primary" 
                        : "bg-secondary/30 border-border hover:bg-secondary text-muted-foreground"
                    )}
                  >
                    <item.icon size={12} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {theme === item.id && <Check size={10} />}
                  </button>
                ))}
              </div>
            </div>

            {/* 🚪 Auth Section */}
            <div className="mt-6 pt-4 border-t border-border/50">
              {status === "authenticated" ? (
                <button
                  aria-label={t('logout')}
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[10px] font-bold uppercase transition-all bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20"
                >
                  <LogOut size={14} />
                  <span>{t('logout')}</span>
                </button>
              ) : (
                <button
                  aria-label={t('login')}
                  onClick={() => signIn()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[10px] font-bold uppercase transition-all bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
                >
                  <LogIn size={14} />
                  <span>{t('login')}</span>
                </button>
              )}
            </div>

            <div className="mt-4 text-center">
              <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-muted-foreground/40">
                ABD_IDENTITY_V1.0
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
