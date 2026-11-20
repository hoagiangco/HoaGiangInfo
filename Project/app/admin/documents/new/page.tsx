import { requirePermission } from '@/lib/auth/guard';
import DocumentForm from '@/components/DocumentForm';

export default async function NewDocumentPage() {
  await requirePermission('documents.write');
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Tải lên tài liệu</h1>
      <DocumentForm />
    </div>
  );
}
