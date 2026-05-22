import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function AppLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className='app-shell'>
      <Sidebar user={session.user} />
      <main className='workspace'>{children}</main>
    </div>
  );
}
