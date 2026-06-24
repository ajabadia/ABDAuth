/**
 * @purpose Gestiona y interactúa con los datos de aplicaciones en el proyecto ABDSuite, proporcionando métodos para encontrar aplicaciones por ID del cliente y validar secretos de cliente.
 * @purpose_en Manages and interacts with application data in the ABDSuite project, providing methods to find applications by Client ID and validate client secrets.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:2,sig:1pckr1
 * @lastUpdated 2026-06-23T22:41:37.651Z
 */

import { BaseRepository, type SafeFilter } from './BaseRepository';
import type { Application } from '@/lib/schemas/auth';

/**
 * 🛰️ ApplicationRepository
 * Industrial persistence for Federated Identity Satellites.
 */
class ApplicationRepository extends BaseRepository<Application> {
  constructor() {
    super('applications', 'AUTH');
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
