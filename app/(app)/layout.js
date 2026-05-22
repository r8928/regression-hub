import Sidebar from '@/components/Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className='app-shell'>
      <Sidebar />
      <main className='workspace'>{children}</main>
    </div>
  );
}
