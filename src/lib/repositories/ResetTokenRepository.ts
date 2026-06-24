/**
 * @purpose Gestiona tokens de reset para autenticación del usuario.
 * @purpose_en Manages reset tokens for user authentication.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:4,sig:agtoxf
 * @lastUpdated 2026-06-21T12:07:08.808Z
 */

import { BaseRepository } from './BaseRepository';
import type { ResetToken } from '../schemas/reset-token';
import type { EntityId } from '../schemas/common';
import { ObjectId } from 'mongodb';

export class ResetTokenRepository extends BaseRepository<ResetToken> {
  constructor() {
    super('reset_tokens');
  }

  async findByToken(token: string): Promise<ResetToken | null> {
    const collection = await this.getCollection();
    return collection.findOne({ token, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } });
  }

  async invalidateTokens(userId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.updateMany(
      { userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    );
  }

  async markAsUsed(tokenId: EntityId): Promise<void> {
    const collection = await this.getCollection();
    const id = typeof tokenId === 'string' ? new ObjectId(tokenId) : tokenId;
    await collection.updateOne(
      { _id: id as unknown as { _id: ObjectId } },
      { $set: { usedAt: new Date() } }
    );
  }
}

export const resetTokenRepository = new ResetTokenRepository();
