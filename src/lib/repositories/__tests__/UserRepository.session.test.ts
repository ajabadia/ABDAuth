import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import './test-setup';
import { mockCollection, mockCursor } from './test-setup';

import { userRepository } from '../UserRepository';
import type { IndustrialSession } from '@/types/auth';

describe('UserRepository.findByTenantId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should query by tenantId', async () => {
    const mockUsers = [
      { _id: new ObjectId(), email: 'u1@t1.com', tenantId: 't1', createdAt: new Date() },
      { _id: new ObjectId(), email: 'u2@t1.com', tenantId: 't1', createdAt: new Date() },
    ];
    mockCursor.toArray.mockResolvedValue(mockUsers);

    const result = await userRepository.findByTenantId('t1');

    expect(mockCollection.find).toHaveBeenCalledWith({ tenantId: 't1' });
    expect(result).toHaveLength(2);
    expect(result[0].email).toBe('u1@t1.com');
  });
});

describe('UserRepository.listForCurrentSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not filter by tenantId if session role is SUPER_ADMIN', async () => {
    const session = {
      id: 'admin_id',
      email: 'super@abd.com',
      role: 'SUPER_ADMIN',
      tenantId: 'GLOBAL',
    } as unknown as IndustrialSession;
    mockCursor.toArray.mockResolvedValue([]);

    await userRepository.listForCurrentSession(session);

    expect(mockCollection.find).toHaveBeenCalledWith({});
  });

  it('should filter by tenantId if session role is a normal USER', async () => {
    const session = {
      id: 'user_id',
      email: 'user@t1.com',
      role: 'USER',
      tenantId: 't1',
    } as unknown as IndustrialSession;
    mockCursor.toArray.mockResolvedValue([]);

    await userRepository.listForCurrentSession(session);

    expect(mockCollection.find).toHaveBeenCalledWith({ tenantId: 't1' });
  });
});

describe('UserRepository.updateMfaStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update user mfaEnabled status', async () => {
    const userId = new ObjectId().toString();
    mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const result = await userRepository.updateMfaStatus(userId, true);

    expect(result).toBe(true);
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      { _id: new ObjectId(userId) },
      { $set: { mfaEnabled: true, updatedAt: expect.any(Date) } },
      {}
    );
  });
});
