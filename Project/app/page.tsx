import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';

export default async function HomePage() {
  // Tìm QR code guest (type="guest" và isActive=true)
  const guestQR = await prisma.qRCode.findFirst({
    where: {
      type: 'guest',
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc', // Lấy QR mới nhất nếu có nhiều
    },
  });

  if (!guestQR) {
    // Nếu không tìm thấy guest QR, hiển thị thông báo
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Chào mừng đến Resort
          </h1>
          <p className="text-gray-600 mb-4">
            Chưa có QR code cho khách hàng được cấu hình.
          </p>
          <p className="text-sm text-gray-500">
            Vui lòng tạo QR code với type="guest" trong Admin Panel.
          </p>
        </div>
      </div>
    );
  }

  const qrImageUrl = `/qr-codes/${guestQR.token}.png`;
  const qrLinkUrl = `/${guestQR.token}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 flex items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Chào mừng đến Resort
        </h1>
        <p className="text-gray-600 mb-6">
          Quét QR code bên dưới để truy cập thông tin resort
        </p>

        <div className="flex justify-center mb-6">
          <div className="relative w-64 h-64 bg-white p-4 rounded-lg border-4 border-gray-200">
            <Image
              src={qrImageUrl}
              alt={`QR Code - ${guestQR.name}`}
              width={256}
              height={256}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>

        {guestQR.description && (
          <p className="text-sm text-gray-500 mb-4">{guestQR.description}</p>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2">
            Hoặc click vào link bên dưới để truy cập trực tiếp:
          </p>
          <Link
            href={qrLinkUrl}
            className="text-primary-600 hover:text-primary-800 underline text-sm"
          >
            {(() => {
              const appUrl = process.env.NEXT_PUBLIC_APP_URL;
              if (!appUrl) return qrLinkUrl;
              // Lấy URL đầu tiên nếu có nhiều URL được phân cách bởi dấu phẩy
              const cleanUrl = appUrl.split(',')[0].trim();
              return `${cleanUrl}${qrLinkUrl}`;
            })()}
          </Link>
        </div>
      </div>
    </div>
  );
}
