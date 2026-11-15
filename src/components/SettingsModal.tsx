import React, { useRef, useState } from 'react';
import {
  Accessibility,
  Download,
  Link2,
  MessageCircle,
  Moon,
  RotateCcw,
  Settings,
  Smartphone,
  Upload,
  X,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { toPersianDigits } from '../utils/persian';
import {
  encodeCabinetShareUrl,
  formatCabinetForMessenger,
  validateImportedBackup,
} from '../utils/share';

export const SettingsModal: React.FC = () => {
  const {
    state,
    setActiveTab,
    isSettingsModalOpen,
    setSettingsModalOpen,
    updatePreferences,
    importFullBackup,
    resetAllData,
    showToast,
  } = useAppState();

  const pwa = usePWAInstall();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleCopyShareLink = async () => {
    if (state.cabinet.length === 0) {
      showToast('جعبه دارو خالی است؛ ابتدا حداقل یک دارو اضافه کنید', 'warning');
      return;
    }
    const url = encodeCabinetShareUrl(state.cabinet);
    try {
      await navigator.clipboard.writeText(url);
      showToast('لینک اشتراک‌گذاری خانواده کپی شد!', 'success', 'برای همسر یا والدین ارسال کنید');
    } catch {
      showToast('امکان کپی خودکار نبود', 'warning');
    }
  };

  const handleCopyMessengerText = async () => {
    const text = formatCabinetForMessenger(state.cabinet);
    try {
      await navigator.clipboard.writeText(text);
      showToast('متن لیست داروها کپی شد!', 'success', 'آماده ارسال در واتساپ، ایتا یا تلگرام');
    } catch {
      showToast('امکان کپی خودکار نبود', 'warning');
    }
  };

  const handleExportJSON = () => {
    const payload = {
      ...state,
      exportedAt: new Date().toISOString(),
      app: 'جعبه داروی من',
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-medicine-box-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('فایل پشتیبان JSON دانلود شد', 'success');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const validated = validateImportedBackup(parsed);
        if (!validated) {
          showToast('ساختار فایل پشتیبان معتبر نیست', 'error');
          return;
        }
        importFullBackup(validated);
        setSettingsModalOpen(false);
        setActiveTab('cabinet');
      } catch {
        showToast('فایل انتخاب‌شده JSON معتبر نیست', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-xs"
        onClick={() => setSettingsModalOpen(false)}
      />

      <div className="relative w-full max-w-lg bg-surface-container-lowest dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-surface-container dark:border-slate-800 max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-container dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-fixed dark:bg-primary/20 text-primary dark:text-inverse-primary flex items-center justify-center">
              <Settings size={21} />
            </div>
            <div>
              <h3
                id="settings-modal-title"
                className="text-base sm:text-lg font-extrabold text-on-surface dark:text-white"
              >
                تنظیمات، اشتراک و پشتیبان
              </h3>
              <span className="text-xs text-outline dark:text-slate-400">
                ۱۰۰٪ آفلاین · ذخیره امن روی مرورگر شما
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettingsModalOpen(false)}
            aria-label="بستن"
            className="w-9 h-9 rounded-full bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* PWA Install Prompt (Auto-hides when already installed in standalone) */}
        {!pwa.isInstalled && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 dark:from-slate-800 dark:to-slate-800/80 border border-primary/20 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Smartphone size={24} className="text-primary dark:text-inverse-primary shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-on-surface dark:text-white">
                  نصب روی صفحه اصلی گوشی (PWA)
                </span>
                <span className="text-[11px] text-on-surface-variant dark:text-slate-300 leading-tight mt-0.5">
                  دسترسی کاملاً آفلاین در داروخانه بدون نیاز به اینترنت
                </span>
              </div>
            </div>

            {pwa.isInstallable ? (
              <button
                type="button"
                onClick={async () => {
                  const ok = await pwa.install();
                  if (ok) showToast('برنامه با موفقیت نصب شد', 'success');
                }}
                className="shrink-0 px-3.5 h-9 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs active:scale-95"
              >
                نصب برنامه
              </button>
            ) : pwa.isIOS ? (
              <button
                type="button"
                onClick={() => setShowIOSGuide((v) => !v)}
                className="shrink-0 px-3 h-9 rounded-xl bg-primary text-on-primary text-xs font-bold"
              >
                راهنمای آیفون
              </button>
            ) : (
              <span className="shrink-0 text-[11px] font-semibold text-primary dark:text-inverse-primary">
                آماده آفلاین ✓
              </span>
            )}
          </div>
        )}

        {showIOSGuide && (
          <div className="p-3 rounded-xl bg-surface-container-low dark:bg-slate-800 text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
            ۱. در مرورگر Safari دکمه <strong>Share</strong> (مربع و فلش رو به بالا) را بزنید.
            <br />
            ۲. گزینه <strong>Add to Home Screen</strong> را انتخاب کنید.
          </div>
        )}

        {/* Display & Expiry Preferences */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">
            نمایش و هشدارها:
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                updatePreferences({ darkMode: !state.preferences.darkMode })
              }
              className={`p-3 rounded-xl border text-right flex items-center justify-between transition-all ${
                state.preferences.darkMode
                  ? 'border-primary bg-primary/10 text-primary dark:text-inverse-primary'
                  : 'border-surface-container dark:border-slate-800 bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white'
              }`}
            >
              <span className="text-xs font-bold">حالت شب (Dark)</span>
              <Moon size={17} />
            </button>

            <button
              type="button"
              onClick={() =>
                updatePreferences({ seniorMode: !state.preferences.seniorMode })
              }
              className={`p-3 rounded-xl border text-right flex items-center justify-between transition-all ${
                state.preferences.seniorMode
                  ? 'border-primary bg-primary/10 text-primary dark:text-inverse-primary'
                  : 'border-surface-container dark:border-slate-800 bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white'
              }`}
            >
              <span className="text-xs font-bold">حالت ساده (درشت‌خط)</span>
              <Accessibility size={17} />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-surface-container-low dark:bg-slate-800 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-on-surface dark:text-slate-200">
              آستانه هشدار نزدیک به انقضا:
            </span>
            <select
              value={state.preferences.expiryWarningMonths}
              onChange={(e) =>
                updatePreferences({ expiryWarningMonths: Number(e.target.value) })
              }
              className="h-9 px-2.5 rounded-lg bg-surface-container-lowest dark:bg-slate-700 text-xs font-bold text-on-surface dark:text-white focus:outline-none"
            >
              <option value={1}>{toPersianDigits(1)} ماه قبل</option>
              <option value={2}>{toPersianDigits(2)} ماه قبل</option>
              <option value={3}>{toPersianDigits(3)} ماه قبل (پیشنهادی)</option>
              <option value={6}>{toPersianDigits(6)} ماه قبل</option>
            </select>
          </div>
        </div>

        {/* Family Sharing */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">
            اشتراک‌گذاری خانوادگی (بدون سرور):
          </span>

          <button
            type="button"
            onClick={handleCopyShareLink}
            className="w-full p-3 rounded-xl bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container text-right flex items-center justify-between gap-2.5 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Link2 size={19} className="text-primary dark:text-inverse-primary shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-on-surface dark:text-white">
                  ارسال مستقیم لیست به گوشی خانواده (لینک انتقال)
                </span>
                <span className="text-[11px] text-outline dark:text-slate-400">
                  با باز کردن این لینک روی گوشی همسر یا والدین، داروها مستقیم وارد برنامه آنها می‌شود.
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleCopyMessengerText}
            className="w-full p-3 rounded-xl bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container text-right flex items-center justify-between gap-2.5 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <MessageCircle size={19} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-bold text-on-surface dark:text-white">
                  کپی متن لیست برای خواندن در واتساپ / ایتا / تلگرام
                </span>
                <span className="text-[11px] text-outline dark:text-slate-400">
                  کپی متن خوانا و مرتب از تمام داروهای موجود در خانه
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* JSON Export & Real FileReader Import */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">
            فایل پشتیبان (برای ذخیره در کامپیوتر یا انتقال فایل):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="h-11 px-3 rounded-xl bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container text-on-surface dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-surface-container dark:border-slate-700 active:scale-95"
            >
              <Download size={16} className="text-primary dark:text-inverse-primary" />
              <span>دانلود فایل بکاپ</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-11 px-3 rounded-xl bg-surface-container-low dark:bg-slate-800 hover:bg-surface-container text-on-surface dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-surface-container dark:border-slate-700 active:scale-95"
            >
              <Upload size={16} className="text-secondary dark:text-secondary-fixed" />
              <span>بازیابی فایل بکاپ</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Reset Data */}
        <div className="pt-2 border-t border-surface-container dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-outline dark:text-slate-400 tabular-nums">
            موجودی ثبت‌شده: {toPersianDigits(state.cabinet.length)} قلم دارو
          </span>

          {confirmReset ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  resetAllData();
                  setConfirmReset(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-error text-on-error text-xs font-bold"
              >
                بله، پاک شود
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-2.5 py-1.5 rounded-lg bg-surface-container dark:bg-slate-800 text-xs font-semibold"
              >
                انصراف
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="text-xs font-bold text-error flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-error-container/50"
            >
              <RotateCcw size={14} />
              <span>پاکسازی کل داده‌ها</span>
            </button>
          )}
        </div>

        {/* About / Open-Source Trust Card */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 dark:border-emerald-800/60 flex flex-col gap-1 text-center">
          <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200">
            💚 رایگان، بدون تبلیغات و متن‌باز
          </span>
          <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
            تمامی اطلاعات دارویی شما فقط در گوشی خودتان ذخیره می‌شود و به هیچ سروری ارسال نمی‌گردد.
          </p>
        </div>
      </div>
    </div>
  );
};
