export function mockSession(overrides = {}) {
  return {
    user: {
      id: 'user-1',
      teamId: 'radius',
      teamName: 'Radius',
      username: 'admin',
      role: 'admin',
      name: 'Admin',
      ...overrides.user,
    },
    ...overrides,
  };
}
