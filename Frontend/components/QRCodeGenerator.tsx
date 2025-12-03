'use client';

import { useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  token: string;
}

export default function QRCodeGenerator({ token }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateQR() {
    setLoading(true);
    try {
      const url = `${window.location.origin}/${token}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  }

  function downloadQR() {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-${token}.png`;
    link.click();
  }

  return (
    <div className="inline-block">
      <button
        onClick={generateQR}
        disabled={loading}
        className="text-blue-600 hover:text-blue-900 text-sm"
      >
        {loading ? 'Generating...' : 'Generate QR'}
      </button>
      {qrCodeUrl && (
        <div className="mt-2">
          <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
          <button
            onClick={downloadQR}
            className="mt-2 text-xs text-blue-600 hover:text-blue-900"
          >
            Download
          </button>
        </div>
      )}
    </div>
  );
}







