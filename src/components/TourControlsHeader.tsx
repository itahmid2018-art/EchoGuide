import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CityPreset,
  TravelMode,
  GuidePersona,
  NarrationLength,
  TourLanguage,
  LanguageOption,
  TourCategoryFilter,
  UserPosition,
} from '../types/tour';
import { ThemeMode } from '../utils/themeUtils';
import { getDistanceMeters, formatDistance } from '../utils/geoUtils';
import { CITY_PRESETS } from '../data/cityPresets';
import {
  Compass,
  Search,
  MapPin,
  Navigation,
  Menu,
  X,
  Play,
  Pause,
  RotateCcw,
  PersonStanding,
  Bike,
  Car,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  Sparkles,
  Layers,
  ChevronDown,
  Route,
  Sun,
  Moon,
  Clock,
  Globe,
  Loader2,
  Glasses,
  Eye,
} from 'lucide-react';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵' },
];

function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
}

interface TourControlsHeaderProps {
  currentCity: CityPreset;
  onSelectCity: (city: CityPreset) => void;
  travelMode: TravelMode;
  onChangeTravelMode: (mode: TravelMode) => void;
  // User Location & Search
  userLocation: UserPosition;
  onSelectCoordinates: (lat: number, lng: number, placeName?: string) => void;
  nearbyLandmarkName?: string | null;
  // Theme & Time of Day
  isDark: boolean;
  themeMode: ThemeMode;
  onChangeThemeMode: (mode: ThemeMode) => void;
  timeOfDayLabel: string;
  formattedLocalTime: string;
  // Live GPS vs Simulation
  isUsingRealGps: boolean;
  onToggleRealGps: () => void;
  isSimulating: boolean;
  simSpeed: number;
  onToggleSimulation: () => void;
  onChangeSimSpeed: (speed: number) => void;
  onResetSimulation: () => void;
  // Audio & Language settings
  autoNarration: boolean;
  onToggleAutoNarration: () => void;
  soundChimes: boolean;
  onToggleSoundChimes: () => void;
  guidePersona: GuidePersona;
  onChangePersona: (persona: GuidePersona) => void;
  narrationLength: NarrationLength;
  onChangeLength: (length: NarrationLength) => void;
  language: TourLanguage;
  onChangeLanguage: (lang: TourLanguage) => void;
  // Category Filter
  selectedCategory: TourCategoryFilter;
  onChangeCategory: (cat: TourCategoryFilter) => void;
  // Route Optimizer & Landmarks Drawer
  onOpenRouteOptimizer: () => void;
  landmarkCount: number;
  visitedCount: number;
  onOpenLandmarksDrawer: () => void;
  onOpenStreetView?: () => void;
}

