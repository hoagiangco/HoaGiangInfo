import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import FlipbookForm from '@/components/FlipbookForm';

export default async function EditFlipbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const flipbook = await prisma.flipbook.findUnique({
    where: { id },
  });

  if (!flipbook) {
    notFound();
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mb-6">Chỉnh Sửa Flipbook</h1>
      <FlipbookForm flipbook={flipbook} />
    </div>
  );
}







