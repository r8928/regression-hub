import { toClientDoc } from '@/lib/db/util';

export async function listTestRuns(db, teamId) {
  const testRuns = await db
    .collection('testRuns')
    .find({ teamId })
    .sort({ createdAt: -1 })
    .toArray();
  return testRuns.map((r) => toClientDoc(r));
}

export async function getTestRunsPageData(db, teamId) {
  return listTestRuns(db, teamId);
}
