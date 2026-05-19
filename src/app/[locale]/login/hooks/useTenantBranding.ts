import { useState, useEffect } from "react";
import { generateTenantCss } from "@abd/styles";

interface TenantBranding {
  logoUrl?: string | null;
  theme?: Record<string, string>;
}

export function useTenantBranding() {
  const [brandingCss, setBrandingCss] = useState("");
  const [tenantBranding, setTenantBranding] = useState<TenantBranding | null>(null);
  const [tenantName, setTenantName] = useState("");

  useEffect(() => {
    const fetchTenantBranding = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        let tenantId = params.get('tenant');
        
        if (!tenantId) {
          const callbackUrl = params.get('callbackUrl');
          if (callbackUrl) {
            try {
              const cbParams = new URL(callbackUrl).searchParams;
              tenantId = cbParams.get('tenant');
            } catch {
              // Ignore invalid callbackUrl parse errors
            }
          }
        }
        
        if (tenantId) {
          const res = await fetch(`/api/auth/tenant/info?tenantId=${tenantId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.active && data.branding?.theme) {
              const css = generateTenantCss(data.branding.theme);
              setBrandingCss(css);
              setTenantBranding(data.branding);
              setTenantName(data.name);
            }
          }
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[LOGIN_BRANDING_ERROR]', err);
      }
    };
    
    fetchTenantBranding();
  }, []);

  return { brandingCss, tenantBranding, tenantName };
}
