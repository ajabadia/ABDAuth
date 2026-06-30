/**
 * @purpose Gestiona aplicaciones satelitales federadas mediante manejo de solicitudes GET y POST para obtener y crear datos de aplicación.
 * @purpose_en Manages federated satellite applications by handling GET and POST requests to retrieve and create application data.
 * @refactorable false
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:3,imports:7,sig:1hjiz7a
 * @lastUpdated 2026-06-30T14:20:20.090Z
 */

import { NextResponse } from 'next/server';
import { applicationRepository } from '@/lib/repositories/ApplicationRepository';
import { getServerSession } from '@/lib/get-session';
import { ApplicationSchema } from '@/lib/schemas/auth';
import { checkApiSecurity } from '@/lib/utils/api-security';
import { assertAccess } from '@/lib/abac';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * 🛰️ Applications API Handler
 * Manage federated satellite applications.
 */

export async function GET() {
  const session = await getServerSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await assertAccess({ userId: session.user.id, tenantId: session.user.tenantId, resource: 'application', action: 'list' });

  try {
    const applications = await applicationRepository.list();
    return NextResponse.json(applications);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const secError = checkApiSecurity(req);
  if (secError) return secError;

  const session = await getServerSession();
  if (session?.user?.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await assertAccess({ userId: session.user.id, tenantId: session.user.tenantId, resource: 'application', action: 'create' });

  try {
    const body = await req.json();
    
    // Auto-generate credentials if not provided (Industrial Standard)
    if (!body.clientId) body.clientId = crypto.randomUUID();
    if (!body.clientSecret) body.clientSecret = crypto.randomBytes(32).toString('hex');
    
    const validated = ApplicationSchema.parse({
      ...body,
      createdAt: new Date(),
    });

    const id = await applicationRepository.create(validated);
    return NextResponse.json({ id, ...validated }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Validation failed or database error' }, { status: 400 });
  }
}
