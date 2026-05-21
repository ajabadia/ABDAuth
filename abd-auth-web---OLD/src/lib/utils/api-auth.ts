import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { IndustrialSession } from '@/types/auth';

/**
 * 🛡️ Validates that the active session is a Tenant Admin or Super Admin.
 * Returns the validated session user, or a 403 JSON Response on failure.
 */
export async function validateAdminSession() {
  const session = await auth();
  const user = session?.user as unknown as IndustrialSession;

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 })
    };
  }

  return { authorized: true, user, response: null };
}

/**
 * 🛡️ Validates that the active session is strictly a Super Admin.
 * Returns the validated session user, or a 403 JSON Response on failure.
 */
export async function validateSuperAdminSession() {
  const session = await auth();
  const user = session?.user as unknown as IndustrialSession;

  if (!user || user.role !== 'SUPER_ADMIN') {
    return {
      authorized: false,
      user: null,
      response: NextResponse.json({ error: 'Unauthorized: SuperAdmin privileges required' }, { status: 403 })
    };
  }

  return { authorized: true, user, response: null };
}
