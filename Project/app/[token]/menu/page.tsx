import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function MenuPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'menu');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const menus = await prisma.menu.findMany({
    where: {
      isActive: true,
    },
    include: {
      items: {
        where: { isAvailable: true },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  const menuIcons: Record<string, string> = {
    'ẩm thực': '🍜',
    'cơm đoàn': '🍱',
    'alacard': '🍽️',
    'buffet': '🥘',
  };

  function getMenuIcon(name: string): string {
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(menuIcons)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return '📋';
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-3">Menu</h1>

      {/* Menu Section */}
      {menus.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menus.map((menu) => (
              <Link
                key={menu.id}
                href={`/${params.token}/menu/${menu.id}`}
                className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer min-h-[140px] flex flex-col"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{getMenuIcon(menu.name)}</span>
                  <h3 className="text-lg font-semibold text-gray-800 flex-1">
                    {menu.name}
                  </h3>
                </div>
                {menu.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                    {menu.description}
                  </p>
                )}
                {menu.items.length > 0 && (
                  <p className="text-xs text-gray-500 mt-auto">
                    {menu.items.length} món
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {menus.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <span className="text-2xl">📭</span>
            <span>Chưa có menu nào</span>
          </p>
        </div>
      )}
    </div>
  );
}

