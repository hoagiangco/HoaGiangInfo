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
      <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mb-6">Chỉnh Sửa Sơ Đồ Phòng</h1>
      <FloorPlanForm floorPlan={floorPlan} />
    </div>
  );
}









