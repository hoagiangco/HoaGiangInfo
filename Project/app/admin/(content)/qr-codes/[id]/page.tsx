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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-slate-200/70">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
          CẤU HÌNH ĐIỂM TRUY CẬP
        </span>
        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
          Chỉnh Sửa Mã QR: {qrCode.name}
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Cập nhật thông tin token, quyền module hoặc trạng thái hoạt động của mã QR
        </p>
      </div>

      <QRCodeEditForm qrCode={qrCode} allModules={allModules} />
    </div>
  );
}
