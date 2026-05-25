import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { ApiError } from '@/lib/errors';
import { getDb } from '@/lib/mongodb';

export function withTeam(handler, { admin = false } = {}) {
  return async (request, context) => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (admin && session.user.role !== ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 },
      );
    }
    const db = await getDb();
    try {
      return await handler(request, context, {
        session,
        teamId: session.user.teamId,
        db,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.payload ?? { error: err.message };
        return NextResponse.json(body, { status: err.status });
      }
      console.error(err);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 },
      );
    }
  };
}

export const withAdmin = (handler) => withTeam(handler, { admin: true });
