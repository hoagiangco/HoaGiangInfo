import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Trang không tìm thấy
        </h2>
        <p className="text-gray-600 mb-8">
          QR code không hợp lệ hoặc trang không tồn tại
        </p>
        <Link
          href="/"
          className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}







