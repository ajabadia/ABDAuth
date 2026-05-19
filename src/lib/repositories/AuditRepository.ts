import { TenantAwareRepository } from './TenantAwareRepository';
import type { IndustrialSession } from '@/types/auth';
import { LogsClient } from '@/lib/logs-client';

/**
 * 🛡️ AuditRepository
 * Immutable repository for security event logging.
 * Migrated to centralize writes to ABDLogs and query from central_audit_logs.
 */
export class AuditRepository extends TenantAwareRepository<any> {
  constructor() {
    super('central_audit_logs', 'LOGS');
  }

  private mapEventToEntityType(event: string): 'USER' | 'TENANT' | 'SSO' | 'SYSTEM' {
    const ev = String(event).toUpperCase();
    if (ev.startsWith('TENANT')) return 'TENANT';
    if (ev.startsWith('SSO')) return 'SSO';
    if (ev.startsWith('MFA') || ev.startsWith('LOGIN') || ev.startsWith('LOGOUT') || ev.startsWith('PASSWORD') || ev.startsWith('USER')) {
      return 'USER';
    }
    return 'SYSTEM';
  }

  /**
   * 📡 Redirect writes to central ABDLogs service
   */
  override async create(data: any): Promise<string> {
    try {
      await LogsClient.log({
        tenantId: data.tenantId || 'SYSTEM',
        action: data.event || 'UNKNOWN_EVENT',
        entityType: this.mapEventToEntityType(data.event),
        entityId: data.actorId || 'SYSTEM',
        userId: data.actorId || 'SYSTEM',
        userEmail: data.actorEmail || 'system@abdlogs.local',
        changedFields: {
          status: data.status || 'INFO',
          ...(data.metadata || {})
        },
        ipAddress: data.ip,
        userAgent: data.userAgent
      });
    } catch (err) {
      console.error('[AUDIT_REPOSITORY_WRITE_ERROR] Failed to route to LogsClient:', err);
    }
    return 'central_log_async_id';
  }

  /**
   * 📋 List logs for the current session context from central_audit_logs
   */
  async listForCurrentSession(session: IndustrialSession): Promise<any[]> {
    const results = await this.listForSession(session, { appId: 'auth' });
    
    // Map back to the expected legacy AuditLog schema for frontend compatibility
    const mapped = results.map(doc => {
      const changedFields = (doc.changedFields || {}) as Record<string, any>;
      return {
        _id: doc._id,
        timestamp: doc.createdAt || doc.timestamp || new Date(),
        event: doc.action,
        actorId: doc.userId,
        actorEmail: doc.userEmail,
        tenantId: doc.tenantId,
        ip: doc.ipAddress,
        userAgent: doc.userAgent,
        metadata: changedFields,
        status: changedFields.status || 'INFO'
      };
    });

    return mapped.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 100);
  }
}

export const auditRepository = new AuditRepository();
