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
      </div>
    </div>
  );
};

