import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';

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

  const serviceIcons: Record<string, string> = {
    gym: '💪',
    bar: '🍹',
    'business-center': '💼',
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-5xl mb-4">
          {serviceIcons[service.type] || '🏊'}
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {service.name}
        </h1>
        {service.location && (
          <p className="text-gray-600">📍 {service.location}</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <p className="text-gray-700 leading-relaxed">{service.description}</p>
      </div>

      {service.hours && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-800 mb-2">Giờ hoạt động:</h2>
          <p className="text-gray-700">{service.hours}</p>
        </div>
      )}

      {service.images && service.images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {service.images.map((image, index) => (
            <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
              <img
                src={image}
                alt={`${service.name} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

