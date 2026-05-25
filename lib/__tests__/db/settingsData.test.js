import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockDb } from '@/lib/__tests__/helpers/mockDb';
import { getTeamSettings, updateTeamSettings } from '@/lib/db/settingsData';

const TEAM = 'team-1';
const { db, collections, reset } = createMockDb();

beforeEach(() => reset());

describe('getTeamSettings', () => {
  it('throws when teamId is falsy', async () => {
    await expect(getTeamSettings(db, '')).rejects.toThrow('teamId required');
  });

  it('spreads settings fields and maps active users to qaUsers names', async () => {
    collections.teamSettings = {
      findOne: vi.fn().mockResolvedValue({
        testEnvironment: 'Staging',
        softwareVersion: '2.1',
      }),
    };
    collections.users = {
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          toArray: vi
            .fn()
            .mockResolvedValue([{ name: 'Bob' }, { name: 'Alice' }]),
        })),
      })),
    };

    const settings = await getTeamSettings(db, TEAM);

    expect(settings).toEqual({
      testEnvironment: 'Staging',
      softwareVersion: '2.1',
      qaUsers: ['Bob', 'Alice'],
    });
  });
});

describe('updateTeamSettings', () => {
  it('throws when teamId is falsy', async () => {
    await expect(updateTeamSettings(db, '', {})).rejects.toThrow(
      'teamId required',
    );
  });

  it('applies only defined fields from the patch', async () => {
    const updateOne = vi.fn().mockResolvedValue({});
    collections.teamSettings = { updateOne };

    await updateTeamSettings(db, TEAM, { softwareVersion: '3.0' });

    expect(updateOne).toHaveBeenCalledWith(
      { teamId: TEAM },
      expect.objectContaining({
        $set: expect.objectContaining({
          softwareVersion: '3.0',
          updatedAt: expect.any(Date),
        }),
      }),
      { upsert: true },
    );
  });
});
