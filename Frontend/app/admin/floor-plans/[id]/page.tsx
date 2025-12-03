import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import FloorPlanForm from '@/components/FloorPlanForm';

export default async function EditFloorPlanPage({
  params,
}: {
  params: { id: string };
}) {
  const floorPlan = await prisma.floorPlan.findUnique({
    where: { id: params.id },
    include: {
      rooms: {
        orderBy: { number: 'asc' },
      },
    },
  });

  if (!floorPlan) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Chỉnh sửa Floor Plan</h1>
      <FloorPlanForm floorPlan={floorPlan} />
    </div>
  );
}






