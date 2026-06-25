/**
 * @purpose Gestiona el registro de acciones diversas dentro de la aplicación ABDAuth al enviando payloads de registro a un microservicio.
 * @purpose_en Manages the logging of various actions within the ABDAuth application by sending log payloads to a microservice.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:117r4jy
 * @lastUpdated 2026-06-25T10:16:57.474Z
 */

import { logger, configureLogger } from '@ajabadia/satellite-sdk/logger';

export interface LogPayload {
  tenantId: string;
  action: string;
  entityType: 'USER' | 'TENANT' | 'SSO' | 'EXAM' | 'CONFIG' | 'SYSTEM' | 'SPACE' | 'BRANDING';
  entityId: string;
  userId: string;
  userEmail: string;
  changedFields?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export class LogsClient {
  private static initialized = false;

  private static init() {
    if (this.initialized) return;

    configureLogger({
      endpoint: process.env.LOGS_SERVICE_URL || 'http://localhost:5003/api/logs',
      token: process.env.LOGS_SECRET_TOKEN || 'shared-system-token-2026',
      appId: process.env.NEXT_PUBLIC_APP_ID || 'auth',
    });
    this.initialized = true;
  }

  /**
   * 📡 Envía un log de forma asíncrona (fire-and-forget) al microservicio ABDLogs usando el Logger centralizado
   */
  static async log(payload: LogPayload): Promise<void> {
    this.init();
    logger.audit(payload);
  }
}
