import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import InteractiveFloorPlan from '@/components/InteractiveFloorPlan';

export default async function FloorPlanDetailPage({
  params,
}: {
  params: { token: string; id: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'floor-plan');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const floorPlan = await prisma.floorPlan.findUnique({
    where: { id: params.id, isActive: true },
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
    <div className="max-w-6xl mx-auto space-y-6">
      <InteractiveFloorPlan floorPlan={floorPlan} token={params.token} />
    </div>
  );
}
