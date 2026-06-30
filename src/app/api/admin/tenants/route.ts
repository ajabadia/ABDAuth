/**
 * @purpose Gestiona el manejo de organización global, manejando solicitudes GET y POST para inquilinos, asegurando acceso autorizado y creando registros de auditoría.
 * @purpose_en Manages global organization management by handling GET and POST requests for tenants, ensuring authorized access and creating audit logs.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:7,sig:z8s956
 * @lastUpdated 2026-06-30T14:20:23.184Z
 */

import { NextResponse } from 'next/server';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { checkApiSecurity } from '@/lib/utils/api-security';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { TenantSchema, type Tenant } from '@/lib/schemas/auth';
import { validateSuperAdminSession, validateAdminSession } from '@/lib/utils/api-auth';
import { assertAccess } from '@/lib/abac';

export const dynamic = 'force-dynamic';

/**
 * 🏢 Tenants Admin API
 * Orchestrates global organization management. Restricted to SUPER_ADMIN.
 */
export async function GET() {
  const { authorized, user, response } = await validateAdminSession();
  if (!authorized) return response!;

  await assertAccess({ userId: user!.id, tenantId: user!.tenantId, resource: 'tenant', action: 'list' });

  const tenants = await tenantRepository.listForCurrentSession(user!);
  return NextResponse.json(tenants);
}

export async function POST(req: Request) {
  const secError = checkApiSecurity(req);
  if (secError) return secError;

  const { authorized, user, response } = await validateSuperAdminSession();
  if (!authorized) return response!;

  await assertAccess({ userId: user!.id, tenantId: user!.tenantId, resource: 'tenant', action: 'create' });

  try {
    const body = await req.json();
    const validatedData = TenantSchema.parse({
      ...body,
      createdAt: new Date(),
    });

    const tenantId = await tenantRepository.create(validatedData as Tenant);

    // 🛡️ Industrial Audit
    await auditRepository.create({
      timestamp: new Date(),
      event: 'TENANT_CREATED',
      actorId: user!.id,
      actorEmail: user!.email,
      tenantId: validatedData.tenantId,
      status: 'SUCCESS',
      metadata: { tenantName: validatedData.name, dbPrefix: validatedData.dbPrefix }
    });

    return NextResponse.json({ id: tenantId, message: 'Tenant created successfully' }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Invalid tenant data', 
      details: errorMessage 
    }, { status: 400 });
  }
}
