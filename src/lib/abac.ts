/**
 * @purpose Valida el acceso del usuario según las políticas de control de acceso basado en atributos (ABAC).
 * @purpose_en Validates user access based on ABAC (Attribute-Based Access Control) policies.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:2,imports:1,sig:b47yvp
 * @lastUpdated 2026-06-30T13:34:50.926Z
 */

import { evaluateAccess, InsufficientPrivilegesError } from '@ajabadia/satellite-sdk/auth-middleware';

export interface AssertAccessParams {
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
  context?: Record<string, unknown>;
}

export async function assertAccess(params: AssertAccessParams): Promise<void> {
  const result = await evaluateAccess({
    tenantId: params.tenantId,
    userId: params.userId,
    resource: params.resource,
    action: params.action,
    context: params.context
  });

  if (!result.allowed) {
    throw new InsufficientPrivilegesError(`ABAC Denied: ${result.reason}`);
  }
}
