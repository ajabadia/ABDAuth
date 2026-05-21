import { NextResponse } from 'next/server';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { TenantSchema, type Tenant } from '@/lib/schemas/auth';
import { validateSuperAdminSession, validateAdminSession } from '@/lib/utils/api-auth';

/**
 * 🏢 Tenants Admin API
 * Orchestrates global organization management. Restricted to SUPER_ADMIN.
 */
export async function GET() {
  const { authorized, user, response } = await validateAdminSession();
  if (!authorized) return response!;

  const tenants = await tenantRepository.listForCurrentSession(user!);
  return NextResponse.json(tenants);
}

export async function POST(request: Request) {
  const { authorized, user, response } = await validateSuperAdminSession();
  if (!authorized) return response!;

  try {
    const body = await request.json();
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
