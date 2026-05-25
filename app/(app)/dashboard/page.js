import MetricCards from '@/components/MetricCards';
import PageHeader from '@/components/PageHeader';
import SummaryPanel from '@/components/SummaryPanel';
import { authOptions } from '@/lib/auth';
import { STATUS } from '@/lib/constants';
import { getDashboardData, getDashboardSettings } from '@/lib/db/dashboardData';
import { getDb } from '@/lib/mongodb';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { getServerSession } from 'next-auth';
import {
  AppStackedBarChart,
  DonutChart,
  ModuleBarChart,
  TesterBarChart,
} from './DashboardCharts';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const teamId = session.user.teamId;

  const db = await getDb();
  const [data, { softwareVersion }] = await Promise.all([
    getDashboardData(db, teamId),
    getDashboardSettings(db, teamId),
  ]);

  const { summary, moduleGroups, testerGroups, modulesByApp } = data;

  const donutData = [
    { name: STATUS.PASS, value: summary.passed, total: summary.total },
    { name: STATUS.FAIL, value: summary.failed, total: summary.total },
    { name: STATUS.PENDING, value: summary.pending, total: summary.total },
  ].filter((d) => d.value > 0);

  const moduleBarData = Object.entries(moduleGroups)
    .map(([name, g]) => ({
      name: name.length > 20 ? name.slice(0, 20) + '…' : name,
      [STATUS.PASS]: g.passed,
      [STATUS.FAIL]: g.failed,
      [STATUS.PENDING]: g.pending,
    }))
    .slice(0, 20);

  const appBarData = Object.entries(modulesByApp)
    .map(([name, app]) => {
      const passPct = app.total
        ? parseFloat(((app.passed / app.total) * 100).toFixed(1))
        : 0;
      const failPct = app.total
        ? parseFloat(((app.failed / app.total) * 100).toFixed(1))
        : 0;
      const pendPct = app.total
        ? parseFloat((100 - passPct - failPct).toFixed(1))
        : 0;
      return {
        name,
        appId: app.appId,
        passCount: app.passed,
        failCount: app.failed,
        pendingCount: app.pending,
        total: app.total,
        [STATUS.PASS]: passPct,
        [STATUS.FAIL]: failPct,
        [STATUS.PENDING]: pendPct,
      };
    })
    .slice(0, 10);

  const testerBarData = Object.entries(testerGroups)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([name, g]) => ({
      name,
      [STATUS.PASS]: g.passed,
      [STATUS.FAIL]: g.failed,
      [STATUS.PENDING]: g.pending,
      total: g.total,
    }));

  return (
    <Stack>
      <PageHeader
        eyebrow='QA Regression Control Center'
        title='Dashboard'
        sub='Live metrics across all imported test runs'
        actions={
          softwareVersion ? (
            <Stack
              direction='row'
              spacing={1}
              sx={{
                alignItems: 'center',
                bgcolor: 'background.default',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                px: 1.75,
                py: 1,
                fontSize: 13,
              }}
            >
              <Box
                component='span'
                sx={{ color: 'text.disabled', fontWeight: 500 }}
              >
                Current Version
              </Box>
              <Box
                component='span'
                sx={{
                  bgcolor: 'action.hover',
                  border: 1,
                  borderColor: 'primary.main',
                  borderRadius: 1.5,
                  px: 1.25,
                  py: 0.25,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: 'primary.main',
                  fontSize: 13,
                }}
              >
                {softwareVersion}
              </Box>
            </Stack>
          ) : undefined
        }
      />

      <Stack spacing={2.5}>
        <MetricCards
          columns={6}
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

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <DonutChart donutData={donutData} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <AppStackedBarChart appBarData={appBarData} />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <TesterBarChart testerBarData={testerBarData} />
          </Grid>
        </Grid>

        <ModuleBarChart moduleBarData={moduleBarData} />

        <Grid container spacing={2}>
          {Object.entries(modulesByApp)
            .sort(([a], [b]) => {
              const order = ['RadiusExam', 'Practice Admin'];
              const ia = order.indexOf(a);
              const ib = order.indexOf(b);
              if (ia !== -1 || ib !== -1)
                return (
                  (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib)
                );
              return a.localeCompare(b);
            })
            .map(([appName, app]) => (
              <Grid size={{ xs: 12, md: 6 }} key={appName}>
                <SummaryPanel
                  title={appName}
                  groups={app.modules}
                  headerStats={{
                    passed: app.passed,
                    failed: app.failed,
                    pending: app.pending,
                  }}
                />
              </Grid>
            ))}
        </Grid>
      </Stack>
    </Stack>
  );
}
