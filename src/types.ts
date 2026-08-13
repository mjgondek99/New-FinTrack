export type UserRole = 'admin' | 'kasir';

export interface UserAccount {
  id: string;
  username: string;
  nama: string;
  role: UserRole;
  password?: string;
  avatarUrl?: string;
}

export type NavTab = 
  | 'dashboard'
  | 'transaksi'
  | 'laporan'
  | 'kasbon'
  | 'pengeluaran'
  | 'saldo'
  | 'platform_jenis'
  | 'export_laporan'
  | 'akun'
  | 'pengaturan';

export interface TransactionItem {
  id: string;
  tanggal: string;
  platform: string;
  jenis: string;
  jumlah: number;
  biayaAdmin: number;
  biayaAdminLuar?: number;
  biayaAdminDalam?: number;
  totalPenagihan?: number;
  status: 'Berhasil' | 'Pending' | 'Gagal';
  pelanggan: string;
  operator?: string;
}

export interface RiwayatCicilanItem {
  id: string;
  tanggal: string;
  jumlah: number;
  sisaSetelah: number;
  catatan?: string;
}

export interface KasbonItem {
  id: string;
  namaPelanggan: string;
  noHp: string;
  tanggal: string;
  totalKasbon: number;
  sisaKasbon: number;
  status: 'Belum Lunas' | 'Lunas';
  catatan: string;
  riwayatPembayaran?: RiwayatCicilanItem[];
}

export interface PengeluaranItem {
  id: string;
  tanggal: string;
  kategori: 'Operasional' | 'Peralatan' | 'Lainnya';
  jumlah: number;
  keterangan: string;
  sumberDana?: string;
}

export interface MutasiSaldoItem {
  id: string;
  waktu: string;
  jenis: 'Masuk' | 'Keluar';
  nominal: number;
  saldoSebelum: number;
  saldoSesudah: number;
  sumber: string;
  platform?: string;
}

export interface LoginLogItem {
  id: string;
  device: string;
  waktu: string;
  ip: string;
  lokasi?: string;
  browser: string;
}

export interface ExportTransaksiFilter {
  startDate: string;
  endDate: string;
  platform: string;
}

export interface ExportKasbonFilter {
  status: string;
  searchPelanggan: string;
}

export interface ExportPengeluaranFilter {
  kategori: string;
  bulan: string;
}

export interface ExportMutasiFilter {
  startDate: string;
  endDate: string;
}
