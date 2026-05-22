import { authOptions } from '@/lib/auth';
import { getUsers } from '@/lib/db/usersData';
import { getDb } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (session.user.role !== 'admin') redirect('/dashboard');

  const db = await getDb();
  const users = await getUsers(db, session.user.teamId);

  return <UsersClient user={session.user} initialUsers={users} />;
}
