import React, { useMemo } from 'react';
import { Moon, Pill, Settings, Sun } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { formatLivePersianDate } from '../utils/jalali';

export const Header: React.FC = () => {
  const {
    state,
    setSettingsModalOpen,
    updatePreferences,
    showToast,
  } = useAppState();

  const liveDate = useMemo(() => formatLivePersianDate(new Date()), []);
  const { darkMode } = state.preferences;

  const handleToggleDark = () => {
    const next = !darkMode;
    updatePreferences({ darkMode: next });
    showToast(next ? 'حالت شب فعال شد' : 'حالت روز فعال شد', 'info');
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-surface/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-surface-container/70 dark:border-slate-800 pt-safe transition-colors">
      <div className="max-w-5xl mx-auto h-16 sm:h-18 px-3.5 sm:px-5 flex items-center justify-between gap-2">
        {/* Brand + Live Jalali Date — clean single-line on 360px+ */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-primary-fixed dark:bg-primary/25 flex items-center justify-center text-primary dark:text-inverse-primary shrink-0 shadow-xs">
            <Pill size={22} />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-[15px] sm:text-lg font-extrabold text-on-surface dark:text-white tracking-tight whitespace-nowrap truncate leading-tight">
              جعبه داروی من
            </h1>
            <span className="text-[11px] sm:text-xs font-medium text-outline dark:text-slate-400 whitespace-nowrap truncate leading-tight">
              {liveDate}
            </span>
          </div>
        </div>

        {/* Simplified Action Controls: ONLY Dark Mode & Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleDark}
            aria-label="تغییر حالت شب و روز"
            title={darkMode ? 'تغییر به حالت روز' : 'تغییر به حالت شب'}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            type="button"
            onClick={() => setSettingsModalOpen(true)}
            aria-label="تنظیمات، پشتیبان‌گیری و اشتراک‌گذاری"
            title="تنظیمات و پشتیبان‌گیری"
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
