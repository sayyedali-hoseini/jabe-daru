import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  MapPin,
  Mic,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { CATEGORIES } from '../data/categories';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import type { CabinetItem, MedicineCategory } from '../types';
import {
  formatGregorianExpiry,
  formatJalaliExpiry,
  getExpiryStatus,
} from '../utils/jalali';
import { normalizePersianSearch, toPersianDigits } from '../utils/persian';
import { CATEGORY_STYLE, CategoryIcon } from './CategoryIcon';

type StatusFilter = 'all' | 'in_stock' | 'half_opened' | 'expired';

export const CabinetView: React.FC = () => {
  const {
    state,
    stats,
    setActiveTab,
    openAddSheet,
    setDoctorModalOpen,
    stepCabinetQuantity,
    deleteCabinetItem,
    isInShoppingList,
    toggleShoppingForCabinetItem,
    updatePreferences,
    showToast,
  } = useAppState();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MedicineCategory>('all');

  const voice = useVoiceSearch(
    (transcript) => {
      setSearchQuery(transcript);
      showToast(`شنیده شد: «${transcript}»`, 'info');
    },
    (errMsg) => showToast(errMsg, 'warning')
  );

  const warnMonths = state.preferences.expiryWarningMonths;
  const seniorMode = state.preferences.seniorMode;
  const normalizedQuery = normalizePersianSearch(searchQuery);

  const filteredItems = useMemo(() => {
    return state.cabinet.filter((item) => {
      const expStatus = getExpiryStatus(item.expiry, warnMonths);

      if (statusFilter === 'in_stock') {
        if (item.quantity <= 0 || expStatus === 'expired') return false;
      } else if (statusFilter === 'half_opened') {
        if (!item.isHalfOrOpened) return false;
      } else if (statusFilter === 'expired') {
        if (expStatus !== 'expired' && expStatus !== 'expiring_soon') return false;
      }

      if (categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }

      if (normalizedQuery) {
        const haystack = normalizePersianSearch(
          `${item.name} ${item.genericName ?? ''} ${item.location ?? ''} ${item.form} ${item.description ?? ''}`
        );
        if (!haystack.includes(normalizedQuery)) return false;
      }

      return true;
    });
  }, [categoryFilter, normalizedQuery, state.cabinet, statusFilter, warnMonths]);

  const pharmacyVerdict = useMemo(() => {
    if (!normalizedQuery) return null;
    const matches = state.cabinet.filter((item) => {
      const haystack = normalizePersianSearch(
        `${item.name} ${item.genericName ?? ''} ${item.location ?? ''} ${item.form}`
      );
      return haystack.includes(normalizedQuery);
    });

    if (matches.length === 0) {
      return { type: 'not_found' as const };
    }

    const healthyMatch = matches.find((m) => {
      const exp = getExpiryStatus(m.expiry, warnMonths);
      return m.quantity > 0 && exp !== 'expired';
    });

    if (healthyMatch) {
      return { type: 'in_stock' as const, item: healthyMatch };
    }

    return { type: 'depleted_or_expired' as const, item: matches[0] };
  }, [normalizedQuery, state.cabinet, warnMonths]);

  const showWelcomeCard =
    state.cabinet.length === 0 && !state.preferences.welcomeDismissed;

  const toggleStatusFilter = (next: StatusFilter) => {
    setStatusFilter((prev) => (prev === next ? 'all' : next));
  };

  const handleToggleSenior = () => {
    const next = !seniorMode;
    updatePreferences({ seniorMode: next });
    showToast(
      next ? 'حالت ساده و درشت‌خط (سالمندان) فعال شد' : 'حالت استاندارد فعال شد',
      'info'
    );
  };

  return (
    <div className="flex flex-col w-full gap-3.5 pb-6">
      {/* 1. Calm Welcome & Intro Card (Shown on empty cabinet before dismissal) */}
      {showWelcomeCard && (
        <section className="senior-hide relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-surface-container-low to-secondary/10 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border border-primary/20 dark:border-slate-700 p-4 sm:p-5 shadow-sm">
          <button
            type="button"
            onClick={() => updatePreferences({ welcomeDismissed: true })}
            aria-label="بستن پیام خوش‌آمدگویی"
            className="absolute top-3.5 left-3.5 w-8 h-8 rounded-full bg-surface-container-lowest/90 dark:bg-slate-700 text-outline dark:text-slate-300 flex items-center justify-center hover:bg-surface-container active:scale-95 transition-all"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2.5 mb-2 pl-8">
            <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
              <Sparkles size={18} />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-on-surface dark:text-white">
              جعبه داروی خونه، همیشه تو جیبت 💊
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-on-surface-variant dark:text-slate-300 leading-relaxed max-w-[95%]">
            دیگه جلوی دکتر یا تو داروخونه شک نکن تو خونه چی داری! داروهای خونه (حتی ورق‌های نصفه) رو ثبت کن تا پول داروی تکراری ندی. کاملاً رایگان، بدون ثبت‌نام و آفلاین روی گوشی خودت.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={() => openAddSheet()}
              className="flex-1 h-11 px-4 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm hover:brightness-105 active:scale-[0.98] transition-all"
            >
              <Plus size={17} />
              <span>ثبت اولین دارو</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('drug-bank')}
              className="flex-1 h-11 px-4 rounded-xl bg-surface-container-lowest dark:bg-slate-800 border border-surface-container-highest dark:border-slate-700 text-on-surface dark:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-surface-container active:scale-[0.98] transition-all"
            >
              <BookOpen size={17} />
              <span>انتخاب از بانک داروهای ایران</span>
            </button>
          </div>
        </section>
      )}

      {/* 2. Search & Real Persian Voice Search + Discoverable Mode Pills */}
      <div className="flex flex-col gap-2.5">
        <div className="relative w-full">
          <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-on-surface-variant dark:text-slate-400">
            <Search size={19} />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی سریع داروخانه (استامینوفن، ژلوفن، یخچال...)"
            className="w-full h-12 pr-11 pl-20 rounded-2xl bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-white placeholder:text-outline dark:placeholder:text-slate-500 text-sm shadow-xs border border-surface-container dark:border-slate-800 focus:border-primary focus:outline-none transition-all"
          />
          <div className="absolute inset-y-1.5 left-1.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="پاک کردن جستجو"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-outline hover:text-on-surface dark:hover:text-white hover:bg-surface-container dark:hover:bg-slate-800"
              >
                <X size={17} />
              </button>
            )}
            {voice.isSupported && (
              <button
                type="button"
                onClick={voice.start}
                aria-label="جستجوی صوتی فارسی"
                title="جستجوی صوتی دارو به فارسی"
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
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

        {/* Two Discoverable Labeled Action Pills right below Search */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDoctorModalOpen(true)}
            className="h-11 px-3 rounded-2xl bg-secondary-container/70 dark:bg-secondary/20 text-on-secondary-container dark:text-secondary-fixed border border-secondary/20 hover:bg-secondary-container dark:hover:bg-secondary/35 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition-all"
          >
            <span className="truncate">🩺 لیست برای مطب دکتر</span>
            {stats.validInStockCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-secondary text-on-secondary text-[11px] font-extrabold tabular-nums leading-none shrink-0">
                {toPersianDigits(stats.validInStockCount)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleSenior}
            aria-pressed={seniorMode}
            className={`h-11 px-3 rounded-2xl border flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition-all ${
              seniorMode
                ? 'bg-primary text-on-primary border-primary shadow-primary/20'
                : 'bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-slate-200 border-surface-container-highest dark:border-slate-800 hover:bg-surface-container'
            }`}
          >
            <span className="truncate">👓 حالت ساده (درشت)</span>
          </button>
        </div>

        {/* Live In-Pharmacy Verdict */}
        {pharmacyVerdict && (
          <div
            className={`rounded-2xl p-3 flex items-center justify-between gap-2.5 shadow-xs border ${
              pharmacyVerdict.type === 'in_stock'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                : pharmacyVerdict.type === 'depleted_or_expired'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {pharmacyVerdict.type === 'in_stock' ? (
                <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : pharmacyVerdict.type === 'depleted_or_expired' ? (
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <XCircle size={20} className="text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <div className="text-xs sm:text-sm leading-snug">
                {pharmacyVerdict.type === 'in_stock' && (
                  <>
                    <strong>خیالت راحت، در خانه داری!</strong> (
                    {toPersianDigits(pharmacyVerdict.item.quantity)}{' '}
                    {pharmacyVerdict.item.unit}
                    {pharmacyVerdict.item.location
                      ? ` در ${pharmacyVerdict.item.location}`
                      : ''}
                    )
                  </>
                )}
                {pharmacyVerdict.type === 'depleted_or_expired' && (
                  <>
                    <strong>قبلاً داشتی ولی تمام یا منقضی شده</strong> — باید از داروخانه بخری
                  </>
                )}
                {pharmacyVerdict.type === 'not_found' && (
                  <>
                    <strong>در لیست خونه‌ات نیست</strong> — می‌تونی با خیال راحت بخری
                  </>
                )}
              </div>
            </div>
            {pharmacyVerdict.type === 'not_found' && (
              <button
                type="button"
                onClick={() => openAddSheet({ prefillName: searchQuery.trim() })}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs active:scale-95"
              >
                ثبت در جعبه
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Senior Mode Quick Big Add Button */}
      {seniorMode && (
        <button
          type="button"
          onClick={() => openAddSheet()}
          className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-primary to-secondary text-on-primary shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform font-bold text-lg"
        >
          <Plus size={24} />
          <span>ثبت داروی جدید</span>
        </button>
      )}

      {/* 4. Compact 1-Row Status Filter Mini-Pill Strip (Hidden in Senior Mode) */}
      {state.cabinet.length > 0 && (
        <div className="senior-hide flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`shrink-0 h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
              statusFilter === 'all'
                ? 'bg-primary text-on-primary border-primary shadow-xs'
                : 'bg-surface-container-lowest dark:bg-slate-900 text-on-surface dark:text-slate-200 border-surface-container dark:border-slate-800'
            }`}
          >
            <span>همه</span>
            <span className="tabular-nums opacity-85">
              ({toPersianDigits(stats.total)})
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleStatusFilter('in_stock')}
            className={`shrink-0 h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
              statusFilter === 'in_stock'
                ? 'bg-secondary text-on-secondary border-secondary shadow-xs'
                : 'bg-surface-container-lowest dark:bg-slate-900 text-secondary dark:text-secondary-fixed border-surface-container dark:border-slate-800'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>موجود</span>
            <span className="tabular-nums">({toPersianDigits(stats.inStock)})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleStatusFilter('half_opened')}
            className={`shrink-0 h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
              statusFilter === 'half_opened'
                ? 'bg-tertiary text-on-tertiary border-tertiary shadow-xs'
                : 'bg-surface-container-lowest dark:bg-slate-900 text-tertiary dark:text-amber-300 border-surface-container dark:border-slate-800'
            }`}
          >
            <span>🌗</span>
            <span>ورق نصفه / درب‌باز</span>
            <span className="tabular-nums">({toPersianDigits(stats.halfOpened)})</span>
          </button>

          <button
            type="button"
            onClick={() => toggleStatusFilter('expired')}
            className={`shrink-0 h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
              statusFilter === 'expired'
                ? 'bg-error text-on-error border-error shadow-xs'
                : 'bg-surface-container-lowest dark:bg-slate-900 text-error dark:text-rose-400 border-surface-container dark:border-slate-800'
            }`}
          >
            <AlertTriangle size={14} />
            <span>منقضی / نزدیک</span>
            <span className="tabular-nums">
              ({toPersianDigits(stats.expiringOrExpired)})
            </span>
          </button>
        </div>
      )}

      {/* 5. Category Filter Chips */}
      {state.cabinet.length > 0 && (
        <div className="senior-hide flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-primary/15 text-primary dark:bg-primary/30 dark:text-inverse-primary font-bold'
                : 'bg-surface-container-low dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container'
            }`}
          >
            همه دسته‌ها
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1 ${
                categoryFilter === cat.id
                  ? 'bg-primary/15 text-primary dark:bg-primary/30 dark:text-inverse-primary font-bold'
                  : 'bg-surface-container-low dark:bg-slate-900 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 6. Medicine Cards Grid OR Clean Empty State */}
      {state.cabinet.length === 0 ? (
        state.preferences.welcomeDismissed && (
          <div className="flex flex-col items-center justify-center py-12 px-5 text-center rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-surface-container-low dark:bg-slate-800 flex items-center justify-center text-primary mb-3">
              <Package size={32} />
            </div>
            <h3 className="text-base font-bold text-on-surface dark:text-white">
              جعبه داروی شما هنوز خالی است
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant dark:text-slate-400 mt-1.5 max-w-sm leading-relaxed">
              برای شروع می‌توانید داروهای رایج خانه را ثبت کنید یا از بانک داروهای ایران انتخاب نمایید.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => openAddSheet()}
                className="h-11 px-4 rounded-xl bg-primary text-on-primary text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Plus size={17} />
                <span>ثبت اولین دارو</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('drug-bank')}
                className="h-11 px-4 rounded-xl bg-surface-container dark:bg-slate-800 text-on-surface dark:text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 active:scale-95"
              >
                <BookOpen size={17} />
                <span>انتخاب از بانک داروهای ایران</span>
              </button>
            </div>
          </div>
        )
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center rounded-3xl bg-surface-container-lowest dark:bg-slate-900 border border-surface-container dark:border-slate-800">
          <div className="w-14 h-14 rounded-full bg-surface-container-low dark:bg-slate-800 flex items-center justify-center text-outline mb-3">
            <Search size={28} />
          </div>
          <h3 className="text-base font-bold text-on-surface dark:text-white">
            دارویی با این فیلتر پیدا نشد
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant dark:text-slate-400 mt-1 max-w-xs">
            فیلترها را پاک کنید یا همین الان این دارو را به جعبه اضافه نمایید.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setCategoryFilter('all');
              }}
              className="h-10 px-4 rounded-xl bg-surface-container dark:bg-slate-800 text-on-surface dark:text-white text-xs font-bold"
            >
              نمایش همه داروها
            </button>
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => openAddSheet({ prefillName: searchQuery.trim() })}
                className="h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={16} />
                <span>ثبت «{searchQuery.trim()}»</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <CabinetCard
              key={item.id}
              item={item}
              warnMonths={warnMonths}
              inCart={isInShoppingList(item.id, item.name)}
              onStep={(delta) => stepCabinetQuantity(item.id, delta)}
              onToggleCart={() => toggleShoppingForCabinetItem(item)}
              onEdit={() => openAddSheet({ editingItem: item })}
              onDelete={() => deleteCabinetItem(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CabinetCardProps {
  item: CabinetItem;
  warnMonths: number;
  inCart: boolean;
  onStep: (delta: number) => void;
  onToggleCart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CabinetCard: React.FC<CabinetCardProps> = ({
  item,
  warnMonths,
  inCart,
  onStep,
  onToggleCart,
  onEdit,
  onDelete,
}) => {
  const expStatus = getExpiryStatus(item.expiry, warnMonths);
  const catStyle = CATEGORY_STYLE[item.category] ?? CATEGORY_STYLE.pain;

  const displayExpiry = item.expiry
    ? item.expiry.calendar === 'gregorian'
      ? formatGregorianExpiry(item.expiry)
      : formatJalaliExpiry(item.expiry)
    : null;

  return (
    <article
      className={`senior-card bg-surface-container-lowest dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-xs border flex flex-col justify-between gap-2.5 transition-all ${
        expStatus === 'expired'
          ? 'border-error/40 dark:border-error/50'
          : item.quantity === 0
          ? 'border-outline-variant/60 dark:border-slate-700 opacity-85'
          : 'border-surface-container dark:border-slate-800 hover:shadow-sm'
      }`}
    >
      <div className="flex flex-col gap-2.5">
        {/* Top Row: Icon + Pure Persian Name/Form + Status */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden ${catStyle.bg} ${catStyle.text}`}
            >
              <CategoryIcon category={item.category} size={22} />
              <div className={`absolute bottom-0 inset-x-0 h-1 ${catStyle.bar}`} />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="senior-title text-sm sm:text-base font-bold text-on-surface dark:text-white leading-snug">
                  {item.name}
                </h3>
                {item.form && (
                  <span className="text-[11px] font-medium text-outline dark:text-slate-400">
                    ({item.form})
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-xs text-on-surface-variant dark:text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </div>

          {/* Semantic Status Label */}
          {expStatus === 'expired' ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-error text-on-error text-[11px] font-bold">
              <AlertTriangle size={12} />
              <span>منقضی شده</span>
            </span>
          ) : item.quantity === 0 ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 text-[11px] font-bold">
              <span>مصرف شد (تمام شد)</span>
            </span>
          ) : expStatus === 'expiring_soon' ? (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tertiary-fixed dark:bg-amber-950/80 text-on-tertiary-fixed-variant dark:text-amber-300 text-[11px] font-bold">
              <span>نزدیک انقضا</span>
            </span>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/80 dark:bg-teal-950 text-on-secondary-container dark:text-teal-300 text-[11px] font-bold">
              <span>موجود</span>
            </span>
          )}
        </div>

        {/* Expired Alert Banner */}
        {expStatus === 'expired' && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-error-container/70 dark:bg-rose-950/60 text-on-error-container dark:text-rose-200 text-xs">
            <span className="leading-snug">
              تاریخ انقضای این دارو گذشته است. لطفاً مصرف نکنید.
            </span>
            <button
              type="button"
              onClick={onDelete}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-error text-on-error text-[11px] font-bold active:scale-95"
            >
              <Trash2 size={13} />
              <span>حذف</span>
            </button>
          </div>
        )}

        {/* Zero-Stock 1-Tap Removal Banner (when not already expired) */}
        {item.quantity === 0 && expStatus !== 'expired' && (
          <div className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-surface-container-low dark:bg-slate-800/80 text-on-surface-variant dark:text-slate-300 text-xs">
            <span className="leading-snug">
              این قلم مصرف شده و موجودی آن صفر است.
            </span>
            <button
              type="button"
              onClick={onDelete}
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-highest dark:bg-slate-700 hover:bg-error hover:text-on-error text-on-surface dark:text-white text-[11px] font-bold transition-colors active:scale-95"
            >
              <Trash2 size={13} />
              <span>حذف از جعبه</span>
            </button>
          </div>
        )}

        {/* Location (if set), Half-Used & Single-Calendar Expiry Row */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          {item.location && (
            <span className="inline-flex items-center gap-1 text-on-surface-variant dark:text-slate-300 bg-surface-container-low dark:bg-slate-800 px-2.5 py-1 rounded-xl">
              <MapPin size={13} className="text-primary dark:text-inverse-primary shrink-0" />
              <span>{item.location}</span>
            </span>
          )}

          {item.isHalfOrOpened && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/12 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/20">
              <span>🌗 ورق نصفه / درب‌باز</span>
            </span>
          )}

          {displayExpiry ? (
            <button
              type="button"
              onClick={onEdit}
              title="ویرایش تاریخ انقضا"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl font-bold tabular-nums transition-colors ${
                expStatus === 'expired'
                  ? 'bg-error-container dark:bg-rose-950/70 text-error dark:text-rose-300'
                  : expStatus === 'expiring_soon'
                  ? 'bg-tertiary-fixed/60 dark:bg-amber-950/70 text-tertiary dark:text-amber-300'
                  : 'bg-surface-container-low dark:bg-slate-800 text-secondary dark:text-teal-300'
              }`}
            >
              <Calendar size={13} />
              <span dir={item.expiry?.calendar === 'gregorian' ? 'ltr' : 'rtl'}>
                انقضا: {displayExpiry}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-surface-container-low dark:bg-slate-800/80 text-on-surface-variant dark:text-slate-400 hover:bg-surface-container dark:hover:bg-slate-800 border border-dashed border-outline-variant dark:border-slate-700 text-[11px] font-medium transition-colors"
            >
              <span>📅 تاریخ انقضا ثبت نشده</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Actions: Quantity Stepper + Cart + Edit */}
      <div className="flex items-center justify-between pt-2 border-t border-surface-container/60 dark:border-slate-800">
        <div className="flex items-center bg-surface-container-low dark:bg-slate-800 rounded-xl p-1 gap-1.5">
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-label="کاهش تعداد"
            className="senior-stepper-btn w-9 h-9 rounded-lg bg-surface-container-lowest dark:bg-slate-700 text-on-surface dark:text-white flex items-center justify-center hover:bg-surface-container active:scale-95 shadow-xs"
          >
            <Minus size={16} />
          </button>
          <span className="senior-big-text min-w-[54px] text-center text-xs sm:text-sm font-bold text-on-surface dark:text-white tabular-nums px-1">
            {toPersianDigits(item.quantity)} {item.unit}
          </span>
          <button
            type="button"
            onClick={() => onStep(1)}
            aria-label="افزایش تعداد"
            className="senior-stepper-btn w-9 h-9 rounded-lg bg-surface-container-lowest dark:bg-slate-700 text-on-surface dark:text-white flex items-center justify-center hover:bg-surface-container active:scale-95 shadow-xs"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleCart}
            aria-label={inCart ? 'حذف از لیست خرید' : 'افزودن به لیست خرید'}
            title={inCart ? 'در لیست خرید است (کلیک برای حذف)' : 'افزودن به لیست خرید'}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              inCart
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container'
            }`}
          >
            <ShoppingCart size={18} />
          </button>
          <button
            type="button"
            onClick={onEdit}
            aria-label="ویرایش مشخصات دارو"
            title="ویرایش مشخصات دارو"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface-container-low dark:bg-slate-800 text-on-surface-variant dark:text-slate-300 hover:bg-surface-container active:scale-95 transition-all"
          >
            <Pencil size={17} />
          </button>
        </div>
      </div>
    </article>
  );
};
