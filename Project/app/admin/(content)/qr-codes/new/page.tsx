import { prisma } from '@/lib/prisma';
import QRCodeCreateForm from '@/components/QRCodeCreateForm';

export default async function NewQRCodePage() {
  const allModules = await prisma.module.findMany({
    orderBy: { displayName: 'asc' },
  });

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="pb-2 border-b border-slate-200/70">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#9C752B] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
          CẤP PHÁT ĐIỂM TRUY CẬP
        </span>
        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mt-2.5">
          Tạo Mã QR Điểm Truy Cập Mới
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Thiết lập mã QR độc bản cho bàn tiệc, biệt thự nghỉ dưỡng hoặc quầy bar tiện ích
        </p>
      </div>

      <QRCodeCreateForm allModules={allModules} />
    </div>
  );
}
