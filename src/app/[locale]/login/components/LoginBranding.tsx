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
  return (
    <div className="mb-12 flex flex-col items-center animate-in slide-in-from-top duration-700">
      {tenantBranding?.logoUrl ? (
        <img src={tenantBranding.logoUrl} alt={tenantName} className="h-14 mb-4 object-contain max-w-[220px]" />
      ) : (
        <div 
          role="button"
          tabIndex={0}
          className="w-14 h-14 bg-primary text-primary-foreground rounded-sm flex items-center justify-center mb-4 shadow-xl shadow-primary/10 border border-primary/20 active:scale-95 transition-transform cursor-pointer"
        >
          <Shield size={32} className="text-primary-foreground" />
        </div>
      )}
      <h1 className="text-xl font-black text-foreground tracking-tighter uppercase">
        {tenantName || defaultBrand}
      </h1>
      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-[0.3em] mt-2 opacity-60">
        {subtitle}
      </p>
    </div>
  );
}
