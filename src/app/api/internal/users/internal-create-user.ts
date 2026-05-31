import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/UserRepository';
import { inviteService } from '@/lib/services/inviteService';
import { randomBytes } from 'crypto';
import type { UserTenantMembership, User } from '@/lib/schemas/user';

export async function handleInternalCreateUser(body: Record<string, unknown>) {
  const email = body.email as string | undefined;
  const name = body.name as string | undefined;
  const surname = body.surname as string | undefined;
  const tenantId = body.tenantId as string | undefined;
  const role = (body.role as string) || 'student';
  const allowedApps = (body.allowedApps as string[]) || [];
  const groupIds = (body.groupIds as string[]) || [];

  if (!email || !name || !tenantId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let user = await userRepository.findByEmail(email);
  let isNewUser = false;
  let activationToken = '';

  const newMembership: UserTenantMembership = {
    tenantId,
    role: role as 'student' | 'admin' | 'owner',
    status: 'active',
    appPermissions: [],
    allowedApps,
    groupIds,
  };

  if (!user) {
    isNewUser = true;
    activationToken = randomBytes(32).toString('hex');

    const userId = await userRepository.create({
      email: email.toLowerCase(),
      password: '',
      name,
      surname: surname || '',
      active: false,
      tenantId: tenantId as string,
      tenantIds: [tenantId],
      tenants: [newMembership],
      verificationToken: activationToken,
      role: 'USER',
      telephone: '',
      position: 'Staff',
      activeModules: [],
      mfaEnabled: false,
      mfaEnforced: false,
      mfaGracePeriodActive: false,
      mfaGraceLoginsRemaining: 0,
      loginAttempts: 0,
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as User);
    user = await userRepository.findById(userId);
  } else {
    const hasMembership = user.tenants?.find((t: { tenantId: string }) => t.tenantId === tenantId);
    if (!hasMembership) {
      await userRepository.update(user._id!.toString(), {
        $push: { tenants: newMembership },
        $addToSet: { tenantIds: tenantId },
      } as Record<string, unknown>);
    }
  }

  if (isNewUser && user) {
    await inviteService.sendActivationEmail(user.email, user.name, activationToken, tenantId);
  }

  return NextResponse.json(
    { data: user, message: isNewUser ? 'User created and invited' : 'User added to tenant' },
    { status: 201 }
  );
}
