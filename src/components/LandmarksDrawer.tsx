import React, { useState } from 'react';
import {
  Landmark,
  LandmarkCategory,
  TourCategoryFilter,
  TravelMode,
  UserPosition,
} from '../types/tour';
import { formatDistance, formatTravelTime, getDistanceMeters } from '../utils/geoUtils';
import { TourStore } from '../data/TourStore';
import {
  X,
  Search,
  Volume2,
  MapPin,
  CheckCircle2,
  Sparkles,
  Compass,
  Navigation,
  Activity,
  Layers,
  Star,
  History,
  RotateCcw,
} from 'lucide-react';

interface LandmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  landmarks: Landmark[];
  userLocation: UserPosition;
  travelMode: TravelMode;
  selectedLandmarkId: string | null;
  activeNarratingId: string | null;
  onSelectLandmark: (landmark: Landmark) => void;
  onNarrateLandmark: (landmark: Landmark) => void;
  onTeleportToLandmark: (landmark: Landmark) => void;
  onDiscoverMore: () => void;
  isDiscovering: boolean;
  activeCategory: TourCategoryFilter;
  onChangeCategory: (cat: TourCategoryFilter) => void;
}

export const LandmarksDrawer: React.FC<LandmarksDrawerProps> = ({
  isOpen,
  onClose,
  landmarks,
  userLocation,
  travelMode,
  selectedLandmarkId,
  activeNarratingId,
  onSelectLandmark,
  onNarrateLandmark,
  onTeleportToLandmark,
  onDiscoverMore,
  isDiscovering,
  activeCategory,
  onChangeCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'history'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>(() => TourStore.getFavorites());

  if (!isOpen) return null;

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    TourStore.toggleFavorite(id);
    setFavorites(TourStore.getFavorites());
  };

  const historyItems = TourStore.getHistory();

  // Augment landmarks with live distance from user's location and sort by closest
  const landmarksWithDistance = landmarks
    .map((l) => {
      const distance = getDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        l.lat,
        l.lng
      );
      return { ...l, distance };
    })
    .sort((a, b) => a.distance - b.distance);

  // Filter landmarks based on tab, category, and search query
  const filteredLandmarks = landmarksWithDistance.filter((l) => {
    if (activeTab === 'favorites' && !favorites.includes(l.id)) {
      return false;
    }

    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.historicalEra && l.historicalEra.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesCategory = true;
    if (activeCategory === 'history') matchesCategory = l.category === 'monument';
    else if (activeCategory === 'food') matchesCategory = l.category === 'market';
    else if (activeCategory === 'architecture') matchesCategory = l.category === 'architecture';
    else if (activeCategory === 'nature') matchesCategory = l.category === 'park' || l.category === 'viewpoint';
    else if (activeCategory === 'museum') matchesCategory = l.category === 'museum';

    return matchesSearch && matchesCategory;
  });

  const categoryPills: { id: TourCategoryFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'history', label: 'History' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'food', label: 'Food & Markets' },
    { id: 'nature', label: 'Nature & Parks' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md h-full shadow-2xl border-l border-slate-700/80 flex flex-col p-4 md:p-6 overflow-hidden">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 border border-indigo-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">City Tour Explorer</h2>
              <p className="text-xs text-slate-400">
                Landmarks, saved favorites & visited history
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: All Sights / Favorites / History */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 mt-3">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>All Sights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'favorites'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Favorites ({favorites.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historyItems.length})</span>
          </button>
        </div>

        {activeTab !== 'history' ? (
          <>
            {/* Search input */}
            <div className="relative mt-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search monuments, eras, alleys..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
              {categoryPills.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChangeCategory(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeCategory === c.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Landmarks Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
              {filteredLandmarks.map((landmark) => {
                const isSelected = landmark.id === selectedLandmarkId;
                const isNarrating = landmark.id === activeNarratingId;
                const inRange =
                  landmark.distance <=
                  (travelMode === 'walking' ? 75 : travelMode === 'cycling' ? 150 : 300);
                const isFav = favorites.includes(landmark.id);

                return (
                  <div
                    key={landmark.id}
                    onClick={() => onSelectLandmark(landmark)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isNarrating
                        ? 'bg-amber-950/30 border-amber-500/60 shadow-lg ring-1 ring-amber-400/50'
                        : isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md ring-1 ring-indigo-400/40'
                        : inRange
                        ? 'bg-emerald-950/20 border-emerald-500/40 hover:bg-slate-800/80'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {landmark.category}
                          </span>
                          {landmark.historicalEra && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {landmark.historicalEra}
                            </span>
                          )}
                          {inRange && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              In Range
                            </span>
                          )}
                          {landmark.visited && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Visited</span>
                            </span>
                          )}
                        </div>

                        <h3 className="mt-1 text-sm font-bold text-white truncate">
                          {landmark.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                          {landmark.shortDescription}
                        </p>

                        {landmark.activityNow && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-300/90 italic">
                            <Activity className="w-3 h-3 shrink-0" />
                            <span className="truncate">{landmark.activityNow}</span>
                          </div>
                        )}
                      </div>

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFav(landmark.id, e)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isFav
                            ? 'text-amber-400 hover:text-amber-300'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Distance and Action Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/70 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                        <Navigation className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{formatDistance(landmark.distance)}</span>
                        <span className="text-slate-500 font-normal">
                          • {formatTravelTime(landmark.distance, travelMode)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTeleportToLandmark(landmark);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                          title="Move user location here"
                        >
                          Walk Here
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNarrateLandmark(landmark);
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredLandmarks.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Compass className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-sm">
                    {activeTab === 'favorites'
                      ? 'No favorite landmarks yet. Click the star icon on any sight to save it!'
                      : 'No landmarks match your search.'}
                  </p>
                </div>
              )}
            </div>

            {/* Drawer Footer: Discover More Nearby with AI */}
            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onDiscoverMore}
                disabled={isDiscovering}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-lg transition-all cursor-pointer disabled:opacity-60"
              >
                <Sparkles className={`w-4 h-4 ${isDiscovering ? 'animate-spin' : ''}`} />
                <span>
                  {isDiscovering
                    ? 'Discovering hidden gems nearby...'
                    : 'AI Discovery: Find More Hidden Sights Nearby'}
                </span>
              </button>
            </div>
          </>
        ) : (
          /* Tour Narration History Tab */
          <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
            {historyItems.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <History className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm font-medium text-slate-300">No tour narration history yet.</p>
                <p className="text-xs text-slate-500 mt-1">
                  As you walk or simulate through the city, visited stories will appear here for easy
                  replay!
                </p>
              </div>
            ) : (
              historyItems.map((item, idx) => {
                const landmark = landmarks.find((l) => l.id === item.poiId);
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          {item.category}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{item.poiName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {item.narrationSnippet}
                        </p>
                      </div>

                      {landmark && (
                        <button
                          type="button"
                          onClick={() => onNarrateLandmark(landmark)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow cursor-pointer shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Replay</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {historyItems.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  TourStore.clearHistory();
                  setFavorites([...favorites]); // trigger re-render
                }}
                className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
