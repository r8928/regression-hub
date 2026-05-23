import {
  COMPLETED_STATUSES,
  STATUS,
  UNASSIGNED_SENTINEL,
} from '@/lib/constants';
import { toClientDoc } from '@/lib/db/util';
import { ApiError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

const PATCH_ALLOWED_FIELDS = [
  'actualResult',
  'status',
  'defectsImprovements',
  'testedBy',
  'testedOn',
  'softwareVersionTested',
  'priority',
  'jiraStory',
  'testCaseId',
  'type',
  'traceability',
  'testCase',
  'preconditions',
  'steps',
  'expectedResult',
  'applicationId',
  'moduleId',
];

function buildListQuery(teamId, filters) {
  const query = { teamId };
  if (filters.applicationId) query.applicationId = filters.applicationId;
  if (filters.moduleId) query.moduleId = filters.moduleId;
  if (filters.testedBy === UNASSIGNED_SENTINEL) {
    query.$or = [
      { testedBy: '' },
      { testedBy: null },
      { testedBy: { $exists: false } },
    ];
  } else if (filters.testedBy) {
    query.testedBy = filters.testedBy;
  }
  if (filters.assignedTo === UNASSIGNED_SENTINEL) {
    query.$and = [
      ...(query.$and || []),
      {
        $or: [
          { assignedTo: '' },
          { assignedTo: null },
          { assignedTo: { $exists: false } },
        ],
      },
    ];
  } else if (filters.assignedTo) {
    query.assignedTo = filters.assignedTo;
  }
  if (filters.version)
    query.softwareVersionTested = { $regex: filters.version, $options: 'i' };
  if (filters.priority) query.priority = filters.priority;
  if (filters.jiraStory)
    query.jiraStory = { $regex: filters.jiraStory, $options: 'i' };
  if (filters.status === STATUS.PASS) query.status = STATUS.PASS;
  else if (filters.status === STATUS.FAIL) query.status = STATUS.FAIL;
  else if (filters.status === STATUS.PENDING)
    query.status = { $nin: COMPLETED_STATUSES };
  return query;
}

export async function listTestCases(db, teamId, filters = {}) {
  if (!teamId) throw new ApiError(400, 'teamId required');

  const page = Math.max(1, parseInt(filters.page || '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(filters.limit || '50', 10)));
  const skip = (page - 1) * limit;
  const query = buildListQuery(teamId, filters);

  const [testCases, total, applications, modules] = await Promise.all([
    db
      .collection('testCases')
      .find(query)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection('testCases').countDocuments(query),
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

  const data = testCases.map((tc) => ({
    ...toClientDoc(tc),
    applicationName: appMap[tc.applicationId] || 'Unknown',
    moduleName: modMap[tc.moduleId] || 'Unknown',
  }));

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    applications: applications.map((a) => ({
      _id: a._id.toString(),
      name: a.name,
    })),
    modules: modules.map((m) => ({
      _id: m._id.toString(),
      name: m.name,
      applicationId: m.applicationId?.toString() || '',
    })),
  };
}

export async function createTestCase(db, teamId, body) {
  if (!teamId) throw new ApiError(400, 'teamId required');

  const { applicationId, moduleId, applicationName, moduleName, ...fields } =
    body;
  if (!applicationId || !moduleId) {
    throw new ApiError(400, 'applicationId and moduleId required');
  }

  const doc = {
    teamId,
    applicationId,
    moduleId,
    testRunId: 'manual',
    uniqueKey: `${teamId}::${applicationName || applicationId}::${
      moduleName || moduleId
    }::${fields.testCaseId || Date.now()}`,
    sourceFileName: 'manual',
    sourceSheetName: '',
    type: fields.type || '',
    traceability: fields.traceability || '',
    testCaseId: fields.testCaseId || '',
    testCase: fields.testCase || '',
    preconditions: fields.preconditions || '',
    steps: fields.steps || '',
    expectedResult: fields.expectedResult || '',
    actualResult: fields.actualResult || '',
    status: fields.status || '',
    defectsImprovements: fields.defectsImprovements || '',
    testedBy: fields.testedBy || '',
    testedOn: fields.testedOn || '',
    softwareVersionTested: fields.softwareVersionTested || '',
    priority: fields.priority || '',
    jiraStory: fields.jiraStory || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('testCases').insertOne(doc);
  return { ok: true, id: result.insertedId.toString() };
}

export async function updateTestCase(db, teamId, id, body) {
  if (!teamId) throw new ApiError(400, 'teamId required');

  const update = {};
  for (const field of PATCH_ALLOWED_FIELDS) {
    if (field in body) update[field] = body[field];
  }
  update.updatedAt = new Date();

  await db
    .collection('testCases')
    .updateOne({ _id: new ObjectId(id), teamId }, { $set: update });

  return { ok: true };
}

export async function resetTeamData(db, teamId) {
  if (!teamId) throw new ApiError(400, 'teamId required');

  const [testCases, testRuns, modules, applications, assignments] =
    await Promise.all([
      db.collection('testCases').deleteMany({ teamId }),
      db.collection('testRuns').deleteMany({ teamId }),
      db.collection('modules').deleteMany({ teamId }),
      db.collection('applications').deleteMany({ teamId }),
      db.collection('assignments').deleteMany({ teamId }),
    ]);

  return {
    testCases: testCases.deletedCount,
    testRuns: testRuns.deletedCount,
    modules: modules.deletedCount,
    applications: applications.deletedCount,
    assignments: assignments.deletedCount,
  };
}
