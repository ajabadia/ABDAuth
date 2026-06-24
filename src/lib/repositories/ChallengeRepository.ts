/**
 * @purpose Gestiona desafios de WebAuthn con índices TTL de MongoDB integrados.
 * @purpose_en Manages WebAuthn challenges with built-in MongoDB TTL indexing.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:3,imports:2,sig:220us2
 * @lastUpdated 2026-06-23T22:41:59.155Z
 */

import { BaseRepository, type SafeFilter } from './BaseRepository';
import { type ObjectId } from 'mongodb';

export interface WebAuthnChallengeDoc {
  _id?: ObjectId | string;
  challenge: string;
  userId?: string;
  createdAt: Date;
}

/**
 * 🛡️ ChallengeRepository
 * Manages WebAuthn challenges with built-in MongoDB TTL indexing.
 */
export class ChallengeRepository extends BaseRepository<WebAuthnChallengeDoc> {
  private indexCreated = false;

  constructor() {
    super('webauthn_challenges', 'AUTH');
  }

  protected async getCollection() {
    const col = await super.getCollection();
    if (!this.indexCreated) {
      try {
        await col.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300, name: 'challenge_ttl' });
        this.indexCreated = true;
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[ChallengeRepository] Failed to create TTL index:', err);
      }
    }
    return col;
  }

  async findByChallenge(challenge: string): Promise<WebAuthnChallengeDoc | null> {
    const query: SafeFilter<WebAuthnChallengeDoc> = { challenge };
    return await this.findOne(query);
  }

  async saveChallenge(challenge: string, userId?: string): Promise<void> {
    if (userId) {
      // Clear previous challenges for this user to avoid stale challenges
      await this.deleteMany({ userId });
    }
    await this.create({
      challenge,
      userId,
      createdAt: new Date(),
    });
  }

  async deleteChallenge(challenge: string): Promise<void> {
    await this.deleteMany({ challenge });
  }
}

export const challengeRepository = new ChallengeRepository();
