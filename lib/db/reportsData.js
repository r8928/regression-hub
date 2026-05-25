import { listApplications } from '@/lib/db/applicationsData';
import { getTeamSettings } from '@/lib/db/settingsData';
import { getVersions } from '@/lib/db/versionsData';

export async function getReportsPageData(db, teamId, _applicationId = '') {
  if (!teamId) throw new Error('teamId required');
  const [versions, settings, applications] = await Promise.all([
    getVersions(db, teamId),
    getTeamSettings(db, teamId),
    listApplications(db, teamId),
  ]);
  return {
    versions,
    settings: {
      testEnvironment: settings.testEnvironment ?? '',
      softwareVersion: settings.softwareVersion ?? '',
    },
    applications,
  };
}
