import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

async function generateQRCodes() {
  try {
    console.log('Generating QR codes...');

    // Get all QR codes
    const qrCodes = await prisma.qRCode.findMany({
      where: { isActive: true },
    });

    // Create output directory
    const outputDir = join(process.cwd(), 'public', 'qr-codes');
    await mkdir(outputDir, { recursive: true });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      console.error('ERROR: NEXT_PUBLIC_APP_URL is not set in .env.local');
      console.error('Please set NEXT_PUBLIC_APP_URL in your .env.local file');
      process.exit(1);
    }
    // Lấy URL đầu tiên nếu có nhiều URL được phân cách bởi dấu phẩy
    const baseUrl = appUrl.split(',')[0].trim();

    for (const qr of qrCodes) {
      const url = `${baseUrl}/${qr.token}`;
      
      console.log(`Generating QR for: ${qr.name} (${qr.token})`);
      console.log(`URL: ${url}`);

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 500,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      // Convert data URL to buffer
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Save to file
      const filename = `${qr.token}.png`;
      const filepath = join(outputDir, filename);
      await writeFile(filepath, buffer);

      console.log(`✅ Saved: ${filepath}`);
    }

    console.log(`\n✅ Generated ${qrCodes.length} QR code(s) in public/qr-codes/`);
    console.log('\nYou can now:');
    console.log(`1. View QR codes at: ${baseUrl}/qr-codes/[token].png`);
    console.log('2. Download and print them');
    console.log('3. Use them in your resort');
  } catch (error) {
    console.error('Error generating QR codes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateQRCodes();










