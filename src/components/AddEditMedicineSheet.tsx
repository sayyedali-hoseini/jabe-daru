import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  Minus,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import {
  CATEGORIES,
  MEDICINE_FORMS,
  MEDICINE_UNITS,
  STORAGE_LOCATIONS,
} from '../data/categories';
import { DRUG_CATALOG } from '../data/drugCatalog';
import type { CatalogEntry, ExpiryDate, MedicineCategory } from '../types';
import {
  GREGORIAN_MONTH_NAMES_FA,
  JALALI_MONTH_NAMES,
  buildExpiryFromGregorian,
  buildExpiryFromJalali,
  formatGregorianExpiry,
  formatJalaliExpiry,
  getCurrentJalali,
  getExpiryStatus,
} from '../utils/jalali';
import {
  normalizeDigits,
  normalizePersianSearch,
  parsePositiveInt,
  toPersianDigits,
} from '../utils/persian';

type ExpiryMode = 'unset' | 'jalali' | 'gregorian';

export const AddEditMedicineSheet: React.FC = () => {
  const {
    state,
    addSheet,
    closeAddSheet,
    addCabinetItem,
    updateCabinetItem,
    deleteCabinetItem,
    showToast,
  } = useAppState();

  const editing = addSheet.editingItem;
  const prefill = addSheet.prefillCatalog;

  const curJalali = useMemo(() => getCurrentJalali(), []);
  const curGreg = useMemo(() => {
    const d = new Date();
    return { gy: d.getFullYear(), gm: d.getMonth() + 1 };
  }, []);

  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [catalogId, setCatalogId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<MedicineCategory>('pain');
  const [form, setForm] = useState('قرص');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('ورق');
  const [locationSelect, setLocationSelect] = useState<string>('');
  const [customLocation, setCustomLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isHalfOrOpened, setIsHalfOrOpened] = useState(false);

  const [expiryMode, setExpiryMode] = useState<ExpiryMode>('unset');
  const [jalYear, setJalYear] = useState<number>(curJalali.jy + 1);
  const [jalMonth, setJalMonth] = useState<number>(curJalali.jm);
  const [gregYear, setGregYear] = useState<number>(curGreg.gy + 1);
  const [gregMonth, setGregMonth] = useState<number>(curGreg.gm);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync form fields whenever sheet opens
  useEffect(() => {
    if (!addSheet.open) return;
    setConfirmDelete(false);
    setShowSuggestions(false);

    if (editing) {
      setName(editing.name);
      setGenericName(editing.genericName ?? '');
      setCatalogId(editing.catalogId);
      setCategory(editing.category);
      setForm(editing.form);
      setQuantity(editing.quantity);
      setUnit(editing.unit);
      if (!editing.location) {
        setLocationSelect('');
        setCustomLocation('');
      } else if (STORAGE_LOCATIONS.includes(editing.location)) {
        setLocationSelect(editing.location);
        setCustomLocation('');
      } else {
        setLocationSelect('__custom__');
        setCustomLocation(editing.location);
      }
      setDescription(editing.description ?? '');
      setIsHalfOrOpened(editing.isHalfOrOpened);
      if (editing.expiry) {
        setExpiryMode(editing.expiry.calendar);
        setJalYear(editing.expiry.jalaliYear);
        setJalMonth(editing.expiry.jalaliMonth);
        setGregYear(editing.expiry.gregorianYear);
        setGregMonth(editing.expiry.gregorianMonth);
      } else {
        setExpiryMode('unset');
        setJalYear(curJalali.jy + 1);
        setJalMonth(curJalali.jm);
        setGregYear(curGreg.gy + 1);
        setGregMonth(curGreg.gm);
      }
      return;
    }

    if (prefill) {
      setName(prefill.name);
      setGenericName(prefill.englishName);
      setCatalogId(prefill.id);
      setCategory(prefill.category);
      setForm(prefill.form);
      setQuantity(1);
      setUnit(prefill.defaultUnit);
      setLocationSelect('');
      setCustomLocation('');
      setDescription(prefill.description);
      setIsHalfOrOpened(false);
      setExpiryMode('unset');
      return;
    }

    setName(addSheet.prefillName ?? '');
    setGenericName('');
    setCatalogId(undefined);
    setCategory('pain');
    setForm('قرص');
    setQuantity(1);
    setUnit('ورق');
    setLocationSelect('');
    setCustomLocation('');
    setDescription('');
    setIsHalfOrOpened(false);
    setExpiryMode('unset');
  }, [addSheet, curGreg.gm, curGreg.gy, curJalali.jm, curJalali.jy, editing, prefill]);

  const mergedCatalog = useMemo(() => {
    const seen = new Set<string>();
    const combined: CatalogEntry[] = [];
    for (const entry of [...state.customCatalog, ...DRUG_CATALOG]) {
      const key = normalizePersianSearch(entry.name);
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(entry);
      }
    }
    return combined;
  }, [state.customCatalog]);

  const suggestions = useMemo(() => {
    const q = normalizePersianSearch(name);
    if (!q || editing) return [];
    return mergedCatalog
      .filter((entry) =>
        normalizePersianSearch(
          `${entry.name} ${entry.englishName} ${entry.keywords.join(' ')}`
        ).includes(q)
      )
      .slice(0, 6);
  }, [editing, mergedCatalog, name]);

  const duplicateMatch = useMemo(() => {
    const q = normalizePersianSearch(name);
    if (!q) return null;
    return state.cabinet.find(
      (c) => c.id !== editing?.id && normalizePersianSearch(c.name) === q
    );
  }, [editing?.id, name, state.cabinet]);

  const computedExpiry: ExpiryDate | undefined = useMemo(() => {
    if (expiryMode === 'unset') return undefined;
    if (expiryMode === 'jalali') return buildExpiryFromJalali(jalYear, jalMonth);
    return buildExpiryFromGregorian(gregYear, gregMonth);
  }, [expiryMode, gregMonth, gregYear, jalMonth, jalYear]);

  const previewExpStatus = getExpiryStatus(
    computedExpiry,
    state.preferences.expiryWarningMonths
  );

  if (!addSheet.open) return null;

  const applyCatalogSuggestion = (entry: CatalogEntry) => {
    setName(entry.name);
    setGenericName(entry.englishName);
    setCatalogId(entry.id);
    setCategory(entry.category);
    setForm(entry.form);
    setUnit(entry.defaultUnit);
    setDescription(entry.description);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    const finalLocation =
      locationSelect === '__custom__'
        ? customLocation.trim()
        : locationSelect;

    const payload = {
      catalogId,
      name: cleanName,
      genericName: genericName.trim() || undefined,
      category,
      form: form.trim() || 'سایر',
      quantity,
      unit,
      location: finalLocation || undefined,
      description: description.trim() || undefined,
      isHalfOrOpened,
      expiry: computedExpiry,
    };

    if (editing) {
      updateCabinetItem(editing.id, payload);
      showToast(`مشخصات «${cleanName}» ذخیره شد`, 'success');
    } else {
      addCabinetItem(payload);
      showToast(`«${cleanName}» در جعبه ثبت شد`, 'success');
    }
    closeAddSheet();
  };

  const jalaliYears = Array.from({ length: 13 }, (_, i) => curJalali.jy - 2 + i);
  const gregYears = Array.from({ length: 13 }, (_, i) => curGreg.gy - 2 + i);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-sheet-title"
    >
      <div
        className="absolute inset-0 bg-inverse-surface/50 backdrop-blur-xs"
        onClick={closeAddSheet}
      />

      <div className="relative w-full max-w-lg bg-surface-container-lowest dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-surface-container dark:border-slate-800 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        <div className="w-10 h-1.5 bg-surface-container-highest dark:bg-slate-700 rounded-full mx-auto -mt-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <h3
              id="add-sheet-title"
              className="text-base sm:text-lg font-extrabold text-on-surface dark:text-white"
            >
              {editing ? 'ویرایش مشخصات دارو' : 'ثبت داروی جدید در جعبه'}
            </h3>
            <span className="text-xs text-outline dark:text-slate-400">
              با پیشنهاد خودکار از ۱۲۰+ داروی رایج و تشخیص تکراری
            </span>
          </div>
          <button
            type="button"
            onClick={closeAddSheet}
            aria-label="بستن"
            className="w-9 h-9 rounded-full bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Drug Name + Live Autocomplete */}
          <div className="flex flex-col gap-1.5 relative">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="med-name-input"
                className="text-xs font-semibold text-on-surface-variant dark:text-slate-300"
              >
                نام دارو یا وسیله پزشکی *
              </label>
              {duplicateMatch && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-tertiary dark:text-amber-300">
                  <AlertCircle size={13} />
                  <span>
                    در جعبه موجود است ({toPersianDigits(duplicateMatch.quantity)}{' '}
                    {duplicateMatch.unit})
                  </span>
                </span>
              )}
            </div>
            <input
              id="med-name-input"
              type="text"
              required
              autoFocus
              value={name}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setName(e.target.value);
                setShowSuggestions(true);
              }}
              placeholder="مثال: استامینوفن ۵۰۰، ژلوفن، سرم شستشو..."
              className="h-11 px-3.5 rounded-xl bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-outline dark:placeholder:text-slate-500 text-sm border border-transparent focus:border-primary focus:outline-none"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="rounded-xl bg-surface-container-lowest dark:bg-slate-800 border border-surface-container-highest dark:border-slate-700 shadow-lg overflow-hidden z-20">
                <div className="px-3 py-1.5 bg-surface-container-low dark:bg-slate-900/60 text-[10px] font-bold text-outline dark:text-slate-400">
                  پیشنهاد از بانک داروها (برای پر شدن خودکار لمس کنید):
                </div>
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => applyCatalogSuggestion(s)}
                    className="w-full px-3 py-2.5 text-right hover:bg-surface-container-low dark:hover:bg-slate-700/70 flex items-center justify-between gap-2 border-t border-surface-container/60 dark:border-slate-700/60"
                  >
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-on-surface dark:text-white truncate">
                          {s.name}
                        </span>
                        {s.isCustom && (
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary dark:text-inverse-primary text-[9px] font-bold shrink-0">
                            ثبت‌شده توسط شما
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-outline dark:text-slate-400 truncate">
                        {s.form}
                        {s.description ? ` · ${s.description}` : ''}
                      </span>
                    </div>
                    <Check size={15} className="text-primary shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Optional Usage / Notes Input */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="med-desc-input"
              className="text-xs font-semibold text-on-surface-variant dark:text-slate-300"
            >
              کاربرد یا یادداشت (اختیاری)
            </label>
            <input
              id="med-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: برای سردرد، روزی ۱ عدد بعد از غذا"
              className="h-10 px-3.5 rounded-xl bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-outline dark:placeholder:text-slate-500 text-xs sm:text-sm border border-transparent focus:border-primary focus:outline-none"
            />
          </div>

          {/* Category, Form & Storage Location */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="med-cat-select"
                className="text-xs font-semibold text-on-surface-variant dark:text-slate-300"
              >
                دسته‌بندی
              </label>
              <select
                id="med-cat-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as MedicineCategory)}
                className="h-11 px-3 rounded-xl bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white text-xs sm:text-sm focus:outline-none border border-transparent focus:border-primary"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="med-form-select"
                className="text-xs font-semibold text-on-surface-variant dark:text-slate-300"
              >
                شکل دارو
              </label>
              <select
                id="med-form-select"
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white text-xs sm:text-sm focus:outline-none border border-transparent focus:border-primary"
              >
                {!MEDICINE_FORMS.includes(form) && form && (
                  <option value={form}>{form}</option>
                )}
                {MEDICINE_FORMS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="med-loc-select"
              className="text-xs font-semibold text-on-surface-variant dark:text-slate-300"
            >
              محل نگهداری در خانه (اختیاری)
            </label>
            <select
              id="med-loc-select"
              value={locationSelect}
              onChange={(e) => setLocationSelect(e.target.value)}
              className="h-11 px-3 rounded-xl bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white text-xs sm:text-sm focus:outline-none border border-transparent focus:border-primary"
            >
              <option value="">بدون مشخص کردن محل (اختیاری)</option>
              {STORAGE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
              <option value="__custom__">سایر / دلخواه...</option>
            </select>
          </div>

          {/* Custom Location Input when "سایر / دلخواه" is selected */}
          {locationSelect === '__custom__' && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="med-custom-loc"
                className="text-xs font-semibold text-on-surface-variant dark:text-slate-300"
              >
                نام محل نگهداری دلخواه
              </label>
              <input
                id="med-custom-loc"
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="مثال: کمد اتاق مادر، کشوی میز آرایش..."
                className="h-10 px-3.5 rounded-xl bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-outline dark:placeholder:text-slate-500 text-xs sm:text-sm border border-primary/30 focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {/* Half-Pack / Opened Bottle Toggle */}
          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low dark:bg-slate-800 border border-primary/10 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🌗</span>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-on-surface dark:text-white">
                  ورق نصفه یا شربت درب‌باز؟
                </span>
                <span className="text-[11px] text-outline dark:text-slate-400">
                  برای یادآوری مصرف زودتر و نمایش به پزشک
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isHalfOrOpened}
              onChange={(e) => setIsHalfOrOpened(e.target.checked)}
              className="w-5 h-5 rounded accent-primary cursor-pointer"
            />
          </label>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface-variant dark:text-slate-300">
                تعداد / مقدار
              </label>
              <div className="flex items-center h-11 bg-surface-container-low dark:bg-slate-800 rounded-xl px-1.5 justify-between gap-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(0, q - 1))}
                  className="w-8 h-8 rounded-lg bg-surface-container-lowest dark:bg-slate-700 flex items-center justify-center text-on-surface dark:text-white shadow-xs active:scale-95"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={toPersianDigits(quantity)}
                  onChange={(e) =>
                    setQuantity(parsePositiveInt(normalizeDigits(e.target.value), 0))
                  }
                  className="w-12 text-center bg-transparent font-bold text-sm text-on-surface dark:text-white focus:outline-none tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-surface-container-lowest dark:bg-slate-700 flex items-center justify-center text-on-surface dark:text-white shadow-xs active:scale-95"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="med-unit-select"
                className="text-xs font-semibold text-on-surface-variant dark:text-slate-300"
              >
                واحد شمارش
              </label>
              <select
                id="med-unit-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-11 px-3 rounded-xl bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white text-xs sm:text-sm focus:outline-none"
              >
                {MEDICINE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Clean Month & Year Jalali/Gregorian Expiry Selector */}
          <div className="flex flex-col gap-2 p-3 rounded-2xl bg-surface-container-low/70 dark:bg-slate-800/70 border border-surface-container dark:border-slate-700">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-on-surface dark:text-white flex items-center gap-1.5">
                <Calendar size={15} className="text-primary" />
                <span>تاریخ انقضای روی جعبه (اختیاری)</span>
              </span>

              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface-container dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setExpiryMode('unset')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    expiryMode === 'unset'
                      ? 'bg-surface-container-lowest dark:bg-slate-700 text-on-surface dark:text-white shadow-xs'
                      : 'text-outline dark:text-slate-400'
                  }`}
                >
                  ثبت نشده
                </button>
                <button
                  type="button"
                  onClick={() => setExpiryMode('jalali')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    expiryMode === 'jalali'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-outline dark:text-slate-400'
                  }`}
                >
                  شمسی
                </button>
                <button
                  type="button"
                  onClick={() => setExpiryMode('gregorian')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                    expiryMode === 'gregorian'
                      ? 'bg-primary text-on-primary shadow-xs'
                      : 'text-outline dark:text-slate-400'
                  }`}
                >
                  میلادی
                </button>
              </div>
            </div>

            {expiryMode !== 'unset' && (
              <div className="flex flex-col gap-2 pt-1">
                {expiryMode === 'jalali' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      aria-label="ماه انقضای شمسی"
                      value={jalMonth}
                      onChange={(e) => setJalMonth(Number(e.target.value))}
                      className="h-10 px-2.5 rounded-xl bg-surface-container-lowest dark:bg-slate-900 text-xs font-semibold text-on-surface dark:text-white"
                    >
                      {JALALI_MONTH_NAMES.map((mName, idx) => (
                        <option key={mName} value={idx + 1}>
                          {toPersianDigits(String(idx + 1).padStart(2, '0'))} - {mName}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="سال انقضای شمسی"
                      value={jalYear}
                      onChange={(e) => setJalYear(Number(e.target.value))}
                      className="h-10 px-2.5 rounded-xl bg-surface-container-lowest dark:bg-slate-900 text-xs font-semibold text-on-surface dark:text-white tabular-nums"
                    >
                      {jalaliYears.map((y) => (
                        <option key={y} value={y}>
                          {toPersianDigits(y)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      aria-label="ماه انقضای میلادی"
                      value={gregMonth}
                      onChange={(e) => setGregMonth(Number(e.target.value))}
                      className="h-10 px-2.5 rounded-xl bg-surface-container-lowest dark:bg-slate-900 text-xs font-semibold text-on-surface dark:text-white"
                    >
                      {GREGORIAN_MONTH_NAMES_FA.map((mName, idx) => (
                        <option key={mName} value={idx + 1}>
                          {mName}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="سال انقضای میلادی"
                      value={gregYear}
                      onChange={(e) => setGregYear(Number(e.target.value))}
                      className="h-10 px-2.5 rounded-xl bg-surface-container-lowest dark:bg-slate-900 text-xs font-semibold text-on-surface dark:text-white font-mono"
                    >
                      {gregYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {computedExpiry && (
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-on-surface-variant dark:text-slate-300 tabular-nums">
                      {expiryMode === 'jalali'
                        ? `معادل میلادی: ${formatGregorianExpiry(computedExpiry)}`
                        : `معادل شمسی: ${formatJalaliExpiry(computedExpiry)}`}
                    </span>
                    <span
                      className={`font-bold ${
                        previewExpStatus === 'expired'
                          ? 'text-error'
                          : previewExpStatus === 'expiring_soon'
                          ? 'text-tertiary dark:text-amber-300'
                          : 'text-secondary dark:text-teal-300'
                      }`}
                    >
                      {previewExpStatus === 'expired'
                        ? '⚠️ منقضی شده'
                        : previewExpStatus === 'expiring_soon'
                        ? '⏳ نزدیک به انقضا'
                        : '✓ تاریخ معتبر'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit & Delete Actions */}
          <div className="flex items-center gap-2 pt-1">
            {editing &&
              (confirmDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    deleteCabinetItem(editing.id);
                    closeAddSheet();
                  }}
                  className="h-12 px-4 rounded-2xl bg-error text-on-error text-xs font-bold flex items-center gap-1 active:scale-95"
                >
                  <Trash2 size={16} />
                  <span>تأیید حذف</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="حذف دارو"
                  className="h-12 w-12 rounded-2xl bg-error-container/70 dark:bg-rose-950/60 text-error dark:text-rose-300 flex items-center justify-center active:scale-95 shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              ))}
            <button
              type="submit"
              className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-primary to-secondary text-on-primary font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              <span>{editing ? 'ذخیره تغییرات' : 'ثبت در جعبه داروی من'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
