import type { User, Tenant } from '@/lib/schemas/auth';

/**
 * 🧬 IndustrialNormalizer
 * Finalized Canonical Normalizer for English Industrial Standards.
 * Zero-Noise Purity Policy Compliant.
 */
export class IndustrialNormalizer {
  static normalizeUser(raw: Record<string, unknown>): User {
    if (!raw) return raw as unknown as User;
    return {
      ...raw,
      mfaGracePeriodActive: raw.mfaGracePeriodActive !== undefined ? !!raw.mfaGracePeriodActive : false,
      mfaGraceLoginsRemaining: raw.mfaGraceLoginsRemaining !== undefined ? Number(raw.mfaGraceLoginsRemaining) : 0,
      mfaGraceExpiresAt: raw.mfaGraceExpiresAt ? new Date(raw.mfaGraceExpiresAt as string | number | Date) : undefined,
      lockoutUntil: raw.lockoutUntil ? new Date(raw.lockoutUntil as string | number | Date) : undefined,
      createdAt: raw.createdAt ? new Date(raw.createdAt as string | number | Date) : new Date(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string | number | Date) : undefined
    } as unknown as User;
  }

  static normalizeTenant(raw: Record<string, unknown>): Tenant {
    if (!raw) return raw as unknown as Tenant;

    // Harmonize dynamic visual branding properties between control plane and IdP
    let branding = raw.branding as Record<string, unknown> | undefined;
    if (branding) {
      const colors = branding.colors as Record<string, string> | undefined;
      const logo = branding.logo as Record<string, string> | undefined;
      const theme = branding.theme as Record<string, unknown> | undefined;

      const normalizedBranding: Record<string, unknown> = { ...branding };

      if (!branding.logoUrl && logo?.url) {
        normalizedBranding.logoUrl = logo.url;
      }

      if (!theme && colors?.primary) {
        normalizedBranding.theme = {
          primary: colors.primary,
          secondary: colors.secondary,
          accent: colors.accent,
          rounded: branding.rounded !== undefined ? branding.rounded : true,
          radius: branding.radius || '0.75rem'
        };
      }

      raw.branding = normalizedBranding;
    }

    return {
      ...raw,
      createdAt: raw.createdAt ? new Date(raw.createdAt as string | number | Date) : new Date(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string | number | Date) : undefined
    } as unknown as Tenant;
  }
}
