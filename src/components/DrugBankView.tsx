import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Info,
  Mic,
  Package,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { CATEGORIES } from '../data/categories';
import { DRUG_CATALOG, STARTER_PACKS } from '../data/drugCatalog';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import type { CatalogEntry, MedicineCategory } from '../types';
import { normalizePersianSearch, toPersianDigits } from '../utils/persian';
import { CATEGORY_STYLE, CategoryIcon } from './CategoryIcon';

export const DrugBankView: React.FC = () => {
  const {
    state,
    openAddSheet,
    addFromCatalog,
    applyStarterPack,
    deleteCustomCatalogEntry,
    showToast,
  } = useAppState();

  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<'all' | MedicineCategory>('all');

  const voice = useVoiceSearch(
    (transcript) => {
      setQuery(transcript);
      showToast(`جستجوی صوتی: «${transcript}»`, 'info');
    },
    (err) => showToast(err, 'warning')
  );

  const normalizedQuery = normalizePersianSearch(query);

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

  const filteredCatalog = useMemo(() => {
    return mergedCatalog.filter((entry) => {
      if (selectedCat !== 'all' && entry.category !== selectedCat) return false;
      if (!normalizedQuery) return true;
      const searchable = normalizePersianSearch(
        `${entry.name} ${entry.englishName} ${entry.form} ${entry.description} ${entry.keywords.join(' ')}`
      );
      return searchable.includes(normalizedQuery);
    });
  }, [mergedCatalog, normalizedQuery, selectedCat]);

  // Quick lookup map of owned items by catalogId or normalized name
  const findOwned = (catalogId: string, name: string) => {
    const norm = normalizePersianSearch(name);
    return state.cabinet.find(
      (c) => c.catalogId === catalogId || normalizePersianSearch(c.name) === norm
    );
  };

  return (
    <div className="flex flex-col w-full gap-5 pb-6">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary-fixed via-surface-container to-surface-container-high dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 border border-primary/10 dark:border-slate-700/60 p-4 shadow-xs">
        <div className="flex items-start gap-3 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={24} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-extrabold text-on-surface dark:text-white">
                بانک اقلام دارویی ایران
              </h2>
              <span className="text-xs font-bold text-secondary dark:text-secondary-fixed">
                · {toPersianDigits(mergedCatalog.length)} قلم پرمصرف
              </span>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant dark:text-slate-300 mt-1 leading-relaxed">
              بدون نیاز به تایپ! هر دارو یا وسیله پزشکی که در خانه دارید را با یک لمس به جعبه اضافه کنید.
            </p>
          </div>
        </div>
      </section>

      {/* Starter Packs Section */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Package size={18} className="text-primary dark:text-inverse-primary" />
            <h3 className="text-sm font-bold text-on-surface dark:text-white">
              پک‌های دارویی آماده (افزودن سریع)
            </h3>
          </div>
          <span className="text-[11px] text-outline dark:text-slate-400">
            بدون تاریخ انقضای فرضی
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {STARTER_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="flex flex-col justify-between p-3.5 rounded-2xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800 shadow-xs"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-2xl leading-none">{pack.emoji}</span>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-on-surface dark:text-white">
                    {pack.title}
                  </span>
                  <span className="text-[11px] text-outline dark:text-slate-400 mt-0.5">
                    {pack.subtitle} ({toPersianDigits(pack.itemIds.length)} قلم)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => applyStarterPack(pack.id)}
                className="mt-3 w-full h-10 rounded-xl bg-surface-container dark:bg-slate-800 text-primary dark:text-inverse-primary hover:bg-primary hover:text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <Plus size={16} />
                <span>افزودن پک به جعبه</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Search + Voice + Category Filters */}
      <div className="flex flex-col gap-2.5">
        <div className="relative w-full">
          <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-outline dark:text-slate-400">
            <Search size={19} />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`جستجو در ${toPersianDigits(mergedCatalog.length)} داروی رایج خانگی (فارسی یا انگلیسی)...`}
            className="w-full h-12 pr-11 pl-20 rounded-xl bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-white text-sm placeholder:text-outline dark:placeholder:text-slate-500 border border-surface-container dark:border-slate-800 shadow-xs focus:outline-none focus:border-primary transition-all"
          />
          <div className="absolute inset-y-1.5 left-1.5 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="پاک کردن متن"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-outline hover:text-on-surface dark:hover:text-white"
              >
                <X size={17} />
              </button>
            )}
            {voice.isSupported && (
              <button
                type="button"
                onClick={voice.start}
                aria-label="جستجوی صوتی به زبان فارسی"
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                  voice.isListening
                    ? 'bg-error text-on-error animate-pulse'
                    : 'text-primary dark:text-inverse-primary hover:bg-surface-container dark:hover:bg-slate-800'
                }`}
              >
                <Mic size={19} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
              selectedCat === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300'
            }`}
          >
            همه موارد ({toPersianDigits(mergedCatalog.length)})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedCat === cat.id
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between px-1 text-xs text-outline dark:text-slate-400">
        <span className="font-semibold text-on-surface dark:text-slate-200">
          داروها و اقلام پرمصرف
        </span>
        <span className="tabular-nums">
          نمایش {toPersianDigits(filteredCatalog.length)} قلم
        </span>
      </div>

      {/* Catalog Grid */}
      {filteredCatalog.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-2xl bg-surface-container-low dark:bg-slate-900 border border-surface-container dark:border-slate-800">
          <Search size={32} className="text-outline mb-2" />
          <h3 className="text-base font-bold text-on-surface dark:text-white">
            این دارو در لیست پیدا نشد
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant dark:text-slate-400 mt-1 max-w-xs">
            می‌توانید این دارو را با نام دلخواه به طور دستی در جعبه ثبت کنید.
          </p>
          <button
            type="button"
            onClick={() => openAddSheet({ prefillName: query.trim() })}
            className="mt-4 h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>ثبت دستی «{query.trim()}»</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCatalog.map((entry) => {
            const owned = findOwned(entry.id, entry.name);
            const catStyle = CATEGORY_STYLE[entry.category] ?? CATEGORY_STYLE.pain;

            return (
              <div
                key={entry.id}
                className="rounded-2xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800 p-3.5 shadow-xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${catStyle.bg} ${catStyle.text}`}
                  >
                    <CategoryIcon category={entry.category} size={22} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h4 className="text-sm font-bold text-on-surface dark:text-white">
                          {entry.name}
                        </h4>
                        <span className="text-[11px] text-secondary dark:text-secondary-fixed font-semibold">
                          · {entry.form}
                        </span>
                        {entry.isCustom && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/25 text-primary dark:text-inverse-primary text-[10px] font-bold">
                            ثبت‌شده توسط شما
                          </span>
                        )}
                      </div>
                      {entry.isCustom && (
                        <button
                          type="button"
                          onClick={() => deleteCustomCatalogEntry(entry.id)}
                          aria-label={`حذف ${entry.name} از بانک شخصی`}
                          title="حذف از بانک داروی شخصی"
                          className="w-7 h-7 rounded-lg text-outline hover:text-error hover:bg-error-container/50 flex items-center justify-center shrink-0 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {entry.englishName && (
                      <span className="text-[11px] text-outline dark:text-slate-400 font-mono truncate" dir="ltr">
                        {entry.englishName}
                      </span>
                    )}
                    {entry.description && (
                      <p className="text-xs text-on-surface-variant dark:text-slate-300 mt-1 leading-relaxed">
                        {entry.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2.5 border-t border-surface-container/60 dark:border-slate-800 flex items-center justify-between gap-2">
                  {owned ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/80 dark:bg-teal-950 text-on-secondary-container dark:text-teal-300 text-xs font-bold tabular-nums">
                        <CheckCircle2 size={14} />
                        <span>
                          در خانه داری ({toPersianDigits(owned.quantity)} {owned.unit})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => addFromCatalog(entry)}
                        className="h-8 px-2.5 rounded-full bg-surface-container dark:bg-slate-800 hover:bg-surface-container-high text-on-surface dark:text-white text-xs font-bold active:scale-95"
                        title="افزایش موجودی"
                      >
                        +۱
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addFromCatalog(entry)}
                      className="h-9 px-3.5 rounded-full bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
                    >
                      <Plus size={16} />
                      <span>افزودن به جعبه دارو</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openAddSheet({ prefillCatalog: entry })}
                    title="ثبت با تاریخ انقضا و محل دلخواه"
                    className="h-9 px-2.5 rounded-xl text-on-surface-variant dark:text-slate-300 hover:bg-surface-container dark:hover:bg-slate-800 text-[11px] font-medium flex items-center gap-1"
                  >
                    <Info size={15} />
                    <span>ثبت دقیق</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
