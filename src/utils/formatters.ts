import { TransactionItem } from '../types';

/**
 * Formats a raw number or numeric string into Indonesian thousand separator string with dots
 * Example: 1500000 -> "1.500.000"
 */
export function formatThousand(val: number | string): string {
  if (val === '' || val === null || val === undefined) return '';
  const cleanStr = String(val).replace(/\D/g, '');
  if (!cleanStr) return '';
  return parseInt(cleanStr, 10).toLocaleString('id-ID');
}

/**
 * Parses a string containing dots/non-digits into a clean integer number
 * Example: "1.500.000" -> 1500000
 */
export function parseThousand(val: string): number {
  if (!val) return 0;
  const cleanStr = String(val).replace(/\D/g, '');
  return cleanStr ? parseInt(cleanStr, 10) : 0;
}

/**
 * Aturan Pendapatan Kotor dan Estimasi Profit per transaksi:
 * 1. Jika ada admin luar dan admin dalam:
 *    Pendapatan Kotor = adminLuar - adminDalam
 *    Estimasi Profit  = adminLuar - adminDalam
 * 2. Jika hanya ada admin dalam (adminLuar == 0):
 *    Pendapatan Kotor = 0
 *    Estimasi Profit  = 0
 * 3. Jika hanya ada admin luar (adminDalam == 0):
 *    Pendapatan Kotor = adminLuar
 *    Estimasi Profit  = adminLuar
 */
export function calculateRevenueAndProfit(adminLuar: number, adminDalam: number) {
  let pendapatanKotor = 0;
  let estimasiProfit = 0;

  if (adminLuar > 0 && adminDalam > 0) {
    pendapatanKotor = adminLuar - adminDalam;
    estimasiProfit = adminLuar - adminDalam;
  } else if (adminLuar > 0 && adminDalam === 0) {
    pendapatanKotor = adminLuar;
    estimasiProfit = adminLuar;
  } else {
    pendapatanKotor = 0;
    estimasiProfit = 0;
  }

  return { pendapatanKotor, estimasiProfit };
}

export function getTransactionRevenueAndProfit(t: TransactionItem) {
  const adminLuar = t.biayaAdminLuar ?? t.biayaAdmin ?? 0;
  const adminDalam = t.biayaAdminDalam ?? 0;
  const { pendapatanKotor, estimasiProfit } = calculateRevenueAndProfit(adminLuar, adminDalam);

  return { adminLuar, adminDalam, pendapatanKotor, estimasiProfit };
}


