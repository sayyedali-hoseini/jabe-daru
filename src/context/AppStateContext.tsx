import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DRUG_CATALOG, STARTER_PACKS, type StarterPackDefinition } from '../data/drugCatalog';
import type {
  ActiveTab,
  AppPreferences,
  AppState,
  CabinetItem,
  CatalogEntry,
  PurchasedLogItem,
  ShoppingItem,
  ShoppingReason,
} from '../types';
import { getExpiryStatus } from '../utils/jalali';
import { normalizePersianSearch, toPersianDigits } from '../utils/persian';
import { decodeCabinetShareHash } from '../utils/share';

const STORAGE_KEY = 'medbox_state_v1';

const DEFAULT_STATE: AppState = {
  version: 1,
  cabinet: [],
  shopping: [],
  purchasedLog: [],
  customCatalog: [],
  preferences: {
    darkMode: false,
    seniorMode: false,
    welcomeDismissed: false,
    expiryWarningMonths: 3,
  },
};

export interface ToastMessage {
  id: number;
  text: string;
  subtext?: string;
  tone?: 'success' | 'info' | 'warning' | 'error';
}

export interface AddSheetPayload {
  open: boolean;
  editingItem?: CabinetItem;
  prefillCatalog?: CatalogEntry;
  prefillName?: string;
}

interface CabinetStats {
  total: number;
  inStock: number;
  halfOpened: number;
  expiringOrExpired: number;
  validInStockCount: number;
}

interface AppContextValue {
  state: AppState;
  stats: CabinetStats;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  addSheet: AddSheetPayload;
  openAddSheet: (opts?: { editingItem?: CabinetItem; prefillCatalog?: CatalogEntry; prefillName?: string }) => void;
  closeAddSheet: () => void;
  isDoctorModalOpen: boolean;
  setDoctorModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  pendingShareItems: CabinetItem[] | null;
  resolveShareImport: (mode: 'merge' | 'replace' | 'cancel') => void;
  toast: ToastMessage | null;
  showToast: (text: string, tone?: ToastMessage['tone'], subtext?: string) => void;
  addCabinetItem: (item: Omit<CabinetItem, 'id' | 'updatedAt'>) => CabinetItem;
  updateCabinetItem: (id: string, patch: Partial<CabinetItem>) => void;
  deleteCabinetItem: (id: string) => void;
  deleteCustomCatalogEntry: (id: string) => void;
  stepCabinetQuantity: (id: string, delta: number) => void;
  addFromCatalog: (entry: CatalogEntry) => { added: boolean; item: CabinetItem };
  applyStarterPack: (packId: StarterPackDefinition['id']) => { added: number; skipped: number };
  isInShoppingList: (cabinetItemId: string, name?: string) => boolean;
  toggleShoppingForCabinetItem: (item: CabinetItem) => void;
  addManualShoppingItem: (name: string, quantityLabel?: string) => void;
  removeShoppingItem: (id: string) => void;
  markShoppingBought: (id: string) => void;
  clearPurchasedLog: () => void;
  updatePreferences: (patch: Partial<AppPreferences>) => void;
  importFullBackup: (nextState: AppState) => void;
  resetAllData: () => void;
}

