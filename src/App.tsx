import React from 'react';
import { AddEditMedicineSheet } from './components/AddEditMedicineSheet';
import { BottomNav } from './components/BottomNav';
import { CabinetView } from './components/CabinetView';
import { DoctorVisitModal } from './components/DoctorVisitModal';
import { DrugBankView } from './components/DrugBankView';
import { FeedbackOverlays } from './components/FeedbackOverlays';
import { Header } from './components/Header';
import { SettingsModal } from './components/SettingsModal';
import { ShareImportModal } from './components/ShareImportModal';
import { ShoppingListView } from './components/ShoppingListView';
import { AppStateProvider, useAppState } from './context/AppStateContext';

const MainShell: React.FC = () => {
  const { activeTab } = useAppState();

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 text-on-surface dark:text-slate-100 transition-colors duration-200">
      <Header />

      <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 pt-20 sm:pt-22 pb-28">
        {activeTab === 'cabinet' && <CabinetView />}
        {activeTab === 'drug-bank' && <DrugBankView />}
        {activeTab === 'shopping-list' && <ShoppingListView />}
      </main>

      <BottomNav />

      {/* Shared Modals & Overlays */}
      <AddEditMedicineSheet />
      <DoctorVisitModal />
      <SettingsModal />
      <ShareImportModal />
      <FeedbackOverlays />
    </div>
  );
};

export default function App() {
  return (
    <AppStateProvider>
      <MainShell />
    </AppStateProvider>
  );
}
