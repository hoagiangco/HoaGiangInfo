import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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

  const serviceIcons: Record<string, string> = {
    gym: '💪',
    bar: '🍹',
    'business-center': '💼',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Dịch Vụ</h1>

      {services.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <span className="text-2xl">📭</span>
            <span>Chưa có dịch vụ nào</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/${params.token}/services/${service.type}`}
            >
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="text-4xl mb-4">
                  {serviceIcons[service.type] || '🏊'}
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {service.name}
                </h2>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {service.description}
                </p>
                {service.hours && (
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Giờ mở cửa:</span>{' '}
                    {service.hours}
                  </p>
                )}
                {service.location && (
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-semibold">Vị trí:</span>{' '}
                    {service.location}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}


