/**
 * @purpose Gestiona el almacenamiento y recuperación de códigos de autenticación federados.
 * @purpose_en Manages the storage and retrieval of federated authentication codes.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:3,imports:3,sig:pilx20
 * @lastUpdated 2026-06-23T22:42:03.633Z
 */

import { BaseRepository, type SafeFilter } from './BaseRepository';
import { type ObjectId } from 'mongodb';
import { z } from 'zod';

/**
 * 🎫 FederatedCode Schema
 */
export const FederatedCodeSchema = z.object({
  _id: z.any().optional(),
  code: z.string(),
  clientId: z.string(),
  userId: z.string(),
  redirectUri: z.string(),
  expiresAt: z.date(),
  used: z.boolean().default(false),
  usedAt: z.date().optional(),
  /** 🔐 Central session ID for back-channel SLO verification */
  sessionId: z.string().optional(),
});

export type FederatedCode = z.infer<typeof FederatedCodeSchema>;

/**
 * 🏛️ FederatedCodeRepository
 */
class FederatedCodeRepository extends BaseRepository<FederatedCode> {
  constructor() {
    super('FederatedCodes', 'AUTH');
  }

  async findByCode(code: string): Promise<FederatedCode | null> {
    return await this.findOne({ code, used: false } as SafeFilter<FederatedCode>);
  }

  async markAsUsed(id: string | ObjectId): Promise<void> {
    await this.update(id, { used: true, usedAt: new Date() } as Record<string, unknown>);
  }
}

export const federatedCodeRepository = new FederatedCodeRepository();
