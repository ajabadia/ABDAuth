/**
 * @purpose Gestiona y persiste registros de auditoría para operaciones de autenticación, redirigiendo escrituras a un servicio ABDLogs centralizado y consultando desde el centro de auditorías.
 * @purpose_en Manages and persists audit logs for authentication operations, redirecting writes to a central ABDLogs service and querying from the central_audit_logs.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:3,sig:1xkob84
 * @lastUpdated 2026-06-23T22:41:44.615Z
 */

import { BaseRepository, type SafeFilter } from './BaseRepository';
import { LogsClient } from '@/lib/logs-client';
import { type AuditAuthOps } from '@/lib/schemas/audit';

/**
 * 🛡️ AuditAuthOpsRepository
 * Persistence repository for local auth operations and SSO logs.
 * Migrated to centralize writes to ABDLogs and query from central_audit_logs.
 */
export class AuditAuthOpsRepository extends BaseRepository<AuditAuthOps> {
  constructor() {
    super('central_audit_logs', 'LOGS');
  }

  /**
   * 📡 Redirect writes to central ABDLogs service
   */
  override async create(data: Partial<AuditAuthOps>): Promise<string> {
    try {
      await LogsClient.log({
        tenantId: data.tenantId || 'SYSTEM',
        action: data.action || 'UNKNOWN_OP',
        entityType: data.entityType || 'SYSTEM',
        entityId: data.entityId || 'SYSTEM',
        userId: data.userId || 'SYSTEM',
        userEmail: data.userEmail || 'system@abdlogs.local',
        changedFields: {
          ...(data.changedFields || {}),
          ...(data.previousState ? { previousState: data.previousState } : {})
        },
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      });
    } catch (err) {
      console.error('[AUDIT_AUTH_OPS_REPOSITORY_WRITE_ERROR] Failed to route to LogsClient:', err);
    }
    return 'central_log_async_id';
  }

  /**
   * 📋 List operational logs filtered by tenantId from central_audit_logs
   */
  async findByTenantId(tenantId: string): Promise<AuditAuthOps[]> {
    const query: SafeFilter<AuditAuthOps> = { tenantId, appId: 'auth' } as SafeFilter<AuditAuthOps>;
    const results = await this.list(query);
    return results.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  /**
   * 📋 List operational logs for a user from central_audit_logs
   */
  async findByUserId(userId: string): Promise<AuditAuthOps[]> {
    const query: SafeFilter<AuditAuthOps> = { userId, appId: 'auth' } as SafeFilter<AuditAuthOps>;
    const results = await this.list(query);
    return results.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }
}

export const auditAuthOpsRepository = new AuditAuthOpsRepository();
