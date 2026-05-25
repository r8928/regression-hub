import { STATUS } from '@/lib/constants';

const toGroups = (rows, nameOf, fallback) =>
  Object.fromEntries(
    rows.map(({ _id, total: t, passed: p, failed: f }) => [
      nameOf(_id) ?? fallback,
      { total: t, passed: p, failed: f, pending: t - p - f },
    ]),
  );

export async function getDashboardData(db, teamId, applicationId = '') {
  const match = applicationId ? { teamId, applicationId } : { teamId };

  const passExpr = { $cond: [{ $eq: ['$status', STATUS.PASS] }, 1, 0] };
  const failExpr = { $cond: [{ $eq: ['$status', STATUS.FAIL] }, 1, 0] };

  const [[agg], applications, modules] = await Promise.all([
    db
      .collection('testCases')
      .aggregate([
        { $match: match },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  passed: { $sum: passExpr },
                  failed: { $sum: failExpr },
                },
              },
            ],
            byModule: [
              {
                $group: {
                  _id: '$moduleId',
                  total: { $sum: 1 },
                  passed: { $sum: passExpr },
                  failed: { $sum: failExpr },
                },
              },
            ],
            byTester: [
              {
                $group: {
                  _id: { $ifNull: ['$testedBy', ''] },
                  total: { $sum: 1 },
                  passed: { $sum: passExpr },
                  failed: { $sum: failExpr },
                },
              },
            ],
          },
        },
      ])
      .toArray(),
    db
      .collection('applications')
      .find({ teamId }, { projection: { _id: 1, name: 1 } })
      .toArray(),
    db
      .collection('modules')
      .find({ teamId }, { projection: { _id: 1, name: 1, applicationId: 1 } })
      .toArray(),
  ]);

  const appMap = Object.fromEntries(
    applications.map((a) => [a._id.toString(), a.name]),
  );
  const modMap = Object.fromEntries(
    modules.map((m) => [m._id.toString(), m.name]),
  );
  const modInfoMap = Object.fromEntries(
    modules.map((m) => [
      m._id.toString(),
      { name: m.name, appId: m.applicationId?.toString() ?? null },
    ]),
  );

  const s = agg.summary[0] ?? { total: 0, passed: 0, failed: 0 };
  const { total, passed, failed } = s;
  const pending = total - passed - failed;

  const modulesByApp = {};
  for (const row of agg.byModule) {
    if (!row._id) continue;
    const id = row._id.toString();
    const info = modInfoMap[id];
    if (!info) continue;
    const appName = appMap[info.appId] ?? 'Unknown';
    const modName = info.name ?? 'Unknown';
    const t = row.total,
      p = row.passed,
      f = row.failed,
      pend = t - p - f;
    if (!modulesByApp[appName]) {
      modulesByApp[appName] = {
        appId: info.appId,
        passed: 0,
        failed: 0,
        pending: 0,
        total: 0,
        modules: {},
      };
    }
    modulesByApp[appName].passed += p;
    modulesByApp[appName].failed += f;
    modulesByApp[appName].pending += pend;
    modulesByApp[appName].total += t;
    modulesByApp[appName].modules[modName] = {
      passed: p,
      failed: f,
      pending: pend,
      total: t,
    };
  }

  return {
    summary: {
      total,
      passed,
      failed,
      pending,
      passPercent: total ? parseFloat(((passed / total) * 100).toFixed(1)) : 0,
      failPercent: total ? parseFloat(((failed / total) * 100).toFixed(1)) : 0,
    },
    moduleGroups: toGroups(agg.byModule, (id) => modMap[id], 'Unknown'),
    moduleGroupsById: toGroups(agg.byModule, (id) => id, null),
    testerGroups: toGroups(agg.byTester, (id) => id, 'Unassigned'),
    modulesByApp,
  };
}

export async function getDashboardSettings(db, teamId) {
  const s = await db
    .collection('teamSettings')
    .findOne({ teamId }, { projection: { softwareVersion: 1 } });
  return { softwareVersion: s?.softwareVersion ?? '' };
}
