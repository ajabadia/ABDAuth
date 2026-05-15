import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { TenantSchema, type Tenant } from '@/lib/schemas/auth';
import type { IndustrialSession } from '@/types/auth';

/**
 * 🏢 Tenants Admin API
 * Orchestrates global organization management. Restricted to SUPER_ADMIN.
 */
export async function GET() {
  const session = await auth();
  const user = session?.user as unknown as IndustrialSession;
  
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: SuperAdmin privileges required' }, { status: 403 });
  }

  const tenants = await tenantRepository.listForCurrentSession(user);
  return NextResponse.json(tenants);
}

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as unknown as IndustrialSession;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: SuperAdmin privileges required' }, { status: 403 });
  }

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
      actorId: user.id,
      actorEmail: user.email,
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
