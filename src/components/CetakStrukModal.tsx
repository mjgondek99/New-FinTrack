import React, { useState, useEffect, useRef } from 'react';
import { TransactionItem } from '../types';
import { formatThousand, parseThousand } from '../utils/formatters';
import { printViaRawBT, printViaWebBluetooth, ReceiptData } from '../utils/thermalPrinter';

interface CetakStrukModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionItem[];
}

export const CetakStrukModal: React.FC<CetakStrukModalProps> = ({
  isOpen,
  onClose,
  transactions
}) => {
  const [selectedTrxId, setSelectedTrxId] = useState<string>(transactions[0]?.id || '');
  const [storeName, setStoreName] = useState('MAKMUR JAYA BRILINK');
  const [agentAddress, setAgentAddress] = useState('Rejosari Gondek');
  const [phone, setPhone] = useState('0812-3456-7890');
  const [customPelanggan, setCustomPelanggan] = useState('');
  const [customJumlah, setCustomJumlah] = useState<number>(0);
  const [customBiayaStr, setCustomBiayaStr] = useState<string>('5.000');
  const [customNote, setCustomNote] = useState('Terima kasih telah bertransaksi di Makmur Jaya Brilink');
  const [copied, setCopied] = useState(false);

  // Logo & Thermal Options
  const [showLogo, setShowLogo] = useState(true);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('58mm');
  const [isBluetoothPrinting, setIsBluetoothPrinting] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load saved settings & logo from localStorage
  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem('fin_track_receipt_logo');
      if (savedLogo) {
        setLogoBase64(savedLogo);
      }
      const savedStore = localStorage.getItem('fin_track_receipt_store');
      if (savedStore) setStoreName(savedStore);
      const savedAddress = localStorage.getItem('fin_track_receipt_address');
      if (savedAddress) setAgentAddress(savedAddress);
      const savedPhone = localStorage.getItem('fin_track_receipt_phone');
      if (savedPhone) setPhone(savedPhone);
    } catch {}
  }, []);

  // Save changes to localStorage
  const handleSaveSettings = () => {
    try {
      localStorage.setItem('fin_track_receipt_store', storeName);
      localStorage.setItem('fin_track_receipt_address', agentAddress);
      localStorage.setItem('fin_track_receipt_phone', phone);
      if (logoBase64) {
        localStorage.setItem('fin_track_receipt_logo', logoBase64);
      }
    } catch {}
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setLogoBase64(base64);
      try {
        localStorage.setItem('fin_track_receipt_logo', base64);
      } catch {}
      setShowLogo(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoBase64('');
    setShowLogo(false);
    try {
      localStorage.removeItem('fin_track_receipt_logo');
    } catch {}
  };

  if (!isOpen) return null;

  const currentTrx = transactions.find((t) => t.id === selectedTrxId) || transactions[0];
  const finalPelanggan = customPelanggan || currentTrx?.pelanggan || 'Pelanggan Tunai';
  const finalJumlah = customJumlah > 0 ? customJumlah : currentTrx?.jumlah || 100000;
  const finalBiaya = parseThousand(customBiayaStr);
  const totalBayar = finalJumlah + finalBiaya;
  const dateFormatted = currentTrx?.tanggal || new Date().toLocaleString('id-ID');

  const receiptData: ReceiptData = {
    storeName,
    agentAddress,
    phone,
    trxId: currentTrx?.id || 'TRX-001',
    dateStr: dateFormatted,
    platform: currentTrx?.platform || 'BriLink',
    jenis: currentTrx?.jenis || 'Transfer',
    pelanggan: finalPelanggan,
    nominal: finalJumlah,
    biayaAdmin: finalBiaya,
    totalBayar,
    status: currentTrx?.status || 'BERHASIL',
    note: customNote,
    logoBase64: logoBase64 || undefined,
    showLogo
  };

  const receiptText = `
================================
      ${storeName}
   ${agentAddress}
   Telp/WA: ${phone}
================================
ID TRX  : ${currentTrx?.id || 'TRX-99001'}
TGL     : ${dateFormatted}
PLATFORM: ${currentTrx?.platform || 'BriLink'}
JENIS   : ${currentTrx?.jenis || 'Transfer'}
PLG     : ${finalPelanggan}
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

  // Direct RawBT Intent Printing (Seamless 1-Click for all Bluetooth / USB printers via RawBT app)
  const handleRawBTPrint = async () => {
    handleSaveSettings();
    try {
      const res = await printViaRawBT(receiptData, paperWidth === '80mm');
      if (res.success) {
        setToastMessage({ text: 'Mengirim struk ke RawBT...', type: 'success' });
      } else {
        setToastMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setToastMessage({
        text: `Gagal mengirim ke RawBT: ${err.message || 'Pastikan aplikasi RawBT terinstall'}`,
        type: 'error'
      });
    } finally {
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Direct Web Bluetooth BLE Printing
  const handleBluetoothPrint = async () => {
    setIsBluetoothPrinting(true);
    setBluetoothStatus('Mempersiapkan printer Bluetooth...');
    handleSaveSettings();

    try {
      const res = await printViaWebBluetooth(
        receiptData,
        paperWidth === '80mm',
        (statusMsg) => setBluetoothStatus(statusMsg)
      );

      if (res.success) {
        setToastMessage({ text: res.message, type: 'success' });
      } else {
        setToastMessage({ text: res.message, type: 'error' });
      }
    } catch (err: any) {
      setToastMessage({
        text: `Gagal mencetak: ${err.message || 'Kesalahan koneksi Bluetooth'}`,
        type: 'error'
      });
    } finally {
      setIsBluetoothPrinting(false);
      setBluetoothStatus(null);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Standard Browser / System Printing fallback
  const handleStandardPrint = () => {
    handleSaveSettings();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const logoHtml = showLogo && logoBase64
        ? `<div class="center" style="margin-bottom: 8px;"><img src="${logoBase64}" style="max-height: 48px; max-width: 140px; object-fit: contain; filter: grayscale(100%) contrast(150%);" /></div>`
        : '';

      printWindow.document.write(`
        <html>
          <head>
            <title>Struk - ${currentTrx?.id}</title>
            <style>
              body { font-family: 'Courier New', Courier, monospace; width: ${paperWidth === '80mm' ? '360px' : '270px'}; padding: 10px; font-size: 12px; margin: 0 auto; color: #000; }
              .center { text-align: center; }
              .line { border-bottom: 1px dashed #000; margin: 6px 0; }
              .double-line { border-bottom: 2px solid #000; margin: 6px 0; }
              .row { display: flex; justify-content: space-between; margin: 3px 0; }
              .bold { font-weight: bold; }
              @media print {
                body { margin: 0; padding: 5px; }
              }
            </style>
          </head>
          <body>
            ${logoHtml}
            <div class="center bold" style="font-size: 14px; text-transform: uppercase;">${storeName}</div>
            <div class="center" style="font-size: 10px; margin-bottom: 3px;">${agentAddress}</div>
            <div class="center" style="font-size: 10px; margin-bottom: 6px;">Telp: ${phone}</div>
            <div class="double-line"></div>
            <div class="row"><span>ID TRX:</span> <span class="bold">${currentTrx?.id}</span></div>
            <div class="row"><span>TGL:</span> <span>${dateFormatted}</span></div>
            <div class="row"><span>PLATFORM:</span> <span>${currentTrx?.platform}</span></div>
            <div class="row"><span>JENIS:</span> <span>${currentTrx?.jenis}</span></div>
            <div class="row"><span>PELANGGAN:</span> <span>${finalPelanggan}</span></div>
            <div class="line"></div>
            <div class="row"><span>Nominal:</span> <span>Rp ${finalJumlah.toLocaleString('id-ID')}</span></div>
            <div class="row"><span>Biaya Admin:</span> <span>Rp ${finalBiaya.toLocaleString('id-ID')}</span></div>
            <div class="line"></div>
            <div class="row bold" style="font-size: 13px;"><span>TOTAL:</span> <span>Rp ${totalBayar.toLocaleString('id-ID')}</span></div>
            <div class="row bold"><span>STATUS:</span> <span>[ BERHASIL ]</span></div>
            <div class="double-line"></div>
            <div class="center" style="font-size: 10px; margin-top: 8px;">${customNote}</div>
            <div class="center" style="font-size: 9px; margin-top: 4px;">*** Terima Kasih ***</div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-60 px-4 py-3 rounded-xl shadow-2xl font-semibold text-xs sm:text-sm flex items-center gap-2 border animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-[#006c49] text-white border-emerald-400'
              : 'bg-red-700 text-white border-red-400'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl border border-[#c6c6cd] w-full max-w-4xl max-h-[92vh] overflow-y-auto flex flex-col md:flex-row my-auto">
        {/* Left Side: Controls & Form Configuration */}
        <div className="p-4 sm:p-6 md:w-1/2 border-b md:border-b-0 md:border-r border-[#c6c6cd]/50 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-[#006c49] rounded-lg">
                <span className="material-symbols-outlined text-[22px]">print</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-black">
                  Cetak Struk Transaksi
                </h3>
                <p className="text-[11px] text-gray-500">
                  Kompatibel 100% via RawBT & printer thermal Bluetooth
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#76777d] hover:text-black p-1.5 rounded-full hover:bg-gray-100"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Transaction Picker */}
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
                    const fee = (trx.biayaAdminLuar && trx.biayaAdminLuar > 0)
                      ? trx.biayaAdminLuar
                      : (trx.biayaAdminDalam || trx.biayaAdmin || 0);
                    setCustomBiayaStr(formatThousand(fee));
                  }
                }}
                className="w-full rounded-lg border border-[#c6c6cd] p-2 bg-white text-xs sm:text-sm font-medium"
              >
                {transactions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} - {t.pelanggan} ({t.platform} • Rp {t.jumlah.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            {/* Logo Settings */}
            <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#c6c6cd]/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0b1c30] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#006c49]">image</span>
                  Logo Struk Thermal
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={showLogo}
                    onChange={(e) => setShowLogo(e.target.checked)}
                    className="rounded text-[#006c49] focus:ring-[#006c49]"
                  />
                  Tampilkan Logo
                </label>
              </div>

              {showLogo && (
                <div className="flex items-center gap-3 pt-1">
                  {logoBase64 ? (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 border border-gray-300 rounded-lg p-1 bg-white flex items-center justify-center overflow-hidden">
                        <img
                          src={logoBase64}
                          alt="Logo Preview"
                          className="max-h-full max-w-full object-contain filter grayscale"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 text-[11px] bg-white border border-[#c6c6cd] rounded font-semibold text-[#0b1c30] hover:bg-gray-50"
                        >
                          Ganti Logo
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-2.5 py-1 text-[11px] bg-rose-50 text-rose-700 border border-rose-200 rounded font-semibold hover:bg-rose-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 border border-dashed border-[#006c49] rounded-lg text-[#006c49] font-bold text-xs bg-emerald-50/50 hover:bg-emerald-50 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
                      + Upload Logo Toko / Agen (PNG, JPG)
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Store & Agent Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                <label className="font-semibold text-[#45464d] block mb-1">No. Telp / WA</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-[#c6c6cd] p-2 bg-white"
                />
              </div>
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

            <div className="grid grid-cols-2 gap-2 items-center">
              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Ukuran Kertas</label>
                <div className="flex gap-2">
                  {(['58mm', '80mm'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPaperWidth(sz)}
                      className={`flex-1 py-1.5 rounded-lg font-bold text-xs border transition-colors ${
                        paperWidth === sz
                          ? 'bg-[#006c49] text-white border-[#006c49]'
                          : 'bg-white text-gray-700 border-[#c6c6cd] hover:bg-gray-50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Pesan Kaki Struk</label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full rounded-lg border border-[#c6c6cd] p-2 bg-white text-xs truncate"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2 border-t border-gray-100">
            {/* Direct RawBT Print Button (PRIMARY - Works with all Bluetooth / USB / WiFi Printers) */}
            <button
              onClick={handleRawBTPrint}
              className="w-full bg-[#006c49] hover:bg-[#006c49]/90 text-white py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md active:scale-98"
            >
              <span className="material-symbols-outlined text-[22px]">print</span>
              <span>Cetak Langsung via RawBT</span>
            </button>

            <div className="grid grid-cols-3 gap-2">
              {/* Direct Web Bluetooth BLE */}
              <button
                onClick={handleBluetoothPrint}
                disabled={isBluetoothPrinting}
                title="Cetak via Web Bluetooth BLE langsung dari browser"
                className="bg-[#f0fdf4] hover:bg-emerald-100 text-[#006c49] border border-emerald-300 py-2 px-1 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">bluetooth</span>
                <span className="truncate">BLE Web</span>
              </button>

              {/* Standard Print / PDF */}
              <button
                onClick={handleStandardPrint}
                title="Dialog cetak bawaan browser atau simpan sebagai PDF"
                className="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#0b1c30] border border-[#c6c6cd] py-2 px-1 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                <span className="truncate">PDF / Print</span>
              </button>

              {/* Copy Receipt Text */}
              <button
                onClick={handleCopyText}
                title="Salin rincian struk untuk dikirim via WhatsApp"
                className="bg-gray-100 hover:bg-gray-200 text-[#0b1c30] border border-[#c6c6cd] py-2 px-1 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">content_copy</span>
                <span className="truncate">{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>

            {bluetoothStatus && (
              <div className="p-2 bg-sky-50 border border-sky-200 rounded-lg text-sky-900 text-[11px] flex items-center gap-2 animate-pulse">
                <span className="material-symbols-outlined text-[16px] text-sky-600">info</span>
                <span>{bluetoothStatus}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Thermal Receipt Preview */}
        <div className="p-4 sm:p-6 md:w-1/2 bg-[#f4f5f8] flex flex-col justify-between items-center">
          <div className="w-full flex justify-center py-2">
            <div
              className={`bg-white border border-gray-400 rounded-lg p-4 sm:p-5 shadow-lg font-mono-jetbrains text-xs text-black leading-snug ${
                paperWidth === '80mm' ? 'w-full max-w-[340px]' : 'w-full max-w-[280px]'
              }`}
            >
              {/* Logo Preview */}
              {showLogo && logoBase64 && (
                <div className="text-center mb-2 flex justify-center">
                  <img
                    src={logoBase64}
                    alt="Receipt Logo"
                    className="max-h-12 max-w-[140px] object-contain filter grayscale contrast-150"
                  />
                </div>
              )}

              <div className="text-center font-bold text-sm tracking-tight">{storeName}</div>
              <div className="text-center text-[10px] text-gray-600 mt-0.5">{agentAddress}</div>
              <div className="text-center text-[10px] text-gray-600 mb-2">Telp: ${phone}</div>
              <div className="border-b border-dashed border-gray-500 my-2"></div>
              
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">ID TRX:</span>
                <span className="font-bold">{currentTrx?.id}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">TGL:</span>
                <span>{dateFormatted}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">PLATFORM:</span>
                <span className="font-semibold">{currentTrx?.platform}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">JENIS:</span>
                <span>{currentTrx?.jenis}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-600">PELANGGAN:</span>
                <span className="truncate max-w-[130px] font-medium">{finalPelanggan}</span>
              </div>

              <div className="border-b border-dashed border-gray-500 my-2"></div>

              <div className="flex justify-between">
                <span>Nominal:</span>
                <span className="font-semibold">Rp {finalJumlah.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Biaya Admin:</span>
                <span>Rp {finalBiaya.toLocaleString('id-ID')}</span>
              </div>

              <div className="border-b border-dashed border-gray-500 my-2"></div>

              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL:</span>
                <span className="text-[#006c49]">Rp {totalBayar.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between my-1">
                <span className="text-[11px]">STATUS:</span>
                <span className="bg-emerald-100 text-[#006c49] px-1.5 py-0.5 rounded font-bold text-[10px]">
                  [ BERHASIL ]
                </span>
              </div>

              <div className="border-b border-dashed border-gray-500 my-2"></div>

              <div className="text-center text-[9px] text-gray-600 italic mt-2">
                {customNote}
              </div>
              <div className="text-center text-[8px] text-gray-500 mt-1">
                *** Terima Kasih ***
              </div>
            </div>
          </div>

          <div className="text-center text-[11px] text-[#76777d] mt-2">
            Terintegrasi langsung dengan <strong>RawBT Print Service</strong> (ESC/POS 58mm & 80mm).
          </div>
        </div>
      </div>
    </div>
  );
};
