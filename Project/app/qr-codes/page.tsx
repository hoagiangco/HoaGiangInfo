import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { requirePermission } from '@/lib/auth/guard';

export const dynamic = 'force-dynamic';

export default async function QRCodesPage() {
  // This page lists every QR token: internal use only (was public before).
  await requirePermission('content.manage');

  const qrCodes = await prisma.qRCode.findMany({
    where: { isActive: true },
    include: {
      modules: {
        include: {
          module: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL is not set in .env.local');
  }
  // Lấy URL đầu tiên nếu có nhiều URL được phân cách bởi dấu phẩy
  const baseUrl = appUrl.split(',')[0].trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            QR Codes
          </h1>
          <p className="text-gray-600">
            Quét QR code để truy cập thông tin resort
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {qrCodes.map((qr) => {
            const qrUrl = `${baseUrl}/${qr.token}`;
            const qrImageUrl = `/qr-codes/${qr.token}.png`;

            return (
              <div
                key={qr.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="text-center">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                    {qr.name}
                  </h2>
                  {qr.description && (
                    <p className="text-gray-600 mb-4">{qr.description}</p>
                  )}

                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
                    <Image
                      src={qrImageUrl}
                      alt={`QR Code for ${qr.name}`}
                      width={300}
                      height={300}
                      className="w-64 h-64"
                    />
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Token:</span> {qr.token}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">URL:</span>{' '}
                      <Link
                        href={qrUrl}
                        className="text-blue-600 hover:underline break-all"
                        target="_blank"
                      >
                        {qrUrl}
                      </Link>
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Modules:</span>{' '}
                      {qr.modules.length} modules
                    </p>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <a
                      href={qrImageUrl}
                      download={`qr-${qr.token}.png`}
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Download QR
                    </a>
                    <Link
                      href={qrUrl}
                      target="_blank"
                      className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Test Link
                    </Link>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">
                      Modules có thể truy cập:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {qr.modules.map((qm) => (
                        <span
                          key={qm.module.id}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                        >
                          {qm.module.displayName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/admin/qr-codes"
            className="text-primary-600 hover:text-primary-800 underline"
          >
            Quản lý QR codes trong Admin Panel →
          </Link>
        </div>
      </div>
    </div>
  );
}










