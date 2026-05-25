import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getVersions, getTeamSettings, listApplications } = vi.hoisted(() => ({
  getVersions: vi.fn(),
  getTeamSettings: vi.fn(),
  listApplications: vi.fn(),
}));

vi.mock('@/lib/mongodb', () => ({ getDb: vi.fn().mockResolvedValue({}) }));
vi.mock('@/lib/db/versionsData', () => ({ getVersions }));
vi.mock('@/lib/db/settingsData', () => ({ getTeamSettings }));
vi.mock('@/lib/db/applicationsData', () => ({ listApplications }));

import { getReportsPageData } from '@/lib/db/reportsData';

const TEAM = 'team-1';

beforeEach(() => {
  vi.clearAllMocks();
  getVersions.mockResolvedValue([{ version: '1.0', total: 1 }]);
  getTeamSettings.mockResolvedValue({
    testEnvironment: 'QA',
    softwareVersion: '2.0',
    qaUsers: ['Alice'],
  });
  listApplications.mockResolvedValue([{ _id: 'app-1', name: 'Portal' }]);
});

describe('getReportsPageData', () => {
  it('throws when teamId is falsy', async () => {
    await expect(getReportsPageData({}, '')).rejects.toThrow('teamId required');
  });

  it('orchestrates lib calls and returns page payload shape', async () => {
    const data = await getReportsPageData({}, TEAM, 'app-1');

    expect(getVersions).toHaveBeenCalledWith({}, TEAM);
    expect(getTeamSettings).toHaveBeenCalledWith({}, TEAM);
    expect(listApplications).toHaveBeenCalledWith({}, TEAM);
    expect(data).toEqual({
      versions: [{ version: '1.0', total: 1 }],
      settings: {
        testEnvironment: 'QA',
        softwareVersion: '2.0',
      },
      applications: [{ _id: 'app-1', name: 'Portal' }],
    });
  });

  it('propagates dependency failures from orchestrated calls', async () => {
    getVersions.mockRejectedValueOnce(new Error('versions failed'));
    await expect(getReportsPageData({}, TEAM)).rejects.toThrow(
      'versions failed',
    );
  });

  it('uses empty strings when settings fields are missing', async () => {
    getTeamSettings.mockResolvedValueOnce({ qaUsers: [] });

    const data = await getReportsPageData({}, TEAM);

    expect(data.settings).toEqual({
      testEnvironment: '',
      softwareVersion: '',
    });
  });
});
