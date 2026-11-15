import type { CalendarType, ExpiryDate, ExpiryStatus } from '../types';
import { normalizeDigits, toPersianDigits } from './persian';

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const GREGORIAN_MONTH_NAMES_FA = [
  'ژانویه (۰۱)',
  'فوریه (۰۲)',
  'مارس (۰۳)',
  'آوریل (۰۴)',
  'مه (۰۵)',
  'ژوئن (۰۶)',
  'ژوئیه (۰۷)',
  'اوت (۰۸)',
  'سپتامبر (۰۹)',
  'اکتبر (۱۰)',
  'نوامبر (۱۱)',
  'دسامبر (۱۲)',
];

/**
 * Deterministic Gregorian <-> Jalali conversion (15th of month to avoid boundary drift).
 * Based on standard 33-year cycle / astronomical JDN algorithm.
 */
function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

export function gregorianToJdn(gy: number, gm: number, gd: number): number {
  const d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * ((gm + 9) % 12) + 2, 5) +
    gd -
    34840408;
  return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
}

export function jdnToGregorian(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(j % 1461, 4) * 5 + 308;
  const gd = div(i % 153, 5) + 1;
  const gm = (div(i, 153) % 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192,
    2262, 2324, 2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jm = 0;
  let jump = 0;

  for (let i = 1; i < bl; i++) {
    jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(jump % 33, 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div((n % 33) + 3, 4);
  if (jump % 33 === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = (((n + 1) % 33) - 1) % 4;
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

export function jalaliToJdn(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return (
    gregorianToJdn(r.gy, 3, r.march) +
    (jm - 1) * 31 -
    div(jm, 7) * (jm - 7) +
    jd -
    1
  );
}

export function jdnToJalali(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = jdnToGregorian(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = gregorianToJdn(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      const jm = 1 + div(k, 31);
      const jd = (k % 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  const jm = 7 + div(k, 30);
  const jd = (k % 30) + 1;
  return { jy, jm, jd };
}

export function gregorianToJalali(gy: number, gm: number, gd = 15): { jy: number; jm: number; jd: number } {
  return jdnToJalali(gregorianToJdn(gy, gm, gd));
}

export function jalaliToGregorian(jy: number, jm: number, jd = 15): { gy: number; gm: number; gd: number } {
  return jdnToGregorian(jalaliToJdn(jy, jm, jd));
}

export function getCurrentJalali(): { jy: number; jm: number; jd: number } {
  const now = new Date();
  return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function buildExpiryFromJalali(jy: number, jm: number): ExpiryDate {
  const safeMonth = Math.min(12, Math.max(1, jm));
  const safeYear = Math.min(1430, Math.max(1390, jy));
  const greg = jalaliToGregorian(safeYear, safeMonth, 15);
  return {
    calendar: 'jalali',
    jalaliYear: safeYear,
    jalaliMonth: safeMonth,
    gregorianYear: greg.gy,
    gregorianMonth: greg.gm,
  };
}

export function buildExpiryFromGregorian(gy: number, gm: number): ExpiryDate {
  const safeMonth = Math.min(12, Math.max(1, gm));
  const safeYear = Math.min(2050, Math.max(2015, gy));
  const jal = gregorianToJalali(safeYear, safeMonth, 15);
  return {
    calendar: 'gregorian',
    gregorianYear: safeYear,
    gregorianMonth: safeMonth,
    jalaliYear: jal.jy,
    jalaliMonth: jal.jm,
  };
}

export function parseQuickExpiryInput(raw: string, calendar: CalendarType): ExpiryDate | undefined {
  const cleaned = normalizeDigits(raw).trim();
  if (!cleaned) return undefined;
  const match = cleaned.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (!match) return undefined;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (m < 1 || m > 12) return undefined;
  return calendar === 'jalali'
    ? buildExpiryFromJalali(y, m)
    : buildExpiryFromGregorian(y, m);
}

export function getMonthsUntilExpiry(expiry?: ExpiryDate): number | null {
  if (!expiry) return null;
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  return (expiry.gregorianYear - curY) * 12 + (expiry.gregorianMonth - curM);
}

export function getExpiryStatus(expiry?: ExpiryDate, warningMonths = 3): ExpiryStatus {
  const diff = getMonthsUntilExpiry(expiry);
  if (diff === null) return 'unset';
  if (diff < 0) return 'expired';
  if (diff <= warningMonths) return 'expiring_soon';
  return 'valid';
}

export function formatJalaliExpiry(expiry: ExpiryDate): string {
  const mm = String(expiry.jalaliMonth).padStart(2, '0');
  return toPersianDigits(`${expiry.jalaliYear}/${mm}`);
}

export function formatGregorianExpiry(expiry: ExpiryDate): string {
  const mm = String(expiry.gregorianMonth).padStart(2, '0');
  return `${expiry.gregorianYear}/${mm}`;
}

export function formatLivePersianDate(date = new Date()): string {
  try {
    const faDate = new Intl.DateTimeFormat('fa-IR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    return `امروز، ${faDate}`;
  } catch {
    const j = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return toPersianDigits(`امروز، ${j.jd} ${JALALI_MONTH_NAMES[j.jm - 1]} ${j.jy}`);
  }
}
