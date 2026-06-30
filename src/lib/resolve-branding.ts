/**
 * @purpose Proporciona datos de marca para un inquilino y ubicación dadas, incluyendo URL del logo, tema y URL de registros auditivos.
 * @purpose_en Retrieves branding data for a given tenant and locale, including logo URL, theme, and logs audit URL.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:11giu09
 * @lastUpdated 2026-06-30T11:38:15.410Z
 */

import { tenantRepository } from "@/lib/repositories/TenantRepository";
import type { TenantId } from '@/lib/schemas/common';

export interface BrandingData {
  logoUrl: string | null;
  theme: Record<string, unknown> | null;
  logsAuditUrl: string;
}

export async function resolveBranding(tenantId: string | undefined, locale: string): Promise<BrandingData> {
  let logoUrl: string | null = null;
  let theme: Record<string, unknown> | null = null;

  if (tenantId) {
    try {
      const tenant = await tenantRepository.findByTenantId(tenantId as TenantId);
      if (tenant?.branding) {
        logoUrl = tenant.branding.logoUrl || null;
        theme = tenant.branding.theme || null;
      }
    } catch (err) {
      console.error("Failed to retrieve tenant branding from database:", err);
    }
  }

  const logsServiceUrl = process.env.LOGS_SERVICE_URL || 'http://localhost:5003/api/logs';
  let logsAuditUrl = '';
  try {
    const logsOrigin = new URL(logsServiceUrl).origin;
    logsAuditUrl = `${logsOrigin}/${locale}/admin/audit`;
  } catch (err) {
    console.error("Failed to parse LOGS_SERVICE_URL:", err);
    logsAuditUrl = `http://localhost:5003/${locale}/admin/audit`;
  }

  return { logoUrl, theme, logsAuditUrl };
}
