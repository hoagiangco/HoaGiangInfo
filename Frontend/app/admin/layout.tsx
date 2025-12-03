import { redirect } from 'next/navigation';
import { checkAdminSession } from '@/lib/admin-auth';
import AdminSidebar from '@/components/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const isAdmin = await checkAdminSession();

    if (!isAdmin) {
      redirect('/login');
    }

    return (
      <div className="min-h-screen bg-gray-100">
        <AdminSidebar />
        <div className="ml-64 p-8">{children}</div>
      </div>
    );
  } catch (error) {
    console.error('Error in admin layout:', error);
    redirect('/login');
  }
}


