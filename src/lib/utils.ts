import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validasi apakah suatu string adalah UUID yang valid
 */
export function isValidUuid(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Generate standard UUID v4 yang aman untuk PostgreSQL
 */
export function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format string/number input ke format ribuan rupiah (contoh: 10000 -> 10.000)
 */
export function formatCurrencyInput(val: string | number | undefined | null): string {
  if (val === undefined || val === null || val === '') return '';
  const cleaned = String(val).replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  return Number(cleaned).toLocaleString('id-ID');
}

/**
 * Parse input string berformat ribuan ke numeric number (contoh: "10.000" -> 10000)
 */
export function parseCurrencyInput(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  return cleaned ? Number(cleaned) : 0;
}
