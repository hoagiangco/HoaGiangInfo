import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FloorPlanListView, {
  type FloorPlanListItem,
} from '@/components/FloorPlanListView';

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
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const serialized: FloorPlanListItem[] = floorPlans.map((fp) => ({
    id: fp.id,
    name: fp.name,
    description: fp.description,
    translations: fp.translations,
    roomsCount: fp.rooms.length,
  }));

  return <FloorPlanListView token={params.token} floorPlans={serialized} />;
}
