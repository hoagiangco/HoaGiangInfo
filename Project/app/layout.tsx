import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  variable: "--font-serif",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hòa Bình Rạch Giá Resort - Hoa Giang",
  description: "Trải nghiệm nghỉ dưỡng chuẩn 4 sao quốc tế tại Hòa Bình Rạch Giá Resort",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${playfair.variable} ${jakarta.variable}`}>
      <body className="font-sans antialiased text-stone-800 bg-[#FDFBF7] selection:bg-[#E6D3A7] selection:text-[#4D3613]">
        {children}
      </body>
    </html>
  );
}
