import { BaseRepository, type SafeFilter } from './BaseRepository';
import type { MfaConfig } from '@/lib/schemas/auth';
import type { EntityId } from '@/lib/schemas/common';

/**
 * 🔒 MfaRepository
 * Repository for MFA configurations.
 */
export class MfaRepository extends BaseRepository<MfaConfig> {
  constructor() {
    super('mfa_configs', 'AUTH');
  }

  async findByUserId(userId: EntityId): Promise<MfaConfig | null> {
    const query: SafeFilter<MfaConfig> = { userId };
    return await this.findOne(query);
  }
}

export const mfaRepository = new MfaRepository();
