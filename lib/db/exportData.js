import { toClientDoc } from '@/lib/db/util';

export async function getExportData(db, teamId, query = {}) {
  const { applicationId = '', testRunId = '', softwareVersion = '' } = query;

  const liveQuery = { teamId };
  if (applicationId) liveQuery.applicationId = applicationId;
  if (testRunId) liveQuery.testRunId = testRunId;
  if (softwareVersion) liveQuery.softwareVersionTested = softwareVersion;

  const [liveTestCases, applications, modules] = await Promise.all([
    db.collection('testCases').find(liveQuery).sort({ createdAt: 1 }).toArray(),
    db
      .collection('applications')
      .find({ teamId }, { projection: { _id: 1, name: 1 } })
      .toArray(),
    db
      .collection('modules')
      .find({ teamId }, { projection: { _id: 1, name: 1 } })
      .toArray(),
  ]);

  const appMap = Object.fromEntries(
    applications.map((a) => [a._id.toString(), a.name]),
  );
  const modMap = Object.fromEntries(
    modules.map((m) => [m._id.toString(), m.name]),
  );

  let testCases = liveTestCases;

  if (softwareVersion && liveTestCases.length === 0) {
    const histQuery = { teamId, 'history.version': softwareVersion };
    if (applicationId) histQuery.applicationId = applicationId;

    const historicalDocs = await db
      .collection('testCases')
      .find(histQuery)
      .sort({ createdAt: 1 })
      .toArray();

    testCases = historicalDocs.map((tc) => {
      const snap =
        (tc.history || []).find((h) => h.version === softwareVersion) || {};
      return {
        ...tc,
        status: snap.status ?? tc.status,
        testedBy: snap.testedBy ?? tc.testedBy,
        testedOn: snap.testedOn ?? tc.testedOn,
        actualResult: snap.actualResult ?? tc.actualResult,
        defectsImprovements: snap.defectsImprovements ?? tc.defectsImprovements,
        softwareVersionTested: softwareVersion,
      };
    });
  }

  return testCases.map((tc) => ({
    ...toClientDoc(tc),
    applicationName: appMap[tc.applicationId] || 'Unknown',
    moduleName: modMap[tc.moduleId] || 'Unknown',
  }));
}
