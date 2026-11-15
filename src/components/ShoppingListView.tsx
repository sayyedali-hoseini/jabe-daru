import React, { useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Lightbulb,
  Mic,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { DRUG_CATALOG } from '../data/drugCatalog';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import type { ShoppingReason } from '../types';
import { formatLivePersianDate } from '../utils/jalali';
import { normalizePersianSearch, toPersianDigits } from '../utils/persian';
import { CategoryIcon } from './CategoryIcon';

const REASON_LABELS: Record<ShoppingReason, { text: string; tone: string }> = {
  zero_stock: {
    text: 'موجودی خانه: ۰',
    tone: 'bg-error-container dark:bg-rose-950/70 text-on-error-container dark:text-rose-300',
  },
  low_stock: {
    text: 'رو به اتمام / نیمه‌مصرف',
    tone: 'bg-tertiary-fixed dark:bg-amber-950/70 text-on-tertiary-fixed-variant dark:text-amber-300',
  },
  expired_replace: {
    text: 'جایگزینی داروی منقضی',
    tone: 'bg-error-container dark:bg-rose-950/70 text-on-error-container dark:text-rose-300',
  },
  manual: {
    text: 'افزوده شده دستی',
    tone: 'bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300',
  },
};

export const ShoppingListView: React.FC = () => {
  const {
    state,
    addManualShoppingItem,
    removeShoppingItem,
    markShoppingBought,
    clearPurchasedLog,
    showToast,
  } = useAppState();

  const [quickInput, setQuickInput] = useState('');
  const [showPurchased, setShowPurchased] = useState(true);

  const voice = useVoiceSearch(
    (transcript) => {
      setQuickInput(transcript);
      showToast(`شنیده شد: «${transcript}» — دکمه افزودن را بزنید`, 'info');
    },
    (err) => showToast(err, 'warning')
  );

  const suggestions = useMemo(() => {
    const q = normalizePersianSearch(quickInput);
    if (q.length < 2) return [];
    return [...state.customCatalog, ...DRUG_CATALOG]
      .filter((d) =>
        normalizePersianSearch(`${d.name} ${d.englishName} ${d.keywords.join(' ')}`).includes(q)
      )
      .slice(0, 5);
  }, [quickInput, state.customCatalog]);

  const handleQuickAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    const val = quickInput.trim();
    if (!val) return;
    addManualShoppingItem(val, '۱ عدد');
    setQuickInput('');
  };

  const handleCopyShoppingText = async () => {
    const dateLabel = formatLivePersianDate(new Date());
    let text = '📋 *لیست خرید داروخانه (جعبه داروی من)* 🏥\n━━━━━━━━━━━━━━━━━━\n\n';
    if (state.shopping.length === 0) {
      text += '🌿 همه داروها در خانه موجود است و کسری نداریم.';
    } else {
      state.shopping.forEach((item, idx) => {
        text += `${toPersianDigits(idx + 1)}. *${item.name}* (${item.quantityLabel}) — ${REASON_LABELS[item.reason].text}\n`;
      });
      text += `\n━━━━━━━━━━━━━━━━━━\n📅 ${dateLabel}`;
    }

    try {
      await navigator.clipboard.writeText(text);
      showToast('متن لیست خرید کپی شد!', 'success', 'آماده ارسال در واتساپ، ایتا یا تلگرام');
    } catch {
      showToast('امکان دسترسی خودکار به کلیپ‌بورد نبود', 'warning');
    }
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-6 max-w-3xl mx-auto">
      {/* Header Summary Card */}
      <section className="bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-fixed dark:bg-primary/25 text-primary dark:text-inverse-primary flex items-center justify-center shrink-0">
              <ShoppingBag size={20} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-base sm:text-lg font-bold text-on-surface dark:text-white">
                لیست خرید داروخانه
              </h2>
              <span className="text-xs text-on-surface-variant dark:text-slate-400">
                نسخه جدید دکتر یا اقلام ضروری انتخاب‌شده توسط شما
              </span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold tabular-nums ${
              state.shopping.length > 0
                ? 'bg-error-container dark:bg-rose-950/70 text-on-error-container dark:text-rose-300'
                : 'bg-secondary-container dark:bg-teal-950 text-on-secondary-container dark:text-teal-300'
            }`}
          >
            {state.shopping.length > 0
              ? `${toPersianDigits(state.shopping.length)} قلم در لیست خرید`
              : 'لیست خرید خالی است ✓'}
          </span>
        </div>

        <div className="bg-surface-container-low dark:bg-slate-800/70 p-3 rounded-xl flex items-start gap-2.5">
          <Lightbulb size={18} className="text-primary dark:text-inverse-primary shrink-0 mt-0.5" />
          <p className="text-xs text-on-surface-variant dark:text-slate-300 leading-relaxed">
            این بخش برای یادداشت <strong>نسخه جدید دکتر یا اقلام ضروری که خودتان برای خرید انتخاب کرده‌اید</strong> است (داروهای تمام‌شده خودکار اضافه نمی‌شوند). پس از خرید، با زدن «خریدم ✓» می‌توانید آن را به موجودی جعبه اضافه کنید.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyShoppingText}
          className="w-full h-11 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-on-primary text-xs sm:text-sm font-bold shadow-sm hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          <Copy size={17} />
          <span>کپی متن لیست برای واتساپ / ایتا / تلگرام</span>
        </button>
      </section>

      {/* Quick Add Input + Autocomplete */}
      <form
        onSubmit={handleQuickAdd}
        className="bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800 p-3.5 rounded-2xl shadow-xs flex flex-col gap-2 relative"
      >
        <label
          htmlFor="shopping-quick-input"
          className="text-xs font-bold text-on-surface dark:text-slate-200 flex items-center justify-between"
        >
          <span>افزودن سریع قلم جدید به لیست خرید</span>
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="shopping-quick-input"
              type="text"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              placeholder="مثلاً: کرم ضدآفتاب یا سرنگ ۵ سی‌سی..."
              className="w-full h-11 bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-white placeholder:text-outline dark:placeholder:text-slate-500 rounded-xl pr-3.5 pl-10 text-sm outline-none border border-transparent focus:border-primary"
            />
            {voice.isSupported && (
              <button
                type="button"
                onClick={voice.start}
                aria-label="ورود صوتی نام دارو"
                className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center ${
                  voice.isListening
                    ? 'bg-error text-on-error animate-pulse'
                    : 'text-outline hover:text-primary'
                }`}
              >
                <Mic size={18} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="h-11 px-4 rounded-xl bg-secondary text-on-secondary text-xs sm:text-sm font-bold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
          >
            <Plus size={17} />
            <span>افزودن</span>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {suggestions.length > 0 && (
          <div className="flex flex-col rounded-xl bg-surface-container-low dark:bg-slate-800 border border-surface-container-highest dark:border-slate-700 overflow-hidden mt-1">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  addManualShoppingItem(s.name, `۱ ${s.defaultUnit}`);
                  setQuickInput('');
                }}
                className="px-3 py-2.5 text-right hover:bg-surface-container dark:hover:bg-slate-700 flex items-center justify-between text-xs border-b last:border-b-0 border-surface-container dark:border-slate-700"
              >
                <span className="font-bold text-on-surface dark:text-white">
                  {s.name}
                </span>
                <span className="text-primary dark:text-inverse-primary font-semibold">
                  + افزودن
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Active Shopping Checklist */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-on-surface dark:text-white">
            اقلام ضروری برای خرید
          </span>
          {state.shopping.length > 0 && (
            <span className="text-[11px] text-outline dark:text-slate-400">
              بعد از خرید روی «خریدم ✓» بزنید
            </span>
          )}
        </div>

        {state.shopping.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800 p-8 text-center flex flex-col items-center gap-2">
            <CheckCircle2 size={34} className="text-secondary dark:text-secondary-fixed" />
            <h3 className="text-sm sm:text-base font-bold text-on-surface dark:text-white">
              لیست خرید خالی است!
            </h3>
            <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-xs leading-relaxed">
              اقلام نسخه جدید دکتر یا لوازم ضروری مورد نیاز خود را از کادر بالا به لیست خرید اضافه کنید.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {state.shopping.map((item) => {
              const reasonMeta = REASON_LABELS[item.reason] ?? REASON_LABELS.manual;
              return (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary-fixed/60 dark:bg-primary/20 text-primary dark:text-inverse-primary flex items-center justify-center shrink-0">
                        <CategoryIcon category={item.category ?? 'firstaid'} size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-on-surface dark:text-white truncate">
                          {item.name}
                        </h4>
                        {item.subtitle && (
                          <span className="text-[11px] text-outline dark:text-slate-400 font-mono truncate" dir="ltr">
                            {item.subtitle}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${reasonMeta.tone}`}
                    >
                      {reasonMeta.text}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-container/60 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-outline dark:text-slate-400">مقدار:</span>
                      <span className="font-bold text-primary dark:text-inverse-primary bg-primary-fixed/60 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                        {item.quantityLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => removeShoppingItem(item.id)}
                        aria-label="حذف از لیست خرید"
                        className="w-10 h-10 rounded-xl bg-surface-container-low dark:bg-slate-800 text-outline hover:text-error flex items-center justify-center active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => markShoppingBought(item.id)}
                        className="h-10 px-4 rounded-xl bg-secondary text-on-secondary text-xs font-bold flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-95 transition-all"
                      >
                        <Check size={16} />
                        <span>خریدم ✓</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recently Purchased Accordion */}
      {state.purchasedLog.length > 0 && (
        <section className="bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800 rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPurchased((v) => !v)}
            className="w-full p-4 flex items-center justify-between text-on-surface dark:text-white hover:bg-surface-container-low dark:hover:bg-slate-800/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-secondary dark:text-secondary-fixed" />
              <span className="text-sm font-bold">اقلام خریداری شده اخیراً</span>
              <span className="text-xs font-bold text-secondary dark:text-teal-300 tabular-nums">
                ({toPersianDigits(state.purchasedLog.length)})
              </span>
            </div>
            <ChevronDown
              size={18}
              className={`text-outline transition-transform ${showPurchased ? 'rotate-180' : ''}`}
            />
          </button>

          {showPurchased && (
            <div className="px-4 pb-4 flex flex-col gap-2">
              {state.purchasedLog.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-surface-container-low dark:bg-slate-800/60 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Check size={15} className="text-secondary shrink-0" />
                    <span className="line-through text-on-surface dark:text-slate-200 truncate">
                      {log.name}
                    </span>
                    <span className="text-secondary dark:text-teal-400 shrink-0">
                      ({log.quantityLabel})
                    </span>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={clearPurchasedLog}
                className="self-end text-[11px] text-outline hover:text-error mt-1 px-2 py-1"
              >
                پاک کردن تاریخچه خرید
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
