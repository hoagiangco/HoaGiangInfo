import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyQRToken } from '@/lib/qr-auth';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import Navigation from '@/components/Navigation';
import LanguageProvider from '@/components/LanguageProvider';

/**
 * Customer area. A QR token only identifies a place; it grants read access to
 * customer-facing modules and the feedback form - never to internal data.
 */
export default async function TokenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { token: string };
}) {
  if (params.token === 'guest-2024') {
    redirect('/guest');
  }

  const qrInfo = await verifyQRToken(params.token);

  if (!qrInfo) {
    notFound();
  }

  // Record scan directly (no self-HTTP call), throttled per IP + QR.
  try {
    const h = headers();
    const ip = getClientIp(h);
    if (rateLimit(`scan:${ip}:${qrInfo.id}`, 5, 60 * 1000).ok) {
      await prisma.qRCodeScan.create({
        data: {
          qrCodeId: qrInfo.id,
          ipAddress: ip,
          userAgent: h.get('user-agent')?.slice(0, 300) ?? 'unknown',
        },
      });
    }
  } catch (error) {
    // Ignore scan recording errors
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#FDFBF7] text-stone-800 flex flex-col selection:bg-[#E6D3A7] selection:text-[#4D3613]">
        <Navigation token={params.token} allowedModules={qrInfo.modules} />
        <main className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex-1 flex flex-col">
          {children}
        </main>
        <footer className="border-t border-[#EAE2D2] bg-white/50 backdrop-blur-sm py-10 mt-16 text-center text-xs text-stone-500">
          <div className="container mx-auto px-4">
            <p className="font-serif tracking-[0.2em] text-[#866526] uppercase font-bold text-sm mb-2">
              Hòa Bình Rạch Giá Resort
            </p>
            <p className="text-stone-400 text-xs tracking-wider mb-3">
              ★★★★ HÂN HẠNH ĐƯỢC ĐÓN TIẾP & PHỤC VỤ QUÝ KHÁCH
            </p>
            <p className="text-stone-400 text-[11px]">
              © {new Date().getFullYear()} Hoa Binh Rach Gia Resort • Hòa Giang Hospitality. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </LanguageProvider>
  );
}
