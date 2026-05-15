import { BaseRepository } from './BaseRepository';
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
    return await this.findOne({ code, used: false } as any);
  }

  async markAsUsed(id: any): Promise<void> {
    await this.update(id, { used: true });
  }
}

export const federatedCodeRepository = new FederatedCodeRepository();
