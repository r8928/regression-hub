import { NextResponse } from 'next/server';
import { listTestRuns } from '@/lib/db/testRunsData';
import { withTeam } from '@/lib/server/withTeam';

export const GET = withTeam(async (_req, _ctx, { teamId, db }) => {
  const testRuns = await listTestRuns(db, teamId);
  return NextResponse.json(testRuns);
});
