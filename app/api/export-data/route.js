import { NextResponse } from 'next/server';
import { getExportData } from '@/lib/db/exportData';
import { withTeam } from '@/lib/server/withTeam';

export const GET = withTeam(async (request, _ctx, { teamId, db }) => {
  const { searchParams } = new URL(request.url);
  const query = {
    applicationId: searchParams.get('applicationId') || '',
    testRunId: searchParams.get('testRunId') || '',
    softwareVersion: searchParams.get('softwareVersion') || '',
  };
  const enriched = await getExportData(db, teamId, query);
  return NextResponse.json(enriched);
});
