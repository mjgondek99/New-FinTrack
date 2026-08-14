import React, { useState } from 'react';
import { TransactionItem, UserAccount } from '../types';
import { formatThousand, parseThousand, getTransactionRevenueAndProfit, calculateRevenueAndProfit } from '../utils/formatters';
import { sortByDateDesc } from '../utils/dateSorter';
import { isDanaPlatform, calculateDanaMonthlyQuota, DANA_MONTHLY_LIMIT } from '../utils/danaLimit';

interface TransaksiViewProps {
  transactions: TransactionItem[];
  setTransactions: React.Dispatch<React.SetStateAction<TransactionItem[]>>;
  onOpenCetakStruk: () => void;
  platforms?: string[];
  jenisList?: string[];
  currentUser?: UserAccount;
}

export const TransaksiView: React.FC<TransaksiViewProps> = ({
  transactions,
  setTransactions,
  onOpenCetakStruk,
  platforms = ['BriLink', 'Dana', 'Mitra Shopee', 'QRIS', 'Transfer Bank'],
  jenisList = ['Transfer', 'Tarik Tunai', 'Top Up', 'Pembayaran'],
  currentUser
}) => {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('Semua');
  const [showAddModal, setShowAddModal] = useState(false);

  // Get current local date and time defaults
  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0];
  const defaultTime = now.toTimeString().slice(0, 5);

  // New Transaction Form state
  const [newDate, setNewDate] = useState(defaultDate);
  const [newTime, setNewTime] = useState(defaultTime);
  const [newPlatform, setNewPlatform] = useState<string>(platforms[0] || 'BriLink');
  const [newJenis, setNewJenis] = useState<string>(jenisList[0] || 'Transfer');
  const [newJumlahStr, setNewJumlahStr] = useState('100.000');
  const [newBiayaAdminLuarStr, setNewBiayaAdminLuarStr] = useState('5.000');
  const [newBiayaAdminDalamStr, setNewBiayaAdminDalamStr] = useState('2.000');
  const [newPelanggan, setNewPelanggan] = useState('');

  // Edit State
  const [editingTrx, setEditingTrx] = useState<TransactionItem | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPlatform, setEditPlatform] = useState('');
  const [editJenis, setEditJenis] = useState('');
  const [editJumlahStr, setEditJumlahStr] = useState('');
  const [editBiayaAdminLuarStr, setEditBiayaAdminLuarStr] = useState('');
  const [editBiayaAdminDalamStr, setEditBiayaAdminDalamStr] = useState('');
  const [editPelanggan, setEditPelanggan] = useState('');
  const [editStatus, setEditStatus] = useState<'Berhasil' | 'Pending' | 'Gagal'>('Berhasil');

  // Delete Confirmation State
  const [deletingTrx, setDeletingTrx] = useState<TransactionItem | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleOpenEdit = (t: TransactionItem) => {
    setEditingTrx(t);
    const parts = t.tanggal.split(' ');
    setEditDate(parts[0] || defaultDate);
    setEditTime(parts[1] || defaultTime);
    setEditPlatform(t.platform);
    setEditJenis(t.jenis);
    setEditPelanggan(t.pelanggan);
    setEditJumlahStr(formatThousand(t.jumlah));
    const adminLuar = t.biayaAdminLuar ?? t.biayaAdmin;
    const adminDalam = t.biayaAdminDalam ?? 0;
    setEditBiayaAdminLuarStr(formatThousand(adminLuar));
    setEditBiayaAdminDalamStr(formatThousand(adminDalam));
    setEditStatus((t.status as any) || 'Berhasil');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrx || !editPelanggan.trim()) return;

    const formattedDateTime = `${editDate} ${editTime}`;
    const numericJumlah = parseThousand(editJumlahStr);
    const numericAdminLuar = parseThousand(editBiayaAdminLuarStr);
    const numericAdminDalam = parseThousand(editBiayaAdminDalamStr);
    // Aturan Penagihan: Jika ada admin luar -> Nominal + Admin Luar, jika tidak ada -> Nominal + Admin Dalam
    const totalTagihan = numericAdminLuar > 0 ? (numericJumlah + numericAdminLuar) : (numericJumlah + numericAdminDalam);

    const updatedList = transactions.map((t) => {
      if (t.id === editingTrx.id) {
        return {
          ...t,
          tanggal: formattedDateTime,
          platform: editPlatform,
          jenis: editJenis,
          pelanggan: editPelanggan,
          jumlah: numericJumlah,
          biayaAdminLuar: numericAdminLuar,
          biayaAdminDalam: numericAdminDalam,
          biayaAdmin: numericAdminLuar,
          totalPenagihan: totalTagihan,
          status: editStatus
        };
      }
      return t;
    });

    setTransactions(updatedList);
    setEditingTrx(null);
    showToast(`✅ Transaksi ${editingTrx.id} berhasil diperbarui!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingTrx) return;
    setTransactions(transactions.filter((t) => t.id !== deletingTrx.id));
    showToast(`🗑️ Transaksi ${deletingTrx.id} berhasil dihapus.`);
    setDeletingTrx(null);
  };

  const filtered = sortByDateDesc(
    transactions.filter((t) => {
      const matchesSearch =
        t.pelanggan.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase());
      const matchesPlatform = platformFilter === 'Semua' || t.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    })
  );

  // Summary calculation for filtered view
  const summaryTotalCount = filtered.length;
  const summaryTotalNominal = filtered.reduce((acc, t) => acc + t.jumlah, 0);
  const summaryTotalPendapatanKotor = filtered.reduce((acc, t) => acc + getTransactionRevenueAndProfit(t).pendapatanKotor, 0);
  const summaryTotalEstimasiProfit = filtered.reduce((acc, t) => acc + getTransactionRevenueAndProfit(t).estimasiProfit, 0);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPelanggan.trim()) return;

    const formattedDateTime = `${newDate} ${newTime}`;
    const numericJumlah = parseThousand(newJumlahStr);
    const numericAdminLuar = parseThousand(newBiayaAdminLuarStr);
    const numericAdminDalam = parseThousand(newBiayaAdminDalamStr);
    // Aturan Penagihan: Jika ada admin luar -> Nominal + Admin Luar, jika tidak ada -> Nominal + Admin Dalam
    const totalTagihan = numericAdminLuar > 0 ? (numericJumlah + numericAdminLuar) : (numericJumlah + numericAdminDalam);

    const newTrx: TransactionItem = {
      id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      tanggal: formattedDateTime,
      platform: newPlatform,
      jenis: newJenis,
      jumlah: numericJumlah,
      biayaAdminLuar: numericAdminLuar,
      biayaAdminDalam: numericAdminDalam,
      biayaAdmin: numericAdminLuar,
      totalPenagihan: totalTagihan,
      status: 'Berhasil',
      pelanggan: newPelanggan,
      operator: currentUser?.nama || 'Admin Utama'
    };

    setTransactions([newTrx, ...transactions]);
    setShowAddModal(false);
    setNewPelanggan('');
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 bg-[#131b2e] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#6cf8bb]/40 flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-[#6cf8bb]">check_circle</span>
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Bar - Stacked Vertically on Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 w-full">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Daftar Transaksi Agent</h2>
          <p className="text-xs sm:text-sm text-[#45464d] mt-0.5">
            Kelola data transaksi perbankan & e-wallet Agen Makmur Jaya Brilink.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              const freshNow = new Date();
              setNewDate(freshNow.toISOString().split('T')[0]);
              setNewTime(freshNow.toTimeString().slice(0, 5));
              setShowAddModal(true);
            }}
            className="w-full sm:w-auto justify-center bg-[#006c49] text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#006c49]/90 transition-colors flex items-center gap-2 shadow-xs active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            + Transaksi Baru
          </button>
          <button
            onClick={onOpenCetakStruk}
            className="w-full sm:w-auto justify-center bg-[#d3e4fe] text-[#0b1c30] border border-[#c6c6cd] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#dce9ff] transition-colors flex items-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">print</span>
            Cetak Struk
          </button>
        </div>
      </div>

      {/* Summary Cards - Grid 1 Col on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        <div className="bg-white p-4 rounded-xl border border-[#c6c6cd] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#45464d]">Total Transaksi</span>
            <span className="material-symbols-outlined text-gray-400">receipt_long</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-black font-mono-jetbrains">{summaryTotalCount}</span>
            <span className="text-xs text-gray-500">transaksi</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#c6c6cd] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#45464d]">Total Nominal</span>
            <span className="material-symbols-outlined text-blue-500">payments</span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-black font-mono-jetbrains">
              Rp {summaryTotalNominal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#c6c6cd] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#45464d]">Pendapatan Kotor</span>
            <span className="material-symbols-outlined text-emerald-600">account_balance_wallet</span>
          </div>
          <div className="mt-2">
            <span className="text-xl font-bold text-black font-mono-jetbrains">
              Rp {summaryTotalPendapatanKotor.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-gray-500 block">Admin Luar - Admin Dalam</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#006c49]/10 to-emerald-50 p-4 rounded-xl border border-[#006c49]/30 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#006c49]">Estimasi Profit</span>
            <span className="material-symbols-outlined text-[#006c49]">trending_up</span>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#006c49] font-mono-jetbrains">
              Rp {summaryTotalEstimasiProfit.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-[#006c49]/80 block font-medium">Margin Bersih Transaksi</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar - Stacked & Wrapped on Mobile */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#c6c6cd] shadow-xs flex flex-col md:flex-row gap-3 md:gap-4 justify-between items-stretch md:items-center w-full">
        <div className="w-full md:w-72 relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#76777d]">search</span>
          <input
            type="text"
            placeholder="Cari ID / Nama pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#c6c6cd] text-sm focus:border-[#006c49] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center w-full md:w-auto">
          <span className="text-xs font-semibold text-[#45464d] w-full sm:w-auto mb-1 sm:mb-0">Platform:</span>
          {['Semua', ...platforms].map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                platformFilter === p
                  ? 'bg-[#006c49] text-white'
                  : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#d3e4fe]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Riwayat / Table Section (Only Table scrolls horizontally on Mobile) */}
      <div className="bg-white rounded-xl border border-[#c6c6cd] shadow-xs overflow-hidden w-full">
        <div className="p-3.5 sm:p-4 border-b border-[#c6c6cd] bg-[#eff4ff]/60 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-black text-sm sm:text-base">Riwayat Transaksi</h3>
            <p className="text-[11px] text-gray-500">Geser tabel ke samping untuk melihat rincian lengkap</p>
          </div>
          <span className="text-xs font-semibold text-[#006c49] bg-emerald-50 border border-[#006c49]/30 px-2.5 py-1 rounded-full font-mono-jetbrains">
            {summaryTotalCount} Transaksi
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm min-w-[720px]">
            <thead>
              <tr className="bg-[#eff4ff] text-[#45464d] font-semibold border-b border-[#c6c6cd]">
                <th className="p-4">ID TRX</th>
                <th className="p-4">Tanggal & Waktu</th>
                <th className="p-4">Platform & Jenis</th>
                <th className="p-4">Nama Pelanggan</th>
                <th className="p-4">Operator</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-right">Admin Luar / Dalam</th>
                <th className="p-4 text-right">Total Penagihan</th>
                <th className="p-4 text-right bg-emerald-50/70 text-[#006c49]">Estimasi Profit</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-gray-500">
                    Tidak ada transaksi yang sesuai filter search.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const { adminLuar, adminDalam, pendapatanKotor, estimasiProfit } = getTransactionRevenueAndProfit(t);
                  const totalTagih = t.totalPenagihan ?? (adminLuar > 0 ? (t.jumlah + adminLuar) : (t.jumlah + adminDalam));
                  const operatorName = t.operator || 'Admin Utama';

                  return (
                    <tr key={t.id} className="hover:bg-[#f8f9ff]">
                      <td className="p-4 font-mono-jetbrains font-bold text-black">{t.id}</td>
                      <td className="p-4 text-xs text-[#45464d] whitespace-nowrap">{t.tanggal}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="bg-[#d3e4fe]/80 text-[#0b1c30] px-2 py-0.5 rounded text-xs font-semibold w-fit">
                            {t.platform}
                          </span>
                          <span className="text-[11px] text-[#45464d] font-medium">{t.jenis}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-black">{t.pelanggan}</td>
                      <td className="p-4 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-[#45464d] rounded-md font-medium border border-gray-200">
                          <span className="material-symbols-outlined text-[14px]">account_circle</span>
                          {operatorName}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono-jetbrains font-bold text-black">
                        Rp {t.jumlah.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-right font-mono-jetbrains text-xs">
                        <div className="text-[#006c49] font-medium">Luar: Rp {adminLuar.toLocaleString('id-ID')}</div>
                        <div className="text-gray-500 text-[11px]">Dalam: Rp {adminDalam.toLocaleString('id-ID')}</div>
                      </td>
                      <td className="p-4 text-right font-mono-jetbrains font-bold text-black">
                        Rp {totalTagih.toLocaleString('id-ID')}
                      </td>
                      <td className="p-4 text-right font-mono-jetbrains font-bold bg-emerald-50/40">
                        <span className={estimasiProfit > 0 ? 'text-[#006c49]' : 'text-gray-500'}>
                          Rp {estimasiProfit.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[10px] text-gray-500 font-normal block">
                          Kotor: Rp {pendapatanKotor.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            t.status === 'Berhasil'
                              ? 'bg-emerald-100 text-[#00714d]'
                              : t.status === 'Pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(t)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit / Ubah Transaksi"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          {currentUser?.role !== 'kasir' && (
                            <button
                              type="button"
                              onClick={() => setDeletingTrx(t)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Transaksi"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-[#c6c6cd] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-black">Catat Transaksi Baru</h3>
                <p className="text-xs text-[#45464d]">Input detail tanggal, nominal, biaya admin, & penagihan</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-3 text-xs">
              {/* Tanggal & Jam Input (Dapat diubah) */}
              <div className="bg-[#f8f9ff] p-3 rounded-xl border border-[#c6c6cd]/60 space-y-2">
                <span className="font-bold text-black block text-xs">📅 Tanggal & Waktu Transaksi</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block text-gray-600 mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-gray-600 mb-1">Jam / Waktu</label>
                    <input
                      type="time"
                      required
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Nama Pelanggan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rina Amalia"
                  value={newPelanggan}
                  onChange={(e) => setNewPelanggan(e.target.value)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-black">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-black">Jenis Transaksi</label>
                  <select
                    value={newJenis}
                    onChange={(e) => setNewJenis(e.target.value)}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                  >
                    {jenisList.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Nominal Transaksi (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={newJumlahStr}
                  onChange={(e) => setNewJumlahStr(formatThousand(e.target.value))}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains font-bold bg-white"
                />
              </div>

              {/* Biaya Admin Luar & Dalam */}
              <div className="grid grid-cols-2 gap-2 bg-[#eff4ff]/60 p-3 rounded-xl border border-[#d3e4fe]">
                <div>
                  <label className="font-semibold block text-[#006c49] mb-1">
                    Biaya Admin Luar (Rp)
                  </label>
                  <span className="text-[10px] text-gray-500 block mb-1">Ditagih ke Pelanggan</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={newBiayaAdminLuarStr}
                    onChange={(e) => setNewBiayaAdminLuarStr(formatThousand(e.target.value))}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block text-gray-700 mb-1">
                    Biaya Admin Dalam (Rp)
                  </label>
                  <span className="text-[10px] text-gray-500 block mb-1">Potongan Internal/Bank</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={newBiayaAdminDalamStr}
                    onChange={(e) => setNewBiayaAdminDalamStr(formatThousand(e.target.value))}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains bg-white"
                  />
                </div>
              </div>

              {/* Total Penagihan & Profit Highlight Card */}
              {(() => {
                const addJml = parseThousand(newJumlahStr);
                const addLuar = parseThousand(newBiayaAdminLuarStr);
                const addDalam = parseThousand(newBiayaAdminDalamStr);
                const addTagihan = addLuar > 0 ? (addJml + addLuar) : (addJml + addDalam);
                const { pendapatanKotor, estimasiProfit } = calculateRevenueAndProfit(addLuar, addDalam);

                return (
                  <div className="p-3.5 bg-[#006c49]/10 rounded-xl border border-[#006c49]/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-black block">Total Penagihan (Cash Masuk)</span>
                        <span className="text-[11px] text-[#45464d]">
                          {addLuar > 0 ? 'Nominal + Admin Luar' : 'Nominal + Admin Dalam (Tanpa Admin Luar)'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono-jetbrains text-[#006c49]">
                          Rp {addTagihan.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#006c49]/20 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 p-2 rounded-lg border border-[#006c49]/20">
                        <span className="text-[11px] text-gray-600 block">Pendapatan Kotor</span>
                        <span className="font-bold font-mono-jetbrains text-black">
                          Rp {pendapatanKotor.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-[#006c49]/20">
                        <span className="text-[11px] text-[#006c49] font-bold block">Estimasi Profit</span>
                        <span className="font-bold font-mono-jetbrains text-[#006c49]">
                          Rp {estimasiProfit.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-lg text-sm font-semibold hover:bg-[#006c49]/90 shadow-xs"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-[#c6c6cd] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-black">Edit Data Transaksi</h3>
                <p className="text-xs text-[#45464d]">Ubah rincian transaksi ID: <span className="font-mono-jetbrains font-bold text-black">{editingTrx.id}</span></p>
              </div>
              <button onClick={() => setEditingTrx(null)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              {/* Tanggal & Jam Input */}
              <div className="bg-[#f8f9ff] p-3 rounded-xl border border-[#c6c6cd]/60 space-y-2">
                <span className="font-bold text-black block text-xs">📅 Tanggal & Waktu Transaksi</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block text-gray-600 mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-gray-600 mb-1">Jam / Waktu</label>
                    <input
                      type="time"
                      required
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Nama Pelanggan / Pengirim</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Pelanggan..."
                  value={editPelanggan}
                  onChange={(e) => setEditPelanggan(e.target.value)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-black">Platform</label>
                  <select
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold block mb-1 text-black">Jenis Transaksi</label>
                  <select
                    value={editJenis}
                    onChange={(e) => setEditJenis(e.target.value)}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                  >
                    {jenisList.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Nominal Transaksi (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={editJumlahStr}
                  onChange={(e) => setEditJumlahStr(formatThousand(e.target.value))}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains font-bold bg-white"
                />
              </div>

              {/* Biaya Admin Luar & Dalam */}
              <div className="grid grid-cols-2 gap-2 bg-[#eff4ff]/60 p-3 rounded-xl border border-[#d3e4fe]">
                <div>
                  <label className="font-semibold block text-[#006c49] mb-1">
                    Biaya Admin Luar (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editBiayaAdminLuarStr}
                    onChange={(e) => setEditBiayaAdminLuarStr(formatThousand(e.target.value))}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold block text-gray-700 mb-1">
                    Biaya Admin Dalam (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editBiayaAdminDalamStr}
                    onChange={(e) => setEditBiayaAdminDalamStr(formatThousand(e.target.value))}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Status Transaksi</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                >
                  <option value="Berhasil">Berhasil</option>
                  <option value="Pending">Pending</option>
                  <option value="Gagal">Gagal</option>
                </select>
              </div>

              {(() => {
                const edtJml = parseThousand(editJumlahStr);
                const edtLuar = parseThousand(editBiayaAdminLuarStr);
                const edtDalam = parseThousand(editBiayaAdminDalamStr);
                const edtTagihan = edtLuar > 0 ? (edtJml + edtLuar) : (edtJml + edtDalam);
                const { pendapatanKotor, estimasiProfit } = calculateRevenueAndProfit(edtLuar, edtDalam);

                return (
                  <div className="p-3.5 bg-[#006c49]/10 rounded-xl border border-[#006c49]/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-black block">Total Penagihan (Cash Masuk)</span>
                        <span className="text-[11px] text-[#45464d]">
                          {edtLuar > 0 ? 'Nominal + Admin Luar' : 'Nominal + Admin Dalam (Tanpa Admin Luar)'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold font-mono-jetbrains text-[#006c49]">
                          Rp {edtTagihan.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#006c49]/20 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 p-2 rounded-lg border border-[#006c49]/20">
                        <span className="text-[11px] text-gray-600 block">Pendapatan Kotor</span>
                        <span className="font-bold font-mono-jetbrains text-black">
                          Rp {pendapatanKotor.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-lg border border-[#006c49]/20">
                        <span className="text-[11px] text-[#006c49] font-bold block">Estimasi Profit</span>
                        <span className="font-bold font-mono-jetbrains text-[#006c49]">
                          Rp {estimasiProfit.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTrx(null)}
                  className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-lg text-sm font-semibold hover:bg-[#006c49]/90 shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Hapus Riwayat Transaksi</h3>
                <p className="text-xs text-gray-500 font-mono-jetbrains font-semibold">{deletingTrx.id}</p>
              </div>
            </div>

            <p className="text-sm text-[#45464d] leading-relaxed">
              Apakah Anda yakin ingin menghapus riwayat transaksi dari pelanggan{' '}
              <strong className="text-black">{deletingTrx.pelanggan}</strong> sebesar{' '}
              <strong className="text-[#006c49]">Rp {deletingTrx.jumlah.toLocaleString('id-ID')}</strong>?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTrx(null)}
                className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
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
