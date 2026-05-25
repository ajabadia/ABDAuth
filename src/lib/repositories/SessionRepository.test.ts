import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { BaseRepository } from './BaseRepository';
import { sessionRepository } from './SessionRepository';

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
vi.spyOn(BaseRepository.prototype as unknown as any, 'getCollection').mockImplementation(async () => {
  return mockCollection;
});

describe('SessionRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findByUserId', () => {
    it('should list and sort active sessions by lastActive descending', async () => {
      const userId = 'user_123';
      const tenantId = 'tenant_abc';
      const now = new Date();
      const mockSessions = [
        {
          _id: new ObjectId(),
          userId,
          tenantId,
          expiresAt: new Date(now.getTime() + 10000),
          lastActive: new Date(now.getTime() - 2000), // older
        },
        {
          _id: new ObjectId(),
          userId,
          tenantId,
          expiresAt: new Date(now.getTime() + 10000),
          lastActive: new Date(now.getTime() - 1000), // newer
        },
      ];
      mockCursor.toArray.mockResolvedValue(mockSessions);

      const results = await sessionRepository.findByUserId(userId, tenantId);

      expect(mockCollection.find).toHaveBeenCalledWith({
        userId,
        tenantId,
        expiresAt: { $gt: expect.any(Date) },
      });
      expect(results).toHaveLength(2);
      // Verify correct sorting (newest first)
      expect(results[0].lastActive.getTime()).toBeGreaterThan(results[1].lastActive.getTime());
    });
  });

  describe('revoke', () => {
    it('should revoke a specific session using deleteOne', async () => {
      const sessionId = new ObjectId().toString();
      const userId = 'user_123';
      const tenantId = 'tenant_abc';

      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await sessionRepository.revoke(sessionId, userId, tenantId);

      expect(result).toBe(true);
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(sessionId),
        userId,
        tenantId,
      });
    });

    it('should return false if no session was deleted', async () => {
      const sessionId = new ObjectId().toString();
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await sessionRepository.revoke(sessionId, 'user_123', 'tenant_abc');

      expect(result).toBe(false);
    });
  });

  describe('revokeAllForUser', () => {
    it('should delete all sessions for a user and tenant', async () => {
      const userId = 'user_123';
      const tenantId = 'tenant_abc';

      mockCollection.deleteMany.mockResolvedValue({ deletedCount: 5 });

      await sessionRepository.revokeAllForUser(userId, tenantId);

      expect(mockCollection.deleteMany).toHaveBeenCalledWith({
        userId,
        tenantId,
      });
    });
  });
});
