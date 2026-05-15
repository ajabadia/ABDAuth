import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { tenantRepository } from '@/lib/repositories/TenantRepository';
import { auditRepository } from '@/lib/repositories/AuditRepository';
import { TenantSchema } from '@/lib/schemas/auth';
import type { IndustrialSession } from '@/types/auth';
import { ObjectId } from 'mongodb';

/**
 * 🏢 Tenant Detail Admin API
 * Restricted to SUPER_ADMIN.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as IndustrialSession;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    // Partial validation for updates
    const partialSchema = TenantSchema.partial();
    const validatedData = partialSchema.parse(body);

    const success = await tenantRepository.update(new ObjectId(id), { $set: validatedData });

    if (!success) {
      return NextResponse.json({ error: 'Tenant not found or no changes made' }, { status: 404 });
    }

    // 🛡️ Industrial Audit
    await auditRepository.create({
      timestamp: new Date(),
      event: 'TENANT_UPDATED',
      actorId: user.id,
      actorEmail: user.email,
      tenantId: 'SYSTEM', // Context of update is global
      status: 'SUCCESS',
      metadata: { targetId: id, updates: validatedData }
    });

    return NextResponse.json({ message: 'Tenant updated successfully' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Invalid data', details: errorMessage }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as IndustrialSession;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const success = await tenantRepository.softDelete(new ObjectId(id));

  if (!success) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // 🛡️ Industrial Audit
  await auditRepository.create({
    timestamp: new Date(),
    event: 'TENANT_DELETED',
    actorId: user.id,
    actorEmail: user.email,
    tenantId: 'SYSTEM',
    status: 'SUCCESS',
    metadata: { targetId: id }
  });

  return NextResponse.json({ message: 'Tenant deactivated successfully' });
}
