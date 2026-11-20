import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/guard';
import UsersManager from '@/components/UsersManager';

export default async function UsersPage() {
  const user = await requirePermission('users.manage');

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, department: true, isActive: true, lastLoginAt: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="pb-2 border-b border-slate-200/70">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
          PHÂN QUYỀN HỆ THỐNG & NHÂN SỰ
        </span>
        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
          Quản Lý Nhân Viên & Phân Quyền
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Cấp phát tài khoản, phân chia phòng ban và quản lý trạng thái hoạt động của nhân sự
        </p>
      </div>

      <UsersManager
        actorRole={user.role}
        actorId={user.id}
        users={users.map((u) => ({ ...u, lastLoginAt: u.lastLoginAt?.toISOString() ?? null }))}
      />
    </div>
  );
}
