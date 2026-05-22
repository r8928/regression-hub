import { createMockDb } from '@/lib/__tests__/helpers/mockDb';
import { getAssignmentsPageData } from '@/lib/db/assignmentsData';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const TEAM = 'team-1';
const { db, collections, reset } = createMockDb();

beforeEach(() => reset());

describe('getAssignmentsPageData', () => {
  it('returns empty structures when no modules', async () => {
    collections.assignments = {
      find: vi.fn(() => ({
        sort: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
      })),
    };
    collections.modules = {
      find: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
    };
    collections.applications = {
      find: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
    };
    collections.users = {
      find: vi.fn(() => ({
        sort: vi.fn(() => ({ toArray: vi.fn().mockResolvedValue([]) })),
      })),
    };

    const data = await getAssignmentsPageData(db, TEAM, {
      userName: 'Bob',
      view: 'mine',
    });
    expect(data.assignments).toEqual([]);
    expect(data.modules).toEqual([]);
    expect(data.qaUsers).toEqual([]);
  });
});
