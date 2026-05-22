import { toClientDoc } from '@/lib/db/util';
import { ApiError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

export async function listModules(db, teamId, { applicationId } = {}) {
  const modules = await db.collection('modules').find({ teamId }).toArray();
  const applications = await db
    .collection('applications')
    .find({ teamId })
    .toArray();
  const appMap = Object.fromEntries(
    applications.map((a) => [a._id.toString(), a.name])
  );

  let enriched = modules
    .map((m) => ({
      ...toClientDoc(m),
      applicationName: appMap[m.applicationId] || 'Unknown',
    }))
    .sort((a, b) => {
      const appCmp = a.applicationName.localeCompare(b.applicationName);
      return appCmp !== 0 ? appCmp : a.name.localeCompare(b.name);
    });

  if (applicationId) {
    enriched = enriched.filter((m) => m.applicationId === applicationId);
  }

  return enriched;
}

export async function createModule(db, teamId, { name, applicationId }) {
  const app = await db.collection('applications').findOne({
    _id: new ObjectId(applicationId),
    teamId,
  });
  if (!app) throw new ApiError(404, 'Application not found');

  const doc = {
    name: name.trim(),
    applicationId,
    teamId,
    createdAt: new Date(),
  };
  try {
    const result = await db.collection('modules').insertOne(doc);
    return {
      _id: result.insertedId.toString(),
      name: doc.name,
      applicationId,
      applicationName: app.name,
      teamId,
    };
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Module already exists');
    throw err;
  }
}

export async function getModulesPageData(db, teamId) {
  const [rawModules, applications, dashModules] = await Promise.all([
    db.collection('modules').find({ teamId }).toArray(),
    db
      .collection('applications')
      .find({ teamId }, { projection: { _id: 1, name: 1 } })
      .toArray(),
    db
      .collection('testCases')
      .aggregate([
        { $match: { teamId } },
        {
          $group: {
            _id: '$moduleId',
            total: { $sum: 1 },
            passed: { $sum: { $cond: [{ $eq: ['$status', 'Pass'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'Fail'] }, 1, 0] } },
          },
        },
      ])
      .toArray(),
  ]);

  const appMap = Object.fromEntries(
    applications.map((a) => [a._id.toString(), a.name])
  );
  const moduleGroupsById = Object.fromEntries(
    dashModules.map(({ _id, total, passed, failed }) => [
      _id,
      { total, passed, failed, pending: total - passed - failed },
    ])
  );

  const modules = rawModules
    .map((m) => ({
      _id: m._id.toString(),
      name: m.name,
      applicationName: appMap[m.applicationId] || 'Unknown',
    }))
    .sort(
      (a, b) =>
        a.applicationName.localeCompare(b.applicationName) ||
        a.name.localeCompare(b.name)
    );

  return { modules, moduleGroupsById };
}
