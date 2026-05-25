import { NextResponse } from 'next/server';
import { listApplications } from '@/lib/db/applicationsData';
import { withTeam } from '@/lib/server/withTeam';

export const GET = withTeam(async (_req, _ctx, { teamId, db }) => {
  const applications = await listApplications(db, teamId);
  return NextResponse.json(applications, {
    headers: {
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
    },
  });
});
