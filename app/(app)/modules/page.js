import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { authOptions } from '@/lib/auth';
import { getModulesPageData } from '@/lib/db/modulesData';
import { getDb } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';

export default async function ModulesPage() {
  const session = await getServerSession(authOptions);
  const db = await getDb();
  const teamId = session.user.teamId;

  const { modules, moduleGroupsById } = await getModulesPageData(db, teamId);

  const grouped = modules.reduce((acc, mod) => {
    const key = mod.applicationName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(mod);
    return acc;
  }, {});

  const appNames = Object.keys(grouped);

  return (
    <div>
      <PageHeader
        eyebrow='Registry'
        title='Modules'
        sub={`${modules.length} modules across ${appNames.length} application${
          appNames.length !== 1 ? 's' : ''
        }`}
      />

      {modules.length === 0 ? (
        <EmptyState icon='⊞' title='No modules yet'>
          <p>
            Modules are created automatically from the Module column in your
            Excel file.
          </p>
        </EmptyState>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {appNames.map((appName) => {
            const appModules = grouped[appName];
            const appStats = appModules.reduce(
              (acc, mod) => {
                const g = moduleGroupsById[mod._id] || {
                  total: 0,
                  passed: 0,
                  failed: 0,
                  pending: 0,
                };
                acc.total += g.total;
                acc.passed += g.passed;
                acc.failed += g.failed;
                acc.pending += g.pending;
                return acc;
              },
              { total: 0, passed: 0, failed: 0, pending: 0 },
            );

            return (
              <div key={appName} className='panel'>
                <div
                  className='panel-header'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <h3 style={{ margin: 0 }}>{appName}</h3>
                  <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                    <span style={{ color: 'var(--muted)' }}>
                      {appModules.length} module
                      {appModules.length !== 1 ? 's' : ''}
                    </span>
                    <span style={{ color: 'var(--pass)', fontWeight: 600 }}>
                      {appStats.passed} Pass
                    </span>
                    <span style={{ color: 'var(--fail)', fontWeight: 600 }}>
                      {appStats.failed} Fail
                    </span>
                    <span style={{ color: 'var(--pending)', fontWeight: 600 }}>
                      {appStats.pending} Pending
                    </span>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Total</th>
                      <th>Pass</th>
                      <th>Fail</th>
                      <th>Pending</th>
                      <th>Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appModules.map((mod) => {
                      const g = moduleGroupsById[mod._id] || {
                        total: 0,
                        passed: 0,
                        failed: 0,
                        pending: 0,
                      };
                      const pct = g.total
                        ? Math.round((g.passed / g.total) * 100)
                        : 0;
                      return (
                        <tr key={mod._id}>
                          <td style={{ fontWeight: 500 }}>{mod.name}</td>
                          <td>{g.total}</td>
                          <td style={{ color: 'var(--pass)', fontWeight: 500 }}>
                            {g.passed}
                          </td>
                          <td style={{ color: 'var(--fail)', fontWeight: 500 }}>
                            {g.failed}
                          </td>
                          <td
                            style={{ color: 'var(--pending)', fontWeight: 500 }}
                          >
                            {g.pending}
                          </td>
                          <td>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <div
                                className='progress-bar'
                                style={{
                                  flex: 1,
                                  maxWidth: 80,
                                  display: 'flex',
                                  overflow: 'hidden',
                                }}
                              >
                                {g.passed > 0 && (
                                  <div
                                    style={{
                                      width: `${(g.passed / g.total) * 100}%`,
                                      height: '100%',
                                      background: 'var(--pass)',
                                      transition: 'width 300ms',
                                    }}
                                  />
                                )}
                                {g.failed > 0 && (
                                  <div
                                    style={{
                                      width: `${(g.failed / g.total) * 100}%`,
                                      height: '100%',
                                      background: 'var(--fail)',
                                      transition: 'width 300ms',
                                    }}
                                  />
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: 'var(--muted)',
                                  minWidth: 36,
                                }}
                              >
                                {pct}%
                                {g.failed > 0 && (
                                  <span
                                    style={{
                                      color: 'var(--fail)',
                                      marginLeft: 2,
                                    }}
                                  >
                                    {' '}
                                    · {Math.round((g.failed / g.total) * 100)}%
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
