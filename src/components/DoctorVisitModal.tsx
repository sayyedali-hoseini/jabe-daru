import React, { useMemo, useState } from 'react';
import { ClipboardPlus, Copy, PackageCheck, X } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { CATEGORIES } from '../data/categories';
import type { CabinetItem } from '../types';
import { formatJalaliExpiry, getExpiryStatus } from '../utils/jalali';
import { toPersianDigits } from '../utils/persian';
import { formatDoctorSummaryText } from '../utils/share';
import { CategoryIcon } from './CategoryIcon';

export const DoctorVisitModal: React.FC = () => {
  const { state, isDoctorModalOpen, setDoctorModalOpen, showToast } = useAppState();
  const [fontSizePx, setFontSizePx] = useState(14);

  const groupedValidItems = useMemo(() => {
    const warnMonths = state.preferences.expiryWarningMonths;
    const validItems = state.cabinet.filter((item) => {
      const expStatus = getExpiryStatus(item.expiry, warnMonths);
      return item.quantity > 0 && expStatus !== 'expired';
    });

    return CATEGORIES.map((cat) => ({
      category: cat,
      items: validItems.filter((i) => i.category === cat.id),
    })).filter((g) => g.items.length > 0);
  }, [state.cabinet, state.preferences.expiryWarningMonths]);

  if (!isDoctorModalOpen) return null;

  const zoomPercent = Math.round((fontSizePx / 14) * 100);

  const handleCopy = async () => {
    const text = formatDoctorSummaryText(
      state.cabinet,
      state.preferences.expiryWarningMonths
    );
    try {
      await navigator.clipboard.writeText(text);
      showToast('خلاصه داروها برای پزشک کپی شد', 'success');
    } catch {
      showToast('خطا در دسترسی به کلیپ‌بورد', 'warning');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doctor-modal-title"
    >
      <div
        className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-xs"
        onClick={() => setDoctorModalOpen(false)}
      />

      <div className="relative w-full max-w-lg bg-surface-container-lowest dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-surface-container dark:border-slate-800 max-h-[88vh] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-container dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-secondary-container dark:bg-secondary/20 text-secondary dark:text-secondary-fixed flex items-center justify-center shrink-0">
              <ClipboardPlus size={22} />
            </div>
            <div>
              <h3
                id="doctor-modal-title"
                className="text-base sm:text-lg font-extrabold text-on-surface dark:text-white"
              >
                🩺 حالت مطب دکتر
              </h3>
              <span className="text-xs text-outline dark:text-slate-400">
                فقط داروهای سالم و موجود در منزل
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDoctorModalOpen(false)}
            aria-label="بستن"
            className="w-9 h-9 rounded-full bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center justify-between bg-surface-container-low dark:bg-slate-800/80 px-3 py-2 rounded-2xl">
          <span className="text-xs font-bold text-on-surface-variant dark:text-slate-300">
            بزرگ‌نمایی متن جهت مطالعه پزشک:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.max(12, s - 2))}
              className="px-3 py-1.5 rounded-lg bg-surface-container-lowest dark:bg-slate-700 text-on-surface dark:text-white font-bold text-xs shadow-xs"
            >
              A-
            </button>
            <span className="text-xs font-bold tabular-nums px-1.5 text-on-surface dark:text-white">
              {toPersianDigits(zoomPercent)}٪
            </span>
            <button
              type="button"
              onClick={() => setFontSizePx((s) => Math.min(22, s + 2))}
              className="px-3 py-1.5 rounded-lg bg-surface-container-lowest dark:bg-slate-700 text-on-surface dark:text-white font-bold text-xs shadow-xs"
            >
              A+
            </button>
          </div>
        </div>

        {/* Grouped Medicine List */}
        <div
          className="flex-1 overflow-y-auto flex flex-col gap-3 pr-0.5"
          style={{ fontSize: `${fontSizePx}px` }}
        >
          {groupedValidItems.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-2 text-outline dark:text-slate-400">
              <PackageCheck size={32} />
              <p className="text-sm font-semibold text-on-surface dark:text-white">
                داروی سالم و موجودی در جعبه ثبت نشده است
              </p>
              <p className="text-xs max-w-xs">
                داروهای منقضی‌شده یا تمام‌شده برای جلوگیری از خطا در لیست مطب دکتر نمایش داده نمی‌شوند.
              </p>
            </div>
          ) : (
            groupedValidItems.map(({ category, items }) => (
              <div
                key={category.id}
                className="p-3.5 rounded-2xl bg-surface-container-low/70 dark:bg-slate-800/60 border border-surface-container dark:border-slate-700/70"
              >
                <h4 className="font-bold text-primary dark:text-inverse-primary mb-2 flex items-center gap-1.5 text-[0.95em]">
                  <CategoryIcon category={category.id} size={17} />
                  <span>{category.doctorGroupLabel}</span>
                </h4>
                <ul className="space-y-2 text-on-surface dark:text-slate-200">
                  {items.map((item: CabinetItem) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-2 pb-1.5 border-b last:border-b-0 border-surface-container/60 dark:border-slate-700/50"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold leading-snug">
                          • {item.name}
                        </span>
                        {item.expiry && (
                          <span className="text-[0.78em] text-outline dark:text-slate-400 tabular-nums">
                            انقضا: {formatJalaliExpiry(item.expiry)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                        {item.isHalfOrOpened && (
                          <span className="text-[0.75em] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300">
                            نصفه/درب‌باز
                          </span>
                        )}
                        <span className="font-bold text-[0.82em] px-2.5 py-0.5 rounded-full bg-surface-container dark:bg-slate-700 tabular-nums">
                          {toPersianDigits(item.quantity)} {item.unit}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-surface-container dark:border-slate-800">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Copy size={17} />
            <span>کپی لیست برای ارسال به دکتر</span>
          </button>
          <button
            type="button"
            onClick={() => setDoctorModalOpen(false)}
            className="h-11 px-4 rounded-xl bg-surface-container dark:bg-slate-800 text-on-surface dark:text-white text-xs sm:text-sm font-bold active:scale-95"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
