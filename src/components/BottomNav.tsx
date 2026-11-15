import React from 'react';
import { BookOpen, Package, Plus, ShoppingBag } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { toPersianDigits } from '../utils/persian';

export const BottomNav: React.FC = () => {
  const { state, activeTab, setActiveTab, openAddSheet } = useAppState();
  const shoppingCount = state.shopping.length;

  return (
    <nav
      aria-label="ناوبری اصلی"
      className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-surface/92 dark:bg-slate-900/92 backdrop-blur-xl border-t border-surface-container/70 dark:border-slate-800 shadow-[0_-4px_20px_rgba(11,28,48,0.06)] transition-colors"
    >
      <div className="max-w-2xl mx-auto h-18 px-2 flex items-center justify-around relative">
        <button
          type="button"
          onClick={() => setActiveTab('cabinet')}
          aria-current={activeTab === 'cabinet' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-w-[68px] min-h-[48px] rounded-xl px-2 transition-all active:scale-95 ${
            activeTab === 'cabinet'
              ? 'text-primary dark:text-inverse-primary font-bold'
              : 'text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white font-medium'
          }`}
        >
          <Package size={22} strokeWidth={activeTab === 'cabinet' ? 2.4 : 1.9} />
          <span className="text-[11px] whitespace-nowrap">داروهای من</span>
        </button>

        {/* Center Floating Add Button */}
        <div className="relative -top-4 flex items-center justify-center">
          <button
            type="button"
            onClick={() => openAddSheet()}
            className="flex items-center gap-1.5 px-4 h-12 min-h-[48px] rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary shadow-lg shadow-primary/25 hover:brightness-105 active:scale-95 transition-all whitespace-nowrap"
          >
            <Plus size={20} strokeWidth={2.5} />
            <span className="text-sm font-bold">ثبت دارو</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('drug-bank')}
          aria-current={activeTab === 'drug-bank' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-w-[68px] min-h-[48px] rounded-xl px-2 transition-all active:scale-95 ${
            activeTab === 'drug-bank'
              ? 'text-primary dark:text-inverse-primary font-bold'
              : 'text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white font-medium'
          }`}
        >
          <BookOpen size={22} strokeWidth={activeTab === 'drug-bank' ? 2.4 : 1.9} />
          <span className="text-[11px] whitespace-nowrap">بانک داروها</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shopping-list')}
          aria-current={activeTab === 'shopping-list' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 min-w-[68px] min-h-[48px] rounded-xl px-2 transition-all active:scale-95 relative ${
            activeTab === 'shopping-list'
              ? 'text-primary dark:text-inverse-primary font-bold'
              : 'text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white font-medium'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <ShoppingBag
              size={22}
              strokeWidth={activeTab === 'shopping-list' ? 2.4 : 1.9}
            />
            {shoppingCount > 0 && (
              <span className="absolute -top-1.5 -left-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-on-error text-[10px] font-bold flex items-center justify-center leading-none tabular-nums shadow-xs">
                {toPersianDigits(shoppingCount)}
              </span>
            )}
          </div>
          <span className="text-[11px] whitespace-nowrap">لیست خرید</span>
        </button>
      </div>
    </nav>
  );
};
