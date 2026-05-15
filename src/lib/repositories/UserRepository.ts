import type { User } from '@/lib/schemas/auth';
import { TenantAwareRepository } from './TenantAwareRepository';
import { type SafeFilter } from './BaseRepository';
import { type ObjectId } from 'mongodb';
import type { TenantId } from '@/lib/schemas/common';
import { IndustrialNormalizer } from '../utils/IndustrialNormalizer';
import type { IndustrialSession } from '@/types/auth';

/**
 * 👤 UserRepository
 * Repository for global user management with Industrial Normalization.
 */
export class UserRepository extends TenantAwareRepository<User> {
  constructor() {
    super('users', 'AUTH');
  }

  async findByEmail(email: string): Promise<User | null> {
    const query: SafeFilter<User> = { email: email.toLowerCase() };
    const raw = await this.findOne(query);
    return raw ? IndustrialNormalizer.normalizeUser(raw) : null;
  }

  async findById(id: string | ObjectId): Promise<User | null> {
    const { ObjectId } = await import('mongodb');
    const queryId = typeof id === 'string' ? new ObjectId(id) : id;
    const query: SafeFilter<User> = { _id: queryId as any } as SafeFilter<User>;
    const raw = await this.findOne(query);
    return raw ? IndustrialNormalizer.normalizeUser(raw) : null;
  }

  async findByTenantId(tenantId: string): Promise<User[]> {
    const query: SafeFilter<User> = { tenantId: tenantId as TenantId };
    const raws = await this.list(query);
    return raws.map(IndustrialNormalizer.normalizeUser);
  }

  /**
   * 📋 List users for the current session context
   */
  async listForCurrentSession(session: IndustrialSession): Promise<User[]> {
    const raws = await this.listForSession(session);
    return raws.map(IndustrialNormalizer.normalizeUser);
  }
}

export const userRepository = new UserRepository();
