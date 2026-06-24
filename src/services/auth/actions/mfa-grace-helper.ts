/**
 * @purpose Gestiona el estado del período de gracia para la autenticación multifactor (MFA).
 * @purpose_en Manages the Multi-Factor Authentication (MFA) grace period state for users.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:16ui0he
 * @lastUpdated 2026-06-23T22:44:33.399Z
 */

import type { EntityId } from '@/lib/schemas/common';
import { userRepository } from '@/lib/repositories/UserRepository';

export interface MfaGraceState {
  mfaGracePeriodActive: boolean;
  mfaGraceLoginsRemaining: number;
  mfaGraceExpiresAt?: string;
}

/**
 * 🛡️ Evaluates and returns the MFA grace period state.
 * If grace period has expired (time or login count), deactivates it.
 */
export async function evaluateMfaGrace(user: {
  _id?: { toString(): string } | string;
  mfaGracePeriodActive?: boolean;
  mfaGraceLoginsRemaining?: number;
  mfaGraceExpiresAt?: Date | string;
}): Promise<MfaGraceState> {
  let mfaGracePeriodActive = !!user.mfaGracePeriodActive;
  let mfaGraceLoginsRemaining = user.mfaGraceLoginsRemaining ?? 0;
  const mfaGraceExpiresAt = user.mfaGraceExpiresAt;

  if (mfaGracePeriodActive) {
    const now = new Date();
    const graceExpiry = mfaGraceExpiresAt ? new Date(mfaGraceExpiresAt) : null;
    let shouldDeactivate = false;

    if (graceExpiry && graceExpiry < now) {
      shouldDeactivate = true;
    } else if (mfaGraceLoginsRemaining <= 0) {
      shouldDeactivate = true;
    }

    if (shouldDeactivate) {
      mfaGracePeriodActive = false;
      await userRepository.update(user._id as EntityId, {
        mfaGracePeriodActive: false,
        updatedAt: now,
      });
    }
  }

  return {
    mfaGracePeriodActive,
    mfaGraceLoginsRemaining,
    mfaGraceExpiresAt: mfaGraceExpiresAt ? new Date(mfaGraceExpiresAt).toISOString() : undefined,
  };
}
