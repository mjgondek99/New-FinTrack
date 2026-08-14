import React, { useState, useEffect } from 'react';
import { NavTab } from '../types';

interface SettingsViewProps {
  activeTab: NavTab;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ activeTab }) => {
  const [storeName, setStoreName] = useState(() => {
    return localStorage.getItem('fintrack_store_name') || 'Makmur Jaya Brilink';
  });
  const [agentAddress, setAgentAddress] = useState(() => {
    return localStorage.getItem('fintrack_agent_address') || 'Rejosari Gondek';
  });
  const [phone, setPhone] = useState(() => {
    return localStorage.getItem('fintrack_phone') || '0812-9876-5432';
  });
  const [printerPaperSize, setPrinterPaperSize] = useState(() => {
    return localStorage.getItem('fintrack_printer_size') || '58mm';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem('fintrack_store_name', storeName);
    localStorage.setItem('fintrack_agent_address', agentAddress);
    localStorage.setItem('fintrack_phone', phone);
    localStorage.setItem('fintrack_printer_size', printerPaperSize);
  }, [storeName, agentAddress, phone, printerPaperSize]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      const keysToBackup = [
        'fintrack_transactions',
        'fintrack_kasbons',
        'fintrack_pengeluaran',
        'fintrack_mutasis',
        'fintrack_customers',
        'fintrack_users',
        'fintrack_platforms',
        'fintrack_jenis',
        'fintrack_saldo_awal',
        'fintrack_store_name',
        'fintrack_agent_address',
        'fintrack_phone',
        'fintrack_printer_size'
      ];

      keysToBackup.forEach((key) => {
        const val = localStorage.getItem(key);
        if (val !== null) {
          try {
            backupData[key] = JSON.parse(val);
          } catch {
            backupData[key] = val;
          }
        }
      });

      const today = new Date().toISOString().split('T')[0];
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-fintrack-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Gagal mendownload file cadangan: ' + e);
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (typeof data !== 'object' || data === null) {
          alert('Format file JSON tidak valid!');
          return;
        }

        // Restore to localStorage
        Object.keys(data).forEach((key) => {
          if (key.startsWith('fintrack_')) {
            const val = data[key];
            localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
          }
        });

        // Also sync data to backend server
        const keyMap: Record<string, string> = {
          fintrack_transactions: 'transactions',
          fintrack_kasbons: 'kasbons',
          fintrack_pengeluaran: 'pengeluaran',
          fintrack_mutasis: 'mutasis',
          fintrack_customers: 'customers',
          fintrack_users: 'users',
          fintrack_platforms: 'platforms',
          fintrack_jenis: 'jenis',
          fintrack_saldo_awal: 'saldoAwalMap',
        };

        for (const [storageKey, serverKey] of Object.entries(keyMap)) {
          if (data[storageKey] !== undefined) {
            try {
              await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: serverKey, value: data[storageKey] }),
              });
            } catch (err) {
              console.error(`Sync error for ${serverKey}:`, err);
            }
          }
        }

        alert('✅ Seluruh data transaksi & pengaturan berhasil dipulihkan!');
        window.location.reload();
      } catch (err) {
        alert('Gagal memulihkan file cadangan: ' + err);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh data lokal (transaksi, kasbon, pengeluaran, akun) dan mengembalikan ke awal? Action ini tidak bisa dibatalkan.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const profileImg = "https://lh3.googleusercontent.com/aida-public/AB6AXuDF9U4CSCjhOmmHyRpV9fMEoHdq7v_PLRO2pfrC-LsrdAZFiD2XaUCCsq5yxLY8CA6VOXTFHVukJKAvhFXaJ3M8UEOwB7it6tJ5ONKSQBMOFSeSs473lpc5bLS7oZZhkRcDEne5XMObGJpccu5jKdHLjkTj-5C9vWEBvC9pXU25wXemoNICJSumtgVh070E-VvEy80BJP5-pUt-mwFc8RLCE8eviNEirOnAanA_RrWm9_U37Gz7Jfkw";

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-black">
          {activeTab === 'akun' ? 'Profil & Akun Agen' : 'Pengaturan Aplikasi'}
        </h2>
        <p className="text-sm text-[#45464d] mt-1">
          Kelola data identitas usaha, alamat cetak struk, dan opsi printer thermal EDC. Data otomatis tersimpan secara permanen di browser ini.
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-[#006c49] text-white px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2">
          <span className="material-symbols-outlined">check_circle</span>
          Pengaturan berhasil diperbarui!
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#c6c6cd] shadow-xs p-6 max-w-2xl space-y-6">
        <form onSubmit={handleSave} className="space-y-4 text-sm">
          {activeTab === 'akun' && (
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <img
                src={profileImg}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#006c49]"
              />
              <div>
                <h3 className="font-bold text-base text-black">{storeName}</h3>
                <p className="text-xs text-[#45464d]">ID Agen: AGT-99201 | Verified</p>
                <button
                  type="button"
                  className="mt-1 text-xs text-[#006c49] font-semibold hover:underline"
                >
                  Ganti Foto Profil
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="font-semibold text-[#45464d] block mb-1">Nama Toko / Usaha Agen</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-2.5 border border-[#c6c6cd] rounded-lg text-sm text-black"
            />
          </div>

          <div>
            <label className="font-semibold text-[#45464d] block mb-1">Nomor WhatsApp Kasir</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2.5 border border-[#c6c6cd] rounded-lg text-sm text-black"
            />
          </div>

          <div>
            <label className="font-semibold text-[#45464d] block mb-1">Alamat Lengkap Toko</label>
            <textarea
              rows={3}
              value={agentAddress}
              onChange={(e) => setAgentAddress(e.target.value)}
              className="w-full p-2.5 border border-[#c6c6cd] rounded-lg text-sm text-black"
            />
          </div>

          <div>
            <label className="font-semibold text-[#45464d] block mb-1">Ukuran Kertas Printer EDC</label>
            <select
              value={printerPaperSize}
              onChange={(e) => setPrinterPaperSize(e.target.value)}
              className="w-full p-2.5 border border-[#c6c6cd] rounded-lg text-sm text-black"
            >
              <option value="58mm">Thermal 58mm (Kecil)</option>
              <option value="80mm">Thermal 80mm (Standar POS)</option>
              <option value="A4">Printer Inkjet A4 / Kuarto</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="bg-[#006c49] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#006c49]/90 transition-colors shadow-xs"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>

        {/* Backup and Restore Data Section */}
        <div className="pt-6 border-t border-gray-100 space-y-4">
          <div>
            <h4 className="font-bold text-sm text-black flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#006c49] text-[20px]">cloud_sync</span>
              Cadangkan & Pulihkan Data (Backup & Restore)
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Gunakan fitur ini untuk memindahkan seluruh data transaksi, kasbon, saldo, dan pelanggan ke link/domain hasil deploy, atau menyimpan file cadangan di laptop/HP Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download Backup */}
            <div className="p-3.5 bg-[#eff4ff] border border-[#c6c6cd] rounded-xl flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#006c49] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  1. Unduh File Cadangan (JSON)
                </span>
                <p className="text-[11px] text-gray-600 mt-1">
                  Simpan semua catatan transaksi & keuangan saat ini ke 1 file (.json) aman di komputer/HP Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full bg-[#006c49] text-white py-2 px-3 rounded-lg text-xs font-bold hover:bg-[#006c49]/90 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">save_alt</span>
                Unduh Cadangan Data
              </button>
            </div>

            {/* Restore / Import Backup */}
            <div className="p-3.5 bg-emerald-50/60 border border-[#006c49]/30 rounded-xl flex flex-col justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#006c49] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  2. Pulihkan / Impor Data
                </span>
                <p className="text-[11px] text-gray-600 mt-1">
                  Upload file cadangan (.json) untuk memulihkan seluruh transaksi di aplikasi hasil deploy ini.
                </p>
              </div>
              <label className="w-full bg-white border-2 border-dashed border-[#006c49] text-[#006c49] py-2 px-3 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center">
                <span className="material-symbols-outlined text-[16px]">file_open</span>
                Pilih File Cadangan (.json)
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100 space-y-2">
          <h4 className="font-bold text-sm text-red-600">Zona Bahaya</h4>
          <p className="text-xs text-gray-500">
            Jika ingin mengosongkan seluruh data transaksi, akun, dan riwayat yang tersimpan di browser ini, klik tombol di bawah.
          </p>
          <button
            type="button"
            onClick={handleResetData}
            className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
          >
            Reset Seluruh Data Lokal
          </button>
        </div>
      </div>
    </div>
  );
};

