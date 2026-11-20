'use client';

import { useState, useRef } from 'react';
import { FiUpload, FiX, FiImage, FiFile } from 'react-icons/fi';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  currentFileUrl?: string;
  label?: string;
  preview?: boolean;
}

export default function FileUpload({
  accept = 'image/*',
  maxSize = 10,
  onFileSelect,
  currentFileUrl,
  label = 'Upload File',
  preview = true,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentFileUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check file type (supports MIME types like "application/pdf", wildcards like "image/*", and extensions like ".pdf")
    if (accept) {
      const acceptedTypes = accept
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      const fileType = (selectedFile.type || '').toLowerCase();
      const fileName = selectedFile.name.toLowerCase();

      const isValidType = acceptedTypes.some((type) => {
        if (type === '*' || type === '*/*') {
          return true;
        }
        if (type.startsWith('.')) {
          return fileName.endsWith(type);
        }
        if (type.endsWith('/*')) {
          const baseType = type.split('/')[0];
          return fileType.startsWith(baseType + '/');
        }
        if (type === 'application/pdf') {
          return fileType === 'application/pdf' || fileName.endsWith('.pdf');
        }
        return fileType === type;
      });

      if (!isValidType) {
        setError(`Định dạng file không hợp lệ. Chỉ chấp nhận: ${accept}`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setError(null);
    setFile(selectedFile);
    onFileSelect(selectedFile);

    // Create preview
    if (preview && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else if (preview) {
      setPreviewUrl(null);
    }
  }

  function handleRemove() {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FiUpload className="w-5 h-5" />
          <span>Choose File</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        {file && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {file.type.startsWith('image/') ? (
              <FiImage className="w-4 h-4" />
            ) : (
              <FiFile className="w-4 h-4" />
            )}
            <span>{file.name}</span>
            <span className="text-gray-400">({formatFileSize(file.size)})</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-600 hover:text-red-800"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {currentFileUrl && !file && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Current file:</span>
            <a
              href={currentFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View
            </a>
          </div>
        )}
      </div>

      {preview && previewUrl && (
        <div className="mt-4">
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-xs max-h-48 rounded-lg border border-gray-200"
          />
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {error}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Max file size: {maxSize}MB. Accepted types: {accept}
      </p>
    </div>
  );
}










