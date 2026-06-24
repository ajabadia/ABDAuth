/**
 * @purpose Gestiona paskeys de WebAuthn para usuarios.
 * @purpose_en Manages WebAuthn Passkeys for users.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:9zih7w
 * @lastUpdated 2026-06-23T22:42:11.660Z
 */

import { BaseRepository, type SafeFilter } from './BaseRepository';
import type { Passkey } from '@/lib/schemas/passkey';

/**
 * 🔑 PasskeyRepository
 * Repository for WebAuthn Passkeys.
 */
export class PasskeyRepository extends BaseRepository<Passkey> {
  constructor() {
    super('user_passkeys', 'AUTH');
  }

  async findByUserId(userId: string): Promise<Passkey[]> {
    const query: SafeFilter<Passkey> = { userId };
    return await this.list(query);
  }

  async findByCredentialId(credentialID: string): Promise<Passkey | null> {
    const query: SafeFilter<Passkey> = { credentialID };
    return await this.findOne(query);
  }

  async updateCounter(credentialID: string, counter: number): Promise<void> {
    const col = await this.getCollection();
    await col.updateOne(
      { credentialID } as SafeFilter<Passkey>,
      { $set: { counter, updatedAt: new Date() } }
    );
  }

  async deletePasskey(userId: string, credentialID: string): Promise<void> {
    const filter: SafeFilter<Passkey> = { userId, credentialID };
    await this.deleteMany(filter);
  }
}

export const passkeyRepository = new PasskeyRepository();
