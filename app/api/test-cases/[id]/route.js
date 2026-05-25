import { NextResponse } from 'next/server';
import { updateTestCase } from '@/lib/db/testCasesData';
import { ApiError } from '@/lib/errors';
import { updateTestCaseBodySchema } from '@/lib/schemas/testCases';
import { withTeam } from '@/lib/server/withTeam';

export const PATCH = withTeam(async (request, { params }, { teamId, db }) => {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateTestCaseBodySchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, 'Invalid body');
  }
  const result = await updateTestCase(db, teamId, id, parsed.data);
  return NextResponse.json(result);
});
