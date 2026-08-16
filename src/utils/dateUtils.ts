/**
 * Date & Time Utilities for Aviation Ground Operations
 * Authoritative times are always kept in UTC.
 */

export function formatUtcTime(isoString?: string | null): string {
  if (!isoString) return '--:-- UTC';
  try {
    const d = new Date(isoString);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}:${d.getUTCSeconds().toString().padStart(2, '0')} UTC`;
  } catch (e) {
    return '--:-- UTC';
  }
}

export function formatUtcShort(isoString?: string | null): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    return `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
  } catch (e) {
    return '--:--';
  }
}

export function formatLocalAirportTime(isoString?: string | null, offsetHours = 3): string {
  if (!isoString) return '--:--';
  try {
    const d = new Date(isoString);
    const localMs = d.getTime() + offsetHours * 3600000;
    const localDate = new Date(localMs);
    return `${localDate.getUTCHours().toString().padStart(2, '0')}:${localDate.getUTCMinutes().toString().padStart(2, '0')}`;
  } catch (e) {
    return '--:--';
  }
}

export function formatFullDateTime(isoString?: string | null): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    const yr = d.getUTCFullYear();
    const mo = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const da = d.getUTCDate().toString().padStart(2, '0');
    const hr = d.getUTCHours().toString().padStart(2, '0');
    const min = d.getUTCMinutes().toString().padStart(2, '0');
    const sec = d.getUTCSeconds().toString().padStart(2, '0');
    return `${yr}-${mo}-${da} ${hr}:${min}:${sec}Z`;
  } catch (e) {
    return '--';
  }
}

export function getMinutesDifference(startIso?: string, endIso?: string): number {
  if (!startIso || !endIso) return 0;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  return Math.round((end - start) / 60000);
}

export function calculateTurnaroundProgress(scheduledArrival: string, scheduledDeparture: string): {
  elapsedMin: number;
  totalMin: number;
  percent: number;
} {
  const start = new Date(scheduledArrival).getTime();
  const end = new Date(scheduledDeparture).getTime();
  const now = Date.now();

  const totalMin = Math.max(1, Math.round((end - start) / 60000));
  const elapsedMin = Math.max(0, Math.round((now - start) / 60000));
  const percent = Math.min(100, Math.max(0, Math.round((elapsedMin / totalMin) * 100)));

  return { elapsedMin, totalMin, percent };
}
