import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function FlipbooksPage() {
  const flipbooks = await prisma.flipbook.findMany({
    include: {
      menus: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý Flipbooks</h1>
        <Link
          href="/admin/flipbooks/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Tạo Flipbook mới
        </Link>
      </div>

      {flipbooks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">Chưa có flipbook nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flipbooks.map((flipbook) => (
            <div
              key={flipbook.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {flipbook.name}
                  </h2>
                  {flipbook.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {flipbook.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{flipbook.pages.length} trang</span>
                    <span className={`px-2 py-1 rounded ${
                      flipbook.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {flipbook.isActive ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </div>
                  {flipbook.menus.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Đang dùng bởi {flipbook.menus.length} menu
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  href={`/admin/flipbooks/${flipbook.id}`}
                  className="flex-1 text-center bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Chỉnh sửa
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}




