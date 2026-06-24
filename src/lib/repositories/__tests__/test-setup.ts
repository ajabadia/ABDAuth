/**
 * @purpose Gestiona el comportamiento del clase `BaseRepository` para fines de pruebas.
 * @purpose_en Mocks the `BaseRepository` class and its methods for testing purposes.
 * @refactorable false
 * @classification Helper Utility
 * @complexity Low
 * @fingerprint exports:2,imports:2,sig:1dc4n8u
 * @lastUpdated 2026-06-21T12:07:28.556Z
 */

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
