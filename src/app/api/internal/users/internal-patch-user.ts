import { NextResponse } from 'next/server';
import { userRepository } from '@/lib/repositories/UserRepository';

export async function handleInternalPatchUser(body: Record<string, unknown>) {
  const userId = body.userId as string | undefined;
  const tenantId = body.tenantId as string | undefined;
  const updates = body.updates as Record<string, unknown> | undefined;

  if (!userId || !tenantId || !updates) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const user = await userRepository.findById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const tenantIndex = user.tenants?.findIndex((t: { tenantId: string }) => t.tenantId === tenantId);
  if (tenantIndex === undefined || tenantIndex === -1) {
    return NextResponse.json({ error: 'User does not belong to this tenant' }, { status: 404 });
  }

  const updateQuery: Record<string, unknown> = {};
  if (updates.status) updateQuery[`tenants.${tenantIndex}.status`] = updates.status;
  if (updates.role) updateQuery[`tenants.${tenantIndex}.role`] = updates.role;
  if (updates.allowedApps) updateQuery[`tenants.${tenantIndex}.allowedApps`] = updates.allowedApps;
  if (updates.groupIds) updateQuery[`tenants.${tenantIndex}.groupIds`] = updates.groupIds;

  await userRepository.update(user._id!.toString(), { $set: updateQuery } as Record<string, unknown>);

  return NextResponse.json({ message: 'User membership updated' });
}
