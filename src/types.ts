export type MedicineCategory =
  | 'pain'
  | 'cold'
  | 'gastro'
  | 'skin'
  | 'firstaid'
  | 'antibiotic'
  | 'vitamins'
  | 'supplies';

export type ExpiryStatus = 'unset' | 'valid' | 'expiring_soon' | 'expired';

export type CalendarType = 'jalali' | 'gregorian';

export interface ExpiryDate {
  calendar: CalendarType;
  /** Canonical Gregorian year (e.g. 2027) used for accurate comparisons */
  gregorianYear: number;
  /** Canonical Gregorian month (1-12) */
  gregorianMonth: number;
  /** Jalali year (e.g. 1406) */
  jalaliYear: number;
  /** Jalali month (1-12) */
  jalaliMonth: number;
}

export interface CabinetItem {
  id: string;
  catalogId?: string;
  name: string;
  genericName?: string;
  category: MedicineCategory;
  form: string;
  quantity: number;
  unit: string;
  location?: string;
  description?: string;
  isHalfOrOpened: boolean;
  expiry?: ExpiryDate;
  updatedAt: number;
}

export type ShoppingReason =
  | 'zero_stock'
  | 'low_stock'
  | 'expired_replace'
  | 'manual';

export interface ShoppingItem {
  id: string;
  cabinetItemId?: string;
  name: string;
  subtitle?: string;
  quantityLabel: string;
  reason: ShoppingReason;
  category?: MedicineCategory;
  addedAt: number;
}

export interface PurchasedLogItem {
  id: string;
  name: string;
  quantityLabel: string;
  purchasedAt: number;
}

export interface AppPreferences {
  darkMode: boolean;
  seniorMode: boolean;
  welcomeDismissed: boolean;
  expiryWarningMonths: number;
}

export interface CatalogEntry {
  id: string;
  name: string;
  englishName: string;
  category: MedicineCategory;
  form: string;
  defaultUnit: string;
  defaultLocation: string;
  description: string;
  keywords: string[];
  isCustom?: boolean;
}

export interface AppState {
  version: number;
  cabinet: CabinetItem[];
  shopping: ShoppingItem[];
  purchasedLog: PurchasedLogItem[];
  customCatalog: CatalogEntry[];
  preferences: AppPreferences;
}

export type ActiveTab = 'cabinet' | 'drug-bank' | 'shopping-list';
