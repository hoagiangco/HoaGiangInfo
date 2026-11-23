import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyQRToken } from '@/lib/qr-auth';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import Navigation from '@/components/Navigation';
import GuestFooter from '@/components/GuestFooter';
import { getFooterConfig } from '@/lib/footer-server';

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
  } catch {
    // Ignore scan recording errors
  }

  const footerConfig = await getFooterConfig();

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-slate-900 flex flex-col pb-[calc(64px+env(safe-area-inset-bottom,0px))] md:pb-0 selection:bg-[#E6D3A7] selection:text-[#0F172A]">
      <Navigation
        token={params.token}
        allowedModules={qrInfo.modules}
        branding={footerConfig.branding}
      />
      <main className="container mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-4 sm:py-6 md:py-8 flex-1 flex flex-col">
        {children}
      </main>
      <GuestFooter config={footerConfig} token={params.token} />
    </div>
  );
}
