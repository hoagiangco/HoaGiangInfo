import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Lora } from 'next/font/google';
import './globals.css';
import LanguageProvider from '@/components/LanguageProvider';
import { getServerLanguage } from '@/lib/i18n-server';

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin', 'vietnamese'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0F172A',
};

export const metadata: Metadata = {
  title: 'Hòa Bình Rạch Giá Resort - Hoa Giang',
  description:
    'Trải nghiệm nghỉ dưỡng chuẩn 4 sao quốc tế tại Hòa Bình Rạch Giá Resort, Kiên Giang, Việt Nam',
  openGraph: {
    locale: 'vi_VN',
    alternateLocale: ['en_US', 'zh_CN'],
    type: 'website',
    siteName: 'Hòa Bình Rạch Giá Resort',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialLanguage = getServerLanguage();

  return (
    <html
      lang={initialLanguage}
      className={`${beVietnamPro.variable} ${lora.variable}`}
    >
      <body className="font-sans antialiased text-slate-900 bg-[#F3EFE6] selection:bg-[#E6D3A7] selection:text-[#0F172A]">
        <LanguageProvider initialLanguage={initialLanguage}>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
