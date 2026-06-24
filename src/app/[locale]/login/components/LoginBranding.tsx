/**
 * @purpose Renderiza la sección de marca del formulario de inicio de sesión, incluyendo una pilla de estado, logo o icono de inquilino y título.
 * @purpose_en Renders the branding section of the login page, including a status pill, tenant logo or icon, and title.
 * @refactorable false
 * @classification UI Component
 * @complexity Low
 * @fingerprint exports:1,imports:1,sig:xmrk9p
 * @lastUpdated 2026-06-21T10:24:02.187Z
 */

import { Shield } from "lucide-react";

interface TenantBranding {
  logoUrl?: string | null;
  theme?: Record<string, string>;
}

interface LoginBrandingProps {
  tenantBranding: TenantBranding | null;
  tenantName: string;
  defaultBrand: string;
  subtitle: string;
}

export function LoginBranding({ tenantBranding, tenantName, defaultBrand, subtitle }: LoginBrandingProps) {
  // Split defaultBrand (e.g. "ABDAuth" -> "ABD" and "Auth")
  const brandName = "ABD";
  const restOfBrand = defaultBrand.toLowerCase().startsWith(brandName.toLowerCase())
    ? defaultBrand.slice(brandName.length)
    : defaultBrand;

  return (
    <div className="mb-8 flex flex-col items-center text-center animate-in slide-in-from-top duration-700 relative z-10 gap-4">
      {/* 1. Status Pill */}
      <div className="inline-flex items-center gap-2.5 px-3 py-1 bg-muted/50 border border-border text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-mono rounded-sm select-none">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
        </span>
        SECURITY GATEWAY
      </div>

      {tenantBranding?.logoUrl ? (
        <img src={tenantBranding.logoUrl} alt={tenantName} className="h-14 mb-2 object-contain max-w-[220px]" />
      ) : (
        <div 
          role="button"
          tabIndex={0}
          className="w-14 h-14 bg-primary/5 text-primary rounded-none flex items-center justify-center mb-2 shadow-xl border border-primary/20 hover:bg-primary/10 active:scale-95 transition-all cursor-pointer"
        >
          <Shield size={28} className="text-primary animate-pulse" />
        </div>
      )}

      <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic uppercase antialiased text-foreground leading-none">
        {tenantName ? (
          tenantName
        ) : (
          <>
            {brandName} <span className="text-primary">{restOfBrand}</span>
          </>
        )}
      </h1>
      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em] mt-1 opacity-60">
        {subtitle}
      </p>
    </div>
  );
}
