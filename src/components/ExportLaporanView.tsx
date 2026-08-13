import React, { useState } from 'react';
import {
  ExportTransaksiFilter,
  ExportKasbonFilter,
  ExportPengeluaranFilter,
  ExportMutasiFilter,
  TransactionItem,
  KasbonItem,
  PengeluaranItem,
  MutasiSaldoItem,
  LoginLogItem
} from '../types';

interface ExportLaporanViewProps {
  transactions: TransactionItem[];
  kasbons: KasbonItem[];
  pengeluaranList: PengeluaranItem[];
  mutasis: MutasiSaldoItem[];
  loginLogs: LoginLogItem[];
  platforms?: string[];
}

export const ExportLaporanView: React.FC<ExportLaporanViewProps> = ({
  transactions,
  kasbons,
  pengeluaranList,
  mutasis,
  loginLogs,
  platforms = ['BriLink', 'Dana', 'Mitra Shopee', 'QRIS', 'Transfer Bank']
}) => {
  // Transaksi Filter State
  const [transaksiFilter, setTransaksiFilter] = useState<ExportTransaksiFilter>({
    startDate: '2026-08-01',
    endDate: '2026-08-11',
    platform: 'Semua Platform'
  });

  // Kasbon Filter State
  const [kasbonFilter, setKasbonFilter] = useState<ExportKasbonFilter>({
    status: 'Semua Status',
    searchPelanggan: ''
  });

  // Pengeluaran Filter State
  const [pengeluaranFilter, setPengeluaranFilter] = useState<ExportPengeluaranFilter>({
    kategori: 'Semua Kategori',
    bulan: '2026-08'
  });

  // Mutasi Filter State
  const [mutasiFilter, setMutasiFilter] = useState<ExportMutasiFilter>({
    startDate: '2026-08-01',
    endDate: '2026-08-11'
  });

  // Download feedback toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Helper to trigger file download
  const downloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export Transaksi (PDF / Excel)
  const handleExportTransaksi = (format: 'pdf' | 'excel') => {
    let filtered = transactions;
    if (transaksiFilter.platform !== 'Semua Platform') {
      filtered = filtered.filter((t) => t.platform === transaksiFilter.platform);
    }

    if (format === 'excel') {
      let csv = 'ID Transaksi,Tanggal,Platform,Jenis,Jumlah (Rp),Biaya Admin (Rp),Status,Pelanggan\n';
      filtered.forEach((t) => {
        csv += `"${t.id}","${t.tanggal}","${t.platform}","${t.jenis}",${t.jumlah},${t.biayaAdmin},"${t.status}","${t.pelanggan}"\n`;
      });
      downloadFile(
        `Laporan_Transaksi_${transaksiFilter.platform.replace(/\s+/g, '_')}_${transaksiFilter.startDate}_to_${transaksiFilter.endDate}.csv`,
        csv,
        'text/csv;charset=utf-8;'
      );
      showToast(`⚡ File Excel Transaksi (${filtered.length} data) berhasil diunduh.`);
    } else {
      // PDF Simulation / Printable View
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const html = `
          <html>
            <head>
              <title>Laporan Transaksi - FinTrack</title>
              <style>
                body { font-family: sans-serif; padding: 20px; color: #0b1c30; }
                h1 { color: #006c49; border-bottom: 2px solid #006c49; padding-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #c6c6cd; padding: 8px; text-align: left; font-size: 13px; }
                th { background-color: #eff4ff; font-weight: bold; }
                .amount { text-align: right; font-family: monospace; }
                .footer { margin-top: 30px; font-size: 11px; color: #76777d; }
              </style>
            </head>
            <body>
              <h1>FinTrack - Laporan Transaksi</h1>
              <p><strong>Agen:</strong> Makmur Jaya Brilink | <strong>Periode:</strong> ${transaksiFilter.startDate} s/d ${transaksiFilter.endDate} | <strong>Platform:</strong> ${transaksiFilter.platform}</p>
              <table>
                <thead>
                  <tr>
                    <th>ID Transaksi</th>
                    <th>Tanggal</th>
                    <th>Platform</th>
                    <th>Jenis</th>
                    <th>Pelanggan</th>
                    <th>Jumlah</th>
                    <th>Biaya Admin</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered
                    .map(
                      (t) => `
                    <tr>
                      <td>${t.id}</td>
                      <td>${t.tanggal}</td>
                      <td>${t.platform}</td>
                      <td>${t.jenis}</td>
                      <td>${t.pelanggan}</td>
                      <td class="amount">Rp ${t.jumlah.toLocaleString('id-ID')}</td>
                      <td class="amount">Rp ${t.biayaAdmin.toLocaleString('id-ID')}</td>
                      <td>${t.status}</td>
                    </tr>
                  `
                    )
                    .join('')}
                </tbody>
              </table>
              <div class="footer">Dicetak otomatis dari FinTrack Agen Makmur Jaya Brilink pada ${new Date().toLocaleString('id-ID')}</div>
              <script>window.print();</script>
            </body>
          </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
      }
      showToast(`📄 Dokumen PDF Transaksi siap dicetak / disimpan.`);
    }
  };

  // Export Kasbon
  const handleExportKasbon = () => {
    let filtered = kasbons;
    if (kasbonFilter.status !== 'Semua Status') {
      filtered = filtered.filter((k) => k.status === kasbonFilter.status);
    }
    if (kasbonFilter.searchPelanggan.trim() !== '') {
      filtered = filtered.filter((k) =>
        k.namaPelanggan.toLowerCase().includes(kasbonFilter.searchPelanggan.toLowerCase())
      );
    }

    let csv = 'ID Kasbon,Nama Pelanggan,No HP,Tanggal,Total Kasbon (Rp),Sisa Kasbon (Rp),Status,Catatan\n';
    filtered.forEach((k) => {
      csv += `"${k.id}","${k.namaPelanggan}","${k.noHp}","${k.tanggal}",${k.totalKasbon},${k.sisaKasbon},"${k.status}","${k.catatan}"\n`;
    });

    downloadFile(`Laporan_Kasbon_${kasbonFilter.status.replace(/\s+/g, '_')}.csv`, csv, 'text/csv;charset=utf-8;');
    showToast(`⚡ Laporan Kasbon (${filtered.length} data) berhasil diunduh.`);
  };

  // Export Pengeluaran
  const handleExportPengeluaran = () => {
    let filtered = pengeluaranList;
    if (pengeluaranFilter.kategori !== 'Semua Kategori') {
      filtered = filtered.filter((p) => p.kategori === pengeluaranFilter.kategori);
    }
    if (pengeluaranFilter.bulan) {
      filtered = filtered.filter((p) => p.tanggal.startsWith(pengeluaranFilter.bulan));
    }

    let csv = 'ID Pengeluaran,Tanggal,Kategori,Jumlah (Rp),Keterangan\n';
    filtered.forEach((p) => {
      csv += `"${p.id}","${p.tanggal}","${p.kategori}",${p.jumlah},"${p.keterangan}"\n`;
    });

    downloadFile(
      `Laporan_Pengeluaran_${pengeluaranFilter.kategori.replace(/\s+/g, '_')}_${pengeluaranFilter.bulan}.csv`,
      csv,
      'text/csv;charset=utf-8;'
    );
    showToast(`⚡ Laporan Pengeluaran (${filtered.length} data) berhasil diunduh.`);
  };

  // Export Mutasi Saldo
  const handleExportMutasi = () => {
    let csv = 'ID Mutasi,Waktu,Jenis,Nominal (Rp),Saldo Sebelum (Rp),Saldo Sesudah (Rp),Sumber\n';
    mutasis.forEach((m) => {
      csv += `"${m.id}","${m.waktu}","${m.jenis}",${m.nominal},${m.saldoSebelum},${m.saldoSesudah},"${m.sumber}"\n`;
    });

    downloadFile(
      `Laporan_Mutasi_Saldo_${mutasiFilter.startDate}_to_${mutasiFilter.endDate}.csv`,
      csv,
      'text/csv;charset=utf-8;'
    );
    showToast(`⚡ Mutasi Saldo (${mutasis.length} data) berhasil diunduh.`);
  };

  // Download Login Log
  const handleDownloadLoginLogs = () => {
    let csv = 'ID Log,Perangkat,Waktu,IP Address,Browser\n';
    loginLogs.forEach((l) => {
      csv += `"${l.id}","${l.device}","${l.waktu}","${l.ip}","${l.browser}"\n`;
    });

    downloadFile('Riwayat_Login_Makmur_Jaya_Brilink.csv', csv, 'text/csv;charset=utf-8;');
    showToast(`⚡ File Riwayat Login Keamanan berhasil diunduh.`);
  };

  return (
    <div className="max-w-[1280px] mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#131b2e] text-white px-5 py-3 rounded-xl shadow-2xl border border-[#6cf8bb]/40 flex items-center gap-3 animate-bounce">
          <span className="material-symbols-outlined text-[#6cf8bb]">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header Title */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-black">
          Pusat Unduhan Data
        </h2>
        <p className="text-base text-[#45464d] mt-2 font-normal">
          Pilih kategori laporan untuk di-export ke format PDF atau Excel.
        </p>
      </div>

      {/* Bento Grid layout */}
      <div className="bento-grid">
        {/* Export Transaksi Card (Large - Spans 2 cols on desktop) */}
        <div className="glass-card rounded-xl p-6 shadow-xs border border-[#c6c6cd] bg-white bento-item-large hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-[#eff4ff] w-32 h-32 opacity-50 group-hover:scale-110 transition-transform pointer-events-none">
            <span className="material-symbols-outlined text-[120px]" data-icon="receipt_long">
              receipt_long
            </span>
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#006c49]/10 text-[#006c49] rounded-lg">
                <span className="material-symbols-outlined text-[20px]" data-icon="receipt_long">
                  receipt_long
                </span>
              </div>
              <h3 className="text-xl font-semibold text-black">Export Transaksi</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#45464d] uppercase tracking-wider">
                  Rentang Waktu
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={transaksiFilter.startDate}
                    onChange={(e) =>
                      setTransaksiFilter({ ...transaksiFilter, startDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#c6c6cd] bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] text-sm font-normal text-[#0b1c30] py-2 px-3"
                  />
                  <span className="self-center text-[#45464d] font-medium">-</span>
                  <input
                    type="date"
                    value={transaksiFilter.endDate}
                    onChange={(e) =>
                      setTransaksiFilter({ ...transaksiFilter, endDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#c6c6cd] bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] text-sm font-normal text-[#0b1c30] py-2 px-3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#45464d] uppercase tracking-wider">
                  Platform
                </label>
                <select
                  value={transaksiFilter.platform}
                  onChange={(e) =>
                    setTransaksiFilter({ ...transaksiFilter, platform: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#c6c6cd] bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] text-sm font-normal text-[#0b1c30] py-2 px-3"
                >
                  <option>Semua Platform</option>
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-[#c6c6cd]/50">
              <button
                onClick={() => handleExportTransaksi('pdf')}
                className="flex-1 bg-[#006c49] text-white py-2.5 px-4 rounded-lg font-semibold text-base hover:bg-[#006c49]/90 transition-colors flex items-center justify-center gap-2 shadow-xs active:scale-98"
              >
                <span className="material-symbols-outlined text-[20px]" data-icon="picture_as_pdf">
                  picture_as_pdf
                </span>
                <span>PDF</span>
              </button>
              <button
                onClick={() => handleExportTransaksi('excel')}
                className="flex-1 bg-[#d3e4fe] text-[#0b1c30] py-2.5 px-4 rounded-lg font-semibold text-base hover:bg-[#dce9ff] transition-colors flex items-center justify-center gap-2 border border-[#c6c6cd] active:scale-98"
              >
                <span className="material-symbols-outlined text-[20px]" data-icon="table_view">
                  table_view
                </span>
                <span>Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Export Kasbon Card */}
        <div className="glass-card rounded-xl p-6 shadow-xs border border-[#c6c6cd] bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#006c49]/10 text-[#006c49] rounded-lg">
                <span
                  className="material-symbols-outlined text-[20px]"
                  data-icon="account_balance_wallet"
                >
                  account_balance_wallet
                </span>
              </div>
              <h3 className="text-xl font-semibold text-black">Export Kasbon</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#45464d] uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={kasbonFilter.status}
                  onChange={(e) => setKasbonFilter({ ...kasbonFilter, status: e.target.value })}
                  className="w-full rounded-lg border border-[#c6c6cd] bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] text-sm font-normal text-[#0b1c30] py-2 px-3"
                >
                  <option>Semua Status</option>
                  <option>Belum Lunas</option>
                  <option>Lunas</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#45464d] uppercase tracking-wider">
                  Pelanggan
                </label>
                <input
                  type="text"
                  placeholder="Cari nama pelanggan..."
                  value={kasbonFilter.searchPelanggan}
                  onChange={(e) =>
                    setKasbonFilter({ ...kasbonFilter, searchPelanggan: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#c6c6cd] bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] text-sm font-normal text-[#0b1c30] py-2 px-3"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleExportKasbon}
            className="w-full mt-6 bg-[#d3e4fe] text-[#0b1c30] border border-[#c6c6cd] py-2.5 px-4 rounded-lg font-semibold text-base hover:bg-[#dce9ff] transition-colors flex items-center justify-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="download">
              download
            </span>
            <span>Unduh Laporan</span>
          </button>
        </div>

        {/* Export Pengeluaran Card */}
        <div className="glass-card rounded-xl p-6 shadow-xs border border-[#c6c6cd] bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#006c49]/10 text-[#006c49] rounded-lg">
                <span className="material-symbols-outlined text-[20px]" data-icon="payments">
                  payments
                </span>
              </div>
              <h3 className="text-xl font-semibold text-black">Export Pengeluaran</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#45464d] uppercase tracking-wider">
                  Kategori
                </label>
                <select
                  value={pengeluaranFilter.kategori}
                  onChange={(e) =>
                    setPengeluaranFilter({ ...pengeluaranFilter, kategori: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#c6c6cd] bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] text-sm font-normal text-[#0b1c30] py-2 px-3"
                >
                  <option>Semua Kategori</option>
                  <option>Operasional</option>
                  <option>Peralatan</option>
                  <option>Lainnya</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#45464d] uppercase tracking-wider">
                  Bulan
                </label>
                <input
                  type="month"
                  value={pengeluaranFilter.bulan}
                  onChange={(e) =>
                    setPengeluaranFilter({ ...pengeluaranFilter, bulan: e.target.value })
                  }
                  className="w-full rounded-lg border border-[#c6c6cd] bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] text-sm font-normal text-[#0b1c30] py-2 px-3"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleExportPengeluaran}
            className="w-full mt-6 bg-[#d3e4fe] text-[#0b1c30] border border-[#c6c6cd] py-2.5 px-4 rounded-lg font-semibold text-base hover:bg-[#dce9ff] transition-colors flex items-center justify-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="download">
              download
            </span>
            <span>Unduh Laporan</span>
          </button>
        </div>

        {/* Mutasi Saldo Card */}
        <div className="glass-card rounded-xl p-6 shadow-xs border border-[#c6c6cd] bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#006c49]/10 text-[#006c49] rounded-lg">
                <span className="material-symbols-outlined text-[20px]" data-icon="account_balance">
                  account_balance
                </span>
              </div>
              <h3 className="text-xl font-semibold text-black">Mutasi Saldo</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#45464d] uppercase tracking-wider">
                  Rentang Waktu
                </label>
                <div className="flex flex-col gap-2">
                  <input
                    type="date"
                    value={mutasiFilter.startDate}
                    onChange={(e) =>
                      setMutasiFilter({ ...mutasiFilter, startDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#c6c6cd] bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] text-sm font-normal text-[#0b1c30] py-2 px-3"
                  />
                  <span className="text-center text-[#45464d] text-xs font-medium">sampai</span>
                  <input
                    type="date"
                    value={mutasiFilter.endDate}
                    onChange={(e) =>
                      setMutasiFilter({ ...mutasiFilter, endDate: e.target.value })
                    }
                    className="w-full rounded-lg border border-[#c6c6cd] bg-white focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] text-sm font-normal text-[#0b1c30] py-2 px-3"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportMutasi}
            className="w-full mt-6 bg-[#d3e4fe] text-[#0b1c30] border border-[#c6c6cd] py-2.5 px-4 rounded-lg font-semibold text-base hover:bg-[#dce9ff] transition-colors flex items-center justify-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="download">
              download
            </span>
            <span>Unduh Mutasi</span>
          </button>
        </div>

        {/* Riwayat Login Card */}
        <div className="glass-card rounded-xl p-6 shadow-xs border border-[#c6c6cd] bg-white hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#006c49]/10 text-[#006c49] rounded-lg">
                  <span className="material-symbols-outlined text-[20px]" data-icon="history">
                    history
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-black">Riwayat Login</h3>
              </div>

              <button
                onClick={handleDownloadLoginLogs}
                className="text-[#006c49] hover:bg-[#006c49]/10 p-1.5 rounded transition-colors"
                title="Download Log Security"
              >
                <span className="material-symbols-outlined text-[20px]" data-icon="download">
                  download
                </span>
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[170px] pr-1">
              {loginLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex justify-between items-center py-2 border-b border-[#c6c6cd]/30 last:border-0"
                >
                  <div>
                    <p className="text-sm text-black font-medium">{log.device}</p>
                    <p className="text-xs text-[#45464d]">{log.waktu}</p>
                  </div>
                  <span className="font-mono-jetbrains text-xs bg-[#eff4ff] px-2 py-1 rounded text-[#45464d] border border-[#c6c6cd]/40">
                    {log.ip}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
