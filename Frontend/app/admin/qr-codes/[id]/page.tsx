import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import QRCodeEditForm from '@/components/QRCodeEditForm';

export default async function QRCodeEditPage({
  params,
}: {
  params: { id: string };
}) {
  const qrCode = await prisma.qRCode.findUnique({
    where: { id: params.id },
    include: {
      modules: {
        include: {
          module: true,
        },
      },
    },
  });

  if (!qrCode) {
    notFound();
  }

  const allModules = await prisma.module.findMany({
    orderBy: { displayName: 'asc' },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Chỉnh sửa QR Code
      </h1>
      <QRCodeEditForm qrCode={qrCode} allModules={allModules} />
    </div>
  );
}







