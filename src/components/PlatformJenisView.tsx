import React, { useState } from 'react';
import { TransactionItem } from '../types';

interface PlatformJenisViewProps {
  platforms: string[];
  setPlatforms: React.Dispatch<React.SetStateAction<string[]>>;
  jenisList: string[];
  setJenisList: React.Dispatch<React.SetStateAction<string[]>>;
  transactions: TransactionItem[];
}

export const PlatformJenisView: React.FC<PlatformJenisViewProps> = ({
  platforms,
  setPlatforms,
  jenisList,
  setJenisList,
  transactions
}) => {
  // New Item Input State
  const [newPlatformInput, setNewPlatformInput] = useState('');
  const [newJenisInput, setNewJenisInput] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    type: 'platform' | 'jenis';
    name: string;
    count: number;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Count usage in transaction history
  const getPlatformCount = (pName: string) => {
    return transactions.filter((t) => t.platform.toLowerCase() === pName.toLowerCase()).length;
  };

  const getJenisCount = (jName: string) => {
    return transactions.filter((t) => t.jenis.toLowerCase() === jName.toLowerCase()).length;
  };

  // Add Platform
  const handleAddPlatform = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlatformInput.trim();
    if (!trimmed) return;

    if (platforms.some((p) => p.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Platform "${trimmed}" sudah ada dalam daftar.`);
      return;
    }

    setPlatforms([...platforms, trimmed]);
    setNewPlatformInput('');
    showToast(`✅ Platform "${trimmed}" berhasil ditambahkan!`);
  };

  // Add Jenis Transaksi
  const handleAddJenis = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newJenisInput.trim();
    if (!trimmed) return;

    if (jenisList.some((j) => j.toLowerCase() === trimmed.toLowerCase())) {
      alert(`Jenis transaksi "${trimmed}" sudah ada dalam daftar.`);
      return;
    }

    setJenisList([...jenisList, trimmed]);
    setNewJenisInput('');
    showToast(`✅ Jenis transaksi "${trimmed}" berhasil ditambahkan!`);
  };

  // Request Delete Confirmation
  const requestDeletePlatform = (pName: string) => {
    if (platforms.length <= 1) {
      alert('Tidak dapat menghapus platform. Minimal harus ada 1 platform aktif.');
      return;
    }
    const count = getPlatformCount(pName);
    setDeleteConfirmItem({ type: 'platform', name: pName, count });
  };

  const requestDeleteJenis = (jName: string) => {
    if (jenisList.length <= 1) {
      alert('Tidak dapat menghapus jenis transaksi. Minimal harus ada 1 jenis transaksi aktif.');
      return;
    }
    const count = getJenisCount(jName);
    setDeleteConfirmItem({ type: 'jenis', name: jName, count });
  };

  // Execute Delete
  const confirmDelete = () => {
    if (!deleteConfirmItem) return;

    const { type, name } = deleteConfirmItem;
    if (type === 'platform') {
      setPlatforms(platforms.filter((p) => p !== name));
      showToast(`🗑️ Platform "${name}" berhasil dihapus.`);
    } else {
      setJenisList(jenisList.filter((j) => j !== name));
      showToast(`🗑️ Jenis transaksi "${name}" berhasil dihapus.`);
    }

    setDeleteConfirmItem(null);
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-6 pb-8">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131b2e] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#6cf8bb]/40 flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-[#6cf8bb]">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-black">Kelola Platform & Jenis Transaksi</h2>
          <p className="text-sm text-[#45464d] mt-1">
            Tambah atau hapus pilihan platform e-wallet / bank dan jenis transaksi layanan agen Anda.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#45464d] uppercase tracking-wider block">
              Total Platform Aktif
            </span>
            <span className="text-2xl font-bold font-mono-jetbrains text-[#006c49] mt-1 block">
              {platforms.length} Platform
            </span>
          </div>
          <div className="p-3 bg-[#006c49]/10 text-[#006c49] rounded-xl">
            <span className="material-symbols-outlined text-[28px]">devices</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#45464d] uppercase tracking-wider block">
              Total Jenis Transaksi
            </span>
            <span className="text-2xl font-bold font-mono-jetbrains text-[#006c49] mt-1 block">
              {jenisList.length} Jenis
            </span>
          </div>
          <div className="p-3 bg-[#006c49]/10 text-[#006c49] rounded-xl">
            <span className="material-symbols-outlined text-[28px]">category</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#45464d] uppercase tracking-wider block">
              Total Riwayat Transaksi
            </span>
            <span className="text-2xl font-bold font-mono-jetbrains text-black mt-1 block">
              {transactions.length} Data
            </span>
          </div>
          <div className="p-3 bg-[#d3e4fe] text-[#0b1c30] rounded-xl">
            <span className="material-symbols-outlined text-[28px]">receipt_long</span>
          </div>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Kelola Platform */}
        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#006c49]/10 text-[#006c49] rounded-xl">
                <span className="material-symbols-outlined text-[22px]">devices</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Platform Transaksi</h3>
                <p className="text-xs text-[#45464d]">Contoh: BriLink, Dana, QRIS, Shopee, BCA</p>
              </div>
            </div>
            <span className="bg-[#eff4ff] text-[#006c49] text-xs font-bold px-3 py-1 rounded-full border border-[#d3e4fe]">
              {platforms.length} Item
            </span>
          </div>

          {/* Form Tambah Platform */}
          <form onSubmit={handleAddPlatform} className="space-y-2">
            <label className="text-xs font-bold text-black block">Tambah Platform Baru</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama Platform (Misal: GoPay, OVO, Bank BCA)..."
                value={newPlatformInput}
                onChange={(e) => setNewPlatformInput(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-[#c6c6cd] text-sm focus:border-[#006c49] focus:outline-none bg-white"
              />
              <button
                type="submit"
                className="bg-[#006c49] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#006c49]/90 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Tambah
              </button>
            </div>
          </form>

          {/* List Platform Aktif */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Daftar Platform Aktif
            </span>
            <div className="divide-y divide-gray-100 border border-[#c6c6cd]/60 rounded-xl overflow-hidden bg-[#f8f9ff]">
              {platforms.map((p) => {
                const count = getPlatformCount(p);
                return (
                  <div
                    key={p}
                    className="p-3.5 flex items-center justify-between hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#d3e4fe]/80 text-[#0b1c30] flex items-center justify-center font-bold text-xs font-mono-jetbrains">
                        {p.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-black">{p}</p>
                        <p className="text-[11px] text-[#45464d]">
                          {count > 0 ? `Digunakan di ${count} transaksi` : 'Belum ada transaksi'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => requestDeletePlatform(p)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                      title={`Hapus platform ${p}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span className="hidden sm:inline">Hapus</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Kelola Jenis Transaksi */}
        <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#006c49]/10 text-[#006c49] rounded-xl">
                <span className="material-symbols-outlined text-[22px]">category</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Jenis Transaksi</h3>
                <p className="text-xs text-[#45464d]">Contoh: Transfer, Tarik Tunai, Top Up, Pembayaran</p>
              </div>
            </div>
            <span className="bg-[#eff4ff] text-[#006c49] text-xs font-bold px-3 py-1 rounded-full border border-[#d3e4fe]">
              {jenisList.length} Item
            </span>
          </div>

          {/* Form Tambah Jenis Transaksi */}
          <form onSubmit={handleAddJenis} className="space-y-2">
            <label className="text-xs font-bold text-black block">Tambah Jenis Transaksi Baru</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama Jenis (Misal: Setor Tunai, Cek Saldo, Token PLN)..."
                value={newJenisInput}
                onChange={(e) => setNewJenisInput(e.target.value)}
                className="flex-1 p-2.5 rounded-xl border border-[#c6c6cd] text-sm focus:border-[#006c49] focus:outline-none bg-white"
              />
              <button
                type="submit"
                className="bg-[#006c49] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#006c49]/90 transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Tambah
              </button>
            </div>
          </form>

          {/* List Jenis Transaksi Aktif */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Daftar Jenis Transaksi Aktif
            </span>
            <div className="divide-y divide-gray-100 border border-[#c6c6cd]/60 rounded-xl overflow-hidden bg-[#f8f9ff]">
              {jenisList.map((j) => {
                const count = getJenisCount(j);
                return (
                  <div
                    key={j}
                    className="p-3.5 flex items-center justify-between hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#006c49]/10 text-[#006c49] flex items-center justify-center font-bold text-xs font-mono-jetbrains">
                        {j.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-black">{j}</p>
                        <p className="text-[11px] text-[#45464d]">
                          {count > 0 ? `Digunakan di ${count} transaksi` : 'Belum ada transaksi'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => requestDeleteJenis(j)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                      title={`Hapus jenis transaksi ${j}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                      <span className="hidden sm:inline">Hapus</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Konfirmasi Hapus</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                  {deleteConfirmItem.type === 'platform' ? 'Platform Transaksi' : 'Jenis Transaksi'}
                </p>
              </div>
            </div>

            <p className="text-sm text-[#45464d] leading-relaxed">
              Apakah Anda yakin ingin menghapus{' '}
              <strong className="text-black">"{deleteConfirmItem.name}"</strong> dari opsi pilihan aktif?
            </p>

            {deleteConfirmItem.count > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Catatan Riwayat Transaksi:
                </p>
                <p>
                  Item ini tercatat dalam <strong>{deleteConfirmItem.count} transaksi terdahulu</strong>.
                  Menghapusnya dari daftar pilihan tidak akan merusak riwayat transaksi terdahulu.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
