import { createMockDb } from '@/lib/__tests__/helpers/mockDb';
import { getUsers } from '@/lib/db/usersData';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const TEAM = 'team-1';
const { db, collections, reset } = createMockDb();

beforeEach(() => reset());

describe('getUsers', () => {
  it('throws when teamId is falsy', async () => {
    await expect(getUsers(db, '')).rejects.toThrow('teamId required');
  });

  it('returns users without passwordHash and string _id', async () => {
    collections.users = {
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          toArray: vi
            .fn()
            .mockResolvedValue([
              { _id: { toString: () => 'u1' }, name: 'Alice', role: 'qa' },
            ]),
        })),
      })),
    };
    const users = await getUsers(db, TEAM);
    expect(users).toEqual([{ _id: 'u1', name: 'Alice', role: 'qa' }]);
    expect(users[0]).not.toHaveProperty('passwordHash');
  });
});
