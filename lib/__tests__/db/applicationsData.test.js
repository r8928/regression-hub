import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockDb } from '@/lib/__tests__/helpers/mockDb';
import { listApplications } from '@/lib/db/applicationsData';

const TEAM = 'team-1';
const { db, collections, reset } = createMockDb();

beforeEach(() => reset());

describe('listApplications', () => {
  it('throws when teamId is falsy', async () => {
    await expect(listApplications(db, '')).rejects.toThrow('teamId required');
  });

  it('returns applications with string _id', async () => {
    collections.applications = {
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          toArray: vi
            .fn()
            .mockResolvedValue([
              { _id: { toString: () => 'a1' }, name: 'App B' },
            ]),
        })),
      })),
    };
    const apps = await listApplications(db, TEAM);
    expect(apps).toEqual([{ _id: 'a1', name: 'App B' }]);
  });
});