export const TourControlsHeader: React.FC<TourControlsHeaderProps> = ({
  currentCity,
  onSelectCity,
  travelMode,
  onChangeTravelMode,
  userLocation,
  onSelectCoordinates,
  nearbyLandmarkName,
  isDark,
  themeMode,
  onChangeThemeMode,
  timeOfDayLabel,
  formattedLocalTime,
  isUsingRealGps,
  onToggleRealGps,
  isSimulating,
  simSpeed,
  onToggleSimulation,
  onChangeSimSpeed,
  onResetSimulation,
  autoNarration,
  onToggleAutoNarration,
  soundChimes,
  onToggleSoundChimes,
  guidePersona,
  onChangePersona,
  narrationLength,
  onChangeLength,
  language,
  onChangeLanguage,
  selectedCategory,
  onChangeCategory,
  onOpenRouteOptimizer,
  landmarkCount,
  visitedCount,
  onOpenLandmarksDrawer,
  onOpenStreetView,
}) => {
  // Hamburger menu open state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchingGeocode, setIsSearchingGeocode] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute active location display name
  const activeLocationDisplayName = useMemo(() => {
    if (nearbyLandmarkName) return nearbyLandmarkName;
    return `${currentCity.name} (${currentCity.country})`;
  }, [nearbyLandmarkName, currentCity]);

  // Current formatted coordinates
  const formattedCoords = useMemo(() => {
    return formatCoordinates(userLocation.lat, userLocation.lng);
  }, [userLocation.lat, userLocation.lng]);

  // Filtered and nearest landmarks sorted by proximity to user location
  const matchingLandmarks = useMemo(() => {
    const landmarksWithDist = currentCity.landmarks.map((lm) => ({
      ...lm,
      distance: getDistanceMeters(userLocation.lat, userLocation.lng, lm.lat, lm.lng),
    })).sort((a, b) => a.distance - b.distance);

    if (!searchQuery.trim()) {
      return landmarksWithDist.slice(0, 5); // Show 5 nearest locations by default
    }
    const q = searchQuery.toLowerCase();
    return landmarksWithDist
      .filter(
        (lm) =>
          lm.name.toLowerCase().includes(q) ||
          lm.shortDescription.toLowerCase().includes(q) ||
          (lm.historicalEra && lm.historicalEra.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [searchQuery, currentCity.landmarks, userLocation.lat, userLocation.lng]);

  // Filtered preset cities matching query
  const matchingCities = useMemo(() => {
    if (!searchQuery.trim()) return CITY_PRESETS;
    const q = searchQuery.toLowerCase();
    return CITY_PRESETS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Handle Geocoding Search Submission
  const handleExecuteSearch = async (queryText?: string) => {
    const q = (queryText || searchQuery).trim();
    if (!q) return;

    // Check if query matches a preset city first
    const matchedCity = CITY_PRESETS.find(
      (c) => c.name.toLowerCase() === q.toLowerCase()
    );
    if (matchedCity) {
      onSelectCity(matchedCity);
      setSearchQuery('');
      setIsSearchFocused(false);
      return;
    }

    // Check if query matches a local landmark in current city
    const matchedLm = currentCity.landmarks.find(
      (lm) => lm.name.toLowerCase().includes(q.toLowerCase())
    );
    if (matchedLm) {
      onSelectCoordinates(matchedLm.lat, matchedLm.lng, matchedLm.name);
      setSearchQuery('');
      setIsSearchFocused(false);
      return;
    }

    // Call server Geocoding API for global location lookup
    setIsSearchingGeocode(true);
    setGeocodeError(null);
    try {
      const res = await fetch('/api/tour/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error('Location not found. Try another city or landmark.');
      }

      const result = await res.json();
      if (result && typeof result.lat === 'number' && typeof result.lng === 'number') {
        onSelectCoordinates(result.lat, result.lng, result.name);
        setSearchQuery('');
        setIsSearchFocused(false);
      } else {
        setGeocodeError('Could not resolve location coordinates.');
      }
    } catch (err: any) {
      setGeocodeError(err?.message || 'Error searching location');
    } finally {
      setIsSearchingGeocode(false);
    }
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const categoryFilters: { id: TourCategoryFilter; label: string }[] = [
    { id: 'all', label: 'All Sights' },
    { id: 'history', label: 'History' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'food', label: 'Food & Markets' },
    { id: 'nature', label: 'Nature & Parks' },
  ];

  return (
    <>
      <header className="sticky top-0 z-45 px-2.5 pt-2.5 md:px-4 md:pt-4 backdrop-blur-md pb-1">
        <div
          className={`glass-panel rounded-2xl md:rounded-3xl shadow-xl px-3 py-2.5 md:px-4 md:py-3 border max-w-7xl mx-auto flex items-center justify-between gap-2.5 md:gap-4 transition-colors duration-300 ${
            isDark ? 'border-slate-700/60' : 'border-slate-200/90 shadow-slate-300/40'
          }`}
        >
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 text-white shadow-md shrink-0">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 bg-clip-text text-transparent">
                  EchoGuide
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border flex items-center gap-1 ${
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                  title={`${timeOfDayLabel} (${formattedLocalTime})`}
                >
                  {isDark ? <Moon className="w-2.5 h-2.5 text-amber-400" /> : <Sun className="w-2.5 h-2.5 text-amber-600" />}
                  <span className="hidden lg:inline">{timeOfDayLabel}</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 truncate -mt-0.5">
                AI Voice City Tour
              </span>
            </div>
          </div>

          {/* Center: Search Field & Live GPS Coordinates Display */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-2xl min-w-0">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-xl md:rounded-2xl border transition-all duration-200 ${
                isSearchFocused
                  ? 'ring-2 ring-indigo-500 border-indigo-500'
                  : isDark
                  ? 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
                  : 'bg-white/90 border-slate-300/90 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center gap-1 text-indigo-500 shrink-0">
                {isUsingRealGps ? (
                  <Navigation className="w-4 h-4 text-emerald-500 animate-pulse" />
                ) : (
                  <Search className="w-4 h-4 opacity-70" />
                )}
              </div>

              {/* Main Text Input */}
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch();
                  }
                }}
                placeholder={
                  isUsingRealGps
                    ? `${activeLocationDisplayName} • ${formattedCoords}`
                    : `Search city, landmark, or enter coordinates (${currentCity.name})...`
                }
                className={`w-full text-xs md:text-sm bg-transparent outline-none truncate font-medium ${
                  isDark ? 'text-white placeholder:text-slate-400' : 'text-slate-900 placeholder:text-slate-500'
                }`}
              />

              {/* GPS Active Badge or Coordinates Tag when location is enabled */}
              {isUsingRealGps && !searchQuery && (
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold tracking-wide shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>GPS Live</span>
                </div>
              )}

              {/* Clear search or Search submit button */}
              {searchQuery ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setGeocodeError(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExecuteSearch()}
                    disabled={isSearchingGeocode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSearchingGeocode ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Go</span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-400 shrink-0">
                  <MapPin className="w-3 h-3 text-indigo-400" />
                  <span>{formattedCoords}</span>
                </div>
              )}
            </div>

            {/* Search Suggestions & Location Dropdown */}
            {isSearchFocused && (
              <div
                className={`absolute left-0 right-0 top-full mt-2 glass-panel rounded-2xl p-2.5 shadow-2xl border z-50 max-h-96 overflow-y-auto ${
                  isDark ? 'border-slate-700 bg-slate-950/95' : 'border-slate-300 bg-white/95'
                }`}
              >
                {/* Geocode Error Notice */}
                {geocodeError && (
                  <div className="mb-2 p-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs">
                    {geocodeError}
                  </div>
                )}

                {/* Live Device Location Option */}
                <div className="pb-2 border-b border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isUsingRealGps) {
                        onToggleRealGps();
                      }
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isUsingRealGps
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isDark
                        ? 'hover:bg-slate-800/80 text-slate-200'
                        : 'hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold flex items-center gap-1.5">
                          <span>Device Real-Time Location (GPS)</span>
                          {isUsingRealGps && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold">
                              ACTIVE
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] font-mono opacity-75">
                          {formattedCoords}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-emerald-400">
                      {isUsingRealGps ? 'Tracking Live' : 'Enable GPS'}
                    </span>
                  </button>
                </div>

                {/* Matching & Nearest Landmarks in Current City */}
                {matchingLandmarks.length > 0 && (
                  <div className="py-2 border-b border-slate-800/60">
                    <p className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      Nearest Locations & Sights in {currentCity.name}
                    </p>
                    {matchingLandmarks.map((lm) => (
                      <button
                        key={lm.id}
                        type="button"
                        onClick={() => {
                          onSelectCoordinates(lm.lat, lm.lng, lm.name);
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          isDark ? 'hover:bg-slate-800/80 text-slate-200' : 'hover:bg-slate-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-semibold truncate">{lm.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/15 px-1.5 py-0.5 rounded">
                            {formatDistance(lm.distance)} away
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                            {formatCoordinates(lm.lat, lm.lng)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Preset Cities */}
                <div className="pt-2">
                  <p className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Preset Tour Destinations
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                    {matchingCities.map((city) => {
                      const isActive = city.id === currentCity.id;
                      return (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => {
                            onSelectCity(city);
                            setSearchQuery('');
                            setIsSearchFocused(false);
                          }}
                          className={`flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white font-bold'
                              : isDark
                              ? 'hover:bg-slate-800/80 text-slate-300'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{city.name}</p>
                            <p className="text-[10px] opacity-75 font-mono">
                              {formatCoordinates(city.center.lat, city.center.lng)}
                            </p>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">
                            {city.landmarks.length} sights
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Global Geocode Option when query is entered */}
                {searchQuery.trim().length > 1 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => handleExecuteSearch()}
                      disabled={isSearchingGeocode}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold shadow transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {isSearchingGeocode ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Searching Worldwide...</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5" />
                          <span>Search "{searchQuery}" Anywhere on Earth</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Hamburger Menu & Quick Feature Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick 360 Street View & VR Launch Button */}
            {onOpenStreetView && (
              <button
                type="button"
                onClick={onOpenStreetView}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-indigo-600 to-purple-600 hover:from-rose-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                title="Open 360° Google Street View & VR Mode"
              >
                <Glasses className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline">360° Street View & VR</span>
                <span className="sm:hidden font-bold">VR</span>
              </button>
            )}

            {/* Quick Sights Drawer trigger icon */}
            <button
              type="button"
              onClick={onOpenLandmarksDrawer}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
              }`}
              title="View all landmarks and favorites"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Sights ({visitedCount}/{landmarkCount})</span>
            </button>

            {/* Primary Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className={`relative flex items-center gap-2 px-3 py-2 md:px-3.5 md:py-2 rounded-xl md:rounded-2xl border font-semibold text-xs md:text-sm shadow-md transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-white'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-900 shadow-slate-200'
              }`}
              title="Open Tour Hub Features Menu"
            >
              <Menu className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
              <span className="hidden sm:inline font-bold">Menu</span>

              {/* Status indicator badge (GPS active or Simulation running) */}
              {(isUsingRealGps || isSimulating) && (
                <span className="flex h-2 w-2 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isUsingRealGps ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isUsingRealGps ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hamburger Menu Slide-Out Hub Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`glass-panel w-full max-w-md h-full shadow-2xl border-l flex flex-col p-4 md:p-6 overflow-hidden ${
              isDark ? 'border-slate-700/80' : 'border-slate-300/90'
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 text-white shadow">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Tour Features & Settings</h2>
                  <p className="text-xs text-slate-400">All city controls in one place</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Feature Menu Body */}
            <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1">
              {/* Active Status Card */}
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                    Current Destination
                  </p>
                  <p className="text-sm font-bold text-white mt-0.5">{currentCity.name}, {currentCity.country}</p>
                  <p className="text-[11px] font-mono text-slate-400">{formattedCoords}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                    <span>{timeOfDayLabel}</span>
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{formattedLocalTime}</p>
                </div>
              </div>

              {/* SECTION 1: Tour Cities & Presets */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Select City Preset</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {CITY_PRESETS.map((city) => {
                    const isSelected = city.id === currentCity.id;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => onSelectCity(city)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-bold'
                            : isDark
                            ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                        }`}
                      >
                        <p className="text-xs font-bold">{city.name}</p>
                        <p className="text-[10px] opacity-75">{city.country} • {city.landmarks.length} sights</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Real GPS & Movement Simulation */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tracking & Movement</span>
                </h3>
                <div className="space-y-2">
                  {/* Real GPS Toggle */}
                  <button
                    type="button"
                    onClick={onToggleRealGps}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isUsingRealGps
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : isDark
                        ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Navigation className="w-4 h-4" />
                      <span>{isUsingRealGps ? 'Device GPS: ON (Live Tracking)' : 'Enable Device Real GPS'}</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-black/20">
                      {isUsingRealGps ? 'Active' : 'Standby'}
                    </span>
                  </button>

                  {/* Simulation Controls */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">
                        Virtual Walk Simulation
                      </span>
                      <span className="text-[11px] font-mono text-amber-400">
                        {simSpeed}x Speed
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={onToggleSimulation}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSimulating
                            ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isSimulating ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                            <span>Pause Walk</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Simulate Tour</span>
                          </>
                        )}
                      </button>

                      {/* Speed multiplier cycles */}
                      <button
                        type="button"
                        onClick={() => {
                          const nextSpeed =
                            simSpeed === 1 ? 2 : simSpeed === 2 ? 5 : simSpeed === 5 ? 10 : 1;
                          onChangeSimSpeed(nextSpeed);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors cursor-pointer"
                        title="Change simulation speed multiplier"
                      >
                        {simSpeed}x
                      </button>

                      <button
                        type="button"
                        onClick={onResetSimulation}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                        title="Reset simulation position to beginning"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Travel Mode: Walk / Cycle / Drive */}
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1.5 block">Travel Mode (Geofence Radius)</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { mode: 'walking', label: 'Walk', icon: PersonStanding, radius: '75m' },
                          { mode: 'cycling', label: 'Cycle', icon: Bike, radius: '150m' },
                          { mode: 'driving', label: 'Drive', icon: Car, radius: '300m' },
                        ] as const
                      ).map((item) => {
                        const Icon = item.icon;
                        const active = travelMode === item.mode;
                        return (
                          <button
                            key={item.mode}
                            type="button"
                            onClick={() => onChangeTravelMode(item.mode)}
                            className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow'
                                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                            }`}
                          >
                            <Icon className="w-4 h-4 mb-0.5" />
                            <span>{item.label}</span>
                            <span className="text-[9px] opacity-75 font-mono">{item.radius}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: AI Tour Guide Persona */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>AI Guide Persona</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'historian', name: 'Lord Reginald', role: 'Master Historian', icon: '🏛️' },
                    { id: 'insider', name: 'Mia', role: 'Local Insider', icon: '🍷' },
                    { id: 'storyteller', name: 'Elena', role: 'Legend Teller', icon: '🎭' },
                    { id: 'adventurer', name: 'Sam', role: 'City Explorer', icon: '🎒' },
                  ].map((p) => {
                    const isSelected = guidePersona === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onChangePersona(p.id as GuidePersona)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow'
                            : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{p.name}</p>
                            <p className="text-[10px] opacity-75 truncate">{p.role}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: Voice & Audio Settings */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Audio & Narration</span>
                </h3>
                <div className="space-y-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  {/* Auto-Narration on Proximity */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Auto-Narrate on Arrival</p>
                      <p className="text-[10px] text-slate-400">Speaks automatically when landmark is in range</p>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleAutoNarration}
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                        autoNarration ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          autoNarration ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Sound Chimes */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <p className="text-xs font-semibold text-slate-200">Chime on Arrival</p>
                      <p className="text-[10px] text-slate-400">Plays melodic notification entering geofence</p>
                    </div>
                    <button
                      type="button"
                      onClick={onToggleSoundChimes}
                      className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative p-0.5 ${
                        soundChimes ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          soundChimes ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Narration Story Length */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-[11px] font-semibold text-slate-300 mb-1.5">Story Length</p>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: 'short', label: 'Short' },
                        { id: 'standard', label: 'Standard' },
                        { id: 'deep', label: 'Deep Dive' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onChangeLength(item.id as NarrationLength)}
                          className={`py-1.5 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer ${
                            narrationLength === item.id
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tour Language */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <p className="text-[11px] font-semibold text-slate-300 mb-1.5">Language</p>
                    <div className="grid grid-cols-3 gap-1">
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          type="button"
                          onClick={() => onChangeLanguage(l.code)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                            language === l.code
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Theme & Time of Day */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Visual Theme & Day/Night Mode</span>
                </h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'auto', label: 'Local Auto', icon: Clock, desc: 'Syncs with time' },
                    { id: 'day', label: 'Daylight', icon: Sun, desc: 'Light mode' },
                    { id: 'night', label: 'Sunset/Night', icon: Moon, desc: 'Dark mode' },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = themeMode === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onChangeThemeMode(t.id as ThemeMode)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow'
                            : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span className="text-xs">{t.label}</span>
                        <span className="text-[9px] opacity-75">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 6: Tour Tools & Planning */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Tour Planning Tools</span>
                </h3>
                <div className="space-y-2">
                  {onOpenStreetView && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenStreetView();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-rose-600 via-indigo-600 to-purple-600 hover:from-rose-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Glasses className="w-4 h-4 text-amber-300" />
                        <span>360° Street View & VR Exploration</span>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        Launch VR
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenRouteOptimizer();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>AI Smart Route Optimizer</span>
                    </div>
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                      Generate Plan
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenLandmarksDrawer();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>Explore All Sights & Favorites</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {visitedCount}/{landmarkCount} visited
                    </span>
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="mt-3">
                  <p className="text-[11px] text-slate-400 mb-1.5">Category Sights Filter</p>
                  <div className="flex flex-wrap gap-1">
                    {categoryFilters.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => onChangeCategory(cat.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>EchoGuide v2.0 • GPS Tour</span>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
