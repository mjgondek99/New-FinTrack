import { TransactionItem, MutasiSaldoItem } from '../types';

export const DANA_MONTHLY_LIMIT = 40_000_000;

export function isDanaPlatform(platformName: string): boolean {
  if (!platformName) return false;
  return platformName.toLowerCase().includes('dana');
}

export function getCurrentMonthKey(dateObj?: Date): string {
  const d = dateObj || new Date();
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}

export interface DanaQuotaInfo {
  platformName: string;
  monthKey: string;
  monthLabel: string;
  limitMax: number;
  totalMasuk: number;
  sisaLimit: number;
  tarikTunaiMasuk: number;
  mutasiTopUpMasuk: number;
  pindahSaldoMasuk: number;
  percentageUsed: number;
  isOverLimit: boolean;
  isNearLimit: boolean; // >= 80%
}

export function calculateDanaMonthlyQuota(
  danaPlatformName: string,
  transactions: TransactionItem[],
  mutasis: MutasiSaldoItem[],
  targetMonthKey?: string
): DanaQuotaInfo {
  const currentMonth = targetMonthKey || getCurrentMonthKey();
  
  // 1. Tarik Tunai transactions for this DANA platform in this month
  let tarikTunaiMasuk = 0;
  transactions.forEach((t) => {
    if (
      (t.status === 'Berhasil' || !t.status) &&
      isDanaPlatform(t.platform) &&
      t.platform.toLowerCase() === danaPlatformName.toLowerCase()
    ) {
      const trxMonth = (t.tanggal || '').slice(0, 7);
      if (trxMonth === currentMonth && t.jenis === 'Tarik Tunai') {
        tarikTunaiMasuk += t.jumlah;
      }
    }
  });

  // 2. Mutasi masuk (Isi saldo / Top up / Pindah saldo masuk)
  let mutasiTopUpMasuk = 0;
  let pindahSaldoMasuk = 0;

  mutasis.forEach((m) => {
    const mutasiMonth = (m.waktu || '').slice(0, 7);
    if (mutasiMonth === currentMonth && m.jenis === 'Masuk') {
      const isTarget =
        (m.platform && m.platform.toLowerCase() === danaPlatformName.toLowerCase()) ||
        (!m.platform && m.sumber.toLowerCase().includes(danaPlatformName.toLowerCase()));
      if (isTarget) {
        if (m.sumber.toLowerCase().includes('pindah saldo')) {
          pindahSaldoMasuk += m.nominal;
        } else {
          mutasiTopUpMasuk += m.nominal;
        }
      }
    }
  });

  const totalMasuk = tarikTunaiMasuk + mutasiTopUpMasuk + pindahSaldoMasuk;
  const sisaLimit = Math.max(0, DANA_MONTHLY_LIMIT - totalMasuk);
  const percentageUsed = Math.min(100, Math.round((totalMasuk / DANA_MONTHLY_LIMIT) * 100));

  const [year, month] = currentMonth.split('-');
  const monthDate = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  const monthLabel = monthDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return {
    platformName: danaPlatformName,
    monthKey: currentMonth,
    monthLabel,
    limitMax: DANA_MONTHLY_LIMIT,
    totalMasuk,
    sisaLimit,
    tarikTunaiMasuk,
    mutasiTopUpMasuk,
    pindahSaldoMasuk,
    percentageUsed,
    isOverLimit: totalMasuk >= DANA_MONTHLY_LIMIT,
    isNearLimit: percentageUsed >= 80
  };
}
