import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect, notFound } from 'next/navigation';
import ServiceDetailView from '@/components/ServiceDetailView';

export default async function ServiceDetailPage({
  params,
}: {
  params: { token: string; service: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'services');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const service = await prisma.service.findFirst({
    where: {
      type: params.service,
      isActive: true,
    },
  });

  if (!service) {
    notFound();
  }

  return <ServiceDetailView token={params.token} service={service} />;
}
