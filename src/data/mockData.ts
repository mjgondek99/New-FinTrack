import { TransactionItem, KasbonItem, PengeluaranItem, MutasiSaldoItem, LoginLogItem } from '../types';

export const INITIAL_TRANSACTIONS: TransactionItem[] = [];

export const INITIAL_KASBON: KasbonItem[] = [];

export const INITIAL_PENGELUARAN: PengeluaranItem[] = [];

export const INITIAL_MUTASI: MutasiSaldoItem[] = [];

export const INITIAL_LOGIN_LOGS: LoginLogItem[] = [
  {
    id: 'LOG-001',
    device: 'Windows 11 - Chrome',
    waktu: 'Hari ini, 08:30 WIB',
    ip: '192.168.1.5',
    browser: 'Chrome 127.0'
  }
];

export const INITIAL_PLATFORMS: string[] = [
  'Cash / Tunai',
  'BriLink',
  'Dana',
  'Mitra Shopee',
  'QRIS',
  'Transfer Bank'
];

export const INITIAL_JENIS_TRANSAKSI: string[] = [
  'Transfer',
  'Tarik Tunai',
  'Top Up',
  'Pembayaran'
];


