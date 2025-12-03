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
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Chỉnh sửa Flipbook</h1>
      <FlipbookForm flipbook={flipbook} />
    </div>
  );
}




