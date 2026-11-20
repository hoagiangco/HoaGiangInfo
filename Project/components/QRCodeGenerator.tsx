'use client';

import { useState } from 'react';
import QRCode from 'qrcode';
import { FiDownload, FiX, FiExternalLink } from 'react-icons/fi';
import { MdQrCode } from 'react-icons/md';

interface QRCodeGeneratorProps {
  token: string;
}

export default function QRCodeGenerator({ token }: QRCodeGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function openQR() {
    setLoading(true);
    setIsOpen(true);
    try {
      const url = `${window.location.origin}/${token}`;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: {
          dark: '#0B1120',
          light: '#FFFFFF',
        },
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
    <>
      <button
        onClick={openQR}
        className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#866526] bg-[#FAF7EE] hover:bg-[#F4EBD4] border border-[#E6D3A7] transition-all"
        title="Xem và tải mã QR"
      >
        <MdQrCode className="w-3.5 h-3.5" />
        <span>Mã QR</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="fixed inset-0"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center z-10 animate-in zoom-in-95 duration-150">
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#866526] bg-[#FAF7EE] border border-[#E6D3A7] px-3 py-1 rounded-full">
                MÃ QR TRUY CẬP
              </span>
              <h3 className="font-serif text-xl font-bold text-slate-900 mt-2">
                Token: {token}
              </h3>
            </div>

            {loading ? (
              <div className="w-64 h-64 mx-auto flex items-center justify-center text-slate-400 text-sm">
                Đang tạo mã QR...
              </div>
            ) : qrCodeUrl ? (
              <div className="bg-[#F8F5EE] p-4 rounded-2xl border border-[#E8D8B0] inline-block shadow-inner mb-4">
                <img
                  src={qrCodeUrl}
                  alt={`QR Code for ${token}`}
                  className="w-56 h-56 mx-auto rounded-lg object-contain bg-white p-2"
                />
              </div>
            ) : null}

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={downloadQR}
                disabled={!qrCodeUrl}
                className="flex-1 inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-[#A38035] to-[#866526] text-white px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase shadow-md shadow-[#866526]/20 hover:from-[#866526] hover:to-[#684B1B] transition-all"
              >
                <FiDownload className="w-4 h-4" />
                <span>Tải PNG</span>
              </button>
              <a
                href={`/${token}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
              >
                <FiExternalLink className="w-4 h-4" />
                <span>Mở link</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
