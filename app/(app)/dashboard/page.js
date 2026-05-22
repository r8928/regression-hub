import MetricCards from '@/components/MetricCards';
import PageHeader from '@/components/PageHeader';
import SummaryRow from '@/components/SummaryRow';
import { authOptions } from '@/lib/auth';
import { getDashboardData, getDashboardSettings } from '@/lib/db/dashboardData';
import { getDb } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { DonutChart, ModuleBarChart } from './DashboardCharts';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const teamId = session.user.teamId;

  const db = await getDb();
  const [data, { softwareVersion }] = await Promise.all([
    getDashboardData(db, teamId),
    getDashboardSettings(db, teamId),
  ]);

  const { summary, moduleGroups, appGroups, testerGroups } = data;

  const donutData = [
    { name: 'Pass', value: summary.passed },
    { name: 'Fail', value: summary.failed },
    { name: 'Pending', value: summary.pending },
  ].filter((d) => d.value > 0);

  const moduleBarData = Object.entries(moduleGroups)
    .map(([name, g]) => ({
      name: name.length > 20 ? name.slice(0, 20) + '…' : name,
      Pass: g.passed,
      Fail: g.failed,
      Pending: g.pending,
    }))
    .slice(0, 20);

  return (
    <div>
      <PageHeader
        eyebrow='QA Regression Control Center'
        title='Dashboard'
        sub='Live metrics across all imported test runs'
        actions={
          softwareVersion ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
              }}
            >
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>
                Current Version
              </span>
              <span
                className='font-mono'
                style={{
                  background: 'rgba(13,148,136,0.12)',
                  border: '1px solid rgba(13,148,136,0.4)',
                  borderRadius: 6,
                  padding: '2px 10px',
                  fontWeight: 700,
                  color: '#0d9488',
                  fontSize: 13,
                }}
              >
                {softwareVersion}
              </span>
            </div>
          ) : undefined
        }
      />

      <MetricCards
        cards={[
          {
            label: 'Total Test Cases',
            value: summary.total,
            sub: 'All imported',
          },
          {
            label: 'Passed',
            value: summary.passed,
            cls: 'pass',
            sub: 'Validated',
          },
          {
            label: 'Failed',
            value: summary.failed,
            cls: 'fail',
            sub: 'Needs attention',
          },
          {
            label: 'Pending',
            value: summary.pending,
            cls: 'pending',
            sub: 'Awaiting result',
          },
          {
            label: 'Pass Rate',
            value: `${summary.passPercent}%`,
            sub: 'Of total',
          },
          {
            label: 'Fail Rate',
            value: `${summary.failPercent}%`,
            sub: 'Of total',
          },
        ]}
      />

      <div className='grid-2' style={{ marginBottom: 20 }}>
        <DonutChart donutData={donutData} />

        <div className='panel'>
          <div className='panel-header'>
            <h3>QA Tester Summary</h3>
          </div>
          {Object.keys(testerGroups).length ? (
            <div>
              {Object.entries(testerGroups)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([name, g]) => (
                  <SummaryRow
                    key={name}
                    name={name}
                    passed={g.passed}
                    failed={g.failed}
                    pending={g.pending}
                    total={g.total}
                  />
                ))}
            </div>
          ) : (
            <div className='empty-state' style={{ padding: '20px' }}>
              No data
            </div>
          )}
        </div>
      </div>

      <ModuleBarChart moduleBarData={moduleBarData} />

      <div className='grid-2' style={{ marginBottom: 20 }}>
        {[
          { title: 'Module Summary', groups: moduleGroups },
          { title: 'Application Summary', groups: appGroups },
        ].map(({ title, groups }) => (
          <div key={title} className='panel'>
            <div className='panel-header'>
              <h3>{title}</h3>
            </div>
            {Object.keys(groups).length ? (
              <div>
                {Object.entries(groups)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([name, g]) => (
                    <SummaryRow
                      key={name}
                      name={name}
                      passed={g.passed}
                      failed={g.failed}
                      pending={g.pending}
                      total={g.total}
                    />
                  ))}
              </div>
            ) : (
              <div className='empty-state' style={{ padding: '20px' }}>
                No data
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
