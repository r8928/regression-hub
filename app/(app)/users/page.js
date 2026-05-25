import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ROLES } from '@/lib/constants';
import { getUsers } from '@/lib/db/usersData';
import { getDb } from '@/lib/mongodb';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (session.user.role !== ROLES.ADMIN) redirect('/dashboard');

  const db = await getDb();
  const users = await getUsers(db, session.user.teamId);

  return <UsersClient user={session.user} initialUsers={users} />;
}
