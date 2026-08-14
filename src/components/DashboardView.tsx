import React, { useState } from 'react';
import { TransactionItem, KasbonItem, PengeluaranItem, MutasiSaldoItem } from '../types';
import { sortByDateDesc } from '../utils/dateSorter';
import { isDanaPlatform, calculateDanaMonthlyQuota, DANA_MONTHLY_LIMIT } from '../utils/danaLimit';

interface DashboardViewProps {
  transactions: TransactionItem[];
  kasbons: KasbonItem[];
  pengeluaranList: PengeluaranItem[];
  mutasis?: MutasiSaldoItem[];
  platforms?: string[];
  saldoAwalMap?: Record<string, number>;
  onNavigateToExport: () => void;
  onOpenCetakStruk: () => void;
}

interface CombinedActivityItem {
  id: string;
  tanggal: string;
  kategori: 'Transaksi' | 'Kasbon' | 'Pengeluaran' | 'Mutasi';
  tipe: string;
  keterangan: string;
  nominal: number;
  status: string;
  badgeColor: string;
  icon: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  kasbons,
  pengeluaranList,
  mutasis = [],
  platforms = ['BriLink', 'Dana', 'Mitra Shopee', 'QRIS', 'Transfer Bank'],
  saldoAwalMap = {},
  onNavigateToExport,
  onOpenCetakStruk
}) => {
  const [activityFilter, setActivityFilter] = useState<'Semua' | 'Transaksi' | 'Kasbon' | 'Pengeluaran' | 'Mutasi'>('Semua');

  // Date constants
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = `${todayStr.slice(0, 7)}-01`;

  // Date Filter State for Activity Table
  const [activityDateMode, setActivityDateMode] = useState<'semua' | 'hari_ini' | 'bulan_ini' | 'rentang'>('semua');
  const [activityStartDate, setActivityStartDate] = useState<string>(firstDayOfMonthStr);
  const [activityEndDate, setActivityEndDate] = useState<string>(todayStr);

  // Date filtering for Omzet & Pendapatan Admin (default to today)
  const [dateMode, setDateMode] = useState<'today' | 'custom' | 'all'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const activeFilterDate = dateMode === 'today' ? todayStr : selectedDate;

  const filteredDashboardTransactions = transactions.filter((t) => {
    if (dateMode === 'all') return true;
    return t.tanggal.startsWith(activeFilterDate);
  });

  const totalOmzet = filteredDashboardTransactions.reduce((acc, curr) => {
    const adminLuar = curr.biayaAdminLuar ?? curr.biayaAdmin;
    return acc + (curr.totalPenagihan ?? (curr.jumlah + adminLuar));
  }, 0);
  const totalAdminFee = filteredDashboardTransactions.reduce((acc, curr) => acc + (curr.biayaAdminLuar ?? curr.biayaAdmin), 0);
  const totalKasbonPending = kasbons
    .filter((k) => k.status === 'Belum Lunas')
    .reduce((acc, curr) => acc + curr.sisaKasbon, 0);
  const totalPengeluaran = pengeluaranList.reduce((acc, curr) => acc + curr.jumlah, 0);

  // Dana platforms detection and monthly quota calculations
  const danaPlatforms = platforms.filter((p) => isDanaPlatform(p));
  const danaQuotas = danaPlatforms.map((pName) => {
    const quota = calculateDanaMonthlyQuota(pName, transactions, mutasis);
    return {
      platformName: pName,
      ...quota
    };
  });

  // Combined Recent Activities: Transaksi, Kasbon, Pengeluaran, Mutasi / Isi Saldo
  const trxActivities: CombinedActivityItem[] = transactions.map((t) => ({
    id: t.id,
    tanggal: t.tanggal,
    kategori: 'Transaksi',
    tipe: t.jenis,
    keterangan: `${t.platform} • ${t.pelanggan}`,
    nominal: t.jumlah,
    status: t.status || 'Berhasil',
    badgeColor: 'bg-emerald-100 text-[#006c49] border-emerald-300',
    icon: 'swap_horiz'
  }));

  const kasbonActivities: CombinedActivityItem[] = kasbons.map((k) => ({
    id: k.id,
    tanggal: k.tanggal,
    kategori: 'Kasbon',
    tipe: 'Piutang Kasbon',
    keterangan: `${k.namaPelanggan} (${k.catatan || 'Kasbon Pelanggan'})`,
    nominal: k.totalKasbon,
    status: k.status,
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: 'account_balance_wallet'
  }));

  const pengeluaranActivities: CombinedActivityItem[] = pengeluaranList.map((p) => ({
    id: p.id,
    tanggal: p.tanggal,
    kategori: 'Pengeluaran',
    tipe: p.kategori || 'Operasional',
    keterangan: `${p.sumberDana || 'Cash'} • ${p.keterangan}`,
    nominal: p.jumlah,
    status: 'Selesai',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: 'receipt_long'
  }));

  const mutasiActivities: CombinedActivityItem[] = mutasis.map((m) => ({
    id: m.id,
    tanggal: m.tanggal,
    kategori: 'Mutasi',
    tipe: m.jenis === 'Masuk' ? 'Pengisian Saldo' : 'Penarikan Saldo',
    keterangan: `${m.platform || m.sumber} (${m.keterangan || (m.jenis === 'Masuk' ? 'Top-Up Saldo' : 'Tarik Saldo')})`,
    nominal: m.nominal,
    status: 'Berhasil',
    badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
    icon: m.jenis === 'Masuk' ? 'add_card' : 'credit_card_off'
  }));

  const allActivities: CombinedActivityItem[] = sortByDateDesc([
    ...trxActivities,
    ...kasbonActivities,
    ...pengeluaranActivities,
    ...mutasiActivities
  ]);

  const filteredActivities = allActivities.filter((act) => {
    const matchCategory = activityFilter === 'Semua' || act.kategori === activityFilter;

    const itemDate = act.tanggal.split(' ')[0];
    let matchDate = true;
    if (activityDateMode === 'hari_ini') {
      matchDate = itemDate === todayStr;
    } else if (activityDateMode === 'bulan_ini') {
      matchDate = itemDate.startsWith(todayStr.slice(0, 7));
    } else if (activityDateMode === 'rentang') {
      if (activityStartDate && activityEndDate) {
        matchDate = itemDate >= activityStartDate && itemDate <= activityEndDate;
      } else if (activityStartDate) {
        matchDate = itemDate >= activityStartDate;
      } else if (activityEndDate) {
        matchDate = itemDate <= activityEndDate;
      }
    }

    return matchCategory && matchDate;
  });

  return (
    <div className="max-w-[1280px] mx-auto space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Title & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-[#c6c6cd] shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Ringkasan Operasional Agen</h2>
          <p className="text-xs sm:text-sm text-[#45464d] mt-0.5">
            Pantau transaksi harian, saldo platform, kuota limit DANA, kasbon pelanggan, dan administrasi toko.
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#f8f9ff] p-1.5 rounded-xl border border-[#c6c6cd]/80">
          <button
            type="button"
            onClick={() => setDateMode('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              dateMode === 'today'
                ? 'bg-[#006c49] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">today</span>
            Hari Ini
          </button>

          <div className="flex items-center gap-1 bg-white border border-[#c6c6cd] rounded-lg px-2 py-1">
            <span className="material-symbols-outlined text-[15px] text-gray-500">calendar_month</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setDateMode('custom');
              }}
              className="text-xs font-semibold text-black bg-transparent outline-none cursor-pointer"
              title="Pilih Tanggal Transaksi"
            />
          </div>

          <button
            type="button"
            onClick={() => setDateMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              dateMode === 'all'
                ? 'bg-[#006c49] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* Total Omzet */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-xs font-semibold uppercase text-[#45464d] block">Total Omzet Transaksi</span>
              <span className="text-[10px] text-[#006c49] font-bold">
                {dateMode === 'today'
                  ? `📅 Hari Ini (${todayStr})`
                  : dateMode === 'custom'
                  ? `📅 Tgl: ${selectedDate}`
                  : '📅 Semua Waktu'}
              </span>
            </div>
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
              {filteredDashboardTransactions.length} Transaksi Terpilih
            </p>
          </div>
        </div>

        {/* Keuntungan Admin */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-xs font-semibold uppercase text-[#45464d] block">Pendapatan Admin</span>
              <span className="text-[10px] text-blue-700 font-bold">
                {dateMode === 'today'
                  ? `📅 Hari Ini (${todayStr})`
                  : dateMode === 'custom'
                  ? `📅 Tgl: ${selectedDate}`
                  : '📅 Semua Waktu'}
              </span>
            </div>
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
              {kasbons.filter((k) => k.status === 'Belum Lunas').length} piutang belum lunas
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
            <p className="text-xs text-[#45464d] font-medium mt-1">{pengeluaranList.length} catatan pengeluaran</p>
          </div>
        </div>
      </div>

      {/* Dana Platform Monthly Inflow Quota Card (Max 40.000.000 / Bulan) */}
      {danaQuotas.length > 0 && (
        <div className="bg-gradient-to-r from-sky-900 via-[#0d2a4a] to-blue-950 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-sky-800/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
                <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white">
                  Monitoring Kuota Saldo Masuk Akun DANA
                </h3>
                <p className="text-xs text-sky-200">
                  Maksimal total saldo masuk Rp 40.000.000 / bulan (Tarik Tunai + Top Up Saldo + Pindah Saldo). Reset tiap awal bulan.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono-jetbrains font-bold bg-sky-500/20 border border-sky-400/30 px-3 py-1 rounded-full text-sky-200 w-fit">
              Batas Max: Rp {DANA_MONTHLY_LIMIT.toLocaleString('id-ID')} / Bulan
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {danaQuotas.map((dq) => {
              const isWarning = dq.sisaLimit <= 5000000;
              const isFull = dq.sisaLimit <= 0;

              return (
                <div
                  key={dq.platformName}
                  className="bg-white/5 backdrop-blur-xs p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-sky-200 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
                      {dq.platformName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isFull
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isWarning
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isFull ? 'KUOTA HABIS' : `${dq.percentageUsed}% Terpakai`}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFull ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${Math.min(100, dq.percentageUsed)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Stats */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Total Masuk Bulan Ini</span>
                      <span className="font-bold font-mono-jetbrains text-white text-sm">
                        Rp {dq.totalMasuk.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-sky-300 block uppercase">Sisa Kuota Masuk</span>
                      <span
                        className={`font-bold font-mono-jetbrains text-sm ${
                          isFull ? 'text-rose-400' : isWarning ? 'text-amber-300' : 'text-emerald-300'
                        }`}
                      >
                        Rp {dq.sisaLimit.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Combined Recent Activities Table (Transaksi, Kasbon, Pengeluaran, Mutasi Saldo) */}
      <div className="bg-white rounded-xl border border-[#c6c6cd] shadow-xs overflow-hidden w-full space-y-0">
        <div className="p-4 border-b border-[#c6c6cd] bg-[#eff4ff]/60 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-black">Aktivitas & Transaksi Terbaru</h3>
              <p className="text-[11px] text-gray-500">
                Riwayat gabungan transaksi, kasbon, pengeluaran toko, & mutasi saldo (tampilan 5 awal, scroll untuk melihat seluruh data).
              </p>
            </div>
            <span className="text-xs font-semibold text-[#006c49] bg-emerald-50 border border-[#006c49]/30 px-2.5 py-1 rounded-full font-mono-jetbrains self-start sm:self-auto">
              {filteredActivities.length} Aktivitas
            </span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 pt-2 border-t border-gray-200/60">
            {/* Activity Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-xs font-semibold text-[#45464d] mr-1">Kategori:</span>
              {(['Semua', 'Transaksi', 'Kasbon', 'Pengeluaran', 'Mutasi'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivityFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activityFilter === tab
                      ? 'bg-[#006c49] text-white shadow-xs'
                      : 'bg-white text-[#45464d] border border-[#c6c6cd] hover:bg-[#d3e4fe]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Activity Date Filter Controls */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-[#45464d] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                Tanggal:
              </span>
              <button
                type="button"
                onClick={() => setActivityDateMode('semua')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activityDateMode === 'semua'
                    ? 'bg-[#006c49] text-white shadow-xs'
                    : 'bg-white border border-[#c6c6cd] text-[#45464d] hover:bg-gray-100'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setActivityDateMode('bulan_ini')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activityDateMode === 'bulan_ini'
                    ? 'bg-[#006c49] text-white shadow-xs'
                    : 'bg-white border border-[#c6c6cd] text-[#45464d] hover:bg-gray-100'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setActivityDateMode('hari_ini')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  activityDateMode === 'hari_ini'
                    ? 'bg-[#006c49] text-white shadow-xs'
                    : 'bg-white border border-[#c6c6cd] text-[#45464d] hover:bg-gray-100'
                }`}
              >
                Hari Ini
              </button>

              {/* Custom Range */}
              <div className={`flex flex-wrap sm:flex-nowrap items-center gap-1 px-2 py-0.5 rounded-lg border transition-all ${
                activityDateMode === 'rentang'
                  ? 'bg-emerald-50/50 border-[#006c49] ring-1 ring-[#006c49]'
                  : 'bg-white border-[#c6c6cd]'
              }`}>
                <input
                  type="date"
                  value={activityStartDate}
                  onChange={(e) => {
                    setActivityStartDate(e.target.value);
                    setActivityDateMode('rentang');
                  }}
                  className="text-xs font-bold text-black bg-transparent outline-none cursor-pointer"
                  title="Dari Tanggal"
                />
                <span className="text-[11px] font-bold text-gray-400">s/d</span>
                <input
                  type="date"
                  value={activityEndDate}
                  onChange={(e) => {
                    setActivityEndDate(e.target.value);
                    setActivityDateMode('rentang');
                  }}
                  className="text-xs font-bold text-black bg-transparent outline-none cursor-pointer"
                  title="Sampai Tanggal"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto w-full max-h-[380px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[760px]">
            <thead className="sticky top-0 z-10 bg-[#eff4ff]">
              <tr className="bg-[#eff4ff] text-[#45464d] font-semibold border-b border-[#c6c6cd]">
                <th className="p-3.5 bg-[#eff4ff]">ID & Kategori</th>
                <th className="p-3.5 bg-[#eff4ff]">Tanggal & Waktu</th>
                <th className="p-3.5 bg-[#eff4ff]">Tipe / Jenis</th>
                <th className="p-3.5 bg-[#eff4ff]">Keterangan / Rincian</th>
                <th className="p-3.5 bg-[#eff4ff] text-right">Nominal (Rp)</th>
                <th className="p-3.5 bg-[#eff4ff] text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/40">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Belum ada aktivitas yang dicatat pada kategori dan filter tanggal ini.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => (
                  <tr key={`${act.kategori}-${act.id}`} className="hover:bg-[#f8f9ff]">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-[18px] p-1.5 rounded-lg ${act.badgeColor}`}>
                          {act.icon}
                        </span>
                        <div>
                          <span className="font-mono-jetbrains font-bold text-black text-xs block">
                            {act.id}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium">{act.kategori}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-[#45464d] whitespace-nowrap">{act.tanggal}</td>
                    <td className="p-3.5">
                      <span className="bg-[#d3e4fe]/70 text-[#0b1c30] px-2.5 py-0.5 rounded text-xs font-semibold">
                        {act.tipe}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-black text-xs">{act.keterangan}</td>
                    <td className="p-3.5 text-right font-mono-jetbrains font-bold text-black">
                      Rp {act.nominal.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          act.status === 'Berhasil' || act.status === 'Lunas' || act.status === 'Selesai'
                            ? 'bg-emerald-100 text-[#006c49]'
                            : act.status === 'Pending' || act.status === 'Belum Lunas'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
