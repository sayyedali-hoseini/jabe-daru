/**
 * Digit normalization & Persian text helpers.
 * Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to Latin (0-9)
 * for reliable parsing across mobile keyboards, search, and expiry fields.
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeDigits(input: string): string {
  if (!input) return '';
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const faIdx = PERSIAN_DIGITS.indexOf(ch);
    if (faIdx !== -1) {
      out += String(faIdx);
      continue;
    }
    const arIdx = ARABIC_DIGITS.indexOf(ch);
    if (arIdx !== -1) {
      out += String(arIdx);
      continue;
    }
    out += ch;
  }
  return out;
}

export function toPersianDigits(input: string | number): string {
  const str = String(input);
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/**
 * Normalizes Persian/Arabic characters (ی/ي, ک/ك, ز/ذ, zero-width non-joiner, digits)
 * so searches work smoothly regardless of keyboard layout.
 */
export function normalizePersianSearch(input: string): string {
  return normalizeDigits(input)
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/آ/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u200c\u200b]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePositiveInt(input: string, fallback = 1): number {
  const normalized = normalizeDigits(input).replace(/[^\d]/g, '');
  if (!normalized) return fallback;
  const parsed = parseInt(normalized, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
