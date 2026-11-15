import React from 'react';
import { AlertTriangle, CheckCircle2, Info, WifiOff } from 'lucide-react';
import { useAppState } from '../context/AppStateContext';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const FeedbackOverlays: React.FC = () => {
  const { toast } = useAppState();
  const isOnline = useOnlineStatus();

  return (
    <>
      {/* Offline Indicator */}
      {!isOnline && (
        <div
          role="status"
          className="fixed bottom-22 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-600 dark:bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
        >
          <WifiOff size={15} />
          <span>حالت آفلاین — تمام داده‌ها روی گوشی ذخیره می‌شوند</span>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 inset-x-4 max-w-md mx-auto z-50 pointer-events-none"
        >
          <div className="p-3 rounded-2xl bg-inverse-surface dark:bg-slate-800 text-inverse-on-surface dark:text-white border border-white/10 shadow-xl flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                toast.tone === 'warning'
                  ? 'bg-amber-500 text-white'
                  : toast.tone === 'error'
                  ? 'bg-error text-on-error'
                  : toast.tone === 'info'
                  ? 'bg-primary text-on-primary'
                  : 'bg-secondary text-on-secondary'
              }`}
            >
              {toast.tone === 'warning' || toast.tone === 'error' ? (
                <AlertTriangle size={16} />
              ) : toast.tone === 'info' ? (
                <Info size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-bold leading-snug">
                {toast.text}
              </span>
              {toast.subtext && (
                <span className="text-[11px] opacity-80 leading-tight mt-0.5">
                  {toast.subtext}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
