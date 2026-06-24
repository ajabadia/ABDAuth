/**
 * @purpose Gestiona solicitudes de API internas para operaciones de gestión de usuarios, como recuperar usuarios por ID de inquilino y crear/actualizar usuarios.
 * @purpose_en Handles internal API requests for user management operations such as retrieving users by tenant ID and creating/patching users.
 * @refactorable false
 * @classification Business Service
 * @complexity Medium
 * @fingerprint exports:3,imports:5,sig:1ajouoc
 * @lastUpdated 2026-06-21T10:17:35.993Z
 */

import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/UserRepository';
import { checkApiSecurity } from '@/lib/utils/api-security';
import { handleInternalCreateUser } from './internal-create-user';
import { handleInternalPatchUser } from './internal-patch-user';

function authenticateInternal(req: NextRequest) {
  const apiKey = req.headers.get('x-internal-iam-key');
  if (!apiKey || apiKey !== process.env.INTERNAL_IAM_API_KEY) {
    return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  if (!authenticateInternal(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
  }

  try {
    const users = await userRepository.findByTenantId(tenantId);
    return NextResponse.json({ data: users });
  } catch (error: unknown) {
    console.error('[IAM API] GET /internal/users Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const secError = checkApiSecurity(req);
  if (secError) return secError;

  if (!authenticateInternal(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    return await handleInternalCreateUser(body);
  } catch (error: unknown) {
    console.error('[IAM API] POST /internal/users Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const secError = checkApiSecurity(req);
  if (secError) return secError;

  if (!authenticateInternal(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    return await handleInternalPatchUser(body);
  } catch (error: unknown) {
    console.error('[IAM API] PATCH /internal/users Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
