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
      createdAt: raw.createdAt ? new Date(raw.createdAt as string | number | Date) : new Date(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string | number | Date) : undefined
    } as unknown as User;
  }

  static normalizeTenant(raw: Record<string, unknown>): Tenant {
    if (!raw) return raw as unknown as Tenant;
    return {
      ...raw,
      createdAt: raw.createdAt ? new Date(raw.createdAt as string | number | Date) : new Date(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt as string | number | Date) : undefined
    } as unknown as Tenant;
  }
}
