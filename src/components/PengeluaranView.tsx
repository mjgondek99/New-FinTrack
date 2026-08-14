import React, { useState } from 'react';
import { PengeluaranItem } from '../types';
import { formatThousand, parseThousand } from '../utils/formatters';
import { sortByDateDesc } from '../utils/dateSorter';

interface PengeluaranViewProps {
  pengeluaranList: PengeluaranItem[];
  setPengeluaranList: React.Dispatch<React.SetStateAction<PengeluaranItem[]>>;
  onNavigateToExport: () => void;
  platforms?: string[];
}

export const PengeluaranView: React.FC<PengeluaranViewProps> = ({
  pengeluaranList,
  setPengeluaranList,
  onNavigateToExport,
  platforms = ['Cash / Tunai', 'BriLink', 'Dana', 'Mitra Shopee', 'QRIS']
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [kategori, setKategori] = useState<'Operasional' | 'Peralatan' | 'Lainnya'>('Operasional');
  const [sumberDana, setSumberDana] = useState<string>(platforms[0] || 'Cash / Tunai');
  const [jumlahStr, setJumlahStr] = useState<string>('50.000');
  const [keterangan, setKeterangan] = useState('');

  // Edit & Delete State
  const [editingExpense, setEditingExpense] = useState<PengeluaranItem | null>(null);
  const [editKategori, setEditKategori] = useState<'Operasional' | 'Peralatan' | 'Lainnya'>('Operasional');
  const [editSumberDana, setEditSumberDana] = useState<string>('Cash / Tunai');
  const [editJumlahStr, setEditJumlahStr] = useState<string>('');
  const [editKeterangan, setEditKeterangan] = useState('');

  const [deletingExpense, setDeletingExpense] = useState<PengeluaranItem | null>(null);

  const handleOpenEdit = (p: PengeluaranItem) => {
    setEditingExpense(p);
    setEditKategori(p.kategori);
    setEditSumberDana(p.sumberDana || 'Cash / Tunai');
    setEditJumlahStr(formatThousand(p.jumlah));
    setEditKeterangan(p.keterangan);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !editKeterangan.trim()) return;

    const numericJumlah = parseThousand(editJumlahStr);
    if (numericJumlah <= 0) {
      alert('Jumlah pengeluaran harus lebih dari Rp 0');
      return;
    }

    setPengeluaranList(
      pengeluaranList.map((p) => {
        if (p.id === editingExpense.id) {
          return {
            ...p,
            kategori: editKategori,
            sumberDana: editSumberDana,
            jumlah: numericJumlah,
            keterangan: editKeterangan.trim()
          };
        }
        return p;
      })
    );

    setEditingExpense(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingExpense) return;
    setPengeluaranList(pengeluaranList.filter((p) => p.id !== deletingExpense.id));
    setDeletingExpense(null);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan.trim()) return;

    const numericJumlah = parseThousand(jumlahStr);
    if (numericJumlah <= 0) {
      alert('Jumlah pengeluaran harus lebih dari Rp 0');
      return;
    }

    const newP: PengeluaranItem = {
      id: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      kategori,
      sumberDana: sumberDana || 'Cash / Tunai',
      jumlah: numericJumlah,
      keterangan
    };

    setPengeluaranList([newP, ...pengeluaranList]);
    setShowAdd(false);
    setJumlahStr('50.000');
    setKeterangan('');
  };

  const totalExpense = pengeluaranList.reduce((acc, curr) => acc + curr.jumlah, 0);
  const sortedPengeluaran = sortByDateDesc(pengeluaranList);

  return (
    <div className="max-w-[1280px] mx-auto space-y-4 sm:space-y-6 w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 w-full">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-black">Catatan Pengeluaran Toko</h2>
          <p className="text-xs sm:text-sm text-[#45464d] mt-0.5">
            Pantau biaya operasional, perlengkapan kertas thermal, listrik, & pemeliharaan mesin EDC.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAdd(true)}
            className="w-full sm:w-auto justify-center bg-[#006c49] text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#006c49]/90 transition-colors flex items-center gap-2 shadow-xs active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            + Tambah Pengeluaran
          </button>
          <button
            onClick={onNavigateToExport}
            className="w-full sm:w-auto justify-center bg-[#d3e4fe] text-[#0b1c30] border border-[#c6c6cd] px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#dce9ff] transition-colors flex items-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
            Export Pengeluaran
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#c6c6cd] shadow-xs flex justify-between items-center w-full">
        <div>
          <span className="text-xs font-semibold text-[#45464d] uppercase">Total Pengeluaran Agustus</span>
          <h3 className="text-2xl font-bold font-mono-jetbrains text-[#ba1a1a]">
            Rp {totalExpense.toLocaleString('id-ID')}
          </h3>
        </div>
        <div className="p-3 bg-red-50 text-red-700 rounded-xl">
          <span className="material-symbols-outlined text-[28px]">payments</span>
        </div>
      </div>

      {/* Table (Horizontal scroll for history) */}
      <div className="bg-white rounded-xl border border-[#c6c6cd] shadow-xs overflow-hidden w-full">
        <div className="p-3.5 sm:p-4 border-b border-[#c6c6cd] bg-[#eff4ff]/60 flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-black text-sm sm:text-base">Riwayat Pengeluaran</h3>
            <p className="text-[11px] text-gray-500">Geser tabel ke samping untuk melihat rincian</p>
          </div>
          <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full font-mono-jetbrains">
            {pengeluaranList.length} Item
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-sm min-w-[620px]">
          <thead>
            <tr className="bg-[#eff4ff] text-[#45464d] font-semibold border-b border-[#c6c6cd]">
              <th className="p-4">ID</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Sumber Dana / Platform</th>
              <th className="p-4">Keterangan Pengeluaran</th>
              <th className="p-4 text-right">Jumlah (Rp)</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#c6c6cd]/40">
            {sortedPengeluaran.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Belum ada catatan pengeluaran toko.
                </td>
              </tr>
            ) : (
              sortedPengeluaran.map((p) => {
                const sDana = p.sumberDana || 'Cash / Tunai';
                const isCash = sDana.toLowerCase().includes('cash') || sDana.toLowerCase().includes('tunai');
                return (
                  <tr key={p.id} className="hover:bg-[#f8f9ff]">
                    <td className="p-4 font-mono-jetbrains font-bold text-black">{p.id}</td>
                    <td className="p-4 text-xs text-[#45464d]">{p.tanggal}</td>
                    <td className="p-4">
                      <span className="bg-[#d3e4fe]/80 text-[#0b1c30] px-2.5 py-1 rounded text-xs font-medium">
                        {p.kategori}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          isCash ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {sDana}
                      </span>
                    </td>
                    <td className="p-4 text-black font-medium">{p.keterangan}</td>
                    <td className="p-4 text-right font-mono-jetbrains font-bold text-[#ba1a1a]">
                      Rp {p.jumlah.toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Pengeluaran"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingExpense(p)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Pengeluaran"
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

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <h3 className="font-bold text-lg text-black border-b pb-2">Catat Pengeluaran Baru</h3>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Kategori</label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as any)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                >
                  <option value="Operasional">Operasional</option>
                  <option value="Peralatan">Peralatan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Sumber Dana / Platform</label>
                <select
                  value={sumberDana}
                  onChange={(e) => setSumberDana(e.target.value)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-semibold bg-white text-black"
                >
                  {platforms.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-[#45464d] block mt-1">
                  Saldo dari platform ini akan dipotong secara otomatis sebesar jumlah pengeluaran.
                </span>
              </div>

              <div>
                <label className="font-semibold block mb-1">Jumlah Pengeluaran (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0"
                  value={jumlahStr}
                  onChange={(e) => setJumlahStr(formatThousand(e.target.value))}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains font-bold bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Keterangan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kertas Thermal 10 Roll"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#006c49] text-white rounded-lg text-sm font-semibold hover:bg-[#006c49]/90 shadow-xs"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <div>
                <h3 className="font-bold text-lg text-black">Edit Catatan Pengeluaran</h3>
                <p className="text-xs text-gray-500 font-mono-jetbrains font-semibold">{editingExpense.id}</p>
              </div>
              <button onClick={() => setEditingExpense(null)} className="text-gray-400 hover:text-black">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Kategori</label>
                <select
                  value={editKategori}
                  onChange={(e) => setEditKategori(e.target.value as any)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                >
                  <option value="Operasional">Operasional</option>
                  <option value="Peralatan">Peralatan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Sumber Dana / Platform</label>
                <select
                  value={editSumberDana}
                  onChange={(e) => setEditSumberDana(e.target.value)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-semibold bg-white text-black"
                >
                  {platforms.map((plat) => (
                    <option key={plat} value={plat}>
                      {plat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Jumlah Pengeluaran (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={editJumlahStr}
                  onChange={(e) => setEditJumlahStr(formatThousand(e.target.value))}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm font-mono-jetbrains font-bold bg-white"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Keterangan</label>
                <input
                  type="text"
                  required
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full p-2 border rounded-lg border-[#c6c6cd] text-sm bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
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

      {/* Delete Modal */}
      {deletingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-[#c6c6cd] space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <span className="material-symbols-outlined text-[28px]">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg text-black">Hapus Catatan Pengeluaran</h3>
                <p className="text-xs text-[#45464d] font-mono-jetbrains font-semibold">{deletingExpense.id}</p>
              </div>
            </div>

            <p className="text-sm text-[#45464d] leading-relaxed">
              Apakah Anda yakin ingin menghapus catatan pengeluaran <strong className="text-black">{deletingExpense.keterangan}</strong> sebesar <strong className="text-red-600">Rp {deletingExpense.jumlah.toLocaleString('id-ID')}</strong>?
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
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
