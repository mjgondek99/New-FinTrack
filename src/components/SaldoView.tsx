import React, { useState } from 'react';
import { MutasiSaldoItem, UserAccount, TransactionItem, PengeluaranItem, KasbonItem } from '../types';
import { formatThousand, parseThousand } from '../utils/formatters';
import { sortByDateDesc } from '../utils/dateSorter';
import { isDanaPlatform, calculateDanaMonthlyQuota, DANA_MONTHLY_LIMIT } from '../utils/danaLimit';

interface SaldoViewProps {
  mutasis: MutasiSaldoItem[];
  setMutasis: React.Dispatch<React.SetStateAction<MutasiSaldoItem[]>>;
  platforms: string[];
  saldoAwalMap: Record<string, number>;
  setSaldoAwalMap: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onNavigateToExport: () => void;
  currentUser?: UserAccount;
  transactions?: TransactionItem[];
  pengeluaranList?: PengeluaranItem[];
  kasbons?: KasbonItem[];
}

export const SaldoView: React.FC<SaldoViewProps> = ({
  mutasis,
  setMutasis,
  platforms,
  saldoAwalMap,
  setSaldoAwalMap,
  onNavigateToExport,
  currentUser,
  transactions = [],
  pengeluaranList = [],
  kasbons = []
}) => {
  // Modal State for Set Saldo Awal
  const [showSaldoAwalModal, setShowSaldoAwalModal] = useState(false);
  const [selectedPlatformForAwal, setSelectedPlatformForAwal] = useState<string>(platforms[0] || 'BriLink');
  const [nominalAwalInput, setNominalAwalInput] = useState<string>('');

  // Modal State for Tambah Mutasi / Isi Saldo
  const [showAddMutasiModal, setShowAddMutasiModal] = useState(false);
  const [mutasiPlatform, setMutasiPlatform] = useState<string>(platforms[0] || 'BriLink');
  const [mutasiJenis, setMutasiJenis] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [mutasiNominal, setMutasiNominal] = useState<string>('');
  const [mutasiSumber, setMutasiSumber] = useState<string>('');

  // Modal State for Edit Mutasi / Pengisian Saldo
  const [editingMutasiItem, setEditingMutasiItem] = useState<MutasiSaldoItem | null>(null);
  const [editMutasiDate, setEditMutasiDate] = useState('');
  const [editMutasiTime, setEditMutasiTime] = useState('');
  const [editMutasiPlatform, setEditMutasiPlatform] = useState('');
  const [editMutasiJenis, setEditMutasiJenis] = useState<'Masuk' | 'Keluar'>('Masuk');
  const [editMutasiNominalStr, setEditMutasiNominalStr] = useState('');
  const [editMutasiSumber, setEditMutasiSumber] = useState('');

  // Modal State for Pindah Saldo Antar Platform
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string>(platforms[0] || 'BriLink');
  const [transferTo, setTransferTo] = useState<string>(platforms[1] || 'Cash / Tunai');
  const [transferNominalStr, setTransferNominalStr] = useState<string>('');
  const [transferBiayaStr, setTransferBiayaStr] = useState<string>('');
  const [adminPotongDari, setAdminPotongDari] = useState<'asal' | 'tujuan' | 'none'>('asal');
  const [transferCatatan, setTransferCatatan] = useState<string>('');

  // Delete Confirmation Modals
  const [deletingMutasiItem, setDeletingMutasiItem] = useState<MutasiSaldoItem | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('Semua');

  // Date Filter State for Mutasi
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = `${todayStr.slice(0, 7)}-01`;
  const [dateFilterMode, setDateFilterMode] = useState<'semua' | 'hari_ini' | 'bulan_ini' | 'rentang'>('semua');
  const [startDateFilter, setStartDateFilter] = useState<string>(firstDayOfMonthStr);
  const [endDateFilter, setEndDateFilter] = useState<string>(todayStr);

  // Helper to identify Cash platform
  const isCashPlatform = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes('cash') || lower.includes('tunai');
  };

  // Calculate Pengeluaran for a platform
  const getPlatformPengeluaran = (pName: string) => {
    return pengeluaranList
      .filter((e) => {
        const ePlatform = e.sumberDana || 'Cash / Tunai';
        if (isCashPlatform(pName)) {
          return isCashPlatform(ePlatform);
        }
        return ePlatform.toLowerCase() === pName.toLowerCase();
      })
      .reduce((sum, e) => sum + e.jumlah, 0);
  };

  // Calculate current total balance for a platform (including transactions & pengeluaran)
  const getPlatformDetails = (platformName: string) => {
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

    const totalPengeluaran = getPlatformPengeluaran(platformName);

    if (isCashPlatform(platformName)) {
      // CASH / TUNAI Mechanics:
      // + Cash diterima dari transaksi lunas (bukan kasbon)
      // - Cash diserahkan ke pelanggan saat Tarik Tunai (Nominal)
      // - Pengeluaran toko dari Cash
      // - Kasbon tunai standalone yang dipinjamkan
      // + Pembayaran cicilan kasbon yang diterima tunai
      let cashDiterima = 0;
      let cashDikeluarkan = 0;

      transactions.forEach((t) => {
        if (t.status === 'Berhasil' || !t.status) {
          const adminLuar = t.biayaAdminLuar ?? t.biayaAdmin ?? 0;
          const adminDalam = t.biayaAdminDalam ?? 0;
          const totalTagihan = t.totalPenagihan ?? (adminLuar > 0 ? (t.jumlah + adminLuar) : (t.jumlah + adminDalam));

          if (t.jenis === 'Tarik Tunai') {
            cashDikeluarkan += t.jumlah;
          } else if (!t.isKasbon) {
            // Hanya tambah kas jika bukan kasbon
            cashDiterima += totalTagihan;
          }
        }
      });

      // Cicilan kasbon yang diterima
      let cicilanKasbonMasuk = 0;
      let standaloneKasbonKeluar = 0;

      const transactionKasbonIds = new Set(
        transactions.filter((t) => t.kasbonId).map((t) => t.kasbonId)
      );

      kasbons.forEach((k) => {
        // Pembayaran cicilan yang masuk
        const terbayar = (k.riwayatPembayaran || []).reduce((sum, r) => sum + r.jumlah, 0);
        cicilanKasbonMasuk += terbayar;

        // Jika kasbon berdiri sendiri (bukan dari transaksi transfer), kasbon tunai ini mengeluarkan uang kas
        if (!transactionKasbonIds.has(k.id)) {
          standaloneKasbonKeluar += k.totalKasbon;
        }
      });

      const totalBalance = awal + mutasiMasuk - mutasiKeluar + cashDiterima + cicilanKasbonMasuk - cashDikeluarkan - standaloneKasbonKeluar - totalPengeluaran;

      return {
        totalBalance,
        awal,
        mutasiMasuk,
        mutasiKeluar,
        trxMasuk: cashDiterima + cicilanKasbonMasuk,
        trxKeluar: cashDikeluarkan + standaloneKasbonKeluar,
        pengeluaran: totalPengeluaran
      };
    } else {
      // DIGITAL PROVIDER Mechanics (e.g. BriLink, Dana, QRIS, etc.):
      // - Saldo provider berkurang saat Transfer/TopUp/Pembayaran (Nominal + Admin Dalam)
      // + Saldo provider bertambah saat Tarik Tunai (terima nominal dari pelanggan)
      // - Pengeluaran toko jika diambil dari platform ini
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

      const totalBalance = awal + mutasiMasuk - mutasiKeluar - providerBerkurang + providerBertambah - totalPengeluaran;

      return {
        totalBalance,
        awal,
        mutasiMasuk,
        mutasiKeluar,
        trxMasuk: providerBertambah,
        trxKeluar: providerBerkurang,
        pengeluaran: totalPengeluaran
      };
    }
  };

  const getPlatformCurrentBalance = (platformName: string) => {
    return getPlatformDetails(platformName).totalBalance;
  };

  // Handle Set Saldo Awal
  const handleSaveSaldoAwal = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseThousand(nominalAwalInput);
    setSaldoAwalMap((prev) => ({
      ...prev,
      [selectedPlatformForAwal]: val
    }));
    setShowSaldoAwalModal(false);
    setNominalAwalInput('');
  };

  // Handle Add Mutasi / Isi Saldo Baru
  const handleAddMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    const nominalNum = parseThousand(mutasiNominal);
    if (nominalNum <= 0) return;

    const currentBal = getPlatformCurrentBalance(mutasiPlatform);
    const newBal = mutasiJenis === 'Masuk' ? currentBal + nominalNum : currentBal - nominalNum;

    const now = new Date();
    const dateStr = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;

    const newMutasi: MutasiSaldoItem = {
      id: `MUT-${Date.now().toString().slice(-6)}`,
      waktu: dateStr,
      jenis: mutasiJenis,
      nominal: nominalNum,
      saldoSebelum: currentBal,
      saldoSesudah: newBal,
      sumber: mutasiSumber.trim() || `Isi Saldo ${mutasiPlatform}`,
      platform: mutasiPlatform
    };

    setMutasis([newMutasi, ...mutasis]);
    setShowAddMutasiModal(false);
    setMutasiNominal('');
    setMutasiSumber('');
  };

  // Handle Open Edit Mutasi
  const handleOpenEditMutasi = (m: MutasiSaldoItem) => {
    setEditingMutasiItem(m);
    const parts = m.waktu.split(' ');
    const fallbackNow = new Date();
    setEditMutasiDate(parts[0] || fallbackNow.toISOString().slice(0, 10));
    setEditMutasiTime(parts[1] || fallbackNow.toTimeString().slice(0, 5));
    setEditMutasiPlatform(m.platform || platforms[0] || 'BriLink');
    setEditMutasiJenis(m.jenis);
    setEditMutasiNominalStr(formatThousand(m.nominal));
    setEditMutasiSumber(m.sumber);
  };

  // Handle Save Edit Mutasi
  const handleSaveEditMutasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMutasiItem) return;

    const nominalNum = parseThousand(editMutasiNominalStr);
    if (nominalNum <= 0) {
      alert('Nominal mutasi harus lebih dari Rp 0');
      return;
    }

    const formattedWaktu = `${editMutasiDate} ${editMutasiTime}`;
    const currentBal = editingMutasiItem.saldoSebelum;
    const newBal = editMutasiJenis === 'Masuk' ? currentBal + nominalNum : currentBal - nominalNum;

    setMutasis(
      mutasis.map((item) => {
        if (item.id === editingMutasiItem.id) {
          return {
            ...item,
            waktu: formattedWaktu,
            platform: editMutasiPlatform,
            jenis: editMutasiJenis,
            nominal: nominalNum,
            saldoSesudah: newBal,
            sumber: editMutasiSumber.trim() || `Mutasi ${editMutasiPlatform}`
          };
        }
        return item;
      })
    );

    setEditingMutasiItem(null);
  };

  // Handle Transfer / Pindah Saldo Antar Platform
  const handlePindahSaldo = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferFrom === transferTo) {
      alert('Platform asal dan platform tujuan tidak boleh sama!');
      return;
    }

    const nominal = parseThousand(transferNominalStr);
    let biaya = parseThousand(transferBiayaStr);
    if (adminPotongDari === 'none') {
      biaya = 0;
    }

    if (nominal <= 0) {
      alert('Nominal pindah saldo harus lebih dari Rp 0');
      return;
    }

    if (adminPotongDari === 'tujuan' && biaya > nominal) {
      alert('Biaya admin tidak boleh lebih besar dari nominal yang dipindahkan!');
      return;
    }

    const now = new Date();
    const dateStr = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`;
    const catatanText = transferCatatan.trim() ? ` (${transferCatatan.trim()})` : '';

    let nominalKeluar = nominal;
    let nominalMasuk = nominal;
    let keteranganBiaya = '';

    if (biaya > 0) {
      if (adminPotongDari === 'asal') {
        nominalKeluar = nominal + biaya;
        nominalMasuk = nominal;
        keteranganBiaya = ` [Biaya Admin Rp ${biaya.toLocaleString('id-ID')} dipotong dari ${transferFrom}]`;
      } else if (adminPotongDari === 'tujuan') {
        nominalKeluar = nominal;
        nominalMasuk = nominal - biaya;
        keteranganBiaya = ` [Biaya Admin Rp ${biaya.toLocaleString('id-ID')} dipotong dari ${transferTo}]`;
      }
    }

    // Mutasi Keluar dari Asal
    const mutasiKeluarItem: MutasiSaldoItem = {
      id: `MUT-${Date.now().toString().slice(-6)}-A`,
      waktu: dateStr,
      jenis: 'Keluar',
      nominal: nominalKeluar,
      saldoSebelum: 0,
      saldoSesudah: 0,
      sumber: `Pindah Saldo ke ${transferTo}${catatanText}${keteranganBiaya}`,
      platform: transferFrom
    };

    // Mutasi Masuk ke Tujuan
    const mutasiMasukItem: MutasiSaldoItem = {
      id: `MUT-${Date.now().toString().slice(-6)}-B`,
      waktu: dateStr,
      jenis: 'Masuk',
      nominal: nominalMasuk,
      saldoSebelum: 0,
      saldoSesudah: 0,
      sumber: `Pindah Saldo dari ${transferFrom}${catatanText}${keteranganBiaya}`,
      platform: transferTo
    };

    setMutasis([mutasiKeluarItem, mutasiMasukItem, ...mutasis]);
    setShowTransferModal(false);
    setTransferNominalStr('');
    setTransferBiayaStr('');
    setAdminPotongDari('asal');
    setTransferCatatan('');
  };

  // Handle Delete Single Mutasi
  const handleDeleteSingleMutasi = (id: string) => {
    setMutasis(mutasis.filter((m) => m.id !== id));
    setDeletingMutasiItem(null);
  };

  // Handle Reset All Mutasi
  const handleResetAllMutasi = () => {
    setMutasis([]);
    setShowResetAllModal(false);
  };

  // Handle Reset Saldo Awal for a platform
  const handleResetPlatformAwal = (platformName: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus / mereset Saldo Awal platform ${platformName}?`)) {
      setSaldoAwalMap((prev) => ({
        ...prev,
        [platformName]: 0
      }));
    }
  };

  // Calculate Grand Totals:
  // 1. Total Saldo Digital: sum of all non-cash platforms
  // 2. Total Saldo Cash: cash / tunai platform
  // 3. Total Saldo + Cash: grand total
  const nonCashPlatforms = platforms.filter((p) => !isCashPlatform(p));
  const cashPlatforms = platforms.filter((p) => isCashPlatform(p));

  const totalSaldoDigital = nonCashPlatforms.reduce((sum, p) => sum + getPlatformDetails(p).totalBalance, 0);
  const totalSaldoCash = cashPlatforms.reduce((sum, p) => sum + getPlatformDetails(p).totalBalance, 0);
  const totalSaldoPlusCash = totalSaldoDigital + totalSaldoCash;

  // Filtered Mutasi List (Sorted by date and time newest first)
  const filteredMutasis = sortByDateDesc(
    mutasis.filter((m) => {
      const matchSearch =
        m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.platform && m.platform.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchPlatform =
        platformFilter === 'Semua' ||
        m.platform === platformFilter ||
        m.sumber.toLowerCase().includes(platformFilter.toLowerCase());

      const itemDate = m.waktu.split(' ')[0];
      let matchDate = true;
      if (dateFilterMode === 'hari_ini') {
        matchDate = itemDate === todayStr;
      } else if (dateFilterMode === 'bulan_ini') {
        matchDate = itemDate.startsWith(todayStr.slice(0, 7));
      } else if (dateFilterMode === 'rentang') {
        if (startDateFilter && endDateFilter) {
          matchDate = itemDate >= startDateFilter && itemDate <= endDateFilter;
        } else if (startDateFilter) {
          matchDate = itemDate >= startDateFilter;
        } else if (endDateFilter) {
          matchDate = itemDate <= endDateFilter;
        }
      }

      return matchSearch && matchPlatform && matchDate;
    })
  );

  const getPlatformBadgeColor = (p: string) => {
    const lower = p.toLowerCase();
    if (lower.includes('cash') || lower.includes('tunai')) return 'bg-emerald-600 text-white';
    if (lower.includes('bri')) return 'bg-blue-600 text-white';
    if (lower.includes('dana')) return 'bg-sky-500 text-white';
    if (lower.includes('shopee')) return 'bg-orange-500 text-white';
    if (lower.includes('qris')) return 'bg-[#006c49] text-white';
    return 'bg-purple-600 text-white';
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-4 sm:space-y-6 pb-12 w-full max-w-full">
      {/* Header Bar - Stacked Vertically on Mobile */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-[#c6c6cd] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5 w-full">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Manajemen Saldo & Mutasi Platform</h2>
          <p className="text-xs sm:text-sm text-[#45464d] mt-0.5">
            Kelola saldo awal, isi saldo provider, dan pantau riwayat mutasi kasir agen secara akurat.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setTransferFrom(platforms[0] || 'BriLink');
              setTransferTo(platforms.find((p) => p !== platforms[0]) || 'Cash / Tunai');
              setTransferNominalStr('');
              setTransferBiayaStr('');
              setTransferCatatan('');
              setShowTransferModal(true);
            }}
            className="w-full sm:w-auto justify-center bg-purple-700 text-white hover:bg-purple-800 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            ⇄ Pindah Saldo
          </button>

          <button
            onClick={() => {
              setNominalAwalInput('');
              setShowSaldoAwalModal(true);
            }}
            className="w-full sm:w-auto justify-center bg-gray-100 text-[#0b1c30] hover:bg-gray-200 border border-[#c6c6cd] px-3.5 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            Atur Saldo Awal
          </button>

          <button
            onClick={() => {
              setMutasiNominal('');
              setMutasiSumber('');
              setShowAddMutasiModal(true);
            }}
            className="w-full sm:w-auto justify-center bg-[#006c49] text-white hover:bg-[#006c49]/90 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            + Isi / Tambah Saldo
          </button>

          <button
            onClick={onNavigateToExport}
            className="w-full sm:w-auto justify-center bg-[#f8f9ff] text-[#45464d] hover:bg-gray-200 border border-[#c6c6cd] px-3 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">ios_share</span>
            Export
          </button>
        </div>
      </div>

      {/* Summary Metrics: Total Saldo Digital (Kecuali Cash) & Total Saldo + Cash */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Saldo Digital (Semua Platform Kecuali Cash) */}
        <div className="bg-gradient-to-br from-[#004d34] to-[#006c49] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200 block">
                Total Saldo Digital (Non-Cash)
              </span>
              <p className="text-[11px] text-emerald-100/90 mt-0.5">
                Akumulasi seluruh platform provider (kecuali Cash)
              </p>
            </div>
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <span className="material-symbols-outlined text-xl text-white">account_balance_wallet</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-mono-jetbrains tracking-tight">
              Rp {totalSaldoDigital.toLocaleString('id-ID')}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-white/15 text-[10px]">
              {nonCashPlatforms.map((p) => (
                <span key={p} className="bg-white/20 px-2 py-0.5 rounded-md font-semibold text-emerald-50">
                  {p}: Rp {getPlatformDetails(p).totalBalance.toLocaleString('id-ID')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Total Saldo Kas Fisik (Cash / Tunai) */}
        <div className="bg-white p-5 rounded-2xl border border-[#c6c6cd] shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d] block">
                Saldo Kas Fisik (Tunai)
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Uang tunai fisik yang ada di laci kasir agen
              </p>
            </div>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-mono-jetbrains text-emerald-700 tracking-tight">
              Rp {totalSaldoCash.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-[#45464d] mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
              <span>Status Likuiditas Tunai</span>
              <span className="font-bold text-emerald-700">Tersedia di Kasir</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Saldo + Cash (Grand Total Modal Kasir) */}
        <div className="bg-gradient-to-br from-[#0b1c30] to-[#1e3a5f] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200 block">
                Total Saldo + Cash (Keseluruhan)
              </span>
              <p className="text-[11px] text-sky-100/90 mt-0.5">
                Total modal kerja berputar (Digital + Kas Fisik)
              </p>
            </div>
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <span className="material-symbols-outlined text-xl text-white">savings</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-bold font-mono-jetbrains text-amber-300 tracking-tight">
              Rp {totalSaldoPlusCash.toLocaleString('id-ID')}
            </div>
            <div className="text-[11px] text-sky-100/90 mt-2.5 pt-2.5 border-t border-white/15 flex items-center justify-between">
              <span>Digital: Rp {totalSaldoDigital.toLocaleString('id-ID')}</span>
              <span>+ Cash: Rp {totalSaldoCash.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Info Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950">
        <span className="material-symbols-outlined text-emerald-700 text-xl shrink-0 mt-0.5">info</span>
        <div className="space-y-1">
          <p className="font-bold text-sm text-emerald-900">
            Mekanisme Transaksi BRILink / PPOB dengan Saldo Cash vs Saldo Provider
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-[11px] text-emerald-900">
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-800 block">1. Transaksi Transfer / Top Up / Pembayaran:</span>
              <span>
                • <strong>Cash / Tunai</strong> <span className="text-emerald-700 font-bold">Bertambah</span> (+Nominal +Admin Luar, atau +Admin Dalam jika tanpa Admin Luar).<br/>
                • <strong>Saldo Provider</strong> <span className="text-red-600 font-bold">Berkurang</span> (-Nominal -Admin Dalam) terpotong dari saldo aplikasi/mesin.
              </span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-200">
              <span className="font-bold text-emerald-800 block">2. Transaksi Tarik Tunai:</span>
              <span>
                • <strong>Cash / Tunai</strong> <span className="text-red-600 font-bold">Berkurang</span> (-Nominal) diserahkan ke pelanggan.<br/>
                • <strong>Saldo Provider</strong> <span className="text-emerald-700 font-bold">Bertambah</span> (+Nominal) masuk ke EDC/Rekening agen.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Saldo Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {platforms.map((pName) => {
          const details = getPlatformDetails(pName);
          const badgeClass = getPlatformBadgeColor(pName);
          const isCash = isCashPlatform(pName);

          return (
            <div
              key={pName}
              className="bg-white p-5 rounded-2xl border border-[#c6c6cd] shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#45464d] uppercase tracking-wider">{pName}</span>
                  <span className={`${badgeClass} font-bold text-[10px] px-2 py-0.5 rounded-full uppercase`}>
                    {isCash ? 'FISIK' : pName.slice(0, 4)}
                  </span>
                </div>

                <div className="text-2xl font-bold font-mono-jetbrains text-black">
                  Rp {details.totalBalance.toLocaleString('id-ID')}
                </div>

                <div className="mt-3 text-[11px] space-y-1.5 text-[#45464d] border-t border-gray-100 pt-2 font-medium">
                  <div className="flex justify-between">
                    <span>Saldo Awal:</span>
                    <span className="font-bold text-black">Rp {details.awal.toLocaleString('id-ID')}</span>
                  </div>

                  {isCash ? (
                    <>
                      <div className="flex justify-between text-emerald-700">
                        <span>+ Masuk Transaksi:</span>
                        <span className="font-bold">+Rp {details.trxMasuk.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>- Keluar (Tarik Tunai):</span>
                        <span className="font-bold">-Rp {details.trxKeluar.toLocaleString('id-ID')}</span>
                      </div>
                      {details.pengeluaran > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>- Pengeluaran Toko:</span>
                          <span className="font-bold">-Rp {details.pengeluaran.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-red-600">
                        <span>- Terpotong (Nominal + Admin Dalam):</span>
                        <span className="font-bold">-Rp {details.trxKeluar.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>+ Masuk (Tarik Tunai):</span>
                        <span className="font-bold">+Rp {details.trxMasuk.toLocaleString('id-ID')}</span>
                      </div>
                      {details.pengeluaran > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>- Pengeluaran Toko:</span>
                          <span className="font-bold">-Rp {details.pengeluaran.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </>
                  )}

                  {(details.mutasiMasuk > 0 || details.mutasiKeluar > 0) && (
                    <div className="flex justify-between text-blue-700 pt-1 border-t border-gray-100">
                      <span>Mutasi TopUp:</span>
                      <span className="font-bold">
                        +Rp {(details.mutasiMasuk - details.mutasiKeluar).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Card */}
              <div className="pt-2 flex items-center justify-between gap-1 border-t border-gray-100 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlatformForAwal(pName);
                    setNominalAwalInput(details.awal ? formatThousand(details.awal) : '');
                    setShowSaldoAwalModal(true);
                  }}
                  className="text-[#006c49] font-bold hover:underline flex items-center gap-0.5"
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  Edit Awal
                </button>

                {details.awal > 0 && (
                  <button
                    type="button"
                    onClick={() => handleResetPlatformAwal(pName)}
                    className="text-red-600 font-bold hover:underline flex items-center gap-0.5"
                    title="Reset Saldo Awal ke Rp 0"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    Reset
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mutasi History Table & Clear Options */}
      <div className="bg-white rounded-2xl border border-[#c6c6cd] shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-black">Riwayat Mutasi & Pengisian Saldo</h3>
            <p className="text-xs text-[#45464d]">Daftar catatan saldo masuk, saldo keluar, dan top up provider</p>
          </div>

          {mutasis.length > 0 && (
            <button
              onClick={() => setShowResetAllModal(true)}
              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              Hapus Semua Mutasi
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Cari ID mutasi, keterangan, provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-[#c6c6cd] rounded-xl text-xs bg-white text-black"
              />
            </div>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="p-2 border border-[#c6c6cd] rounded-xl text-xs bg-white font-medium text-black"
            >
              <option value="Semua">Semua Provider</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter Bar */}
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-semibold text-[#45464d] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                Filter Tanggal:
              </span>
              <button
                type="button"
                onClick={() => setDateFilterMode('semua')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  dateFilterMode === 'semua'
                    ? 'bg-[#006c49] text-white shadow-xs'
                    : 'bg-gray-100 text-[#45464d] hover:bg-gray-200'
                }`}
              >
                Semua Data
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode('bulan_ini')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  dateFilterMode === 'bulan_ini'
                    ? 'bg-[#006c49] text-white shadow-xs'
                    : 'bg-gray-100 text-[#45464d] hover:bg-gray-200'
                }`}
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode('hari_ini')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  dateFilterMode === 'hari_ini'
                    ? 'bg-[#006c49] text-white shadow-xs'
                    : 'bg-gray-100 text-[#45464d] hover:bg-gray-200'
                }`}
              >
                Hari Ini
              </button>

              {/* Custom Range */}
              <div className={`flex flex-wrap sm:flex-nowrap items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${
                dateFilterMode === 'rentang'
                  ? 'bg-emerald-50/50 border-[#006c49] ring-1 ring-[#006c49]'
                  : 'bg-gray-50 border-[#c6c6cd]'
              }`}>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-gray-500">Dari:</span>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => {
                      setStartDateFilter(e.target.value);
                      setDateFilterMode('rentang');
                    }}
                    className="text-xs font-bold text-black bg-transparent outline-none cursor-pointer"
                  />
                </div>
                <span className="text-[11px] font-bold text-gray-400">s/d</span>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-gray-500">Sampai:</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => {
                      setEndDateFilter(e.target.value);
                      setDateFilterMode('rentang');
                    }}
                    className="text-xs font-bold text-black bg-transparent outline-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-gray-500 font-mono-jetbrains">
              Menampilkan <strong>{filteredMutasis.length}</strong> dari {mutasis.length} mutasi
            </div>
          </div>
        </div>

        {/* Mutasi Table (Scrollable table with 5 rows view height + sticky header) */}
        <div className="overflow-x-auto border border-[#c6c6cd]/60 rounded-xl w-full max-h-[380px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[680px]">
            <thead className="sticky top-0 z-10 bg-[#eff4ff]">
              <tr className="bg-[#eff4ff] text-[#45464d] font-bold border-b border-[#c6c6cd] text-xs">
                <th className="p-3 bg-[#eff4ff]">ID Mutasi</th>
                <th className="p-3 bg-[#eff4ff]">Waktu</th>
                <th className="p-3 bg-[#eff4ff]">Provider</th>
                <th className="p-3 bg-[#eff4ff]">Jenis</th>
                <th className="p-3 bg-[#eff4ff]">Sumber / Keterangan</th>
                <th className="p-3 bg-[#eff4ff] text-right">Nominal</th>
                <th className="p-3 bg-[#eff4ff] text-right">Saldo Akhir</th>
                <th className="p-3 bg-[#eff4ff] text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/40 text-xs">
              {filteredMutasis.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500 font-medium">
                    Belum ada riwayat mutasi saldo. Klik <strong>+ Isi / Tambah Saldo</strong> di atas untuk menambah.
                  </td>
                </tr>
              ) : (
                filteredMutasis.map((m) => (
                  <tr key={m.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-3 font-mono-jetbrains font-bold text-black">{m.id}</td>
                    <td className="p-3 text-[#45464d]">{m.waktu}</td>
                    <td className="p-3 font-bold text-black">{m.platform || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          m.jenis === 'Masuk' ? 'bg-emerald-100 text-[#00714d]' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {m.jenis === 'Masuk' ? '↑ Masuk' : '↓ Keluar'}
                      </span>
                    </td>
                    <td className="p-3 text-black font-medium">{m.sumber}</td>
                    <td
                      className={`p-3 text-right font-mono-jetbrains font-bold ${
                        m.jenis === 'Masuk' ? 'text-[#006c49]' : 'text-red-600'
                      }`}
                    >
                      {m.jenis === 'Masuk' ? '+' : '-'} Rp {m.nominal.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-right font-mono-jetbrains font-semibold text-black">
                      Rp {m.saldoSesudah.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditMutasi(m)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit / Ubah Mutasi Ini"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingMutasiItem(m)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Hapus Isi Saldo Ini"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Pindah Saldo Antar Platform */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-700 text-2xl">swap_horiz</span>
                <h3 className="font-bold text-lg text-black">Pindah Saldo Antar Platform</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handlePindahSaldo} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-purple-50 p-3 rounded-xl border border-purple-200">
                <div>
                  <label className="font-bold text-purple-900 block mb-1">Dari (Platform Asal)</label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full p-2 border border-purple-300 rounded-lg text-xs bg-white text-black font-bold"
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-purple-900 block mb-1">Ke (Platform Tujuan)</label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full p-2 border border-purple-300 rounded-lg text-xs bg-white text-black font-bold"
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Nominal Pindah Saldo (Rp)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 500.000"
                  value={transferNominalStr}
                  onChange={(e) => {
                    const raw = parseThousand(e.target.value);
                    setTransferNominalStr(raw > 0 ? formatThousand(raw) : '');
                  }}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-base font-bold font-mono-jetbrains text-black bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Biaya Admin / Transfer (Rp - Opsional)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={adminPotongDari === 'none' ? '0' : transferBiayaStr}
                  onChange={(e) => {
                    const raw = parseThousand(e.target.value);
                    setTransferBiayaStr(raw > 0 ? formatThousand(raw) : '');
                    if (raw > 0 && adminPotongDari === 'none') {
                      setAdminPotongDari('asal');
                    }
                  }}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-sm font-bold font-mono-jetbrains text-black bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Admin Potong Dari:</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdminPotongDari('asal')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors flex flex-col items-center justify-center text-center ${
                      adminPotongDari === 'asal'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span>Platform Asal</span>
                    <span className="text-[10px] font-normal opacity-90 truncate max-w-full">
                      ({transferFrom})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminPotongDari('tujuan')}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors flex flex-col items-center justify-center text-center ${
                      adminPotongDari === 'tujuan'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span>Platform Tujuan</span>
                    <span className="text-[10px] font-normal opacity-90 truncate max-w-full">
                      ({transferTo})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAdminPotongDari('none');
                      setTransferBiayaStr('');
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors flex flex-col items-center justify-center text-center ${
                      adminPotongDari === 'none'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <span>Tanpa Admin</span>
                    <span className="text-[10px] font-normal opacity-90">(Gratis / Rp 0)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Catatan / Alasan Pindah Saldo</label>
                <input
                  type="text"
                  placeholder="Contoh: Tarik tunai BriLink ke laci kasir atau isi saldo Dana"
                  value={transferCatatan}
                  onChange={(e) => setTransferCatatan(e.target.value)}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-sm text-black bg-white"
                />
              </div>

              {/* Highlight summary */}
              {(() => {
                const nom = parseThousand(transferNominalStr);
                const fee = adminPotongDari === 'none' ? 0 : parseThousand(transferBiayaStr);

                let nomKeluar = nom;
                let nomMasuk = nom;

                if (fee > 0) {
                  if (adminPotongDari === 'asal') {
                    nomKeluar = nom + fee;
                    nomMasuk = nom;
                  } else if (adminPotongDari === 'tujuan') {
                    nomKeluar = nom;
                    nomMasuk = Math.max(0, nom - fee);
                  }
                }

                return (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                    <div className="font-semibold text-gray-700 flex justify-between items-center text-[11px]">
                      <span>Rincian Pindah Saldo:</span>
                      <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        Biaya Admin: {fee > 0 ? `Rp ${fee.toLocaleString('id-ID')} (${adminPotongDari === 'asal' ? `Potong ${transferFrom}` : `Potong ${transferTo}`})` : 'Rp 0 (Gratis)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-red-700">
                      <span>• {transferFrom} (Terpotong):</span>
                      <span className="font-bold font-mono-jetbrains">-Rp {nomKeluar.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700">
                      <span>• {transferTo} (Bertambah):</span>
                      <span className="font-bold font-mono-jetbrains">+Rp {nomMasuk.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-xs font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-700 text-white rounded-xl text-xs font-semibold hover:bg-purple-800 shadow-xs"
                >
                  Proses Pindah Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Set Saldo Awal */}
      {showSaldoAwalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-lg text-black">Atur Saldo Awal Provider</h3>
              <button onClick={() => setShowSaldoAwalModal(false)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveSaldoAwal} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Pilih Provider / Platform</label>
                <select
                  value={selectedPlatformForAwal}
                  onChange={(e) => {
                    setSelectedPlatformForAwal(e.target.value);
                    const existing = saldoAwalMap[e.target.value] || 0;
                    setNominalAwalInput(existing ? formatThousand(existing) : '');
                  }}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-sm bg-white text-black font-semibold"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Nominal Saldo Awal (Rp)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 10.000.000"
                  value={nominalAwalInput}
                  onChange={(e) => {
                    const raw = parseThousand(e.target.value);
                    setNominalAwalInput(raw > 0 ? formatThousand(raw) : '');
                  }}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-base font-bold font-mono-jetbrains text-black bg-white"
                />
                <span className="text-[11px] text-[#45464d] block mt-1">
                  Saldo awal ini menjadi acuan dasar kalkulasi total saldo aktif.
                </span>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSaldoAwalModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-xs font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-semibold hover:bg-[#006c49]/90 shadow-xs"
                >
                  Simpan Saldo Awal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Mutasi / Isi Saldo */}
      {showAddMutasiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-lg text-black">Tambah / Isi Saldo Provider</h3>
              <button onClick={() => setShowAddMutasiModal(false)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddMutasi} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Provider / Platform</label>
                <select
                  value={mutasiPlatform}
                  onChange={(e) => setMutasiPlatform(e.target.value)}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-sm bg-white text-black font-semibold"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Jenis Mutasi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMutasiJenis('Masuk')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      mutasiJenis === 'Masuk'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    ↑ Masuk / Top Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setMutasiJenis('Keluar')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      mutasiJenis === 'Keluar'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    ↓ Keluar / Penarikan
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Nominal (Rp)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1.000.000"
                  value={mutasiNominal}
                  onChange={(e) => {
                    const raw = parseThousand(e.target.value);
                    setMutasiNominal(raw > 0 ? formatThousand(raw) : '');
                  }}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-base font-bold font-mono-jetbrains text-black bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Sumber / Keterangan Mutasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Setoran tunai via Teller Bank BCA"
                  value={mutasiSumber}
                  onChange={(e) => setMutasiSumber(e.target.value)}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-sm text-black bg-white"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMutasiModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-xs font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-semibold hover:bg-[#006c49]/90 shadow-xs"
                >
                  Simpan Isi Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirm Single Delete */}
      {deletingMutasiItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-[#c6c6cd] space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-black">Hapus Records Isi Saldo?</h3>
              <p className="text-xs text-[#45464d] mt-1">
                Penghapusan mutasi <strong>{deletingMutasiItem.id}</strong> (Rp{' '}
                {deletingMutasiItem.nominal.toLocaleString('id-ID')}) bersifat permanen.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMutasiItem(null)}
                className="flex-1 py-2 bg-gray-100 text-black text-xs font-semibold rounded-xl hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteSingleMutasi(deletingMutasiItem.id)}
                className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirm Delete All */}
      {showResetAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-[#c6c6cd] space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-black">Hapus Semua Riwayat Mutasi?</h3>
              <p className="text-xs text-[#45464d] mt-1">
                Semua catatan riwayat pengisian dan mutasi saldo akan dikosongkan.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetAllModal(false)}
                className="flex-1 py-2 bg-gray-100 text-black text-xs font-semibold rounded-xl hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetAllMutasi}
                className="flex-1 py-2 bg-red-600 text-white text-xs font-semibold rounded-xl hover:bg-red-700 shadow-xs"
              >
                Kosongkan Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Mutasi / Pengisian Saldo */}
      {editingMutasiItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div>
                <h3 className="font-bold text-lg text-black">Edit Riwayat Mutasi / Saldo</h3>
                <p className="text-xs text-[#45464d]">
                  ID: <span className="font-mono-jetbrains font-bold text-black">{editingMutasiItem.id}</span>
                </p>
              </div>
              <button onClick={() => setEditingMutasiItem(null)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditMutasi} className="space-y-3 text-xs">
              {/* Tanggal & Waktu */}
              <div className="bg-[#f8f9ff] p-3 rounded-xl border border-[#c6c6cd]/60 space-y-2">
                <span className="font-bold text-black block text-xs">📅 Waktu Mutasi</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block text-gray-600 mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={editMutasiDate}
                      onChange={(e) => setEditMutasiDate(e.target.value)}
                      className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white text-black"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-gray-600 mb-1">Jam / Waktu</label>
                    <input
                      type="time"
                      required
                      value={editMutasiTime}
                      onChange={(e) => setEditMutasiTime(e.target.value)}
                      className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white text-black"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Provider / Platform</label>
                <select
                  value={editMutasiPlatform}
                  onChange={(e) => setEditMutasiPlatform(e.target.value)}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-sm bg-white text-black font-semibold"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Jenis Mutasi</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditMutasiJenis('Masuk')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      editMutasiJenis === 'Masuk'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    ↑ Masuk / Top Up
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMutasiJenis('Keluar')}
                    className={`py-2 rounded-xl font-bold border transition-colors ${
                      editMutasiJenis === 'Keluar'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-gray-50 text-gray-700 border-gray-300'
                    }`}
                  >
                    ↓ Keluar / Penarikan
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Nominal (Rp)</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1.000.000"
                  value={editMutasiNominalStr}
                  onChange={(e) => {
                    const raw = parseThousand(e.target.value);
                    setEditMutasiNominalStr(raw > 0 ? formatThousand(raw) : '');
                  }}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-base font-bold font-mono-jetbrains text-black bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#45464d] block mb-1">Sumber / Keterangan Mutasi</label>
                <input
                  type="text"
                  placeholder="Keterangan mutasi..."
                  value={editMutasiSumber}
                  onChange={(e) => setEditMutasiSumber(e.target.value)}
                  className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-sm text-black bg-white"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMutasiItem(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-xs font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-xl text-xs font-semibold hover:bg-[#006c49]/90 shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
