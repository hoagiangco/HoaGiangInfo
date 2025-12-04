import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function FloorPlanPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'floor-plan');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const floorPlans = await prisma.floorPlan.findMany({
    where: { isActive: true },
    include: {
      rooms: {
        orderBy: { number: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-3">Sơ Đồ</h1>

      {floorPlans.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <span className="text-2xl">📭</span>
            <span>Chưa có sơ đồ phòng nào</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {floorPlans.map((floorPlan) => (
            <Link
              key={floorPlan.id}
              href={`/${params.token}/floor-plan/${floorPlan.id}`}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer min-h-[120px] flex flex-col justify-center"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📐</span>
                <h2 className="text-lg font-semibold text-gray-800">
                  {floorPlan.name}
                </h2>
              </div>
              {floorPlan.description && (
                <p className="text-gray-600 text-sm line-clamp-2">
                  {floorPlan.description}
                </p>
              )}
              {floorPlan.rooms.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {floorPlan.rooms.length} phòng
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

