import { requireUser } from '@/lib/auth/guard';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Tài khoản của tôi</h1>
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md text-sm space-y-1">
        <p><span className="text-gray-500">Họ tên:</span> {user.name}</p>
        <p><span className="text-gray-500">Email:</span> {user.email}</p>
        <p><span className="text-gray-500">Vai trò:</span> {ROLE_LABELS[user.role]}</p>
        <p><span className="text-gray-500">Phòng ban:</span> {user.department ?? '—'}</p>
      </div>
      <ChangePasswordForm />
    </div>
  );
}
