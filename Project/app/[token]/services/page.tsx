import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import ServicesListView from '@/components/ServicesListView';

export default async function ServicesPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'services');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return <ServicesListView token={params.token} services={services} />;
}
