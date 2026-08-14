import React, { useState, useMemo } from 'react';
import { Customer, TransactionItem, KasbonItem, UserAccount } from '../types';

interface PelangganViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  transactions: TransactionItem[];
  kasbons: KasbonItem[];
  currentUser?: UserAccount;
  onNavigateToTransaksiWithCustomer?: (customerName: string) => void;
  onNavigateToKasbonWithCustomer?: (customerName: string, phone: string) => void;
}

export const PelangganView: React.FC<PelangganViewProps> = ({
  customers,
  setCustomers,
  transactions,
  kasbons,
  currentUser,
  onNavigateToTransaksiWithCustomer,
  onNavigateToKasbonWithCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState<Customer | null>(null);

  // Form states
  const [formNama, setFormNama] = useState('');
  const [formNoHp, setFormNoHp] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formCatatan, setFormCatatan] = useState('');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setFormNama('');
    setFormNoHp('');
    setFormAlamat('');
    setFormCatatan('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormNama(cust.nama);
    setFormNoHp(cust.noHp || '');
    setFormAlamat(cust.alamat || '');
    setFormCatatan(cust.catatan || '');
    setFormError('');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim()) {
      setFormError('Nama pelanggan wajib diisi!');
      return;
    }

    if (editingCustomer) {
      // Update
      setCustomers((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id
            ? {
                ...c,
                nama: formNama.trim(),
                noHp: formNoHp.trim(),
                alamat: formAlamat.trim(),
                catatan: formCatatan.trim(),
              }
            : c
        )
      );
      setEditingCustomer(null);
    } else {
      // Create new
      const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}-${Date.now().toString().slice(-3)}`;
      const now = new Date();
      const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const newCustomer: Customer = {
        id: newId,
        nama: formNama.trim(),
        noHp: formNoHp.trim(),
        alamat: formAlamat.trim(),
        catatan: formCatatan.trim(),
        createdAt,
      };

      setCustomers((prev) => [newCustomer, ...prev]);
      setIsAddModalOpen(false);
    }
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (window.confirm(`Yakin ingin menghapus pelanggan "${name}" dari daftar?`)) {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      if (selectedDetailCustomer?.id === id) {
        setSelectedDetailCustomer(null);
      }
    }
  };

  // Stats
  const totalCustomers = customers.length;

  const customerStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalTrxCount: number;
        totalTrxVolume: number;
        kasbonPendingCount: number;
        totalSisaKasbon: number;
      }
    >();

    customers.forEach((c) => {
      const cNameLower = c.nama.toLowerCase().trim();
      // Transactions
      const matchedTrxs = transactions.filter((t) => t.pelanggan?.toLowerCase().trim() === cNameLower);
      const trxVol = matchedTrxs.reduce((sum, t) => sum + (t.jumlah || 0), 0);

      // Kasbons
      const matchedKasbons = kasbons.filter((k) => k.namaPelanggan?.toLowerCase().trim() === cNameLower);
      const pendingKasbons = matchedKasbons.filter((k) => k.status === 'Belum Lunas');
      const sisaDebt = pendingKasbons.reduce((sum, k) => sum + (k.sisaKasbon || 0), 0);

      map.set(c.id, {
        totalTrxCount: matchedTrxs.length,
        totalTrxVolume: trxVol,
        kasbonPendingCount: pendingKasbons.length,
        totalSisaKasbon: sisaDebt,
      });
    });

    return map;
  }, [customers, transactions, kasbons]);

  const totalPiutangAll = useMemo(() => {
    let total = 0;
    customerStatsMap.forEach((val) => {
      total += val.totalSisaKasbon;
    });
    return total;
  }, [customerStatsMap]);

  const customersWithDebtCount = useMemo(() => {
    let count = 0;
    customerStatsMap.forEach((val) => {
      if (val.totalSisaKasbon > 0) count++;
    });
    return count;
  }, [customerStatsMap]);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.nama.toLowerCase().includes(q) ||
        (c.noHp && c.noHp.includes(q)) ||
        (c.alamat && c.alamat.toLowerCase().includes(q)) ||
        (c.catatan && c.catatan.toLowerCase().includes(q))
    );
  }, [customers, searchTerm]);

  return (
    <div className="max-w-[1280px] mx-auto space-y-4 sm:space-y-6 w-full max-w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-[#c6c6cd] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#006c49] font-bold text-xs uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-[18px]">group</span>
            Data Pelanggan Toko
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Manajemen Data Pelanggan</h2>
          <p className="text-xs sm:text-sm text-[#45464d] mt-0.5">
            Kelola data pelanggan, pantau riwayat transaksi, kontak WhatsApp, dan status kasbon masing-masing pelanggan.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-[#006c49] hover:bg-[#006c49]/90 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Tambah Pelanggan
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Pelanggan */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-[#45464d] block">Total Pelanggan</span>
            <h3 className="text-2xl font-bold font-mono-jetbrains text-black mt-1">{totalCustomers}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Terdaftar di sistem agen</p>
          </div>
          <div className="p-3 bg-[#d3e4fe] text-[#0b1c30] rounded-xl">
            <span className="material-symbols-outlined text-[24px]">contacts</span>
          </div>
        </div>

        {/* Pelanggan Ada Kasbon */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-[#45464d] block">Pelanggan Kasbon Aktif</span>
            <h3 className="text-2xl font-bold font-mono-jetbrains text-amber-700 mt-1">{customersWithDebtCount}</h3>
            <p className="text-xs text-amber-600 mt-0.5">Memiliki sisa hutang/kasbon</p>
          </div>
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
          </div>
        </div>

        {/* Total Piutang Kasbon */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase text-[#45464d] block">Total Piutang Belum Lunas</span>
            <h3 className="text-2xl font-bold font-mono-jetbrains text-red-600 mt-1">
              Rp {totalPiutangAll.toLocaleString('id-ID')}
            </h3>
            <p className="text-xs text-red-500 mt-0.5">Kasbon beredar di pelanggan</p>
          </div>
          <div className="p-3 bg-red-100 text-red-700 rounded-xl">
            <span className="material-symbols-outlined text-[24px]">pending_actions</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#c6c6cd] shadow-xs overflow-hidden">
        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-[#c6c6cd] bg-[#eff4ff]/60 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama, no HP, alamat pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#c6c6cd] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#006c49]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan</span>
          </div>
        </div>

        {/* Scrollable Customer Table (Display ~5 visible rows with smooth scroll) */}
        <div className="overflow-x-auto w-full max-h-[380px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-sm min-w-[720px]">
            <thead className="sticky top-0 z-10 bg-[#eff4ff] text-[#45464d] font-semibold border-b border-[#c6c6cd]">
              <tr>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">No. HP / WhatsApp</th>
                <th className="p-3.5">Alamat & Catatan</th>
                <th className="p-3.5 text-center">Status Kasbon</th>
                <th className="p-3.5 text-right">Total Transaksi</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c6c6cd]/40">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl text-gray-400">person_off</span>
                      <p className="font-semibold text-sm">Tidak ada data pelanggan yang cocok.</p>
                      <button
                        onClick={openAddModal}
                        className="mt-2 text-xs bg-[#006c49] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#006c49]/90"
                      >
                        + Tambah Pelanggan Baru
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const stats = customerStatsMap.get(cust.id) || {
                    totalTrxCount: 0,
                    totalTrxVolume: 0,
                    kasbonPendingCount: 0,
                    totalSisaKasbon: 0,
                  };

                  const cleanPhone = cust.noHp ? cust.noHp.replace(/\D/g, '') : '';
                  const waUrl = cleanPhone
                    ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}`
                    : '';

                  return (
                    <tr key={cust.id} className="hover:bg-[#f8f9ff] transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#006c49]/10 text-[#006c49] font-bold flex items-center justify-center text-sm border border-[#006c49]/20">
                            {cust.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-black text-sm block">{cust.nama}</span>
                            <span className="text-[11px] font-mono-jetbrains text-gray-400">{cust.id}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {cust.noHp ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono-jetbrains text-xs text-[#0b1c30]">{cust.noHp}</span>
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Chat WhatsApp"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">chat</span>
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>

                      <td className="p-3.5 max-w-[200px]">
                        <div className="text-xs text-gray-700 truncate" title={cust.alamat || ''}>
                          {cust.alamat || <span className="text-gray-400 italic">Tanpa alamat</span>}
                        </div>
                        {cust.catatan && (
                          <div className="text-[10px] text-gray-500 truncate mt-0.5" title={cust.catatan}>
                            📝 {cust.catatan}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 text-center">
                        {stats.totalSisaKasbon > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-600 inline-block animate-pulse"></span>
                            Kasbon: Rp {stats.totalSisaKasbon.toLocaleString('id-ID')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-[#006c49] border border-emerald-300">
                            <span className="material-symbols-outlined text-[14px]">check</span>
                            Lunas / Aman
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <span className="font-bold text-black text-xs font-mono-jetbrains block">
                          {stats.totalTrxCount} Transaksi
                        </span>
                        <span className="text-[11px] text-gray-500 font-mono-jetbrains">
                          Rp {stats.totalTrxVolume.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedDetailCustomer(cust)}
                            title="Lihat Riwayat & Detail"
                            className="p-1.5 text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button
                            onClick={() => openEditModal(cust)}
                            title="Edit Data Pelanggan"
                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(cust.id, cust.nama)}
                            title="Hapus Pelanggan"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

        {/* Footer scroll hint */}
        <div className="p-2.5 bg-gray-50 border-t border-[#c6c6cd]/50 text-center text-[11px] text-gray-500 flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-[14px]">unfold_more</span>
          <span>Daftar dapat di-scroll vertikal untuk melihat seluruh pelanggan</span>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {(isAddModalOpen || editingCustomer) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#c6c6cd] space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#006c49]/10 text-[#006c49] rounded-xl">
                  <span className="material-symbols-outlined text-[20px]">
                    {editingCustomer ? 'edit' : 'person_add'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-black">
                    {editingCustomer ? 'Edit Data Pelanggan' : 'Tambah Pelanggan Baru'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingCustomer ? `ID: ${editingCustomer.id}` : 'Simpan identitas pelanggan toko'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="text-gray-400 hover:text-black p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nama Pelanggan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bapak Subur / Ibu Ani"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#c6c6cd] rounded-xl focus:ring-2 focus:ring-[#006c49] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={formNoHp}
                  onChange={(e) => setFormNoHp(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#c6c6cd] rounded-xl focus:ring-2 focus:ring-[#006c49] focus:outline-none font-mono-jetbrains"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Alamat / Domisili
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Dusun Makmur RT 03 / Jl. Melati No. 5"
                  value={formAlamat}
                  onChange={(e) => setFormAlamat(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#c6c6cd] rounded-xl focus:ring-2 focus:ring-[#006c49] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Langganan transfer BRI, sering kasbon tempo 3 hari"
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-[#c6c6cd] rounded-xl focus:ring-2 focus:ring-[#006c49] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="flex-1 py-2.5 border border-[#c6c6cd] text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#006c49] hover:bg-[#006c49]/90 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Tambah Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Detail Modal (Transactions & Kasbon History) */}
      {selectedDetailCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#c6c6cd] space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#006c49]/10 text-[#006c49] font-bold flex items-center justify-center text-lg border border-[#006c49]/30">
                  {selectedDetailCustomer.nama.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-black">{selectedDetailCustomer.nama}</h3>
                  <p className="text-xs text-gray-500">
                    ID: {selectedDetailCustomer.id} • Terdaftar: {selectedDetailCustomer.createdAt || 'Baru'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailCustomer(null)}
                className="text-gray-400 hover:text-black p-1.5 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Quick Profile Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#f8f9ff] rounded-xl border border-[#c6c6cd]/60 text-xs">
              <div>
                <span className="text-gray-500 font-semibold block">Nomor HP / WhatsApp:</span>
                <span className="font-mono-jetbrains font-bold text-black text-sm">
                  {selectedDetailCustomer.noHp || '-'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 font-semibold block">Alamat / Lokasi:</span>
                <span className="text-gray-800 font-medium">{selectedDetailCustomer.alamat || '-'}</span>
              </div>
              {selectedDetailCustomer.catatan && (
                <div className="col-span-1 sm:col-span-2 pt-1 border-t border-gray-200">
                  <span className="text-gray-500 font-semibold block">Catatan:</span>
                  <span className="text-gray-700 italic">{selectedDetailCustomer.catatan}</span>
                </div>
              )}
            </div>

            {/* Kasbon Section for this customer */}
            <div className="space-y-2">
              <h4 className="font-bold text-sm text-black flex items-center gap-1.5">
                <span className="material-symbols-outlined text-amber-600 text-[18px]">account_balance_wallet</span>
                Riwayat Kasbon Pelanggan Ini
              </h4>

              {(() => {
                const matchedKasbons = kasbons.filter(
                  (k) => k.namaPelanggan?.toLowerCase().trim() === selectedDetailCustomer.nama.toLowerCase().trim()
                );

                if (matchedKasbons.length === 0) {
                  return <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl">Belum ada catatan kasbon.</p>;
                }

                return (
                  <div className="space-y-2">
                    {matchedKasbons.map((k) => (
                      <div
                        key={k.id}
                        className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono-jetbrains text-black">{k.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                k.status === 'Lunas'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              {k.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            Tanggal: {k.tanggal} • {k.catatan || 'Kasbon'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 block text-[10px]">Sisa Hutang:</span>
                          <span className="font-bold font-mono-jetbrains text-red-600 text-sm">
                            Rp {k.sisaKasbon.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Transactions History for this customer */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <h4 className="font-bold text-sm text-black flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#006c49] text-[18px]">receipt_long</span>
                Riwayat Transaksi Pelanggan Ini
              </h4>

              {(() => {
                const matchedTrxs = transactions.filter(
                  (t) => t.pelanggan?.toLowerCase().trim() === selectedDetailCustomer.nama.toLowerCase().trim()
                );

                if (matchedTrxs.length === 0) {
                  return (
                    <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-xl">
                      Belum ada catatan transaksi atas nama pelanggan ini.
                    </p>
                  );
                }

                return (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 rounded-xl p-2 bg-gray-50">
                    {matchedTrxs.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 bg-white rounded-lg border border-gray-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold font-mono-jetbrains text-black">{t.id}</span>
                            <span className="bg-[#d3e4fe] text-[#0b1c30] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                              {t.platform} • {t.jenis}
                            </span>
                            {t.isKasbon && (
                              <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                                KASBON
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500">{t.tanggal}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold font-mono-jetbrains text-black">
                            Rp {t.jumlah.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedDetailCustomer(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
