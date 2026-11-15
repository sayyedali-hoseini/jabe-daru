import type { MedicineCategory } from '../types';

export interface CategoryMeta {
  id: MedicineCategory;
  label: string;
  shortLabel: string;
  doctorGroupLabel: string;
  emoji: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'pain',
    label: 'مسکن و تب‌بر',
    shortLabel: 'مسکن',
    doctorGroupLabel: 'مسکن‌ها، ضدالتهاب و تب‌بر',
    emoji: '💊',
  },
  {
    id: 'cold',
    label: 'سرماخوردگی و سرفه',
    shortLabel: 'سرماخوردگی',
    doctorGroupLabel: 'سرماخوردگی، سرفه و آلرژی',
    emoji: '🤧',
  },
  {
    id: 'gastro',
    label: 'گوارشی و معده',
    shortLabel: 'گوارشی',
    doctorGroupLabel: 'گوارشی، معده و تهوع',
    emoji: '🫄',
  },
  {
    id: 'skin',
    label: 'پوست و پماد',
    shortLabel: 'پوست و پماد',
    doctorGroupLabel: 'پوست، پماد و موضعی',
    emoji: '🧴',
  },
  {
    id: 'firstaid',
    label: 'پانسمان و کمک‌های اولیه',
    shortLabel: 'کمک‌های اولیه',
    doctorGroupLabel: 'پانسمان و کمک‌های اولیه',
    emoji: '🩹',
  },
  {
    id: 'antibiotic',
    label: 'آنتی‌بیوتیک',
    shortLabel: 'آنتی‌بیوتیک',
    doctorGroupLabel: 'آنتی‌بیوتیک‌ها و ضدعفونی‌کننده‌ها',
    emoji: '🔬',
  },
  {
    id: 'vitamins',
    label: 'مکمل و ویتامین',
    shortLabel: 'ویتامین',
    doctorGroupLabel: 'مکمل‌ها و ویتامین‌ها',
    emoji: '✨',
  },
  {
    id: 'supplies',
    label: 'تزریقات و لوازم مصرفی',
    shortLabel: 'لوازم مصرفی',
    doctorGroupLabel: 'قطره‌ها، تزریقات و لوازم مصرفی',
    emoji: '💉',
  },
];

export const CATEGORY_MAP: Record<MedicineCategory, CategoryMeta> = CATEGORIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<MedicineCategory, CategoryMeta>
);

export const STORAGE_LOCATIONS = [
  'کشوی اتاق خواب',
  'یخچال (۲ تا ۸ درجه)',
  'کابینت آشپزخانه',
  'کیف کمک‌های اولیه',
  'کابینت حمام',
  'کشوی میز کار',
  'کیف سفر / خودرو',
];

export const MEDICINE_FORMS = [
  'قرص',
  'کپسول',
  'شربت',
  'پماد',
  'قطره',
  'اسپری',
  'سرنگ/تزریقی',
  'پانسمان',
  'سایر',
];

export const MEDICINE_UNITS = [
  'ورق',
  'بسته',
  'عدد',
  'شیشه',
  'تیوپ',
  'قطره',
  'اسپری',
  'ساشه',
  'آمپول',
  'شیاف',
];
