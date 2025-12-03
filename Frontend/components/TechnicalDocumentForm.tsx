'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from './FileUpload';

interface TechnicalDocument {
  id: string;
  title: string;
  category: string;
  description: string | null;
  content: string | null;
  fileUrl: string | null;
  fileName: string | null;
  isActive: boolean;
}

interface TechnicalDocumentFormProps {
  document?: TechnicalDocument;
}

export default function TechnicalDocumentForm({
  document,
}: TechnicalDocumentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: document?.title || '',
    category: document?.category || 'maintenance',
    description: document?.description || '',
    content: document?.content || '',
    isActive: document?.isActive !== undefined ? document.isActive : true,
  });
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('content', formData.content);
      if (file) {
        formDataToSend.append('file', file);
      }

      const url = document
        ? `/api/technical-documents/${document.id}`
        : '/api/technical-documents';
      const method = document ? 'PUT' : 'POST';

      // For PUT, we need to send JSON (file upload only on POST)
      if (document && method === 'PUT') {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            category: formData.category,
            description: formData.description,
            content: formData.content,
            isActive: formData.isActive,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save document');
        }
      } else {
        const response = await fetch(url, {
          method,
          body: formDataToSend,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to save document');
        }
      }

      router.push('/admin/technical-documents');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="maintenance">Maintenance</option>
          <option value="cleaning">Cleaning</option>
          <option value="safety">Safety</option>
          <option value="equipment">Equipment</option>
          <option value="procedures">Procedures</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content (HTML/Markdown)
        </label>
        <textarea
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
          rows={8}
          placeholder="HTML or Markdown content..."
        />
      </div>

      {!document && (
        <FileUpload
          accept="application/pdf"
          maxSize={10}
          onFileSelect={setFile}
          label="PDF Document"
          preview={false}
        />
      )}

      {document && document.fileUrl && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current File
          </label>
          <a
            href={document.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {document.fileName || 'View PDF'}
          </a>
        </div>
      )}

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Active</span>
        </label>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
        >
          {loading ? 'Đang lưu...' : 'Lưu Document'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}







