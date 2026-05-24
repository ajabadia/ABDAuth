import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { BaseRepository } from './BaseRepository';
import { userRepository } from './UserRepository';
import type { IndustrialSession } from '@/types/auth';

// Define standard mock collection interface
const mockCursor = {
  toArray: vi.fn().mockResolvedValue([]),
};

const mockCollection = {
  findOne: vi.fn(),
  find: vi.fn().mockReturnValue(mockCursor),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
  deleteOne: vi.fn(),
  deleteMany: vi.fn(),
};

// Spy on BaseRepository's getCollection method
vi.spyOn(BaseRepository.prototype as any, 'getCollection').mockImplementation(async () => {
  return mockCollection;
});

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should query by lowercase email and return normalized user', async () => {
      const mockUser = {
        _id: new ObjectId(),
        email: 'test@example.com',
        role: 'USER',
        createdAt: new Date(),
      };
      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('Test@EXAMPLE.com');

      expect(mockCollection.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null if user is not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const result = await userRepository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should query by ObjectId if given a valid 24-char hex string', async () => {
      const id = new ObjectId();
      const mockUser = {
        _id: id,
        email: 'idtest@example.com',
        role: 'USER',
        createdAt: new Date(),
      };
      mockCollection.findOne.mockResolvedValue(mockUser);

      const result = await userRepository.findById(id.toString());

      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: id });
      expect(result?._id).toEqual(id);
    });

    it('should fallback to string search and email search if ObjectId match fails', async () => {
      mockCollection.findOne
        .mockResolvedValueOnce(null) // first try: ObjectId
        .mockResolvedValueOnce(null) // second try: fallback 1 (string id)
        .mockResolvedValueOnce({ // third try: fallback 2 (email)
          _id: new ObjectId(),
          email: 'fallback@example.com',
          createdAt: new Date(),
        });

      const result = await userRepository.findById('fallback@example.com');

      expect(mockCollection.findOne).toHaveBeenCalledTimes(3);
      expect(result?.email).toBe('fallback@example.com');
    });
  });

  describe('findByTenantId', () => {
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

  describe('listForCurrentSession', () => {
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

  describe('updateMfaStatus', () => {
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
});
