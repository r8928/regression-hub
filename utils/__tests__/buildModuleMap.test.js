import { describe, it, expect } from 'vitest';
import { buildModuleMap } from '../buildModuleMap';

describe('buildModuleMap', () => {
  it('groups cases by moduleId, falling back to moduleName', () => {
    const cases = [
      { moduleId: 'm1', moduleName: 'Auth',   applicationName: 'App', status: 'Pass' },
      { moduleId: 'm1', moduleName: 'Auth',   applicationName: 'App', status: 'Fail' },
      { moduleId: null, moduleName: 'Search', applicationName: 'App', status: '' },
    ];
    const rows = buildModuleMap(cases);
    expect(rows).toHaveLength(2);
    const auth = rows.find((r) => r.module === 'Auth');
    expect(auth).toMatchObject({ total: 2, pass: 1, fail: 1, pending: 0, app: 'App' });
    const search = rows.find((r) => r.module === 'Search');
    expect(search).toMatchObject({ total: 1, pass: 0, fail: 0, pending: 1 });
  });

  it('defaults blank module/app names to "—"', () => {
    const rows = buildModuleMap([{ moduleId: 'x', moduleName: '', applicationName: '', status: 'Pass' }]);
    expect(rows[0]).toMatchObject({ module: '—', app: '—' });
  });

  it('returns rows sorted by module name', () => {
    const rows = buildModuleMap([
      { moduleId: 'b', moduleName: 'Beta',  applicationName: 'A', status: 'Pass' },
      { moduleId: 'a', moduleName: 'Alpha', applicationName: 'A', status: 'Pass' },
    ]);
    expect(rows.map((r) => r.module)).toEqual(['Alpha', 'Beta']);
  });
});
