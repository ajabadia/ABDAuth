import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';

import './test-setup';
import { mockCollection } from './test-setup';

import { userRepository } from '../UserRepository';

describe('UserRepository.findById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: new ObjectId(),
        email: 'fallback@example.com',
        createdAt: new Date(),
      });

    const result = await userRepository.findById('fallback@example.com');

    expect(mockCollection.findOne).toHaveBeenCalledTimes(3);
    expect(result?.email).toBe('fallback@example.com');
  });
});
