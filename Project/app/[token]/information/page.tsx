import { prisma } from '@/lib/prisma';
import { checkModuleAccess } from '@/lib/qr-auth';
import { redirect } from 'next/navigation';

export default async function InformationPage({
  params,
}: {
  params: { token: string };
}) {
  const hasAccess = await checkModuleAccess(params.token, 'information');
  if (!hasAccess) {
    redirect(`/${params.token}`);
  }

  const information = await prisma.information.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Thông Tin</h1>

      {information.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 flex items-center justify-center gap-2">
            <span className="text-2xl">📭</span>
            <span>Chưa có thông tin nào</span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {information.map((info) => (
            <div
              key={info.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start space-x-4">
                {info.icon && (
                  <div className="text-4xl flex-shrink-0">{info.icon}</div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {info.title}
                  </h2>
                  <div 
                    className="text-gray-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: info.content }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


