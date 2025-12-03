import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function MenuPage() {
  const menus = await prisma.menu.findMany({
    include: {
      items: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Menu Management</h1>
        <Link
          href="/admin/menu/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Tạo Menu mới
        </Link>
      </div>

      <div className="space-y-6">
        {menus.map((menu) => (
          <div key={menu.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {menu.name}
                </h2>
                {menu.description && (
                  <p className="text-gray-600 mt-1">{menu.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Items: {menu.items.length}
                </p>
              </div>
              <Link
                href={`/admin/menu/${menu.id}`}
                className="text-primary-600 hover:text-primary-900"
              >
                Edit
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}





