import React, { useState } from 'react';
import { KasbonItem, RiwayatCicilanItem, Customer } from '../types';
import { formatThousand, parseThousand } from '../utils/formatters';
import { sortByDateDesc } from '../utils/dateSorter';

interface KasbonViewProps {
  kasbons: KasbonItem[];
  setKasbons: React.Dispatch<React.SetStateAction<KasbonItem[]>>;
  customers?: Customer[];
  setCustomers?: React.Dispatch<React.SetStateAction<Customer[]>>;
  onNavigateToExport: () => void;
}

export const KasbonView: React.FC<KasbonViewProps> = ({
  kasbons,
  setKasbons,
  customers = [],
  setCustomers,
  onNavigateToExport
}) => {
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Belum Lunas' | 'Lunas'>('Semua');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Date Filter State
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonthStr = `${todayStr.slice(0, 7)}-01`;
  const [dateFilterMode, setDateFilterMode] = useState<'semua' | 'hari_ini' | 'bulan_ini' | 'rentang'>('semua');
  const [startDateFilter, setStartDateFilter] = useState<string>(firstDayOfMonthStr);
  const [endDateFilter, setEndDateFilter] = useState<string>(todayStr);

  // Installment Modal State
  const [selectedKasbonForPay, setSelectedKasbonForPay] = useState<KasbonItem | null>(null);
  const [payMode, setPayMode] = useState<'cicilan' | 'lunas'>('cicilan');
  const [payAmountStr, setPayAmountStr] = useState<string>('50.000');
  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [payTime, setPayTime] = useState<string>(() => new Date().toTimeString().slice(0, 5));
  const [payCatatan, setPayCatatan] = useState<string>('Cicilan Kasbon Tunai');
  const [payToast, setPayToast] = useState<string | null>(null);

  // History Modal State
  const [selectedKasbonForHistory, setSelectedKasbonForHistory] = useState<KasbonItem | null>(null);

  // Edit & Delete Kasbon State
  const [editingKasbon, setEditingKasbon] = useState<KasbonItem | null>(null);
  const [editKasbonNama, setEditKasbonNama] = useState('');
  const [editKasbonHp, setEditKasbonHp] = useState('');
  const [editKasbonTotalStr, setEditKasbonTotalStr] = useState('');
  const [editKasbonCatatan, setEditKasbonCatatan] = useState('');
  const [deletingKasbon, setDeletingKasbon] = useState<KasbonItem | null>(null);

  // Edit & Delete Cicilan State
  const [editingCicilan, setEditingCicilan] = useState<{
    kasbonId: string;
    cicilan: RiwayatCicilanItem;
  } | null>(null);
  const [editCicilanDate, setEditCicilanDate] = useState('');
  const [editCicilanTime, setEditCicilanTime] = useState('');
  const [editCicilanAmountStr, setEditCicilanAmountStr] = useState('');
  const [editCicilanCatatan, setEditCicilanCatatan] = useState('');

  const [deletingCicilan, setDeletingCicilan] = useState<{
    kasbonId: string;
    cicilan: RiwayatCicilanItem;
  } | null>(null);

  // Toast State for Kasbon actions
  const showToast = (msg: string) => {
    setPayToast(msg);
    setTimeout(() => setPayToast(null), 3500);
  };

  // Open Edit Kasbon
  const handleOpenEditKasbon = (k: KasbonItem) => {
    setEditingKasbon(k);
    setEditKasbonNama(k.namaPelanggan);
    setEditKasbonHp(k.noHp);
    setEditKasbonTotalStr(formatThousand(k.totalKasbon));
    setEditKasbonCatatan(k.catatan);
  };

  // Save Edit Kasbon
  const handleSaveEditKasbon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKasbon || !editKasbonNama.trim()) return;

    const newTotal = parseThousand(editKasbonTotalStr);
    if (newTotal <= 0) {
      alert('Total kasbon harus lebih dari Rp 0');
      return;
    }

    const updatedList = kasbons.map((k) => {
      if (k.id === editingKasbon.id) {
        const currentTerbayar = (k.riwayatPembayaran || []).reduce((sum, r) => sum + r.jumlah, 0);
        const newSisa = Math.max(0, newTotal - currentTerbayar);
        const isLunas = newSisa <= 0;

        return {
          ...k,
          namaPelanggan: editKasbonNama.trim(),
          noHp: editKasbonHp.trim() || '081234567890',
          totalKasbon: newTotal,
          sisaKasbon: newSisa,
          status: isLunas ? ('Lunas' as const) : ('Belum Lunas' as const),
          catatan: editKasbonCatatan.trim()
        };
      }
      return k;
    });

    setKasbons(updatedList);
    setEditingKasbon(null);
    showToast(`✅ Data kasbon ${editingKasbon.namaPelanggan} berhasil diperbarui!`);
  };

  // Confirm Delete Kasbon
  const handleConfirmDeleteKasbon = () => {
    if (!deletingKasbon) return;
    setKasbons(kasbons.filter((k) => k.id !== deletingKasbon.id));
    showToast(`🗑️ Data kasbon ${deletingKasbon.namaPelanggan} berhasil dihapus.`);
    setDeletingKasbon(null);
  };

  // Open Edit Cicilan
  const handleOpenEditCicilan = (kasbonId: string, log: RiwayatCicilanItem) => {
    setEditingCicilan({ kasbonId, cicilan: log });
    const parts = log.tanggal.split(' ');
    setEditCicilanDate(parts[0] || new Date().toISOString().split('T')[0]);
    setEditCicilanTime(parts[1] || new Date().toTimeString().slice(0, 5));
    setEditCicilanAmountStr(formatThousand(log.jumlah));
    setEditCicilanCatatan(log.catatan);
  };

  // Save Edit Cicilan
  const handleSaveEditCicilan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCicilan) return;

    const newAmount = parseThousand(editCicilanAmountStr);
    if (newAmount <= 0) {
      alert('Nominal cicilan harus lebih dari Rp 0');
      return;
    }

    const formattedDateTime = `${editCicilanDate} ${editCicilanTime}`;

    let updatedTargetKasbon: KasbonItem | null = null;

    const updatedKasbons = kasbons.map((k) => {
      if (k.id === editingCicilan.kasbonId) {
        const updatedHistory = (k.riwayatPembayaran || []).map((r) => {
          if (r.id === editingCicilan.cicilan.id) {
            return {
              ...r,
              tanggal: formattedDateTime,
              jumlah: newAmount,
              catatan: editCicilanCatatan.trim() || 'Cicilan Kasbon'
            };
          }
          return r;
        });

        // Recalculate sisaKasbon and status
        const totalTerbayarBaru = updatedHistory.reduce((sum, item) => sum + item.jumlah, 0);
        const newSisa = Math.max(0, k.totalKasbon - totalTerbayarBaru);
        const isLunas = newSisa <= 0;

        // Recalculate sisaSetelah for each log
        let runningRemaining = k.totalKasbon;
        const recalculatedHistory = updatedHistory.map((log) => {
          runningRemaining = Math.max(0, runningRemaining - log.jumlah);
          return { ...log, sisaSetelah: runningRemaining };
        });

        updatedTargetKasbon = {
          ...k,
          sisaKasbon: newSisa,
          status: isLunas ? 'Lunas' : 'Belum Lunas',
          riwayatPembayaran: recalculatedHistory
        };

        return updatedTargetKasbon;
      }
      return k;
    });

    setKasbons(updatedKasbons);
    if (updatedTargetKasbon && selectedKasbonForHistory?.id === editingCicilan.kasbonId) {
      setSelectedKasbonForHistory(updatedTargetKasbon);
    }
    setEditingCicilan(null);
    showToast(`✅ Catatan cicilan berhasil diperbarui!`);
  };

  // Confirm Delete Cicilan
  const handleConfirmDeleteCicilan = () => {
    if (!deletingCicilan) return;

    let updatedTargetKasbon: KasbonItem | null = null;

    const updatedKasbons = kasbons.map((k) => {
      if (k.id === deletingCicilan.kasbonId) {
        const filteredHistory = (k.riwayatPembayaran || []).filter(
          (r) => r.id !== deletingCicilan.cicilan.id
        );

        const totalTerbayarBaru = filteredHistory.reduce((sum, item) => sum + item.jumlah, 0);
        const newSisa = Math.max(0, k.totalKasbon - totalTerbayarBaru);
        const isLunas = newSisa <= 0;

        let runningRemaining = k.totalKasbon;
        const recalculatedHistory = filteredHistory.map((log) => {
          runningRemaining = Math.max(0, runningRemaining - log.jumlah);
          return { ...log, sisaSetelah: runningRemaining };
        });

        updatedTargetKasbon = {
          ...k,
          sisaKasbon: newSisa,
          status: isLunas ? 'Lunas' : 'Belum Lunas',
          riwayatPembayaran: recalculatedHistory
        };

        return updatedTargetKasbon;
      }
      return k;
    });

    setKasbons(updatedKasbons);
    if (updatedTargetKasbon && selectedKasbonForHistory?.id === deletingCicilan.kasbonId) {
      setSelectedKasbonForHistory(updatedTargetKasbon);
    }
    setDeletingCicilan(null);
    showToast(`🗑️ Catatan cicilan berhasil dihapus.`);
  };

  // New kasbon state
  const [nama, setNama] = useState('');
  const [hp, setHp] = useState('');
  const [nominalStr, setNominalStr] = useState<string>('100.000');
  const [catatan, setCatatan] = useState('');

  // Metrics
  const totalKasbonSemua = kasbons.reduce((acc, curr) => acc + curr.totalKasbon, 0);
  const totalSisaPiutang = kasbons.reduce((acc, curr) => acc + curr.sisaKasbon, 0);
  const totalTerbayar = totalKasbonSemua - totalSisaPiutang;

  const filtered = sortByDateDesc(
    kasbons.filter((k) => {
      const matchSearch =
        k.namaPelanggan.toLowerCase().includes(search.toLowerCase()) ||
        k.id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'Semua' || k.status === filterStatus;

      const itemDate = k.tanggal.split(' ')[0];
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

      return matchSearch && matchStatus && matchDate;
    })
  );

  const handleOpenPayModal = (kasbon: KasbonItem) => {
    const freshNow = new Date();
    setSelectedKasbonForPay(kasbon);
    setPayMode('cicilan');
    // Default pay amount to min(50000, sisaKasbon)
    setPayAmountStr(formatThousand(Math.min(50000, kasbon.sisaKasbon)));
    setPayDate(freshNow.toISOString().split('T')[0]);
    setPayTime(freshNow.toTimeString().slice(0, 5));
    setPayCatatan(`Cicilan Kasbon - ${kasbon.namaPelanggan}`);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKasbonForPay) return;

    const parsedPayAmount = parseThousand(payAmountStr);
    const amountToPay = payMode === 'lunas' ? selectedKasbonForPay.sisaKasbon : parsedPayAmount;

    if (amountToPay <= 0) {
      alert('Nominal pembayaran harus lebih dari Rp 0');
      return;
    }

    if (amountToPay > selectedKasbonForPay.sisaKasbon) {
      alert(`Nominal cicilan tidak boleh melebihi sisa piutang (Rp ${selectedKasbonForPay.sisaKasbon.toLocaleString('id-ID')})`);
      return;
    }

    const newSisa = selectedKasbonForPay.sisaKasbon - amountToPay;
    const isLunas = newSisa <= 0;
    const formattedDateTime = `${payDate} ${payTime}`;

    const newPaymentLog: RiwayatCicilanItem = {
      id: `PAY-${Math.floor(100 + Math.random() * 900)}`,
      tanggal: formattedDateTime,
      jumlah: amountToPay,
      sisaSetelah: Math.max(0, newSisa),
      catatan: payCatatan.trim() || (isLunas ? 'Pelunasan Kasbon Lunas' : 'Pembayaran Cicilan')
    };

    setKasbons(
      kasbons.map((k) => {
        if (k.id === selectedKasbonForPay.id) {
          const currentHistory = k.riwayatPembayaran || [];
          return {
            ...k,
            sisaKasbon: Math.max(0, newSisa),
            status: isLunas ? ('Lunas' as const) : ('Belum Lunas' as const),
            riwayatPembayaran: [newPaymentLog, ...currentHistory]
          };
        }
        return k;
      })
    );

    setPayToast(
      isLunas
        ? `🎉 Pembayaran Rp ${amountToPay.toLocaleString('id-ID')} berhasil. Status Kasbon ${selectedKasbonForPay.namaPelanggan} LUNAS!`
        : `✅ Cicilan Rp ${amountToPay.toLocaleString('id-ID')} dicatat. Sisa piutang: Rp ${Math.max(0, newSisa).toLocaleString('id-ID')}.`
    );

    setTimeout(() => setPayToast(null), 4000);
    setSelectedKasbonForPay(null);
  };

  const handleAddKasbon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama pelanggan wajib diisi atau dipilih dari daftar pelanggan!');
      return;
    }

    const numericNominal = parseThousand(nominalStr);
    if (numericNominal <= 0) {
      alert('Nominal kasbon harus lebih dari Rp 0');
      return;
    }

    // Check if new customer should be added to customer list
    if (setCustomers && customers) {
      const exists = customers.some(
        (c) => c.nama.toLowerCase().trim() === nama.toLowerCase().trim()
      );
      if (!exists && nama.trim()) {
        const newCust: Customer = {
          id: `CUST-${Date.now()}`,
          nama: nama.trim(),
          noHp: hp.trim() || '-',
          catatan: 'Dibuat otomatis dari pencatatan kasbon',
          createdAt: new Date().toISOString()
        };
        setCustomers([newCust, ...customers]);
      }
    }

    const newK: KasbonItem = {
      id: `KSB-00${kasbons.length + 1}`,
      namaPelanggan: nama.trim(),
      noHp: hp.trim() || '081234567890',
      tanggal: new Date().toISOString().slice(0, 10),
      totalKasbon: numericNominal,
      sisaKasbon: numericNominal,
      status: 'Belum Lunas',
      catatan: catatan.trim() || 'Kasbon transaksi',
      riwayatPembayaran: []
    };

    setKasbons([newK, ...kasbons]);
    setShowAdd(false);
    setNama('');
    setHp('');
    setNominalStr('100.000');
    setCatatan('');
    showToast(`✅ Kasbon Rp ${numericNominal.toLocaleString('id-ID')} untuk ${nama.trim()} berhasil ditambahkan.`);
  };

  const handleSelectExistingCustomer = (custName: string) => {
    setNama(custName);
    const matched = customers.find((c) => c.nama.toLowerCase() === custName.toLowerCase());
    if (matched && matched.noHp) {
      setHp(matched.noHp);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Toast Notification */}
      {payToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#006c49] text-white px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2 border border-emerald-400 animate-bounce">
          <span className="material-symbols-outlined">check_circle</span>
          <span>{payToast}</span>
        </div>
      )}

      {/* Header - Stacked Vertically on Mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 w-full">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Manajemen & Pelunasan Cicilan Kasbon</h2>
          <p className="text-xs sm:text-sm text-[#45464d] mt-0.5">
            Catat piutang pelanggan, pembayaran bertahap (cicilan), dan pelunasan Makmur Jaya Brilink.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full sm:w-auto justify-center bg-[#006c49] text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#006c49]/90 transition-colors flex items-center gap-2 shadow-xs active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">add_card</span>
            + Tambah Kasbon Baru
          </button>
          <button
            onClick={onNavigateToExport}
            className="w-full sm:w-auto justify-center bg-[#d3e4fe] text-[#0b1c30] border border-[#c6c6cd] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#dce9ff] transition-colors flex items-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
            Export Kasbon
          </button>
        </div>
      </div>

      {/* Metrics Header - 1 Col on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 w-full">
        <div className="bg-white p-4 rounded-xl border border-[#c6c6cd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#45464d] block">Total Kasbon Dicatat</span>
            <span className="text-xl font-bold font-mono-jetbrains text-black">
              Rp {totalKasbonSemua.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#006c49]">
            <span className="material-symbols-outlined">receipt_long</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#c6c6cd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 block">Total Sudah Dicicil / Terbayar</span>
            <span className="text-xl font-bold font-mono-jetbrains text-[#006c49]">
              Rp {totalTerbayar.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-[#006c49]">
            <span className="material-symbols-outlined">payments</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#c6c6cd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-red-700 block">Sisa Belum Lunas (Sisa Piutang)</span>
            <span className="text-xl font-bold font-mono-jetbrains text-[#ba1a1a]">
              Rp {totalSisaPiutang.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#ba1a1a]">
            <span className="material-symbols-outlined">pending_actions</span>
          </div>
        </div>
      </div>

      {/* Filters - Stacked on Mobile */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#c6c6cd] shadow-xs flex flex-col gap-3 w-full">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center w-full">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari ID / nama pelanggan kasbon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[#c6c6cd] rounded-lg text-sm bg-white"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-gray-400 text-[18px]">
              search
            </span>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#45464d] self-center">Status:</span>
            {(['Semua', 'Belum Lunas', 'Lunas'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === s ? 'bg-[#006c49] text-white shadow-xs' : 'bg-[#eff4ff] text-[#45464d] hover:bg-[#d3e4fe]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
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
            Menampilkan <strong>{filtered.length}</strong> dari {kasbons.length} kasbon
          </div>
        </div>
      </div>

      {/* Kasbon History Table (Scrollable table with 5 rows view height + sticky header) */}
      <div className="bg-white rounded-xl border border-[#c6c6cd] shadow-xs overflow-hidden w-full">
        <div className="p-3.5 sm:p-4 border-b border-[#c6c6cd] bg-[#eff4ff]/60 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-black text-sm sm:text-base">Daftar & Riwayat Kasbon</h3>
            <p className="text-[11px] text-gray-500">Tampilan riwayat dapat di-scroll kebawah jika lebih dari 5 data</p>
          </div>
          <span className="text-xs font-semibold text-[#006c49] bg-emerald-50 border border-[#006c49]/30 px-2.5 py-1 rounded-full font-mono-jetbrains">
            {filtered.length} Data
          </span>
        </div>

        <div className="overflow-x-auto w-full max-h-[380px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[700px]">
          <thead className="sticky top-0 z-10 bg-[#eff4ff] shadow-xs">
            <tr className="text-[#45464d] font-semibold border-b border-[#c6c6cd]">
              <th className="p-4 bg-[#eff4ff]">ID Kasbon</th>
              <th className="p-4 bg-[#eff4ff]">Pelanggan & Kontak</th>
              <th className="p-4 bg-[#eff4ff]">Tgl Buat</th>
              <th className="p-4 bg-[#eff4ff] text-right">Total Kasbon</th>
              <th className="p-4 bg-[#eff4ff] text-right">Progres Cicilan</th>
              <th className="p-4 bg-[#eff4ff] text-right">Sisa Piutang</th>
              <th className="p-4 bg-[#eff4ff] text-center">Status</th>
              <th className="p-4 bg-[#eff4ff] text-center">Aksi Pelunasan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c6c6cd]/40">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  Tidak ada catatan kasbon yang sesuai filter.
                </td>
              </tr>
            ) : (
              filtered.map((k) => {
                const terbayar = k.totalKasbon - k.sisaKasbon;
                const persen = Math.round((terbayar / k.totalKasbon) * 100);
                const countCicilan = k.riwayatPembayaran?.length || 0;

                return (
                  <tr key={k.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-4 font-mono-jetbrains font-bold text-black">{k.id}</td>
                    <td className="p-4">
                      <p className="font-bold text-black">{k.namaPelanggan}</p>
                      <p className="text-xs text-[#45464d]">{k.noHp}</p>
                      <p className="text-[11px] text-gray-500 truncate max-w-[180px]" title={k.catatan}>
                        📝 {k.catatan}
                      </p>
                    </td>
                    <td className="p-4 text-xs text-[#45464d] whitespace-nowrap">{k.tanggal}</td>
                    <td className="p-4 text-right font-mono-jetbrains font-semibold text-black">
                      Rp {k.totalKasbon.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-right font-mono-jetbrains">
                      <div className="text-xs text-[#006c49] font-bold">
                        Rp {terbayar.toLocaleString('id-ID')} ({persen}%)
                      </div>
                      <div className="w-28 bg-gray-200 h-1.5 rounded-full ml-auto mt-1 overflow-hidden">
                        <div
                          className="bg-[#006c49] h-full rounded-full transition-all duration-300"
                          style={{ width: `${persen}%` }}
                        />
                      </div>
                      <button
                        onClick={() => setSelectedKasbonForHistory(k)}
                        className="text-[11px] text-[#006c49] hover:underline font-semibold mt-1 inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">history</span>
                        {countCicilan}x Cicilan
                      </button>
                    </td>
                    <td className="p-4 text-right font-mono-jetbrains font-bold text-[#ba1a1a]">
                      Rp {k.sisaKasbon.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                          k.status === 'Lunas' ? 'bg-emerald-100 text-[#00714d]' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {k.status === 'Belum Lunas' ? (
                          <button
                            onClick={() => handleOpenPayModal(k)}
                            className="px-2.5 py-1.5 bg-[#006c49] text-white rounded-lg text-xs font-bold hover:bg-[#006c49]/90 flex items-center gap-1 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[15px]">credit_card</span>
                            Bayar
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedKasbonForHistory(k)}
                            className="px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-medium flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[14px]">receipt</span>
                            Struk
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditKasbon(k)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Kasbon"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingKasbon(k)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Kasbon"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
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

      {/* Installment Payment Modal */}
      {selectedKasbonForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-[#c6c6cd] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-black">Form Pembayaran / Cicilan Kasbon</h3>
                <p className="text-xs text-[#45464d]">Terima pembayaran tunai atau transfer cicilan kasbon</p>
              </div>
              <button
                onClick={() => setSelectedKasbonForPay(null)}
                className="text-gray-400 hover:text-black"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Selected Kasbon Info Banner */}
            <div className="bg-[#eff4ff] p-3.5 rounded-xl border border-[#d3e4fe] space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-black">{selectedKasbonForPay.namaPelanggan}</span>
                <span className="font-mono-jetbrains text-xs bg-white px-2 py-0.5 rounded border font-semibold">
                  {selectedKasbonForPay.id}
                </span>
              </div>
              <div className="grid grid-cols-2 text-xs pt-1 border-t border-blue-100 gap-1">
                <div>
                  <span className="text-gray-600 block">Total Kasbon Awal:</span>
                  <span className="font-bold font-mono-jetbrains text-black">
                    Rp {selectedKasbonForPay.totalKasbon.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-red-700 block font-semibold">Sisa Piutang Saat Ini:</span>
                  <span className="font-bold font-mono-jetbrains text-[#ba1a1a]">
                    Rp {selectedKasbonForPay.sisaKasbon.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              {/* Payment Type Selection */}
              <div>
                <label className="font-bold block mb-1.5 text-black">Jenis Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPayMode('cicilan');
                      setPayAmountStr(formatThousand(Math.min(50000, selectedKasbonForPay.sisaKasbon)));
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 font-semibold ${
                      payMode === 'cicilan'
                        ? 'border-[#006c49] bg-[#006c49]/10 text-[#006c49]'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">payments</span>
                    <div>
                      <div className="text-xs font-bold">Cicil / Partial</div>
                      <div className="text-[10px] text-gray-500 font-normal">Bayar sebagian nominal</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPayMode('lunas');
                      setPayAmountStr(formatThousand(selectedKasbonForPay.sisaKasbon));
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 font-semibold ${
                      payMode === 'lunas'
                        ? 'border-[#006c49] bg-[#006c49]/10 text-[#006c49]'
                        : 'border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <div>
                      <div className="text-xs font-bold">Pelunasan Lunas</div>
                      <div className="text-[10px] text-gray-500 font-normal">Bayar sisa Rp {selectedKasbonForPay.sisaKasbon.toLocaleString('id-ID')}</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Date & Time Picker */}
              <div className="bg-[#f8f9ff] p-3 rounded-xl border border-[#c6c6cd]/60 space-y-2">
                <span className="font-bold text-black block text-xs">📅 Waktu Pembayaran Cicilan</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold block text-gray-600 mb-1">Tanggal</label>
                    <input
                      type="date"
                      required
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold block text-gray-600 mb-1">Jam / Waktu</label>
                    <input
                      type="time"
                      required
                      value={payTime}
                      onChange={(e) => setPayTime(e.target.value)}
                      className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Nominal Input & Quick Buttons */}
              <div>
                <label className="font-bold block mb-1 text-black">Nominal Pembayaran Cicilan (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  disabled={payMode === 'lunas'}
                  placeholder="0"
                  value={payMode === 'lunas' ? formatThousand(selectedKasbonForPay.sisaKasbon) : payAmountStr}
                  onChange={(e) => setPayAmountStr(formatThousand(e.target.value))}
                  className="w-full p-2.5 border rounded-lg border-[#c6c6cd] text-base font-bold font-mono-jetbrains bg-white"
                />

                {payMode === 'cicilan' && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[50000, 100000, 200000, 500000].map((quick) => (
                      <button
                        key={quick}
                        type="button"
                        disabled={quick > selectedKasbonForPay.sisaKasbon}
                        onClick={() => setPayAmountStr(formatThousand(quick))}
                        className={`px-2.5 py-1 rounded text-xs font-mono-jetbrains border ${
                          parseThousand(payAmountStr) === quick
                            ? 'bg-[#006c49] text-white border-[#006c49]'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300'
                        } disabled:opacity-40`}
                      >
                        Rp {quick.toLocaleString('id-ID')}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPayAmountStr(formatThousand(selectedKasbonForPay.sisaKasbon))}
                      className="px-2.5 py-1 rounded text-xs font-mono-jetbrains font-bold bg-[#d3e4fe] text-[#0b1c30] border border-blue-200"
                    >
                      Sisa Lunas
                    </button>
                  </div>
                )}
              </div>

              {/* Catatan / Keterangan Pembayaran */}
              <div>
                <label className="font-semibold block mb-1 text-black">Catatan Pembayaran / Metode</label>
                <input
                  type="text"
                  placeholder="Contoh: Cicilan ke-1 tunai di agen"
                  value={payCatatan}
                  onChange={(e) => setPayCatatan(e.target.value)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs bg-white"
                />
              </div>

              {/* Live Calculation Preview */}
              {(() => {
                const effectiveAmount = payMode === 'lunas' ? selectedKasbonForPay.sisaKasbon : parseThousand(payAmountStr);
                const remainingAfter = Math.max(0, selectedKasbonForPay.sisaKasbon - effectiveAmount);
                const willBeLunas = remainingAfter === 0;

                return (
                  <div className={`p-3.5 rounded-xl border space-y-1 ${
                    willBeLunas ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'
                  }`}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">Sisa Piutang Setelah Pembayaran Ini:</span>
                      <span className={`font-mono-jetbrains font-bold text-base ${
                        willBeLunas ? 'text-[#006c49]' : 'text-amber-900'
                      }`}>
                        Rp {remainingAfter.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium flex items-center gap-1">
                      {willBeLunas ? (
                        <span className="text-[#00714d] font-bold">
                          🎉 Kasbon akan langsung berubah status menjadi LUNAS!
                        </span>
                      ) : (
                        <span className="text-amber-800">
                          ⚠️ Sisa kasbon Rp {remainingAfter.toLocaleString('id-ID')} tetap sebagai piutang pelanggan.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedKasbonForPay(null)}
                  className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-lg text-sm font-semibold hover:bg-[#006c49]/90 shadow-xs flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  Simpan Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {selectedKasbonForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-[#c6c6cd] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-black">Riwayat Cicilan & Pembayaran</h3>
                <p className="text-xs text-[#45464d]">{selectedKasbonForHistory.namaPelanggan} ({selectedKasbonForHistory.noHp})</p>
              </div>
              <button
                onClick={() => setSelectedKasbonForHistory(null)}
                className="text-gray-400 hover:text-black"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 bg-[#f8f9ff] p-3 rounded-xl border text-xs">
              <div>
                <span className="text-gray-500 block">Total Awal</span>
                <span className="font-bold font-mono-jetbrains text-black">
                  Rp {selectedKasbonForHistory.totalKasbon.toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Total Terbayar</span>
                <span className="font-bold font-mono-jetbrains text-[#006c49]">
                  Rp {(selectedKasbonForHistory.totalKasbon - selectedKasbonForHistory.sisaKasbon).toLocaleString('id-ID')}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Sisa Piutang</span>
                <span className="font-bold font-mono-jetbrains text-[#ba1a1a]">
                  Rp {selectedKasbonForHistory.sisaKasbon.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* List of Payments */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-black uppercase tracking-wider">
                Catatan Cicilan ({selectedKasbonForHistory.riwayatPembayaran?.length || 0} Trx)
              </h4>

              {(!selectedKasbonForHistory.riwayatPembayaran || selectedKasbonForHistory.riwayatPembayaran.length === 0) ? (
                <div className="p-6 text-center text-gray-500 border border-dashed rounded-xl text-xs">
                  Belum ada riwayat cicilan yang dicatat untuk kasbon ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedKasbonForHistory.riwayatPembayaran.map((log, index) => (
                    <div
                      key={log.id || index}
                      className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs flex justify-between items-center text-xs hover:border-[#006c49]"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono-jetbrains text-black">{log.id}</span>
                          <span className="text-[10px] text-gray-500">{log.tanggal}</span>
                        </div>
                        <p className="text-[#45464d] italic">{log.catatan || 'Cicilan Kasbon'}</p>
                        <p className="text-[10px] text-gray-400">
                          Sisa setelahnya: Rp {log.sisaSetelah.toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-mono-jetbrains font-bold text-sm text-[#006c49] block">
                            + Rp {log.jumlah.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-[#00714d] px-2 py-0.5 rounded-full font-bold">
                            Diterima
                          </span>
                        </div>

                        <div className="flex flex-col gap-1 border-l border-gray-100 pl-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCicilan(selectedKasbonForHistory.id, log)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Cicilan"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingCicilan({ kasbonId: selectedKasbonForHistory.id, cicilan: log })}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Cicilan"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t flex justify-end">
              <button
                onClick={() => setSelectedKasbonForHistory(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-semibold text-black"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Kasbon Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-lg text-black">Tambah Catatan Kasbon Baru</h3>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddKasbon} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-black">
                    Nama Pelanggan <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-gray-500">Pilih dari list atau ketik baru</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="kasbon-cust-datalist"
                    placeholder="Ketik atau pilih nama pelanggan..."
                    value={nama}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNama(val);
                      const matched = customers.find((c) => c.nama.toLowerCase() === val.toLowerCase());
                      if (matched && matched.noHp) {
                        setHp(matched.noHp);
                      }
                    }}
                    className="w-full p-2.5 border rounded-lg border-[#c6c6cd] text-sm bg-white font-medium text-black focus:ring-2 focus:ring-[#006c49] focus:outline-none"
                  />
                  <datalist id="kasbon-cust-datalist">
                    {customers.map((c) => (
                      <option key={c.id} value={c.nama}>
                        {c.noHp ? `${c.nama} (${c.noHp})` : c.nama}
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Quick select customer pills */}
                {customers.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1 max-h-20 overflow-y-auto pt-0.5">
                    {customers.slice(0, 6).map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => handleSelectExistingCustomer(c.nama)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                          nama.toLowerCase() === c.nama.toLowerCase()
                            ? 'bg-[#006c49] text-white border-[#006c49] font-bold'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {c.nama}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">No. WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="0812xxxxxxxx"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  className="w-full p-2.5 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Nominal Kasbon (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={nominalStr}
                  onChange={(e) => setNominalStr(formatThousand(e.target.value))}
                  className="w-full p-2.5 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains font-bold bg-white text-black"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Catatan Transaksi</label>
                <input
                  type="text"
                  placeholder="Keterangan transaksi kasbon"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full p-2.5 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-lg text-sm font-semibold hover:bg-[#006c49]/90 shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Simpan Kasbon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Kasbon Modal */}
      {editingKasbon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div>
                <h3 className="font-bold text-lg text-black">Edit Catatan Kasbon</h3>
                <p className="text-xs text-gray-500 font-mono-jetbrains font-semibold">{editingKasbon.id}</p>
              </div>
              <button onClick={() => setEditingKasbon(null)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditKasbon} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-black">
                    Nama Pelanggan <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-gray-500">Pilih atau ketik</span>
                </div>
                <input
                  type="text"
                  required
                  list="edit-kasbon-cust-datalist"
                  value={editKasbonNama}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditKasbonNama(val);
                    const matched = customers.find((c) => c.nama.toLowerCase() === val.toLowerCase());
                    if (matched && matched.noHp) {
                      setEditKasbonHp(matched.noHp);
                    }
                  }}
                  className="w-full p-2.5 border rounded-lg border-[#c6c6cd] text-sm bg-white font-medium text-black focus:ring-2 focus:ring-[#006c49]"
                />
                <datalist id="edit-kasbon-cust-datalist">
                  {customers.map((c) => (
                    <option key={c.id} value={c.nama}>
                      {c.noHp ? `${c.nama} (${c.noHp})` : c.nama}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">No. WhatsApp / HP</label>
                <input
                  type="text"
                  value={editKasbonHp}
                  onChange={(e) => setEditKasbonHp(e.target.value)}
                  className="w-full p-2.5 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Total Nominal Kasbon (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={editKasbonTotalStr}
                  onChange={(e) => setEditKasbonTotalStr(formatThousand(e.target.value))}
                  className="w-full p-2.5 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains font-bold bg-white text-black"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Catatan Transaksi</label>
                <input
                  type="text"
                  value={editKasbonCatatan}
                  onChange={(e) => setEditKasbonCatatan(e.target.value)}
                  className="w-full p-2.5 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingKasbon(null)}
                  className="flex-1 py-2.5 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] text-white rounded-lg text-sm font-semibold hover:bg-[#006c49]/90 shadow-xs flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Kasbon Modal */}
      {deletingKasbon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Hapus Data Kasbon</h3>
                <p className="text-xs text-gray-500 font-mono-jetbrains font-semibold">{deletingKasbon.id}</p>
              </div>
            </div>

            <p className="text-sm text-[#45464d] leading-relaxed">
              Apakah Anda yakin ingin menghapus data kasbon <strong className="text-black">{deletingKasbon.namaPelanggan}</strong> dengan total kasbon <strong className="text-[#006c49]">Rp {deletingKasbon.totalKasbon.toLocaleString('id-ID')}</strong>? Semua riwayat cicilannya juga akan terhapus.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingKasbon(null)}
                className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteKasbon}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cicilan Modal */}
      {editingCicilan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div>
                <h3 className="font-bold text-lg text-black">Edit Catatan Cicilan</h3>
                <p className="text-xs text-gray-500 font-mono-jetbrains font-semibold">{editingCicilan.cicilan.id}</p>
              </div>
              <button onClick={() => setEditingCicilan(null)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditCicilan} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1 text-black">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={editCicilanDate}
                    onChange={(e) => setEditCicilanDate(e.target.value)}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1 text-black">Jam</label>
                  <input
                    type="time"
                    required
                    value={editCicilanTime}
                    onChange={(e) => setEditCicilanTime(e.target.value)}
                    className="w-full p-2 border rounded-lg border-[#c6c6cd] text-xs font-mono-jetbrains bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Nominal Cicilan (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={editCicilanAmountStr}
                  onChange={(e) => setEditCicilanAmountStr(formatThousand(e.target.value))}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains font-bold bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-black">Catatan Pembayaran</label>
                <input
                  type="text"
                  value={editCicilanCatatan}
                  onChange={(e) => setEditCicilanCatatan(e.target.value)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCicilan(null)}
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

      {/* Delete Cicilan Modal */}
      {deletingCicilan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Hapus Catatan Cicilan</h3>
                <p className="text-xs text-gray-500 font-mono-jetbrains font-semibold">{deletingCicilan.cicilan.id}</p>
              </div>
            </div>

            <p className="text-sm text-[#45464d] leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan cicilan sebesar <strong className="text-[#006c49]">Rp {deletingCicilan.cicilan.jumlah.toLocaleString('id-ID')}</strong> ({deletingCicilan.cicilan.tanggal})? Sisa piutang kasbon akan disesuaikan otomatis.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCicilan(null)}
                className="flex-1 py-2.5 bg-gray-100 text-black rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCicilan}
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

