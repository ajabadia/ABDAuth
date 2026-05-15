import { BaseRepository, type SafeFilter } from './BaseRepository';
import type { Application } from '@/lib/schemas/auth';

/**
 * 🛰️ ApplicationRepository
 * Industrial persistence for Federated Identity Satellites.
 */
class ApplicationRepository extends BaseRepository<Application> {
  constructor() {
    super('Applications', 'AUTH');
  }

  /**
   * 🔍 Find application by Client ID
   */
  async findByClientId(clientId: string): Promise<Application | null> {
    return await this.findOne({ clientId } as SafeFilter<Application>);
  }

  /**
   * 🛡️ Validate secret
   */
  async validateSecret(clientId: string, clientSecret: string): Promise<boolean> {
    const app = await this.findByClientId(clientId);
    return app?.clientSecret === clientSecret;
  }
}

export const applicationRepository = new ApplicationRepository();
