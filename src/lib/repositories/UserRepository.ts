import type { User } from '@/lib/schemas/auth';
import type { TenantId } from '@/lib/schemas/common';
import { BaseRepository, type SafeFilter } from './BaseRepository';
import { IndustrialNormalizer } from '../utils/IndustrialNormalizer';

/**
 * 👤 UserRepository
 * Repository for global user management with Industrial Normalization.
 */
export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users', 'AUTH');
  }

  async findByEmail(email: string): Promise<User | null> {
    const query: SafeFilter<User> = { email: email.toLowerCase() };
    const raw = await this.findOne(query);
    return raw ? IndustrialNormalizer.normalizeUser(raw) : null;
  }

  async findByTenantId(tenantId: string): Promise<User[]> {
    const query: SafeFilter<User> = { tenantId: tenantId as TenantId };
    const raws = await this.list(query);
    return raws.map(IndustrialNormalizer.normalizeUser);
  }

  // Override list to ensure all users are normalized
  async listAll(): Promise<User[]> {
    const raws = await this.list({});
    return raws.map(IndustrialNormalizer.normalizeUser);
  }
}

export const userRepository = new UserRepository();
