import { listApplications } from '@/lib/db/applicationsData';
import { getDashboardData } from '@/lib/db/dashboardData';
import { getTeamSettings } from '@/lib/db/settingsData';
import { getVersions } from '@/lib/db/versionsData';

export async function getReportsPageData(db, teamId, applicationId = '') {
  if (!teamId) throw new Error('teamId required');
  const [versions, dashboard, settings, applications] = await Promise.all([
    getVersions(db, teamId),
    getDashboardData(db, teamId, applicationId),
    getTeamSettings(db, teamId),
    listApplications(db, teamId),
  ]);
  return {
    versions,
    summary: dashboard.summary,
    settings: {
      testEnvironment: settings.testEnvironment ?? '',
      softwareVersion: settings.softwareVersion ?? '',
    },
    applications,
  };
}
