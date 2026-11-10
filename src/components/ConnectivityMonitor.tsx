import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, CheckCircle2, ChevronDown, ChevronUp, X, Database, Star, History, BookOpen } from 'lucide-react';
import { TourStore } from '../data/TourStore';

interface ConnectivityMonitorProps {
  isDark?: boolean;
}

export const ConnectivityMonitor: React.FC<ConnectivityMonitorProps> = ({ isDark = true }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowToast(true);
        // Auto hide "Back Online" message after 4 seconds
        const timer = setTimeout(() => {
          setShowToast(false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowToast(true);
      setIsExpanded(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check: if already offline on load, show toast
    if (!navigator.onLine) {
      setWasOffline(true);
      setShowToast(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  if (!showToast) return null;

  const favCount = TourStore.getFavorites().length;
  const historyCount = TourStore.getHistory().length;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92vw] px-2 animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
      <div
        className={`rounded-2xl shadow-2xl border p-3 md:p-3.5 backdrop-blur-xl transition-all duration-300 ${
          !isOnline
            ? isDark
              ? 'bg-slate-900/95 border-amber-500/50 text-slate-100 shadow-amber-950/30 ring-1 ring-amber-500/30'
              : 'bg-white/95 border-amber-400 text-slate-900 shadow-amber-500/20 ring-1 ring-amber-400/40'
            : isDark
            ? 'bg-slate-900/95 border-emerald-500/50 text-slate-100 shadow-emerald-950/30'
            : 'bg-white/95 border-emerald-400 text-slate-900 shadow-emerald-500/20'
        }`}
      >
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {!isOnline ? (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 animate-pulse">
                <WifiOff className="w-4 h-4" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold truncate">
                  {!isOnline ? 'You are Offline — Offline Mode Active' : 'Back Online'}
                </h4>
                {!isOnline && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                    Cached Sights Ready
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-80 truncate mt-0.5">
                {!isOnline
                  ? 'Stored history, saved favorites & cached stories remain accessible.'
                  : 'Full real-time narration & AI chat restored.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!isOnline && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-xs font-medium flex items-center gap-0.5"
                title={isExpanded ? 'Hide Details' : 'View Offline Features'}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowToast(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded View of Cached Offline Features */}
        {!isOnline && isExpanded && (
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs space-y-2 animate-in fade-in duration-200">
            <p className="font-semibold text-amber-300 text-[11px] uppercase tracking-wider">
              Available Offline Features & Data:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-slate-200">Landmark Guides</span>
                  <span className="text-[10px] text-slate-400">Presets & Descriptions</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                <div>
                  <span className="font-semibold block text-slate-200">Saved Favorites</span>
                  <span className="text-[10px] text-slate-400">{favCount} Saved</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <History className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-slate-200">Tour History</span>
                  <span className="text-[10px] text-slate-400">{historyCount} Visited</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <Database className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div>
                  <span className="font-semibold block text-slate-200">Cached Audio</span>
                  <span className="text-[10px] text-slate-400">Local TTS & Offline</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
