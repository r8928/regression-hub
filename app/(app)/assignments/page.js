import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AssignmentsClient from './AssignmentsClient';

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions);
  return <AssignmentsClient user={session.user} />;
}
