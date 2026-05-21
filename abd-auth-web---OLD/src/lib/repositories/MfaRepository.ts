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

  /**
   * 🔓 Enable MFA for a user
   */
  async enable(userId: string, config: Omit<MfaConfig, '_id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const col = await this.getCollection();
    await col.updateOne(
      { userId } as SafeFilter<MfaConfig>,
      { $set: { ...config, active: true, updatedAt: new Date() } },
      { upsert: true }
    );
  }

  /**
   * 🔒 Disable MFA for a user
   */
  async disable(userId: string): Promise<void> {
    const filter: SafeFilter<MfaConfig> = { userId };
    await this.deleteMany(filter);
  }

  /**
   * 🔄 Update backup codes
   */
  async updateBackupCodes(userId: string, backupCodes: string[]): Promise<void> {
    const col = await this.getCollection();
    await col.updateOne(
      { userId } as SafeFilter<MfaConfig>,
      { $set: { backupCodes, updatedAt: new Date() } }
    );
  }
}

export const mfaRepository = new MfaRepository();
