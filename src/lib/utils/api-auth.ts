/**
 * @purpose Valida sesiones de usuario para asegurar que tengan los privilegios administrativos necesarios.
 * @purpose_en Validates user sessions to ensure they have the necessary administrative privileges.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:2,imports:3,sig:lmss3u
 * @lastUpdated 2026-06-23T22:43:32.144Z
 */

import { getServerSession } from '@/lib/get-session';
import { NextResponse } from 'next/server';
import type { IndustrialSession } from '@/types/auth';

/**
 * 🛡️ Validates that the active session is a Tenant Admin or Super Admin.
 * Returns the validated session user, or a 403 JSON Response on failure.
 */
export async function validateAdminSession() {
  const session = await getServerSession();
  const user = session?.user as unknown as IndustrialSession;

  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' && user.role !== 'PROFESSOR')) {
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
  const session = await getServerSession();
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
