import { requirePermission } from '@/lib/auth/guard';
import DocumentForm from '@/components/DocumentForm';

export default async function NewDocumentPage() {
  await requirePermission('documents.write');
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight mb-6">Tải Lên Tài Liệu</h1>
      <DocumentForm />
    </div>
  );
}
