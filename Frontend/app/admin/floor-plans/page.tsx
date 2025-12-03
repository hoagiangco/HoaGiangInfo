import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function FloorPlansPage() {
  const floorPlans = await prisma.floorPlan.findMany({
    include: {
      rooms: true,
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Floor Plans</h1>
        <Link
          href="/admin/floor-plans/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          Tạo Floor Plan mới
        </Link>
      </div>

      <div className="space-y-6">
        {floorPlans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {plan.name}
                </h2>
                {plan.description && (
                  <p className="text-gray-600 mt-1">{plan.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Rooms: {plan.rooms.length} | Type: {plan.fileType || 'N/A'}
                </p>
              </div>
              <Link
                href={`/admin/floor-plans/${plan.id}`}
                className="text-primary-600 hover:text-primary-900"
              >
                Edit
              </Link>
            </div>
            {plan.imageUrl && (
              <img
                src={plan.imageUrl}
                alt={plan.name}
                className="w-full max-w-2xl h-auto rounded-lg border border-gray-200"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}







