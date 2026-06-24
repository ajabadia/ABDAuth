/**
 * @purpose Gestiona el registro de eventos de seguridad alarmando los escritos a un servicio ABDLogs centralizado y recuperando registros para el contexto actual del session.
 * @purpose_en Manages security event logging by routing writes to a central ABDLogs service and fetching logs for the current session context.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:2,imports:4,sig:1tgsz69
 * @lastUpdated 2026-06-23T22:41:50.644Z
 */

import { TenantAwareRepository } from './TenantAwareRepository';
import type { IndustrialSession } from '@/types/auth';
import { LogsClient } from '@/lib/logs-client';
import { type AuditLog, type AuditAuthOps } from '@/lib/schemas/audit';

/**
 * 🛡️ AuditRepository
 * Immutable repository for security event logging.
 * Migrated to centralize writes to ABDLogs and query from central_audit_logs.
 */
export class AuditRepository extends TenantAwareRepository<AuditAuthOps> {
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
  override async create(data: Partial<AuditLog>): Promise<string> {
    try {
      await LogsClient.log({
        tenantId: data.tenantId || 'SYSTEM',
        action: data.event || 'UNKNOWN_EVENT',
        entityType: this.mapEventToEntityType(data.event || ''),
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
  async listForCurrentSession(session: IndustrialSession): Promise<AuditLog[]> {
    const results = await this.listForSession(session, { appId: 'auth' });
    
    // Map back to the expected legacy AuditLog schema for frontend compatibility
    const mapped = results.map(doc => {
      const changedFields = (doc.changedFields || {}) as Record<string, any>;
      return {
        _id: doc._id?.toString(),
        timestamp: doc.createdAt || new Date(),
        event: doc.action as unknown as AuditLog['event'],
        actorId: doc.userId,
        actorEmail: doc.userEmail,
        tenantId: doc.tenantId,
        ip: doc.ipAddress,
        userAgent: doc.userAgent,
        metadata: changedFields,
        status: changedFields.status || 'INFO'
      } as AuditLog;
    });

    return mapped.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)).slice(0, 100);
  }
}

export const auditRepository = new AuditRepository();
