import { notFound, redirect } from 'next/navigation';
import { verifyQRToken } from '@/lib/qr-auth';
import Navigation from '@/components/Navigation';
import LanguageProvider from '@/components/LanguageProvider';

export default async function TokenLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { token: string };
}) {
  const qrInfo = await verifyQRToken(params.token);

  if (!qrInfo) {
    notFound();
  }

  // Record scan
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/qr/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: params.token }),
    });
  } catch (error) {
    // Ignore scan recording errors
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <Navigation token={params.token} allowedModules={qrInfo.modules} />
        <main className="container mx-auto px-4 pt-2 pb-8">{children}</main>
      </div>
    </LanguageProvider>
  );
}

