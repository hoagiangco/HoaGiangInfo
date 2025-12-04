import { prisma } from '@/lib/prisma';
import QRCodeCreateForm from '@/components/QRCodeCreateForm';

export default async function NewQRCodePage() {
  const allModules = await prisma.module.findMany({
    orderBy: { displayName: 'asc' },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tạo QR Code mới</h1>
      <QRCodeCreateForm allModules={allModules} />
    </div>
  );
}