const AppStateContext = createContext<AppContextValue | null>(null);

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      version: 1,
      cabinet: Array.isArray(parsed.cabinet) ? parsed.cabinet : [],
      shopping: Array.isArray(parsed.shopping) ? parsed.shopping : [],
      purchasedLog: Array.isArray(parsed.purchasedLog) ? parsed.purchasedLog : [],
      customCatalog: Array.isArray(parsed.customCatalog) ? parsed.customCatalog : [],
      preferences: {
        darkMode: Boolean(parsed.preferences?.darkMode),
        seniorMode: Boolean(parsed.preferences?.seniorMode),
        welcomeDismissed: Boolean(parsed.preferences?.welcomeDismissed),
        expiryWarningMonths:
          typeof parsed.preferences?.expiryWarningMonths === 'number'
            ? parsed.preferences.expiryWarningMonths
            : 3,
      },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('cabinet');
  const [addSheet, setAddSheet] = useState<AddSheetPayload>({ open: false });
  const [isDoctorModalOpen, setDoctorModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [pendingShareItems, setPendingShareItems] = useState<CabinetItem[] | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (text: string, tone: ToastMessage['tone'] = 'success', subtext?: string) => {
      setToast({ id: Date.now(), text, subtext, tone });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [state]);

  // Sync dark & senior mode classes on root elements
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.preferences.darkMode);
  }, [state.preferences.darkMode]);

  useEffect(() => {
    document.body.classList.toggle('senior-mode', state.preferences.seniorMode);
  }, [state.preferences.seniorMode]);

  // Check #share= URL hash on mount and hashchange
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('share=')) {
        const decoded = decodeCabinetShareHash(hash);
        if (decoded && decoded.length > 0) {
          setPendingShareItems(decoded);
        } else {
          showToast('لینک اشتراک‌گذاری معتبر نیست یا خراب شده است', 'error');
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [showToast]);

  const resolveShareImport = useCallback(
    (mode: 'merge' | 'replace' | 'cancel') => {
      if (mode === 'cancel' || !pendingShareItems) {
        setPendingShareItems(null);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return;
      }

      if (mode === 'replace') {
        setState((prev) => ({
          ...prev,
          cabinet: pendingShareItems,
        }));
        showToast(
          `لیست جعبه دارو با ${toPersianDigits(pendingShareItems.length)} قلم جایگزین شد`,
          'success'
        );
      } else {
        let addedCount = 0;
        let updatedCount = 0;
        setState((prev) => {
          const nextCabinet = [...prev.cabinet];
          for (const incoming of pendingShareItems) {
            const normIncoming = normalizePersianSearch(incoming.name);
            const existingIdx = nextCabinet.findIndex(
              (c) =>
                (incoming.catalogId && c.catalogId === incoming.catalogId) ||
                normalizePersianSearch(c.name) === normIncoming
            );
            if (existingIdx !== -1) {
              const existing = nextCabinet[existingIdx];
              nextCabinet[existingIdx] = {
                ...existing,
                quantity: Math.max(existing.quantity, incoming.quantity),
                expiry: existing.expiry ?? incoming.expiry,
                updatedAt: Date.now(),
              };
              updatedCount++;
            } else {
              nextCabinet.push(incoming);
              addedCount++;
            }
          }
          return { ...prev, cabinet: nextCabinet };
        });
        showToast(
          `ادغام انجام شد: ${toPersianDigits(addedCount)} قلم جدید و ${toPersianDigits(updatedCount)} قلم به‌روزرسانی شد`,
          'success'
        );
      }

      setPendingShareItems(null);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    },
    [pendingShareItems, showToast]
  );

  const openAddSheet = useCallback(
    (opts?: { editingItem?: CabinetItem; prefillCatalog?: CatalogEntry; prefillName?: string }) => {
      setAddSheet({
        open: true,
        editingItem: opts?.editingItem,
        prefillCatalog: opts?.prefillCatalog,
        prefillName: opts?.prefillName,
      });
    },
    []
  );

  const closeAddSheet = useCallback(() => {
    setAddSheet({ open: false });
  }, []);

  const addCabinetItem = useCallback((item: Omit<CabinetItem, 'id' | 'updatedAt'>): CabinetItem => {
    const now = Date.now();
    const created: CabinetItem = {
      ...item,
      id: `med-${now}-${Math.random().toString(36).slice(2, 7)}`,
      updatedAt: now,
    };

    setState((prev) => {
      const normName = normalizePersianSearch(item.name);
      const existsInBuiltin = DRUG_CATALOG.some(
        (d) => normalizePersianSearch(d.name) === normName
      );
      const existsInCustom = prev.customCatalog.some(
        (d) => normalizePersianSearch(d.name) === normName
      );

      let nextCustomCatalog = prev.customCatalog;
      if (normName && !existsInBuiltin && !existsInCustom) {
        const customEntry: CatalogEntry = {
          id: `custom-${now}-${Math.random().toString(36).slice(2, 6)}`,
          name: item.name.trim(),
          englishName: item.genericName?.trim() ?? '',
          category: item.category,
          form: item.form || 'سایر',
          defaultUnit: item.unit || 'عدد',
          defaultLocation: '',
          description: item.description?.trim() ?? '',
          keywords: [],
          isCustom: true,
        };
        nextCustomCatalog = [customEntry, ...prev.customCatalog];
      }

      return {
        ...prev,
        cabinet: [created, ...prev.cabinet],
        customCatalog: nextCustomCatalog,
      };
    });

    return created;
  }, []);

  const updateCabinetItem = useCallback((id: string, patch: Partial<CabinetItem>) => {
    setState((prev) => ({
      ...prev,
      cabinet: prev.cabinet.map((item) =>
        item.id === id ? { ...item, ...patch, updatedAt: Date.now() } : item
      ),
    }));
  }, []);

  const deleteCabinetItem = useCallback(
    (id: string) => {
      const target = state.cabinet.find((i) => i.id === id);
      setState((prev) => ({
        ...prev,
        cabinet: prev.cabinet.filter((i) => i.id !== id),
      }));
      if (target) {
        showToast(`«${target.name}» از جعبه حذف شد`, 'info');
      }
    },
    [showToast, state.cabinet]
  );

  const deleteCustomCatalogEntry = useCallback(
    (id: string) => {
      const target = state.customCatalog.find((c) => c.id === id);
      setState((prev) => ({
        ...prev,
        customCatalog: prev.customCatalog.filter((c) => c.id !== id),
      }));
      if (target) {
        showToast(`«${target.name}» از بانک داروی شخصی حذف شد`, 'info');
      }
    },
    [showToast, state.customCatalog]
  );

  const stepCabinetQuantity = useCallback((id: string, delta: number) => {
    setState((prev) => ({
      ...prev,
      cabinet: prev.cabinet.map((item) => {
        if (item.id !== id) return item;
        const nextQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: nextQty, updatedAt: Date.now() };
      }),
    }));
  }, []);

  const addFromCatalog = useCallback(
    (entry: CatalogEntry): { added: boolean; item: CabinetItem } => {
      const normName = normalizePersianSearch(entry.name);
      const existing = state.cabinet.find(
        (c) => c.catalogId === entry.id || normalizePersianSearch(c.name) === normName
      );

      if (existing) {
        updateCabinetItem(existing.id, { quantity: existing.quantity + 1 });
        showToast(`موجودی «${entry.name}» ۱ واحد افزایش یافت`, 'success');
        return { added: false, item: { ...existing, quantity: existing.quantity + 1 } };
      }

      const created = addCabinetItem({
        catalogId: entry.id,
        name: entry.name,
        genericName: entry.englishName || undefined,
        category: entry.category,
        form: entry.form,
        quantity: 1,
        unit: entry.defaultUnit,
        location: undefined,
        description: entry.description || undefined,
        isHalfOrOpened: false,
        expiry: undefined,
      });
      showToast(`«${entry.name}» به جعبه داروی شما اضافه شد`, 'success');
      return { added: true, item: created };
    },
    [addCabinetItem, showToast, state.cabinet, updateCabinetItem]
  );

  const applyStarterPack = useCallback(
    (packId: StarterPackDefinition['id']): { added: number; skipped: number } => {
      const pack = STARTER_PACKS.find((p) => p.id === packId);
      if (!pack) return { added: 0, skipped: 0 };

      let added = 0;
      let skipped = 0;
      const now = Date.now();

      setState((prev) => {
        const nextCabinet = [...prev.cabinet];
        pack.itemIds.forEach((catId, idx) => {
          const entry = DRUG_CATALOG.find((d) => d.id === catId);
          if (!entry) return;
          const normName = normalizePersianSearch(entry.name);
          const exists = nextCabinet.some(
            (c) => c.catalogId === entry.id || normalizePersianSearch(c.name) === normName
          );
          if (exists) {
            skipped++;
            return;
          }
          nextCabinet.push({
            id: `pack-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            catalogId: entry.id,
            name: entry.name,
            genericName: entry.englishName,
            category: entry.category,
            form: entry.form,
            quantity: 1,
            unit: entry.defaultUnit,
            location: undefined,
            description: entry.description,
            isHalfOrOpened: false,
            expiry: undefined,
            updatedAt: now,
          });
          added++;
        });
        return {
          ...prev,
          cabinet: nextCabinet,
        };
      });

      if (added > 0 && skipped > 0) {
        showToast(
          `${toPersianDigits(added)} قلم از ${pack.title} اضافه شد (${toPersianDigits(skipped)} قلم تکراری بود)`,
          'success'
        );
      } else if (added > 0) {
        showToast(`${toPersianDigits(added)} قلم از ${pack.title} به جعبه اضافه شد`, 'success');
      } else {
        showToast(`همه داروهای ${pack.title} از قبل در جعبه موجود است`, 'info');
      }

      return { added, skipped };
    },
    [showToast]
  );

  const isInShoppingList = useCallback(
    (cabinetItemId: string, name?: string) => {
      const norm = name ? normalizePersianSearch(name) : '';
      return state.shopping.some(
        (s) =>
          s.cabinetItemId === cabinetItemId ||
          (norm && normalizePersianSearch(s.name) === norm)
      );
    },
    [state.shopping]
  );

  const toggleShoppingForCabinetItem = useCallback(
    (item: CabinetItem) => {
      const expStatus = getExpiryStatus(item.expiry, state.preferences.expiryWarningMonths);
      const existing = state.shopping.find(
        (s) =>
          s.cabinetItemId === item.id ||
          normalizePersianSearch(s.name) === normalizePersianSearch(item.name)
      );

      if (existing) {
        setState((prev) => ({
          ...prev,
          shopping: prev.shopping.filter((s) => s.id !== existing.id),
        }));
        showToast(`«${item.name}» از لیست خرید حذف شد`, 'info');
        return;
      }

      let reason: ShoppingReason = 'manual';
      if (expStatus === 'expired') reason = 'expired_replace';
      else if (item.quantity === 0) reason = 'zero_stock';
      else if (item.quantity === 1 || item.isHalfOrOpened) reason = 'low_stock';

      const newShop: ShoppingItem = {
        id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        cabinetItemId: item.id,
        name: item.name,
        subtitle: item.genericName,
        quantityLabel: `۱ ${item.unit}`,
        reason,
        category: item.category,
        addedAt: Date.now(),
      };

      setState((prev) => ({
        ...prev,
        shopping: [newShop, ...prev.shopping],
      }));
      showToast(`«${item.name}» به لیست خرید اضافه شد`, 'success');
    },
    [showToast, state.preferences.expiryWarningMonths, state.shopping]
  );

  const addManualShoppingItem = useCallback(
    (name: string, quantityLabel = '۱ عدد') => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const norm = normalizePersianSearch(trimmed);
      const exists = state.shopping.some((s) => normalizePersianSearch(s.name) === norm);
      if (exists) {
        showToast(`«${trimmed}» از قبل در لیست خرید هست`, 'info');
        return;
      }
      const catalogMatch =
        state.customCatalog.find((c) => normalizePersianSearch(c.name) === norm) ??
        DRUG_CATALOG.find((c) => normalizePersianSearch(c.name) === norm);
      const newShop: ShoppingItem = {
        id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmed,
        subtitle: catalogMatch?.englishName || undefined,
        quantityLabel,
        reason: 'manual',
        category: catalogMatch?.category,
        addedAt: Date.now(),
      };
      setState((prev) => ({
        ...prev,
        shopping: [newShop, ...prev.shopping],
      }));
      showToast(`«${trimmed}» به لیست خرید اضافه شد`, 'success');
    },
    [showToast, state.customCatalog, state.shopping]
  );

  const removeShoppingItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      shopping: prev.shopping.filter((s) => s.id !== id),
    }));
  }, []);

  const markShoppingBought = useCallback(
    (id: string) => {
      const target = state.shopping.find((s) => s.id === id);
      if (!target) return;

      const logItem: PurchasedLogItem = {
        id: `log-${Date.now()}`,
        name: target.name,
        quantityLabel: target.quantityLabel,
        purchasedAt: Date.now(),
      };

      setState((prev) => {
        const nextShopping = prev.shopping.filter((s) => s.id !== id);
        const normName = normalizePersianSearch(target.name);
        let matched = false;
        const nextCabinet = prev.cabinet.map((c) => {
          if (
            (target.cabinetItemId && c.id === target.cabinetItemId) ||
            normalizePersianSearch(c.name) === normName
          ) {
            matched = true;
            return {
              ...c,
              quantity: c.quantity + 1,
              isHalfOrOpened: false,
              updatedAt: Date.now(),
            };
          }
          return c;
        });

        if (!matched) {
          const catMatch =
            prev.customCatalog.find((d) => normalizePersianSearch(d.name) === normName) ??
            DRUG_CATALOG.find((d) => normalizePersianSearch(d.name) === normName);
          nextCabinet.unshift({
            id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            catalogId: catMatch?.id,
            name: target.name,
            genericName: catMatch?.englishName || target.subtitle,
            category: catMatch?.category ?? target.category ?? 'firstaid',
            form: catMatch?.form ?? 'سایر',
            quantity: 1,
            unit: catMatch?.defaultUnit ?? 'عدد',
            location: undefined,
            description: catMatch?.description || undefined,
            isHalfOrOpened: false,
            expiry: undefined,
            updatedAt: Date.now(),
          });
        }

        return {
          ...prev,
          cabinet: nextCabinet,
          shopping: nextShopping,
          purchasedLog: [logItem, ...prev.purchasedLog].slice(0, 20),
        };
      });

      showToast(`«${target.name}» خریداری و به موجودی جعبه اضافه شد`, 'success');
    },
    [showToast, state.shopping]
  );

  const clearPurchasedLog = useCallback(() => {
    setState((prev) => ({ ...prev, purchasedLog: [] }));
  }, []);

  const updatePreferences = useCallback((patch: Partial<AppPreferences>) => {
    setState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...patch },
    }));
  }, []);

  const importFullBackup = useCallback(
    (nextState: AppState) => {
      setState(nextState);
      showToast(
        `فایل پشتیبان با ${toPersianDigits(nextState.cabinet.length)} قلم دارو بازیابی شد`,
        'success'
      );
    },
    [showToast]
  );

  const resetAllData = useCallback(() => {
    setState(DEFAULT_STATE);
    showToast('تمام داده‌های جعبه دارو پاکسازی شد', 'info');
  }, [showToast]);

  const stats: CabinetStats = useMemo(() => {
    const warnMonths = state.preferences.expiryWarningMonths;
    let inStock = 0;
    let halfOpened = 0;
    let expiringOrExpired = 0;
    let validInStockCount = 0;

    for (const item of state.cabinet) {
      const exp = getExpiryStatus(item.expiry, warnMonths);
      if (exp === 'expired' || exp === 'expiring_soon') {
        expiringOrExpired++;
      }
      if (item.isHalfOrOpened) {
        halfOpened++;
      }
      if (item.quantity > 0 && exp !== 'expired') {
        validInStockCount++;
        inStock++;
      }
    }

    return {
      total: state.cabinet.length,
      inStock,
      halfOpened,
      expiringOrExpired,
      validInStockCount,
    };
  }, [state.cabinet, state.preferences.expiryWarningMonths]);

  const value: AppContextValue = {
    state,
    stats,
    activeTab,
    setActiveTab,
    addSheet,
    openAddSheet,
    closeAddSheet,
    isDoctorModalOpen,
    setDoctorModalOpen,
    isSettingsModalOpen,
    setSettingsModalOpen,
    pendingShareItems,
    resolveShareImport,
    toast,
    showToast,
    addCabinetItem,
    updateCabinetItem,
    deleteCabinetItem,
    deleteCustomCatalogEntry,
    stepCabinetQuantity,
    addFromCatalog,
    applyStarterPack,
    isInShoppingList,
    toggleShoppingForCabinetItem,
    addManualShoppingItem,
    removeShoppingItem,
    markShoppingBought,
    clearPurchasedLog,
    updatePreferences,
    importFullBackup,
    resetAllData,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export function useAppState(): AppContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
