import React from 'react';
import { GitMerge, Link2, RefreshCw, X } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { toPersianDigits } from '../utils/persian';

export const ShareImportModal: React.FC = () => {
  const { pendingShareItems, resolveShareImport } = useAppState();

  if (!pendingShareItems || pendingShareItems.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-import-title"
    >
      <div
        className="absolute inset-0 bg-inverse-surface/65 backdrop-blur-xs"
        onClick={() => resolveShareImport('cancel')}
      />

      <div className="relative w-full max-w-md bg-surface-container-lowest dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-surface-container dark:border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed dark:bg-primary/25 text-primary dark:text-inverse-primary flex items-center justify-center">
              <Link2 size={21} />
            </div>
            <div>
              <h3
                id="share-import-title"
                className="text-base font-extrabold text-on-surface dark:text-white"
              >
                دریافت لیست داروی خانواده
              </h3>
              <span className="text-xs text-outline dark:text-slate-400 tabular-nums">
                {toPersianDigits(pendingShareItems.length)} قلم دارو در این لینک ثبت شده است
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => resolveShareImport('cancel')}
            aria-label="انصراف"
            className="w-8 h-8 rounded-full bg-surface-container dark:bg-slate-800 text-outline flex items-center justify-center"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview */}
        <div className="max-h-44 overflow-y-auto rounded-2xl bg-surface-container-low dark:bg-slate-800/70 p-3 flex flex-col gap-1.5 text-xs">
          {pendingShareItems.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-on-surface dark:text-slate-200"
            >
              <span className="font-semibold truncate">• {item.name}</span>
              <span className="text-outline dark:text-slate-400 shrink-0 tabular-nums">
                {toPersianDigits(item.quantity)} {item.unit}
              </span>
            </div>
          ))}
          {pendingShareItems.length > 8 && (
            <span className="text-[11px] text-primary dark:text-inverse-primary font-bold pt-1">
              و {toPersianDigits(pendingShareItems.length - 8)} قلم داروی دیگر...
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => resolveShareImport('merge')}
            className="w-full h-11 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98"
          >
            <GitMerge size={17} />
            <span>ادغام با لیست فعلی (موارد جدید اضافه شوند)</span>
          </button>

          <button
            type="button"
            onClick={() => resolveShareImport('replace')}
            className="w-full h-11 rounded-xl bg-surface-container dark:bg-slate-800 text-on-surface dark:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-98"
          >
            <RefreshCw size={16} />
            <span>جایگزینی کامل لیست فعلی</span>
          </button>

          <button
            type="button"
            onClick={() => resolveShareImport('cancel')}
            className="w-full h-9 text-xs text-outline dark:text-slate-400 font-semibold"
          >
            انصراف و بستن
          </button>
        </div>
      </div>
    </div>
  );
};
