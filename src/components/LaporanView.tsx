import React, { useState } from 'react';
import { TransactionItem, KasbonItem, PengeluaranItem, MutasiSaldoItem } from '../types';
import { getTransactionRevenueAndProfit } from '../utils/formatters';

interface LaporanViewProps {
  transactions: TransactionItem[];
  kasbons: KasbonItem[];
  pengeluaranList: PengeluaranItem[];
  mutasis: MutasiSaldoItem[];
  platforms?: string[];
  saldoAwalMap?: Record<string, number>;
  onNavigateToExport?: () => void;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  transactions,
  kasbons,
  pengeluaranList,
  mutasis,
  platforms = ['Cash / Tunai', 'BriLink', 'Dana', 'Mitra Shopee', 'QRIS'],
  saldoAwalMap = {},
  onNavigateToExport
}) => {
  // Periode Filter
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = `${todayStr.slice(0, 7)}-01`;
  const [periodeFilter, setPeriodeFilter] = useState<'semua' | 'hari_ini' | 'bulan_ini' | 'rentang'>('semua');
  const [startDate, setStartDate] = useState<string>(firstDayOfMonthStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Helper to identify Cash platform
  const isCashPlatform = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes('cash') || lower.includes('tunai');
  };

  // Calculate current balance for a platform (including transactions & pengeluaran)
  const getPlatformCurrentBalance = (platformName: string) => {
    const awal = saldoAwalMap[platformName] || 0;
    const mutasiForPlatform = mutasis.filter((m) => {
      if (m.platform) {
        return m.platform.toLowerCase() === platformName.toLowerCase();
      }
      return m.sumber.toLowerCase().includes(platformName.toLowerCase());
    });
    const mutasiMasuk = mutasiForPlatform
      .filter((m) => m.jenis === 'Masuk')
      .reduce((sum, m) => sum + m.nominal, 0);
    const mutasiKeluar = mutasiForPlatform
      .filter((m) => m.jenis === 'Keluar')
      .reduce((sum, m) => sum + m.nominal, 0);

    const totalPengeluaran = pengeluaranList
      .filter((e) => {
        const ePlatform = e.sumberDana || 'Cash / Tunai';
        if (isCashPlatform(platformName)) {
          return isCashPlatform(ePlatform);
        }
        return ePlatform.toLowerCase() === platformName.toLowerCase();
      })
      .reduce((sum, e) => sum + e.jumlah, 0);

    if (isCashPlatform(platformName)) {
      let cashDiterima = 0;
      let cashDikeluarkan = 0;

      transactions.forEach((t) => {
        if (t.status === 'Berhasil' || !t.status) {
          const adminLuar = t.biayaAdminLuar ?? t.biayaAdmin ?? 0;
          const adminDalam = t.biayaAdminDalam ?? 0;
          const totalTagihan = t.totalPenagihan ?? (adminLuar > 0 ? (t.jumlah + adminLuar) : (t.jumlah + adminDalam));

          if (t.jenis === 'Tarik Tunai') {
            cashDikeluarkan += t.jumlah;
          } else {
            cashDiterima += totalTagihan;
          }
        }
      });

      return awal + mutasiMasuk - mutasiKeluar + cashDiterima - cashDikeluarkan - totalPengeluaran;
    } else {
      let providerBerkurang = 0;
      let providerBertambah = 0;

      transactions.forEach((t) => {
        if ((t.status === 'Berhasil' || !t.status) && t.platform === platformName) {
          if (t.jenis === 'Tarik Tunai') {
            providerBertambah += t.jumlah;
          } else {
            const adminDalam = t.biayaAdminDalam ?? 0;
            providerBerkurang += (t.jumlah + adminDalam);
          }
        }
      });

      return awal + mutasiMasuk - mutasiKeluar - providerBerkurang + providerBertambah - totalPengeluaran;
    }
  };

  // 1. Jumlah Kas Awal Bulan (Total seluruh platform provider + cash di awal bulan)
  const kasAwalBulan = platforms.reduce((sum, p) => sum + (saldoAwalMap[p] || 0), 0);

  // 2. Jumlah Kas Saat Ini (Total seluruh platform provider + cash berjalan)
  const kasSaatIni = platforms.reduce((sum, p) => sum + getPlatformCurrentBalance(p), 0);

  // 3. Perubahan Modal (Kas Saat Ini - Kas Awal)
  const perubahanModal = kasSaatIni - kasAwalBulan;
  const persenPerubahanModal = kasAwalBulan > 0 ? ((perubahanModal / kasAwalBulan) * 100).toFixed(1) : '0.0';

  // Filter transactions by date period helper
  const filterByDate = <T extends { tanggal: string }>(items: T[]) => {
    if (periodeFilter === 'semua') return items;

    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

    return items.filter((item) => {
      // expected format: YYYY-MM-DD HH:mm or YYYY-MM-DD
      const itemDate = item.tanggal.split(' ')[0];
      if (periodeFilter === 'hari_ini') {
        return itemDate === todayStr;
      }
      if (periodeFilter === 'bulan_ini') {
        return itemDate.startsWith(currentMonthStr);
      }
      if (periodeFilter === 'rentang') {
        if (startDate && endDate) {
          return itemDate >= startDate && itemDate <= endDate;
        }
        if (startDate) return itemDate >= startDate;
        if (endDate) return itemDate <= endDate;
        return true;
      }
      return true;
    });
  };

  const filteredTransactions = filterByDate<TransactionItem>(transactions);
  const filteredPengeluaran = filterByDate<PengeluaranItem>(pengeluaranList);

  // Financial Calculations based on user rules
  const totalOmset = filteredTransactions.reduce((sum, t) => {
    const adminLuar = t.biayaAdminLuar ?? t.biayaAdmin;
    return sum + (t.totalPenagihan ?? (t.jumlah + adminLuar));
  }, 0);

  const totalNominalTransaksi = filteredTransactions.reduce((sum, t) => sum + t.jumlah, 0);

  const totalAdminLuar = filteredTransactions.reduce((sum, t) => sum + (t.biayaAdminLuar ?? t.biayaAdmin ?? 0), 0);
  const totalAdminDalam = filteredTransactions.reduce((sum, t) => sum + (t.biayaAdminDalam ?? 0), 0);

  // Pendapatan Kotor akumulasi transaksi
  const totalPendapatanKotor = filteredTransactions.reduce(
    (sum, t) => sum + getTransactionRevenueAndProfit(t).pendapatanKotor,
    0
  );

  // Estimasi Profit akumulasi transaksi
  const totalEstimasiProfitTrx = filteredTransactions.reduce(
    (sum, t) => sum + getTransactionRevenueAndProfit(t).estimasiProfit,
    0
  );

  const totalPengeluaran = filteredPengeluaran.reduce((sum, p) => sum + p.jumlah, 0);
  // Laba Bersih Toko = Total Estimasi Profit Transaksi - Total Pengeluaran
  const labaBersih = totalEstimasiProfitTrx - totalPengeluaran;

  const totalPiutangKasbon = kasbons.reduce((sum, k) => sum + k.sisaKasbon, 0);
  const totalKasbonTerbayar = kasbons.reduce((sum, k) => sum + (k.totalKasbon - k.sisaKasbon), 0);

  // Platform Breakdown Analysis
  const platformStats = platforms.map((p) => {
    const trxList = filteredTransactions.filter((t) => t.platform.toLowerCase() === p.toLowerCase());
    const count = trxList.length;
    const volume = trxList.reduce((sum, t) => sum + t.jumlah, 0);
    const profit = trxList.reduce((sum, t) => sum + getTransactionRevenueAndProfit(t).estimasiProfit, 0);
    return { platform: p, count, volume, profit };
  });

  // Transaction Status Stats
  const countBerhasil = filteredTransactions.filter((t) => t.status === 'Berhasil').length;
  const countPending = filteredTransactions.filter((t) => t.status === 'Pending').length;
  const countGagal = filteredTransactions.filter((t) => t.status === 'Gagal').length;

  // Expense Breakdown
  const expenseCategories = ['Operasional', 'Peralatan', 'Lainnya'];
  const expenseStats = expenseCategories.map((cat) => {
    const items = filteredPengeluaran.filter((p) => p.kategori === cat);
    const total = items.reduce((sum, p) => sum + p.jumlah, 0);
    return { category: cat, total, count: items.length };
  });

  return (
    <div className="max-w-[1280px] mx-auto space-y-4 sm:space-y-6 pb-12 w-full max-w-full">
      {/* Top Header & Export Quick Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 bg-white p-4 sm:p-6 rounded-2xl border border-[#c6c6cd] shadow-xs w-full">
        <div>
          <div className="flex items-center gap-2 text-[#006c49] font-bold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            Analisis Performa Agen
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Laporan Keuangan & Ringkasan Performa</h2>
          <p className="text-xs sm:text-sm text-[#45464d] mt-0.5">
            Ringkasan omset, pendapatan biaya admin, pengeluaran toko, dan estimasi keuntungan bersih agen Anda.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
          {/* Filter Periode Bar */}
          <div className="bg-[#f8f9ff] p-1.5 border border-[#c6c6cd] rounded-xl flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setPeriodeFilter('semua')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                periodeFilter === 'semua'
                  ? 'bg-[#006c49] text-white shadow-xs'
                  : 'text-[#45464d] hover:bg-gray-200'
              }`}
            >
              Semua Data
            </button>
            <button
              type="button"
              onClick={() => setPeriodeFilter('bulan_ini')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                periodeFilter === 'bulan_ini'
                  ? 'bg-[#006c49] text-white shadow-xs'
                  : 'text-[#45464d] hover:bg-gray-200'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriodeFilter('hari_ini')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                periodeFilter === 'hari_ini'
                  ? 'bg-[#006c49] text-white shadow-xs'
                  : 'text-[#45464d] hover:bg-gray-200'
              }`}
            >
              Hari Ini
            </button>

            {/* Pilih Rentang Tanggal (Dari s/d Sampai) */}
            <div className={`flex flex-wrap sm:flex-nowrap items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all ${
              periodeFilter === 'rentang'
                ? 'bg-white border-[#006c49] ring-2 ring-[#006c49]/20 shadow-xs'
                : 'bg-white/80 border-[#c6c6cd]'
            }`}>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-gray-500">Dari:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPeriodeFilter('rentang');
                  }}
                  className="text-xs font-bold text-black bg-transparent outline-none cursor-pointer"
                  title="Dari Tanggal"
                />
              </div>
              <span className="text-[11px] font-bold text-gray-400">s/d</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-semibold text-gray-500">Sampai:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPeriodeFilter('rentang');
                  }}
                  className="text-xs font-bold text-black bg-transparent outline-none cursor-pointer"
                  title="Sampai Tanggal"
                />
              </div>
            </div>
          </div>

          {onNavigateToExport && (
            <button
              onClick={onNavigateToExport}
              className="w-full sm:w-auto justify-center px-4 py-2 bg-[#d3e4fe] text-[#0b1c30] rounded-xl text-xs font-bold hover:bg-[#b9d5ff] transition-colors flex items-center gap-1.5 border border-[#c6c6cd] active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">ios_share</span>
              Export File Excel/PDF
            </button>
          )}
        </div>
      </div>

      {/* Rekapitulasi Modal & Arus Kas Agen (Kas Awal, Kas Saat Ini, Perubahan Modal) */}
      <div className="bg-gradient-to-r from-[#0b1c30] via-[#132742] to-[#1e3a5f] text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-sky-900/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <span className="material-symbols-outlined text-amber-300 text-[22px]">account_balance</span>
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-white">Rekapitulasi Modal & Kas Agen</h3>
              <p className="text-xs text-sky-200">Pemantauan modal kerja awal bulan vs saldo kas riil saat ini</p>
            </div>
          </div>
          <span className="text-[11px] font-mono-jetbrains font-bold bg-white/10 px-3 py-1 rounded-full text-sky-100 w-fit">
            {platforms.length} Platform Aktif (Termasuk Kas Tunai)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* 1. Kas Awal Bulan */}
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200">
                  1. Kas Awal Bulan
                </span>
                <span className="material-symbols-outlined text-sky-300 text-[18px]">history</span>
              </div>
              <p className="text-[10px] text-gray-300 mt-0.5">
                Total saldo semua platform + cash di awal bulan
              </p>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-bold font-mono-jetbrains text-white">
                Rp {kasAwalBulan.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-sky-200 block mt-1">
                Modal Awal Tercatat
              </span>
            </div>
          </div>

          {/* 2. Kas Saat Ini */}
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  2. Kas Saat Ini
                </span>
                <span className="material-symbols-outlined text-emerald-300 text-[18px]">wallet</span>
              </div>
              <p className="text-[10px] text-gray-300 mt-0.5">
                Total saldo berjalan saat ini (E-Money + Cash)
              </p>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-bold font-mono-jetbrains text-emerald-300">
                Rp {kasSaatIni.toLocaleString('id-ID')}
              </div>
              <span className="text-[10px] text-emerald-200 block mt-1">
                Saldo Likuid Berputar
              </span>
            </div>
          </div>

          {/* 3. Perubahan Modal */}
          <div className="bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  3. Perubahan Modal
                </span>
                <span className="material-symbols-outlined text-amber-300 text-[18px]">
                  {perubahanModal >= 0 ? 'trending_up' : 'trending_down'}
                </span>
              </div>
              <p className="text-[10px] text-gray-300 mt-0.5">
                Selisih Kas Saat Ini vs Kas Awal Bulan
              </p>
            </div>
            <div className="mt-3">
              <div className={`text-xl sm:text-2xl font-bold font-mono-jetbrains ${perubahanModal >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {perubahanModal >= 0 ? '+' : ''}Rp {perubahanModal.toLocaleString('id-ID')}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${perubahanModal >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {perubahanModal >= 0 ? '▲ Kenaikan Modal' : '▼ Penurunan Modal'} ({persenPerubahanModal}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omset */}
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#45464d] uppercase tracking-wider">
              Total Omset Penagihan
            </span>
            <div className="p-2 bg-[#d3e4fe] text-[#0b1c30] rounded-xl">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono-jetbrains text-black">
              Rp {totalOmset.toLocaleString('id-ID')}
            </div>
            <span className="text-xs text-[#45464d] block mt-1">
              Dari {filteredTransactions.length} transaksi ({countBerhasil} Berhasil)
            </span>
          </div>
        </div>

        {/* Pendapatan Admin Kotor */}
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#45464d] uppercase tracking-wider">
              Pendapatan Kotor (Admin Luar)
            </span>
            <div className="p-2 bg-[#006c49]/10 text-[#006c49] rounded-xl">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono-jetbrains text-[#006c49]">
              Rp {totalPendapatanKotor.toLocaleString('id-ID')}
            </div>
            <span className="text-xs text-[#45464d] block mt-1">
              Biaya admin langsung dari pelanggan
            </span>
          </div>
        </div>

        {/* Total Pengeluaran & Admin Dalam */}
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#45464d] uppercase tracking-wider">
              Pengeluaran & Potongan
            </span>
            <div className="p-2 bg-red-100 text-red-700 rounded-xl">
              <span className="material-symbols-outlined text-[20px]">output</span>
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono-jetbrains text-red-600">
              Rp {(totalPengeluaran + totalAdminDalam).toLocaleString('id-ID')}
            </div>
            <span className="text-xs text-[#45464d] block mt-1">
              Toko: Rp {totalPengeluaran.toLocaleString('id-ID')} | Potong Saldo: Rp {totalAdminDalam.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Keuntungan Bersih */}
        <div className="bg-gradient-to-br from-[#131b2e] to-[#0b1c30] text-white p-5 rounded-2xl border border-[#6cf8bb]/30 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
              Estimasi Profit Bersih
            </span>
            <div className="p-2 bg-[#6cf8bb]/20 text-[#6cf8bb] rounded-xl">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </div>
          </div>
          <div>
            <div className={`text-2xl font-bold font-mono-jetbrains ${labaBersih >= 0 ? 'text-[#6cf8bb]' : 'text-red-400'}`}>
              Rp {labaBersih.toLocaleString('id-ID')}
            </div>
            <span className="text-xs text-gray-300 block mt-1">
              Admin Luar - (Admin Dalam + Pengeluaran)
            </span>
          </div>
        </div>
      </div>

      {/* Grid Section: Visual Breakdown Per Platform & Transaction Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Visual Analisis Platform (2 Columns on LG) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-lg text-black">Performa Berdasarkan Platform</h3>
              <p className="text-xs text-[#45464d]">Perbandingan volume transaksi & estimasi laba per platform e-wallet / bank</p>
            </div>
            <span className="text-xs font-bold text-[#006c49] bg-[#006c49]/10 px-3 py-1 rounded-full">
              {platforms.length} Platform Active
            </span>
          </div>

          <div className="space-y-4">
            {platformStats.map((stat) => {
              const maxVol = Math.max(...platformStats.map((s) => s.volume), 1);
              const percentage = Math.min(100, Math.round((stat.volume / maxVol) * 100));

              return (
                <div key={stat.platform} className="p-4 bg-[#f8f9ff] rounded-xl border border-[#c6c6cd]/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-lg bg-[#d3e4fe] text-[#0b1c30] flex items-center justify-center font-bold font-mono-jetbrains text-xs">
                        {stat.platform.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <span className="font-bold text-black text-sm block">{stat.platform}</span>
                        <span className="text-[11px] text-[#45464d]">{stat.count} Transaksi</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono-jetbrains font-bold text-black text-sm block">
                        Rp {stat.volume.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[11px] text-[#006c49] font-semibold">
                        Laba Admin: Rp {stat.profit.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#006c49] h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Status & Ringkasan Piutang Kasbon */}
        <div className="space-y-6">
          {/* Status Breakdown Box */}
          <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-4">
            <h3 className="font-bold text-lg text-black border-b border-gray-100 pb-2">
              Status Transaksi
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
                  <span className="font-semibold text-emerald-950">Berhasil</span>
                </div>
                <span className="font-bold font-mono-jetbrains text-emerald-900">{countBerhasil} Transaksi</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="font-semibold text-amber-950">Pending</span>
                </div>
                <span className="font-bold font-mono-jetbrains text-amber-900">{countPending} Transaksi</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-600 inline-block" />
                  <span className="font-semibold text-red-950">Gagal</span>
                </div>
                <span className="font-bold font-mono-jetbrains text-red-900">{countGagal} Transaksi</span>
              </div>
            </div>
          </div>

          {/* Ringkasan Kasbon Box */}
          <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-lg text-black">Ringkasan Kasbon</h3>
              <span className="text-xs text-[#45464d]">Pelanggan</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                <span className="text-xs text-amber-900 font-bold uppercase tracking-wider block">
                  Total Piutang Belum Lunas
                </span>
                <span className="text-xl font-bold font-mono-jetbrains text-amber-900 block">
                  Rp {totalPiutangKasbon.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-amber-800 block">
                  Sudah terbayar: Rp {totalKasbonTerbayar.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-gray-500 uppercase block">Top Piutang Pelanggan:</span>
                {kasbons
                  .filter((k) => k.sisaKasbon > 0)
                  .slice(0, 3)
                  .map((k) => (
                    <div key={k.id} className="p-2.5 bg-[#f8f9ff] rounded-lg border border-[#c6c6cd]/50 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-black block">{k.namaPelanggan}</span>
                        <span className="text-[10px] text-[#45464d]">{k.noHp}</span>
                      </div>
                      <span className="font-mono-jetbrains font-bold text-red-600">
                        Rp {k.sisaKasbon.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Categories Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-[#c6c6cd] shadow-xs space-y-4">
        <h3 className="font-bold text-lg text-black border-b border-gray-100 pb-2">
          Rincian Pengeluaran Toko Berdasarkan Kategori
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {expenseStats.map((exp) => (
            <div key={exp.category} className="p-4 bg-[#f8f9ff] rounded-xl border border-[#c6c6cd]/60 space-y-1">
              <span className="text-xs font-bold text-[#45464d] uppercase tracking-wider block">
                {exp.category}
              </span>
              <span className="text-xl font-bold font-mono-jetbrains text-red-600 block">
                Rp {exp.total.toLocaleString('id-ID')}
              </span>
              <span className="text-[11px] text-[#45464d] block">
                {exp.count} Catatan
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
