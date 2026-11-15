import LZString from 'lz-string';
import type {
  AppState,
  CabinetItem,
  CatalogEntry,
  ExpiryDate,
  MedicineCategory,
} from '../types';
import {
  buildExpiryFromGregorian,
  buildExpiryFromJalali,
  formatGregorianExpiry,
  formatJalaliExpiry,
  getExpiryStatus,
} from './jalali';
import { toPersianDigits } from './persian';

interface CompactCabinetItem {
  n: string; // name
  g?: string; // genericName
  c: MedicineCategory; // category
  f: string; // form
  q: number; // quantity
  u: string; // unit
  l?: string; // location (optional)
  d?: string; // description
  h?: 1; // isHalfOrOpened
  e?: [number, number, 'j' | 'g']; // [year, month, calendar]
  cat?: string; // catalogId
}

interface SharePayload {
  v: 1;
  items: CompactCabinetItem[];
}

export function encodeCabinetShareUrl(cabinet: CabinetItem[]): string {
  const compact: SharePayload = {
    v: 1,
    items: cabinet.map((item) => {
      const entry: CompactCabinetItem = {
        n: item.name,
        c: item.category,
        f: item.form,
        q: item.quantity,
        u: item.unit,
      };
      if (item.location) entry.l = item.location;
      if (item.genericName) entry.g = item.genericName;
      if (item.description) entry.d = item.description;
      if (item.isHalfOrOpened) entry.h = 1;
      if (item.catalogId) entry.cat = item.catalogId;
      if (item.expiry) {
        entry.e =
          item.expiry.calendar === 'jalali'
            ? [item.expiry.jalaliYear, item.expiry.jalaliMonth, 'j']
            : [item.expiry.gregorianYear, item.expiry.gregorianMonth, 'g'];
      }
      return entry;
    }),
  };

  const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(compact));
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}#share=${compressed}`;
}

