import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { authOptions } from '@/lib/auth';
import { getApplicationsPageData } from '@/lib/db/applicationsData';
import { getDb } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);
  const db = await getDb();
  const teamId = session.user.teamId;

  const { apps, appGroups } = await getApplicationsPageData(db, teamId);

  return (
    <div>
      <PageHeader
        eyebrow='Registry'
        title='Applications'
        sub={`Auto-created from imported Excel files. ${apps.length} total.`}
      />

      {apps.length === 0 ? (
        <EmptyState icon='▣' title='No applications yet'>
          <p>
            Applications are created automatically when you import an Excel
            file.
          </p>
        </EmptyState>
      ) : (
        <div className='grid-3'>
          {apps.map((app) => {
            const g = appGroups[app._id] || {
              total: 0,
              passed: 0,
              failed: 0,
              pending: 0,
            };
            const pct = g.total ? Math.round((g.passed / g.total) * 100) : 0;
            return (
              <div key={app._id} className='panel'>
                <div className='panel-body'>
                  <div
                    style={{ fontWeight: 600, fontSize: 15, marginBottom: 10 }}
                  >
                    {app.name}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      fontSize: 13,
                      marginBottom: 10,
                    }}
                  >
                    <span>{g.total} total</span>
                    <span style={{ color: 'var(--pass)' }}>
                      {g.passed} pass
                    </span>
                    <span style={{ color: 'var(--fail)' }}>
                      {g.failed} fail
                    </span>
                    <span style={{ color: 'var(--pending)' }}>
                      {g.pending} pending
                    </span>
                  </div>
                  <div className='progress-bar'>
                    <div
                      className='progress-bar-fill'
                      style={{ width: `${pct}%`, background: 'var(--pass)' }}
                    />
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: 'var(--muted)',
                    }}
                  >
                    {pct}% pass rate
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
