import React, { useState } from 'react';
import { TransactionItem } from '../types';
import { formatThousand, parseThousand } from '../utils/formatters';

interface CetakStrukModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionItem[];
}

// Helper: encode Uint8Array (byte ESC/POS) menjadi base64 untuk RawBT
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: gabungkan beberapa array angka/teks jadi satu Uint8Array
function buildEscPosBytes(parts: (number[] | string)[]): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: number[] = [];
  parts.forEach((part) => {
    if (typeof part === 'string') {
      chunks.push(...Array.from(encoder.encode(part)));
    } else {
      chunks.push(...part);
    }
  });
  return new Uint8Array(chunks);
}

export const CetakStrukModal: React.FC<CetakStrukModalProps> = ({
  isOpen,
  onClose,
  transactions
}) => {
  const [selectedTrxId, setSelectedTrxId] = useState<string>(transactions[0]?.id || '');
  const [storeName, setStoreName] = useState('MAKMUR JAYA BRILINK');
  const [agentAddress, setAgentAddress] = useState('Rejosari Gondek');
  const [customPelanggan, setCustomPelanggan] = useState('');
  const [customJumlah, setCustomJumlah] = useState<number>(0);
  const [customBiayaStr, setCustomBiayaStr] = useState<string>('5.000');
  const [customNote, setCustomNote] = useState('Terima kasih telah bertransaksi di Makmur Jaya Brilink');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentTrx = transactions.find((t) => t.id === selectedTrxId) || transactions[0];
  const finalPelanggan = customPelanggan || currentTrx?.pelanggan || 'Pelanggan Tunai';
  const finalJumlah = customJumlah > 0 ? customJumlah : currentTrx?.jumlah || 100000;
  const finalBiaya = parseThousand(customBiayaStr);
  const totalBayar = finalJumlah + finalBiaya;
  const dateFormatted = currentTrx?.tanggal || new Date().toLocaleString('id-ID');

  const receiptText = `
================================
      ${storeName}
   ${agentAddress}
================================
ID TRX : ${currentTrx?.id || 'TRX-99001'}
TGL    : ${dateFormatted}
PLATFORM: ${currentTrx?.platform || 'BriLink'}
JENIS  : ${currentTrx?.jenis || 'Transfer'}
PLG    : ${finalPelanggan}
--------------------------------
Nominal     : Rp ${finalJumlah.toLocaleString('id-ID')}
Biaya Admin : Rp ${finalBiaya.toLocaleString('id-ID')}
--------------------------------
TOTAL BAYAR : Rp ${totalBayar.toLocaleString('id-ID')}
STATUS      : [ BERHASIL ]
================================
${customNote}
================================
`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(receiptText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

 const handlePrint = () => {
  const ESC = 0x1B;
  const GS = 0x1D;

  const bytes = buildEscPosBytes([
    [ESC, 0x40],                    // Initialize printer
    [ESC, 0x61, 0x01],              // Align center
    [ESC, 0x45, 0x01],              // Bold ON
    `${storeName}\n`,
    [ESC, 0x45, 0x00],              // Bold OFF
    `${agentAddress}\n`,
    '--------------------------------\n',
    [ESC, 0x61, 0x00],              // Align left
    `ID TRX : ${currentTrx?.id}\n`,
    `TGL    : ${dateFormatted}\n`,
    `PLATFORM: ${currentTrx?.platform}\n`,
    `JENIS  : ${currentTrx?.jenis}\n`,
    `PLG    : ${finalPelanggan}\n`,
    '--------------------------------\n',
    `Nominal      : Rp ${finalJumlah.toLocaleString('id-ID')}\n`,
    `Biaya Admin  : Rp ${finalBiaya.toLocaleString('id-ID')}\n`,
    '--------------------------------\n',
    [ESC, 0x45, 0x01],              // Bold ON
    `TOTAL BAYAR : Rp ${totalBayar.toLocaleString('id-ID')}\n`,
    `STATUS      : BERHASIL\n`,
    [ESC, 0x45, 0x00],              // Bold OFF
    '--------------------------------\n',
    [ESC, 0x61, 0x01],              // Align center
    `${customNote}\n`,
    '\n\n\n',
    [GS, 0x56, 0x00],                // Potong kertas (full cut)
  ]);

  const base64Data = bytesToBase64(bytes);
  window.location.href = `rawbt:base64,${base64Data}`;
};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#c6c6cd] w-full max-w-3xl overflow-hidden flex flex-col md:flex-row my-auto">
        {/* Left Side: Controls & Selector */}
        <div className="p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-[#c6c6cd]/50 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-black flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c49]">print</span>
              Cetak Struk Transaksi
            </h3>
            <button
              onClick={onClose}
              className="text-[#76777d] hover:text-black p-1 rounded-full hover:bg-gray-100"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-[#45464d] block mb-1">Pilih Transaksi</label>
              <select
                value={selectedTrxId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedTrxId(id);
                  setCustomJumlah(0);
                  setCustomPelanggan('');
                  const trx = transactions.find((t) => t.id === id);
                  if (trx) {
                    const fee = (trx.biayaAdminLuar && trx.biayaAdminLuar > 0) ? trx.biayaAdminLuar : (trx.biayaAdminDalam || trx.biayaAdmin || 0);
                    setCustomBiayaStr(formatThousand(fee));
                  }
                }}
                className="w-full rounded-lg border border-[#c6c6cd] p-2 bg-white text-sm"
              >
                {transactions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} - {t.pelanggan} (Rp {t.jumlah.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-[#45464d] block mb-1">Nama Toko Agen</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full rounded-lg border border-[#c6c6cd] p-2 bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-[#45464d] block mb-1">Alamat Agen</label>
              <input
                type="text"
                value={agentAddress}
                onChange={(e) => setAgentAddress(e.target.value)}
                className="w-full rounded-lg border border-[#c6c6cd] p-2 bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Biaya Admin (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={customBiayaStr}
                  onChange={(e) => setCustomBiayaStr(formatThousand(e.target.value))}
                  className="w-full rounded-lg border border-[#c6c6cd] p-2 bg-white font-mono-jetbrains"
                />
              </div>
              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Nama Pelanggan</label>
                <input
                  type="text"
                  placeholder={currentTrx?.pelanggan}
                  value={customPelanggan}
                  onChange={(e) => setCustomPelanggan(e.target.value)}
                  className="w-full rounded-lg border border-[#c6c6cd] p-2 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#45464d] block mb-1">Pesan Kaki Struk</label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full rounded-lg border border-[#c6c6cd] p-2 bg-white"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 bg-[#006c49] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#006c49]/90 transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Cetak Printer EDC
            </button>
            <button
              onClick={handleCopyText}
              className="px-3 bg-gray-100 text-[#0b1c30] border border-[#c6c6cd] rounded-lg font-semibold text-xs hover:bg-gray-200 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>

        {/* Right Side: Visual Thermal Receipt Preview */}
        <div className="p-6 md:w-1/2 bg-[#f8f9ff] flex flex-col justify-between items-center">
          <div className="w-full max-w-[280px] bg-white border border-gray-300 rounded-lg p-4 shadow-md font-mono-jetbrains text-xs text-black leading-tight">
            <div className="text-center font-bold text-sm">{storeName}</div>
            <div className="text-center text-[10px] text-gray-500 mb-2">{agentAddress}</div>
            <div className="border-b border-dashed border-gray-400 my-2"></div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID TRX:</span>
              <span className="font-semibold">{currentTrx?.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">TGL:</span>
              <span>{dateFormatted.slice(0, 10)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PLATFORM:</span>
              <span className="font-semibold">{currentTrx?.platform}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PLG:</span>
              <span className="truncate max-w-[120px]">{finalPelanggan}</span>
            </div>
            <div className="border-b border-dashed border-gray-400 my-2"></div>
            <div className="flex justify-between">
              <span>Nominal:</span>
              <span>Rp {finalJumlah.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between">
              <span>Admin:</span>
              <span>Rp {finalBiaya.toLocaleString('id-ID')}</span>
            </div>
            <div className="border-b border-dashed border-gray-400 my-2"></div>
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span className="text-[#006c49]">Rp {totalBayar.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between my-1">
              <span>STATUS:</span>
              <span className="bg-emerald-100 text-[#006c49] px-1 rounded font-bold text-[10px]">
                BERHASIL
              </span>
            </div>
            <div className="border-b border-dashed border-gray-400 my-2"></div>
            <div className="text-center text-[9px] text-gray-500 italic mt-2">
              {customNote}
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-[#76777d]">
            Format stiker thermal 58mm / 80mm disesuaikan otomatis untuk mesin EDC.
          </div>
        </div>
      </div>
    </div>
  );
};
