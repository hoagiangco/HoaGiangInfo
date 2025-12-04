import { prisma } from '@/lib/prisma';

export default async function AdminDashboard() {
  try {
    const [qrCodesCount, modulesCount, menusCount, servicesCount, informationCount, documentsCount, floorPlansCount, flipbooksCount] =
      await Promise.all([
        prisma.qRCode.count().catch(() => 0),
        prisma.module.count().catch(() => 0),
        prisma.menu.count().catch(() => 0),
        prisma.service.count().catch(() => 0),
        prisma.information.count().catch(() => 0),
        prisma.technicalDocument.count().catch(() => 0),
        prisma.floorPlan.count().catch(() => 0),
        prisma.flipbook.count().catch(() => 0),
      ]);

  const stats = [
    { label: 'QR Codes', value: qrCodesCount, color: 'bg-blue-500' },
    { label: 'Modules', value: modulesCount, color: 'bg-green-500' },
    { label: 'Menus', value: menusCount, color: 'bg-yellow-500' },
    { label: 'Flipbooks', value: flipbooksCount, color: 'bg-orange-500' },
    { label: 'Services', value: servicesCount, color: 'bg-purple-500' },
    { label: 'Information', value: informationCount, color: 'bg-pink-500' },
    { label: 'Floor Plans', value: floorPlansCount, color: 'bg-teal-500' },
    { label: 'Documents', value: documentsCount, color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.color} w-12 h-12 rounded-full flex items-center justify-center text-white text-xl`}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error loading dashboard:', error);
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>Error loading dashboard data. Please check the console for details.</p>
        </div>
      </div>
    );
  }
}


