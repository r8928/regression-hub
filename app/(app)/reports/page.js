import { authOptions } from '@/lib/auth';
import { getReportsPageData } from '@/lib/db/reportsData';
import { getDb } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import ReportsClient from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const resolvedParams = await searchParams;
  const applicationId = resolvedParams?.applicationId || '';

  const db = await getDb();
  const data = await getReportsPageData(db, session.user.teamId, applicationId);

  return (
    <ReportsClient
      user={session.user}
      initialVersions={data.versions}
      initialSummary={data.summary}
      initialSettings={data.settings}
      initialApplications={data.applications}
      initialApplicationId={applicationId}
    />
  );
}
