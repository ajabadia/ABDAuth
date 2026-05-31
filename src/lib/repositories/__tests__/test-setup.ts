import { vi } from 'vitest';
import { BaseRepository } from '../BaseRepository';

export const mockCursor = {
  toArray: vi.fn().mockResolvedValue([]),
};

export const mockCollection = {
  findOne: vi.fn(),
  find: vi.fn().mockReturnValue(mockCursor),
  insertOne: vi.fn(),
  updateOne: vi.fn(),
  deleteOne: vi.fn(),
  deleteMany: vi.fn(),
};

vi.spyOn(BaseRepository.prototype as unknown as any, 'getCollection').mockImplementation(async () => {
  return mockCollection;
});
