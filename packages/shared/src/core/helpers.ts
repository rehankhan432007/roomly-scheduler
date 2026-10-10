// ID and time helper utilities
import { v4 as uuidv4 } from 'uuid';

/** Generate a new UUID v4 */
export function newId(): string {
  return uuidv4();
}

/** Convert a Date to UTC ISO-8601 string */
export function toUtc(date: Date): string {
  return date.toISOString();
}

/** Get current time as UTC ISO-8601 string */
export function nowUtc(): string {
  return new Date().toISOString();
}

/** Format a date in a specific timezone for display */
export function formatInZone(isoDate: string, timezone: string, formatStr?: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString('en-IN', { timeZone: timezone });
}

/** Check if two time ranges overlap */
export function overlaps(
  aStart: Date | string,
  aEnd: Date | string,
  bStart: Date | string,
  bEnd: Date | string,
): boolean {
  const a0 = typeof aStart === 'string' ? new Date(aStart).getTime() : aStart.getTime();
  const a1 = typeof aEnd === 'string' ? new Date(aEnd).getTime() : aEnd.getTime();
  const b0 = typeof bStart === 'string' ? new Date(bStart).getTime() : bStart.getTime();
  const b1 = typeof bEnd === 'string' ? new Date(bEnd).getTime() : bEnd.getTime();
  return a0 < b1 && b0 < a1;
}

/** Parse an ISO time string "HH:MM:SS" to minutes since midnight */
export function timeToMinutes(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0] ?? '0', 10) * 60 + parseInt(parts[1] ?? '0', 10);
}
