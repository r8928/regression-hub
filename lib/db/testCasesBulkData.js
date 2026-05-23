import { COMPLETED_STATUSES, UNASSIGNED_SENTINEL } from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import { ObjectId } from 'mongodb';

const ALLOWED_FIELDS = [
  'actualResult',
  'status',
  'defectsImprovements',
  'testedBy',
  'testedOn',
  'softwareVersionTested',
  'priority',
  'jiraStory',
  'applicationId',
  'moduleId',
];

function buildBulkMatchQuery(teamId, { ids, filter, pendingOnly }) {
  if (ids?.length) {
    const matchQuery = {
      _id: { $in: ids.map((id) => new ObjectId(id)) },
      teamId,
    };
    if (pendingOnly) matchQuery.status = { $nin: COMPLETED_STATUSES };
    return matchQuery;
  }

  const matchQuery = { teamId };
  if (filter?.applicationId) matchQuery.applicationId = filter.applicationId;
  if (filter?.moduleId) matchQuery.moduleId = filter.moduleId;
  if (filter?.version) {
    matchQuery.softwareVersionTested = {
      $regex: filter.version,
      $options: 'i',
    };
  }
  if (filter?.testedBy === UNASSIGNED_SENTINEL) {
    matchQuery.$or = [
      { testedBy: '' },
      { testedBy: null },
      { testedBy: { $exists: false } },
    ];
  } else if (filter?.testedBy) {
    matchQuery.testedBy = filter.testedBy;
  }
  if (pendingOnly) matchQuery.status = { $nin: COMPLETED_STATUSES };
  return matchQuery;
}

export async function bulkUpdateTestCases(
  db,
  teamId,
  { ids, filter, fields, pendingOnly },
) {
  if (!teamId) throw new ApiError(400, 'teamId required');
  if ((!ids?.length && !filter) || !fields) {
    throw new ApiError(400, 'ids or filter, and fields are required');
  }

  const update = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in fields) update[field] = fields[field];
  }
  update.updatedAt = new Date();

  const matchQuery = buildBulkMatchQuery(teamId, { ids, filter, pendingOnly });
  const result = await db
    .collection('testCases')
    .updateMany(matchQuery, { $set: update });
  return { ok: true, updated: result.modifiedCount };
}
