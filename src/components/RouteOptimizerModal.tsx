import React, { useState } from 'react';
import { Landmark, OptimizedRoutePlan, TravelMode, UserPosition } from '../types/tour';
import {
  Sparkles,
  Route,
  Clock,
  Navigation,
  CheckCircle2,
  X,
  ArrowRight,
  Flame,
  Bookmark,
} from 'lucide-react';

interface RouteOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  userLocation: UserPosition;
  travelMode: TravelMode;
  landmarks: Landmark[];
  onApplyOptimizedRoute: (plan: OptimizedRoutePlan) => void;
}

export const RouteOptimizerModal: React.FC<RouteOptimizerModalProps> = ({
  isOpen,
  onClose,
  cityName,
  userLocation,
  travelMode,
  landmarks,
  onApplyOptimizedRoute,
}) => {
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [categoryFocus, setCategoryFocus] = useState<string>('History & Architecture');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [optimizedPlan, setOptimizedPlan] = useState<OptimizedRoutePlan | null>(null);

  if (!isOpen) return null;

  const handleGeneratePlan = async () => {
    setIsLoading(true);
    try {
      const poiPayload = landmarks.map((l) => ({
        id: l.id,
        name: l.name,
        lat: l.lat,
        lng: l.lng,
        category: l.category,
      }));

      const res = await fetch('/api/tour/optimize-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationMinutes,
          mode: travelMode,
          cityName,
          lat: userLocation.lat,
          lng: userLocation.lng,
          category: categoryFocus,
          pois: poiPayload,
        }),
      });

      if (!res.ok) throw new Error('Failed to optimize route');
      const data: OptimizedRoutePlan = await res.json();
      setOptimizedPlan(data);
    } catch (e) {
      console.error('Route optimization error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-xl max-h-[85vh] rounded-3xl p-5 md:p-6 shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow">
              <Route className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Tour Route Optimizer</h3>
              <p className="text-xs text-slate-400">
                Optimized visiting order minimizing travel time around {cityName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="py-4 border-b border-slate-800/80 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Tour Duration
              </label>
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                {[30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`flex-1 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Tour Interest Focus
              </label>
              <select
                value={categoryFocus}
                onChange={(e) => setCategoryFocus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="History & Architecture">History & Architecture</option>
                <option value="Food & Markets">Food, Cafes & Markets</option>
                <option value="Parks & Panoramic Views">Nature & Panoramic Views</option>
                <option value="All Highlights">Balanced Highlights</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGeneratePlan}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-60"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Computing Best Sequence...' : 'Generate Optimized Tour Route'}</span>
          </button>
        </div>

        {/* Route Output Results */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {optimizedPlan ? (
            <div>
              {/* Summary */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 mb-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs mb-1">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Curated Tour Sequence</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{optimizedPlan.summary}</p>
              </div>

              {/* Steps */}
              <div className="space-y-2">
                {optimizedPlan.stops.map((stop, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900/70 border border-slate-800"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs shrink-0 mt-0.5">
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{stop.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">{stop.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <Route className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No optimized route generated yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Choose your duration and click "Generate" to create a seamless tour itinerary!
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {optimizedPlan && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Est. {optimizedPlan.totalEstimatedMinutes} mins</span>
            </span>

            <button
              type="button"
              onClick={() => {
                onApplyOptimizedRoute(optimizedPlan);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply & Tour This Route</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