export function decodeCabinetShareHash(hash: string): CabinetItem[] | null {
  if (!hash || !hash.includes('share=')) return null;
  try {
    const rawParam = hash.replace(/^#/, '').split('&').find((p) => p.startsWith('share='));
    if (!rawParam) return null;
    const encoded = rawParam.slice('share='.length);
    if (!encoded) return null;

    const jsonStr = LZString.decompressFromEncodedURIComponent(encoded);
    if (!jsonStr) return null;
    const parsed = JSON.parse(jsonStr) as SharePayload;
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.items)) return null;

    const now = Date.now();
    return parsed.items
      .filter((it) => it && typeof it.n === 'string' && it.n.trim().length > 0)
      .map((it, idx) => {
        let expiry: ExpiryDate | undefined;
        if (Array.isArray(it.e) && it.e.length === 3) {
          const [y, m, cal] = it.e;
          if (cal === 'j' && y >= 1390 && y <= 1430 && m >= 1 && m <= 12) {
            expiry = buildExpirySafe('jalali', y, m);
          } else if (cal === 'g' && y >= 2015 && y <= 2050 && m >= 1 && m <= 12) {
            expiry = buildExpirySafe('gregorian', y, m);
          }
        }
        return {
          id: `shared-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          catalogId: it.cat,
          name: it.n,
          genericName: it.g,
          category: it.c || 'pain',
          form: it.f || 'قرص',
          quantity: typeof it.q === 'number' && it.q >= 0 ? it.q : 1,
          unit: it.u || 'عدد',
          location: it.l?.trim() || undefined,
          description: it.d,
          isHalfOrOpened: it.h === 1,
          expiry,
          updatedAt: now,
        };
      });
  } catch {
    return null;
  }
}

function buildExpirySafe(cal: 'jalali' | 'gregorian', y: number, m: number): ExpiryDate {
  return cal === 'jalali' ? buildExpiryFromJalali(y, m) : buildExpiryFromGregorian(y, m);
}

export function formatCabinetForMessenger(cabinet: CabinetItem[]): string {
  if (cabinet.length === 0) {
    return '📦 جعبه داروی خانگی ما در حال حاضر خالی است.';
  }
  const lines: string[] = [
    '💊 *لیست موجودی جعبه داروی خانگی*',
    '━━━━━━━━━━━━━━━━━━',
    '',
  ];

  cabinet.forEach((item, index) => {
    const status = getExpiryStatus(item.expiry);
    const expStr = item.expiry
      ? item.expiry.calendar === 'gregorian'
        ? formatGregorianExpiry(item.expiry)
        : formatJalaliExpiry(item.expiry)
      : 'تاریخ انقضا ثبت نشده';
    const halfTag = item.isHalfOrOpened ? ' · نیمه‌مصرف/درب‌باز' : '';
    const warnTag =
      status === 'expired'
        ? ' ⚠️ [منقضی]'
        : status === 'expiring_soon'
        ? ' ⏳ [نزدیک انقضا]'
        : '';

    lines.push(
      `${toPersianDigits(index + 1)}. *${item.name}*${warnTag}`,
      `   📦 موجودی: ${toPersianDigits(item.quantity)} ${item.unit}${halfTag}`
    );
    if (item.location) {
      lines.push(`   📍 محل: ${item.location}`);
    }
    lines.push(`   📅 انقضا: ${expStr}`, '');
  });

  lines.push('━━━━━━━━━━━━━━━━━━', 'ارسال شده از برنامه «جعبه داروی من»');
  return lines.join('\n');
}

export function formatDoctorSummaryText(cabinet: CabinetItem[], warningMonths: number): string {
  const validInStock = cabinet.filter((item) => {
    const expStatus = getExpiryStatus(item.expiry, warningMonths);
    return item.quantity > 0 && expStatus !== 'expired';
  });

  if (validInStock.length === 0) {
    return 'در حال حاضر داروی معتبر و موجودی در جعبه ثبت نشده است.';
  }

  const lines: string[] = [
    '🩺 خلاصه داروهای موجود و سالم در منزل (جهت رویت پزشک محترم):',
    '━━━━━━━━━━━━━━━━━━',
  ];

  validInStock.forEach((item, idx) => {
    const halfNote = item.isHalfOrOpened ? ' (ورق نصفه / درب‌باز)' : '';
    const expNote = item.expiry
      ? ` | انقضا: ${
          item.expiry.calendar === 'gregorian'
            ? formatGregorianExpiry(item.expiry)
            : formatJalaliExpiry(item.expiry)
        }`
      : '';
    lines.push(
      `${toPersianDigits(idx + 1)}. ${item.name} — ${toPersianDigits(item.quantity)} ${item.unit}${halfNote}${expNote}`
    );
  });

  return lines.join('\n');
}

export function validateImportedBackup(raw: unknown): AppState | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Partial<AppState>;
  if (!Array.isArray(obj.cabinet)) return null;

  const now = Date.now();
  const safeCabinet: CabinetItem[] = obj.cabinet
    .filter((item): item is CabinetItem => Boolean(item && typeof item.name === 'string' && item.name.trim()))
    .map((item, idx) => ({
      id: item.id || `imp-${now}-${idx}`,
      catalogId: item.catalogId,
      name: item.name.trim(),
      genericName: item.genericName,
      category: item.category || 'pain',
      form: item.form || 'قرص',
      quantity: typeof item.quantity === 'number' && item.quantity >= 0 ? item.quantity : 1,
      unit: item.unit || 'عدد',
      location: item.location?.trim() || undefined,
      description: item.description,
      isHalfOrOpened: Boolean(item.isHalfOrOpened),
      expiry: item.expiry,
      updatedAt: item.updatedAt || now,
    }));

  const safeShopping = Array.isArray(obj.shopping)
    ? obj.shopping.filter((s) => s && typeof s.name === 'string' && s.name.trim())
    : [];

  const safePurchased = Array.isArray(obj.purchasedLog)
    ? obj.purchasedLog.filter((p) => p && typeof p.name === 'string' && p.name.trim())
    : [];

  const safeCustomCatalog: CatalogEntry[] = Array.isArray(obj.customCatalog)
    ? obj.customCatalog
        .filter((c): c is CatalogEntry => Boolean(c && typeof c.name === 'string' && c.name.trim()))
        .map((c, idx) => ({
          id: c.id || `custom-imp-${now}-${idx}`,
          name: c.name.trim(),
          englishName: c.englishName || '',
          category: c.category || 'pain',
          form: c.form || 'قرص',
          defaultUnit: c.defaultUnit || 'عدد',
          defaultLocation: c.defaultLocation || '',
          description: c.description || '',
          keywords: Array.isArray(c.keywords) ? c.keywords : [],
          isCustom: true,
        }))
    : [];

  return {
    version: 1,
    cabinet: safeCabinet,
    shopping: safeShopping,
    purchasedLog: safePurchased,
    customCatalog: safeCustomCatalog,
    preferences: {
      darkMode: Boolean(obj.preferences?.darkMode),
      seniorMode: Boolean(obj.preferences?.seniorMode),
      welcomeDismissed: Boolean(obj.preferences?.welcomeDismissed),
      expiryWarningMonths:
        typeof obj.preferences?.expiryWarningMonths === 'number'
          ? obj.preferences.expiryWarningMonths
          : 3,
    },
  };
}
