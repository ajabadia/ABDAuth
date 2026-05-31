import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import './test-setup';
import { mockCollection } from './test-setup';

import { userRepository } from '../UserRepository';

describe('UserRepository.findByEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
