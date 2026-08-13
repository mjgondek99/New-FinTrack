import React from 'react';
import { TransactionItem, KasbonItem, PengeluaranItem } from '../types';

interface DashboardViewProps {
  transactions: TransactionItem[];
  kasbons: KasbonItem[];
  pengeluaranList: PengeluaranItem[];
  onNavigateToExport: () => void;
  onOpenCetakStruk: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  kasbons,
  pengeluaranList,
  onNavigateToExport,
  onOpenCetakStruk
}) => {
  const totalOmzet = transactions.reduce((acc, curr) => {
    const adminLuar = curr.biayaAdminLuar ?? curr.biayaAdmin;
    return acc + (curr.totalPenagihan ?? (curr.jumlah + adminLuar));
  }, 0);
  const totalAdminFee = transactions.reduce((acc, curr) => acc + (curr.biayaAdminLuar ?? curr.biayaAdmin), 0);
  const totalKasbonPending = kasbons
    .filter((k) => k.status === 'Belum Lunas')
    .reduce((acc, curr) => acc + curr.sisaKasbon, 0);
  const totalPengeluaran = pengeluaranList.reduce((acc, curr) => acc + curr.jumlah, 0);

  return (
    <div className="max-w-[1280px] mx-auto space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-black">Ringkasan Operasional Agen</h2>
        <p className="text-xs sm:text-sm text-[#45464d] mt-0.5">
          Pantau transaksi harian, saldo platform, kasbon pelanggan, dan administrasi toko.
        </p>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* Total Omzet */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold uppercase text-[#45464d]">Total Omzet Transaksi</span>
            <div className="p-2 bg-[#006c49]/10 text-[#006c49] rounded-lg">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono-jetbrains text-black">
              Rp {totalOmzet.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-[#006c49] font-medium mt-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +12.4% minggu ini
            </p>
          </div>
        </div>

        {/* Keuntungan Admin */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold uppercase text-[#45464d]">Pendapatan Admin (Luar)</span>
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <span className="material-symbols-outlined text-[20px]">savings</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono-jetbrains text-black">
              Rp {totalAdminFee.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-[#45464d] font-medium mt-1">Biaya admin dari pelanggan</p>
          </div>
        </div>

        {/* Total Kasbon Pending */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold uppercase text-[#45464d]">Kasbon Belum Lunas</span>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono-jetbrains text-[#ba1a1a]">
              Rp {totalKasbonPending.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-[#ba1a1a] font-medium mt-1">
              {kasbons.filter((k) => k.status === 'Belum Lunas').length} pelanggan aktif
            </p>
          </div>
        </div>

        {/* Total Pengeluaran */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold uppercase text-[#45464d]">Biaya Operasional</span>
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <span className="material-symbols-outlined text-[20px]">receipt</span>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono-jetbrains text-black">
              Rp {totalPengeluaran.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-[#45464d] font-medium mt-1">Bulan Agustus 2026</p>
          </div>
        </div>
      </div>

      {/* Quick Access CTA Section */}
      <div className="bg-[#131b2e] text-white p-4 sm:p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        <div>
          <h3 className="text-lg sm:text-xl font-bold">Butuh Rekapitulasi & File Ekspor?</h3>
          <p className="text-xs sm:text-sm text-[#7c839b] mt-1">
            Unduh laporan transaksi BriLink, Dana, Mitra Shopee, dan Kasbon dalam format PDF & Excel.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
          <button
            onClick={onNavigateToExport}
            className="w-full sm:w-auto bg-[#006c49] hover:bg-[#006c49]/90 text-white px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            Pusat Unduhan Data
          </button>
          <button
            onClick={onOpenCetakStruk}
            className="w-full sm:w-auto bg-[#d3e4fe] hover:bg-[#dce9ff] text-[#0b1c30] px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Cetak Struk
          </button>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-[#c6c6cd] shadow-xs overflow-hidden w-full">
        <div className="p-4 border-b border-[#c6c6cd] flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-black">Transaksi Terbaru</h3>
            <p className="text-[11px] text-gray-500">Geser tabel ke samping untuk melihat rincian</p>
          </div>
          <span className="text-xs font-semibold text-[#006c49] bg-[#006c49]/10 px-3 py-1 rounded-full">
            Realtime Live Sync
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm min-w-[680px]">
            <thead>
              <tr className="bg-[#eff4ff] text-[#45464d] font-semibold border-b border-[#c6c6cd]">
                <th className="p-3">ID Transaksi</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Pelanggan</th>
                <th className="p-3">Jenis</th>
                <th className="p-3 text-right">Nominal</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/40">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-[#f8f9ff]">
                  <td className="p-3 font-mono-jetbrains font-medium text-black">{t.id}</td>
                  <td className="p-3 text-xs text-[#45464d]">{t.tanggal}</td>
                  <td className="p-3">
                    <span className="bg-[#d3e4fe]/60 text-[#0b1c30] px-2.5 py-1 rounded text-xs font-medium">
                      {t.platform}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-black">{t.pelanggan}</td>
                  <td className="p-3 text-xs text-[#45464d]">{t.jenis}</td>
                  <td className="p-3 text-right font-mono-jetbrains font-bold text-black">
                    Rp {t.jumlah.toLocaleString('id-ID')}
                  </td>
                  <td className="p-3 text-center">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
