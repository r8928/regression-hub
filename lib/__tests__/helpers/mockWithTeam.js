import { vi } from 'vitest';

export function installWithTeamMock(
  mockDb,
  { role = 'admin', teamId = 't1' } = {},
) {
  const session = { user: { id: 'u1', teamId, role, name: 'Test' } };
  const inject = (handler) => (req, ctx) =>
    handler(req, ctx, { session, teamId, db: mockDb });
  vi.mock('@/lib/server/withTeam', () => ({
    withTeam: (handler) => inject(handler),
    withAdmin: (handler) => inject(handler),
  }));
  return { session, teamId };
}
