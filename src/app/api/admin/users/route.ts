/**
 * @purpose Gestiona operaciones del usuario como recuperar y actualizar usuarios industriales, requiriendo validación de sesión administrativa.
 * @purpose_en Manages user operations such as retrieving and updating industrial users, requiring admin session validation.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:7,sig:1w2drg0
 * @lastUpdated 2026-06-30T14:20:24.569Z
 */

import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/UserRepository';
import { IndustrialNormalizer } from '@/lib/utils/IndustrialNormalizer';
import { validateAdminSession } from '@/lib/utils/api-auth';
import { assertAccess } from '@/lib/abac';
import { createUserHandler } from './create-user';
import { updateUserHandler } from './update-user';

/**
 * 👥 Hierarchical User Management API
 * Supports SuperAdmin global view and TenantAdmin delegated view.
 */
export async function GET() {
  try {
    const { authorized, user, response } = await validateAdminSession();
    if (!authorized) return response!;

    await assertAccess({ userId: user!.id, tenantId: user!.tenantId, resource: 'user', action: 'list' });

    const users = await userRepository.listForSession(user!);

    const sanitizedUsers = users.map(u => {
      const normalized = IndustrialNormalizer.normalizeUser(u);
      const { password: _p, ...safeUser } = normalized;
      return safeUser;
    });

    return NextResponse.json(sanitizedUsers);
  } catch {
    return NextResponse.json({ error: 'Internal User Sync Failure' }, { status: 500 });
  }
}

/**
 * 🆕 Create Industrial User
 */
export async function POST(request: Request) {
  try {
    const { authorized, user, response } = await validateAdminSession();
    if (!authorized) return response!;

    await assertAccess({ userId: user!.id, tenantId: user!.tenantId, resource: 'user', action: 'create' });

    const payload = await request.json();
    return await createUserHandler(payload, user!);
  } catch (err: unknown) {
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json({ error: 'Failed to create industrial user' }, { status: 500 });
  }
}

/**
 * 🔄 Update Industrial User
 */
export async function PUT(request: Request) {
  try {
    const { authorized, user, response } = await validateAdminSession();
    if (!authorized) return response!;

    await assertAccess({ userId: user!.id, tenantId: user!.tenantId, resource: 'user', action: 'update' });

    const payload = await request.json();
    return await updateUserHandler(payload, user!);
  } catch {
    return NextResponse.json({ error: 'Failed to update industrial user' }, { status: 500 });
  }
}
