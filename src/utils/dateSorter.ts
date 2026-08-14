/**
 * Robust date and time sorting utility to ensure newest records appear first.
 */

export function parseDateToTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  try {
    const trimmed = String(dateStr).trim();
    if (!trimmed) return 0;

    // If format is like "2026-08-14 15:30"
    if (trimmed.includes(' ') && !trimmed.includes('T')) {
      const parts = trimmed.split(' ');
      const datePart = parts[0];
      const timePart = parts[1] || '00:00';
      const isoCandidate = `${datePart}T${timePart.length === 5 ? timePart + ':00' : timePart}`;
      const ts = new Date(isoCandidate).getTime();
      if (!isNaN(ts)) return ts;
    }

    const ts = new Date(trimmed).getTime();
    return isNaN(ts) ? 0 : ts;
  } catch {
    return 0;
  }
}

export function sortByDateDesc<T = any>(items: T[], customDateField?: string): T[] {
  return [...items].sort((a: any, b: any) => {
    const rawA = customDateField ? a[customDateField] : (a?.tanggal || a?.waktu || a?.date);
    const rawB = customDateField ? b[customDateField] : (b?.tanggal || b?.waktu || b?.date);
    const timeA = parseDateToTimestamp(rawA);
    const timeB = parseDateToTimestamp(rawB);
    return timeB - timeA;
  });
}
