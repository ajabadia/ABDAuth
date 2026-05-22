import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/UserRepository';
import { inviteService } from '@/lib/services/inviteService';
import { randomBytes } from 'crypto';
import type { UserTenantMembership } from '@/lib/schemas/user';

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
  if (!authenticateInternal(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { email, name, surname, tenantId, role = 'student', allowedApps = [], groupIds = [] } = body;

    if (!email || !name || !tenantId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user already exists
    let user = await userRepository.findByEmail(email);
    let isNewUser = false;
    let activationToken = '';

    const newMembership: UserTenantMembership = {
      tenantId,
      role,
      status: 'active',
      appPermissions: [],
      allowedApps,
      groupIds
    };

    if (!user) {
      isNewUser = true;
      activationToken = randomBytes(32).toString('hex');
      
      const userId = await userRepository.create({
        email: email.toLowerCase(),
        password: '', // will be set during activation
        name,
        surname: surname || '',
        active: false, // inactive until they activate
        tenantId, // primary tenant
        tenantIds: [tenantId],
        tenants: [newMembership],
        verificationToken: activationToken,
        role: 'USER',
        telephone: '',
        position: 'Staff',
        activeModules: [],
        mfaEnabled: false,
        mfaEnforced: false,
        loginAttempts: 0,
        preferences: {},
        createdAt: new Date(),
        updatedAt: new Date()
      } as Parameters<typeof userRepository.create>[0]);
      user = await userRepository.findById(userId);
    } else {
      // User exists, just add membership if not present
      const hasMembership = user.tenants.find((t: { tenantId: string }) => t.tenantId === tenantId);
      if (!hasMembership) {
        await userRepository.update(user._id!.toString(), {
          $push: { tenants: newMembership },
          $addToSet: { tenantIds: tenantId }
        } as Record<string, unknown>);
      }
    }

    if (isNewUser && user) {
      await inviteService.sendActivationEmail(user.email, user.name, activationToken, tenantId);
    }

    return NextResponse.json({ data: user, message: isNewUser ? 'User created and invited' : 'User added to tenant' }, { status: 201 });
  } catch (error: unknown) {
    console.error('[IAM API] POST /internal/users Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!authenticateInternal(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { userId, tenantId, updates } = body;
    // updates could contain { status: 'suspended', role: 'admin', allowedApps: ['quiz'] }

    if (!userId || !tenantId || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tenantIndex = user.tenants.findIndex((t: { tenantId: string }) => t.tenantId === tenantId);
    if (tenantIndex === -1) {
      return NextResponse.json({ error: 'User does not belong to this tenant' }, { status: 404 });
    }

    const updateQuery: Record<string, unknown> = {};
    if (updates.status) updateQuery[`tenants.${tenantIndex}.status`] = updates.status;
    if (updates.role) updateQuery[`tenants.${tenantIndex}.role`] = updates.role;
    if (updates.allowedApps) updateQuery[`tenants.${tenantIndex}.allowedApps`] = updates.allowedApps;
    if (updates.groupIds) updateQuery[`tenants.${tenantIndex}.groupIds`] = updates.groupIds;

    await userRepository.update(user._id!.toString(), { $set: updateQuery } as Record<string, unknown>);

    return NextResponse.json({ message: 'User membership updated' });
  } catch (error: unknown) {
    console.error('[IAM API] PATCH /internal/users Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
