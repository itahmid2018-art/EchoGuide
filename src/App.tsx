import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CITY_PRESETS } from './data/cityPresets';
import {
  ActiveNarration,
  CityPreset,
  GuidePersona,
  Landmark,
  NarrationLength,
  OptimizedRoutePlan,
  TourCategoryFilter,
  TourLanguage,
  TravelMode,
  UserPosition,
} from './types/tour';
import { getBearing, getDistanceMeters, getGeofenceRadiusMeters } from './utils/geoUtils';
import { audioNarrator } from './utils/audioNarrator';
import { POICache } from './data/POICache';
import { TourStore } from './data/TourStore';
import { QuotaBanner } from './components/QuotaBanner';
import { TourControlsHeader } from './components/TourControlsHeader';
import { MapContainer } from './components/MapContainer';
import { NarrationDock } from './components/NarrationDock';
import { LandmarksDrawer } from './components/LandmarksDrawer';
import { VoiceQAWidget } from './components/VoiceQAWidget';
import { RouteOptimizerModal } from './components/RouteOptimizerModal';
import { StreetViewVRModal } from './components/StreetViewVRModal';
import { ConnectivityMonitor } from './components/ConnectivityMonitor';
import { getTimeOfDayInfo, ThemeMode, TimeOfDayInfo } from './utils/themeUtils';

export default function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Active City and Landmarks
  const [currentCity, setCurrentCity] = useState<CityPreset>(CITY_PRESETS[0]);
  const [landmarks, setLandmarks] = useState<Landmark[]>(CITY_PRESETS[0].landmarks);
  const [activeRoute, setActiveRoute] = useState<{ lat: number; lng: number }[]>(
    CITY_PRESETS[0].walkingRoute
  );

  // User location state
  const [userLocation, setUserLocation] = useState<UserPosition>({
    lat: CITY_PRESETS[0].walkingRoute[0]?.lat || CITY_PRESETS[0].center.lat,
    lng: CITY_PRESETS[0].walkingRoute[0]?.lng || CITY_PRESETS[0].center.lng,
    heading: 45,
    speed: 1.2,
    accuracy: 12,
    timestamp: Date.now(),
  });

  const [visitedTrail, setVisitedTrail] = useState<{ lat: number; lng: number }[]>([
    {
      lat: CITY_PRESETS[0].walkingRoute[0]?.lat || CITY_PRESETS[0].center.lat,
      lng: CITY_PRESETS[0].walkingRoute[0]?.lng || CITY_PRESETS[0].center.lng,
    },
  ]);

  // Mode and settings
  const [travelMode, setTravelMode] = useState<TravelMode>('walking');
  const [autoNarration, setAutoNarration] = useState<boolean>(true);
  const [soundChimes, setSoundChimes] = useState<boolean>(true);
  const [guidePersona, setGuidePersona] = useState<GuidePersona>('historian');
  const [narrationLength, setNarrationLength] = useState<NarrationLength>('standard');
  const [language, setLanguage] = useState<TourLanguage>('en');
  const [selectedCategory, setSelectedCategory] = useState<TourCategoryFilter>('all');

  // Day / Sunset / Night Theme state synchronized with user's local time
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [timeInfo, setTimeInfo] = useState<TimeOfDayInfo>(getTimeOfDayInfo());

  // Periodically check local time so theme updates automatically as day turns to sunset/night
  useEffect(() => {
    const updateTime = () => setTimeInfo(getTimeOfDayInfo());
    const interval = window.setInterval(updateTime, 30000);
    return () => window.clearInterval(interval);
  }, []);

  // Compute active dark mode: Auto (based on user local time) vs forced Day / forced Night
  const isDark = useMemo(() => {
    if (themeMode === 'night') return true;
    if (themeMode === 'day') return false;
    // When 'auto', sunset and nighttime use dark theme, daytime uses light theme
    return !timeInfo.isDay;
  }, [themeMode, timeInfo.isDay]);

  // Real GPS tracking state
  const [isUsingRealGps, setIsUsingRealGps] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  // Simulation mode state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const simStepRef = useRef<number>(0);
  const simIntervalRef = useRef<number | null>(null);

  // Selected & Proximity state
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [nearbyInRangeId, setNearbyInRangeId] = useState<string | null>(null);
  const narratedIdsRef = useRef<Set<string>>(new Set());

  // Narration playback state
  const [activeNarration, setActiveNarration] = useState<ActiveNarration | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isLoadingNarration, setIsLoadingNarration] = useState<boolean>(false);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);

  // Modals & Drawers
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isRouteOptimizerOpen, setIsRouteOptimizerOpen] = useState<boolean>(false);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [streetViewLandmark, setStreetViewLandmark] = useState<Landmark | null>(null);

  // Switch City
  const handleSelectCity = (newCity: CityPreset) => {
    setCurrentCity(newCity);
    setLandmarks(newCity.landmarks);
    setActiveRoute(newCity.walkingRoute);
    narratedIdsRef.current.clear();
    const startPoint = newCity.walkingRoute[0] || newCity.center;
    const newPos: UserPosition = {
      lat: startPoint.lat,
      lng: startPoint.lng,
      heading: 0,
      timestamp: Date.now(),
    };
    setUserLocation(newPos);
    setVisitedTrail([{ lat: startPoint.lat, lng: startPoint.lng }]);
    simStepRef.current = 0;
    setSelectedLandmarkId(null);
    setNearbyInRangeId(null);
  };

  // Play narration text with speech synthesis in the chosen language
  const playStoryAudio = useCallback(
    (narrationObj: ActiveNarration) => {
      audioNarrator.speak(narrationObj.story, {
        rate: 0.98,
        pitch: 1.0,
        language: narrationObj.language || language,
        onStart: () => {
          setIsPlaying(true);
          setIsPaused(false);
          setCurrentCharIndex(0);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsPaused(false);
          setCurrentCharIndex(0);
        },
        onBoundary: (charIndex) => {
          setCurrentCharIndex(charIndex);
        },
        onError: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
      });
    },
    [language]
  );

  // Request AI Narration from POICache or server Gemini API
  const triggerNarrationForLandmark = useCallback(
    async (landmark: Landmark, personaOverride?: GuidePersona) => {
      const persona = personaOverride || guidePersona;
      setIsLoadingNarration(true);
      setSelectedLandmarkId(landmark.id);

      // Mark landmark as visited
      setLandmarks((prev) =>
        prev.map((l) => (l.id === landmark.id ? { ...l, visited: true } : l))
      );
      narratedIdsRef.current.add(landmark.id);

      // 1. Check Offline LocalStorage Cache first (Roadmap P2)
      const cached = POICache.get(landmark.id, language, persona);
      if (cached) {
        const cachedNarration: ActiveNarration = {
          landmark,
          story: cached.narrationText,
          highlightSnippet: cached.highlightSnippet,
          funFact: cached.funFact,
          insiderTip: cached.insiderTip,
          nearbyActivity: cached.nearbyActivity,
          historicalEra: cached.historicalEra,
          suggestedLookAt: cached.suggestedLookAt,
          persona,
          length: narrationLength,
          language,
          weather: cached.weather,
        };

        setActiveNarration(cachedNarration);
        setIsLoadingNarration(false);
        playStoryAudio(cachedNarration);

        // Record to History
        TourStore.addHistory({
          poiId: landmark.id,
          poiName: landmark.name,
          cityName: currentCity.name,
          category: landmark.category,
          narrationSnippet: cached.highlightSnippet || cached.narrationText.slice(0, 100),
          timestamp: Date.now(),
        });
        return;
      }

      const distance = getDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        landmark.lat,
        landmark.lng
      );

      try {
        const res = await fetch('/api/tour/narrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            landmarkName: landmark.name,
            category: landmark.category,
            city: currentCity.name,
            country: currentCity.country,
            coordinates: { lat: landmark.lat, lng: landmark.lng },
            distanceMeters: distance,
            travelMode,
            persona,
            length: narrationLength,
            language,
            additionalContext: `${landmark.shortDescription} ${landmark.historicalEra || ''}`,
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }

        const data = await res.json();
        const newNarration: ActiveNarration = {
          landmark,
          story: data.story || landmark.shortDescription,
          highlightSnippet: data.highlightSnippet,
          funFact: data.funFact || landmark.funFact,
          insiderTip: data.insiderTip || landmark.insiderTip,
          nearbyActivity: data.nearbyActivity || landmark.activityNow,
          historicalEra: data.historicalEra || landmark.historicalEra,
          suggestedLookAt: data.suggestedLookAt || landmark.suggestedLookAt,
          persona,
          length: narrationLength,
          language,
          weather: data.weather,
        };

        // Cache in LocalStorage for offline and instant replay
        POICache.set({
          poiId: landmark.id,
          language,
          persona,
          narrationText: newNarration.story,
          highlightSnippet: newNarration.highlightSnippet,
          funFact: newNarration.funFact,
          insiderTip: newNarration.insiderTip,
          nearbyActivity: newNarration.nearbyActivity,
          historicalEra: newNarration.historicalEra,
          suggestedLookAt: newNarration.suggestedLookAt,
          weather: newNarration.weather,
          timestamp: Date.now(),
        });

        // Record to history
        TourStore.addHistory({
          poiId: landmark.id,
          poiName: landmark.name,
          cityName: currentCity.name,
          category: landmark.category,
          narrationSnippet:
            newNarration.highlightSnippet || newNarration.story.slice(0, 100),
          timestamp: Date.now(),
        });

        setActiveNarration(newNarration);
        setIsLoadingNarration(false);

        // Auto-play audio narration
        playStoryAudio(newNarration);
      } catch (err) {
        console.error('Failed to generate narration:', err);
        setIsLoadingNarration(false);

        // Fallback to local landmark description
        const fallbackNarration: ActiveNarration = {
          landmark,
          story: landmark.shortDescription,
          funFact: landmark.funFact,
          insiderTip: landmark.insiderTip,
          nearbyActivity: landmark.activityNow,
          historicalEra: landmark.historicalEra,
          persona,
          length: narrationLength,
          language,
        };
        setActiveNarration(fallbackNarration);
        playStoryAudio(fallbackNarration);
      }
    },
    [guidePersona, userLocation, currentCity, travelMode, narrationLength, language, playStoryAudio]
  );

  // Proximity Detection Check
  const checkProximityToLandmarks = useCallback(
    (currentPos: UserPosition) => {
      const radius = getGeofenceRadiusMeters(travelMode);
      let closestInRange: { landmark: Landmark; dist: number } | null = null;

      for (const lm of landmarks) {
        const dist = getDistanceMeters(currentPos.lat, currentPos.lng, lm.lat, lm.lng);
        if (dist <= radius) {
          if (!closestInRange || dist < closestInRange.dist) {
            closestInRange = { landmark: lm, dist };
          }
        }
      }

      if (closestInRange) {
        const lm = closestInRange.landmark;
        setNearbyInRangeId(lm.id);

        // Check if we should automatically trigger audio narration
        if (!narratedIdsRef.current.has(lm.id)) {
          if (soundChimes) {
            audioNarrator.playArrivalChime();
          }

          if (autoNarration) {
            triggerNarrationForLandmark(lm);
          }
        }
      } else {
        setNearbyInRangeId(null);
      }
    },
    [travelMode, landmarks, soundChimes, autoNarration, triggerNarrationForLandmark]
  );

  // Handle location update from any source (GPS, simulation, map click)
  const handleUpdateLocation = useCallback(
    (newLat: number, newLng: number, speed?: number, accuracy?: number) => {
      setUserLocation((prev) => {
        const heading = getBearing(prev.lat, prev.lng, newLat, newLng);
        const updated: UserPosition = {
          lat: newLat,
          lng: newLng,
          heading:
            Math.abs(prev.lat - newLat) + Math.abs(prev.lng - newLng) > 0.00001
              ? heading
              : prev.heading,
          speed: speed ?? prev.speed,
          accuracy: accuracy ?? prev.accuracy,
          timestamp: Date.now(),
        };

        // Append to visited trail breadcrumbs
        setVisitedTrail((trail) => {
          const last = trail[trail.length - 1];
          if (!last || getDistanceMeters(last.lat, last.lng, newLat, newLng) > 5) {
            return [...trail.slice(-150), { lat: newLat, lng: newLng }];
          }
          return trail;
        });

        // Run proximity detection
        checkProximityToLandmarks(updated);

        return updated;
      });
    },
    [checkProximityToLandmarks]
  );

  // Browser Geolocation watchPosition
  const toggleRealGps = () => {
    if (isUsingRealGps) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setIsUsingRealGps(false);
    } else {
      if (!('geolocation' in navigator)) {
        alert('Geolocation is not supported by your browser.');
        return;
      }

      setIsSimulating(false);

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, speed, accuracy } = position.coords;
          handleUpdateLocation(
            latitude,
            longitude,
            speed || undefined,
            accuracy || undefined
          );
        },
        (error) => {
          console.warn('Geolocation error:', error);
          alert(`Geolocation Error: ${error.message}. You can continue in Simulation Tour mode.`);
          setIsUsingRealGps(false);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 15000,
        }
      );

      watchIdRef.current = watchId;
      setIsUsingRealGps(true);
    }
  };

  // Cleanup GPS on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Walk Simulation Loop along activeRoute
  useEffect(() => {
    if (isSimulating) {
      const route = activeRoute;
      if (!route || route.length < 2) return;

      const intervalMs = Math.max(250, 1500 / simSpeed);

      simIntervalRef.current = window.setInterval(() => {
        simStepRef.current += 1;
        const totalPoints = (route.length - 1) * 20;
        const progress = (simStepRef.current % totalPoints) / totalPoints;

        const rawIndex = progress * (route.length - 1);
        const segmentIndex = Math.floor(rawIndex);
        const segmentProgress = rawIndex - segmentIndex;

        const p1 = route[segmentIndex];
        const p2 = route[Math.min(segmentIndex + 1, route.length - 1)];

        const interpLat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
        const interpLng = p1.lng + (p2.lng - p1.lng) * segmentProgress;

        handleUpdateLocation(interpLat, interpLng, 1.4 * simSpeed, 5);
      }, intervalMs);
    } else {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [isSimulating, simSpeed, activeRoute, handleUpdateLocation]);

  // AI Discover More Nearby Sights
  const handleDiscoverMore = async () => {
    setIsDiscovering(true);
    try {
      const res = await fetch('/api/tour/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: userLocation.lat,
          lng: userLocation.lng,
          city: currentCity.name,
          travelMode,
        }),
      });

      if (!res.ok) throw new Error('Failed to discover');
      const newPlaces = await res.json();

      if (Array.isArray(newPlaces) && newPlaces.length > 0) {
        setLandmarks((existing) => {
          const existingIds = new Set(existing.map((e) => e.id));
          const uniqueNew = newPlaces.filter((p: any) => !existingIds.has(p.id));
          return [...existing, ...uniqueNew];
        });
      }
    } catch (e) {
      console.error('Error discovering nearby landmarks:', e);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Apply AI Optimized Tour Route Plan
  const handleApplyOptimizedRoute = (plan: OptimizedRoutePlan) => {
    if (!plan.stops || plan.stops.length < 2) return;
    const newRoute = plan.stops.map((s) => ({ lat: s.lat, lng: s.lng }));
    setActiveRoute(newRoute);
    simStepRef.current = 0;
    // Teleport to the start of the optimized route
    handleUpdateLocation(newRoute[0].lat, newRoute[0].lng);
  };

  // Filter landmarks displayed on the map according to selectedCategory
  const displayedLandmarks = useMemo(() => {
    if (selectedCategory === 'all') return landmarks;
    return landmarks.filter((l) => {
      if (selectedCategory === 'history') return l.category === 'monument';
      if (selectedCategory === 'food') return l.category === 'market';
      if (selectedCategory === 'architecture') return l.category === 'architecture';
      if (selectedCategory === 'nature')
        return l.category === 'park' || l.category === 'viewpoint';
      if (selectedCategory === 'museum') return l.category === 'museum';
      return true;
    });
  }, [landmarks, selectedCategory]);

  const visitedCount = landmarks.filter((l) => l.visited).length;

  // Active nearest landmark name for location display
  const nearbyLandmark = useMemo(() => {
    if (nearbyInRangeId) {
      return landmarks.find((l) => l.id === nearbyInRangeId);
    }
    if (selectedLandmarkId) {
      return landmarks.find((l) => l.id === selectedLandmarkId);
    }
    return null;
  }, [nearbyInRangeId, selectedLandmarkId, landmarks]);

  // Navigate to coordinates from search bar or location selector
  const handleSelectCoordinates = useCallback(
    (lat: number, lng: number, placeName?: string) => {
      handleUpdateLocation(lat, lng);
      const matched = landmarks.find(
        (l) => Math.abs(l.lat - lat) < 0.001 && Math.abs(l.lng - lng) < 0.001
      );
      if (matched) {
        setSelectedLandmarkId(matched.id);
        if (autoNarration) {
          triggerNarrationForLandmark(matched);
        }
      } else if (placeName) {
        const newLm: Landmark = {
          id: `searched_${Date.now()}`,
          name: placeName,
          category: 'monument',
          lat,
          lng,
          shortDescription: `Searched location: ${placeName}. Explore historical details, architecture, and local culture.`,
          historicalEra: 'Historic & Cultural Site',
          visited: true,
        };
        setLandmarks((prev) => [newLm, ...prev]);
        setSelectedLandmarkId(newLm.id);
        if (autoNarration) {
          triggerNarrationForLandmark(newLm);
        }
      } else {
        setSelectedLandmarkId(null);
      }
    },
    [handleUpdateLocation, landmarks, autoNarration, triggerNarrationForLandmark]
  );

  return (
    <div
      className={`relative flex flex-col h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-300 ${
        isDark ? 'theme-dark bg-slate-950 text-slate-100' : 'theme-day bg-slate-100 text-slate-900'
      }`}
    >
      {/* Quota Defense Banner mandated by Google Maps Platform guidelines */}
      <QuotaBanner />

      {/* Persistent Connectivity Monitor for Offline Toast Notifications */}
      <ConnectivityMonitor isDark={isDark} />

      {/* Top Header with Location Search & Top-Right Hamburger Menu */}
      <TourControlsHeader
        currentCity={currentCity}
        onSelectCity={handleSelectCity}
        travelMode={travelMode}
        onChangeTravelMode={setTravelMode}
        userLocation={userLocation}
        onSelectCoordinates={handleSelectCoordinates}
        nearbyLandmarkName={nearbyLandmark?.name || null}
        isDark={isDark}
        themeMode={themeMode}
        onChangeThemeMode={setThemeMode}
        timeOfDayLabel={timeInfo.themeTitle}
        formattedLocalTime={timeInfo.formattedTime}
        isUsingRealGps={isUsingRealGps}
        onToggleRealGps={toggleRealGps}
        isSimulating={isSimulating}
        simSpeed={simSpeed}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onChangeSimSpeed={setSimSpeed}
        onResetSimulation={() => {
          simStepRef.current = 0;
          const start = activeRoute[0] || currentCity.center;
          handleUpdateLocation(start.lat, start.lng);
        }}
        autoNarration={autoNarration}
        onToggleAutoNarration={() => setAutoNarration(!autoNarration)}
        soundChimes={soundChimes}
        onToggleSoundChimes={() => setSoundChimes(!soundChimes)}
        guidePersona={guidePersona}
        onChangePersona={(p) => {
          setGuidePersona(p);
          if (activeNarration) {
            triggerNarrationForLandmark(activeNarration.landmark, p);
          }
        }}
        narrationLength={narrationLength}
        onChangeLength={setNarrationLength}
        language={language}
        onChangeLanguage={(l) => {
          setLanguage(l);
          if (activeNarration) {
            triggerNarrationForLandmark(activeNarration.landmark);
          }
        }}
        selectedCategory={selectedCategory}
        onChangeCategory={setSelectedCategory}
        onOpenRouteOptimizer={() => setIsRouteOptimizerOpen(true)}
        landmarkCount={landmarks.length}
        visitedCount={visitedCount}
        onOpenLandmarksDrawer={() => setIsDrawerOpen(true)}
        onOpenStreetView={() => {
          const target =
            landmarks.find((l) => l.id === selectedLandmarkId) ||
            landmarks.find((l) => l.id === nearbyInRangeId) ||
            landmarks[0];
          if (target) setStreetViewLandmark(target);
        }}
      />

      {/* Google Map enclosed within a rounded edge rectangle matching the header */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto px-2.5 pb-2.5 pt-1 md:px-4 md:pb-4 md:pt-1.5 min-h-0 flex flex-col">
        <div
          className={`relative flex-1 w-full h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border transition-colors duration-300 ${
            isDark
              ? 'border-slate-700/60 shadow-slate-950/70'
              : 'border-slate-200/90 shadow-slate-300/40'
          }`}
        >
          <MapContainer
            apiKey={apiKey}
            isDark={isDark}
            userLocation={userLocation}
            travelMode={travelMode}
            landmarks={displayedLandmarks}
            walkingRoute={activeRoute}
            visitedTrail={visitedTrail}
            selectedLandmarkId={selectedLandmarkId}
            activeNarratingId={isPlaying ? activeNarration?.landmark.id || null : null}
            nearbyInRangeId={nearbyInRangeId}
            onSelectLandmark={(lm) => {
              setSelectedLandmarkId(lm?.id || null);
            }}
            onNarrateLandmark={(lm) => {
              triggerNarrationForLandmark(lm);
            }}
            onOpenStreetView={(lm) => {
              setStreetViewLandmark(lm);
            }}
            onMapClickPosition={(lat, lng) => {
              handleUpdateLocation(lat, lng);
            }}
            initialCenter={currentCity.center}
            initialZoom={currentCity.zoom}
          />
        </div>
      </main>

      {/* Bottom Sticky Audio Narration Player Dock */}
      <NarrationDock
        narration={activeNarration}
        isPlaying={isPlaying}
        isPaused={isPaused}
        isLoading={isLoadingNarration}
        currentCharIndex={currentCharIndex}
        onPlay={() => {
          if (activeNarration) playStoryAudio(activeNarration);
        }}
        onPause={() => {
          audioNarrator.pause();
          setIsPaused(true);
          setIsPlaying(false);
        }}
        onResume={() => {
          audioNarrator.resume();
          setIsPaused(false);
          setIsPlaying(true);
        }}
        onStop={() => {
          audioNarrator.stop();
          setIsPlaying(false);
          setIsPaused(false);
          setActiveNarration(null);
        }}
        onReplay={() => {
          if (activeNarration) playStoryAudio(activeNarration);
        }}
        onPersonaChange={(p) => {
          setGuidePersona(p);
          if (activeNarration) {
            triggerNarrationForLandmark(activeNarration.landmark, p);
          }
        }}
        onOpenStreetView={(lm) => setStreetViewLandmark(lm)}
      />

      {/* Slide-over Sights & Landmarks Drawer (with Favorites & History) */}
      <LandmarksDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        landmarks={landmarks}
        userLocation={userLocation}
        travelMode={travelMode}
        selectedLandmarkId={selectedLandmarkId}
        activeNarratingId={activeNarration?.landmark.id || null}
        onSelectLandmark={(lm) => {
          setSelectedLandmarkId(lm.id);
          setIsDrawerOpen(false);
        }}
        onNarrateLandmark={(lm) => {
          triggerNarrationForLandmark(lm);
          setIsDrawerOpen(false);
        }}
        onTeleportToLandmark={(lm) => {
          handleUpdateLocation(lm.lat, lm.lng);
          setIsDrawerOpen(false);
        }}
        onOpenStreetView={(lm) => setStreetViewLandmark(lm)}
        onDiscoverMore={handleDiscoverMore}
        isDiscovering={isDiscovering}
        activeCategory={selectedCategory}
        onChangeCategory={setSelectedCategory}
      />

      {/* Always-visible AI Chat bubble above footer bar, just below the map */}
      <VoiceQAWidget
        userLocation={userLocation}
        cityName={currentCity.name}
        landmarks={landmarks}
        persona={guidePersona}
        onTeleportToLandmark={(lm) => {
          handleUpdateLocation(lm.lat, lm.lng);
        }}
        hasActiveNarration={Boolean(activeNarration || isLoadingNarration)}
        isDark={isDark}
        initialWeather={activeNarration?.weather || null}
      />

      {/* AI Tour Route Optimizer Modal (Roadmap P1) */}
      <RouteOptimizerModal
        isOpen={isRouteOptimizerOpen}
        onClose={() => setIsRouteOptimizerOpen(false)}
        cityName={currentCity.name}
        userLocation={userLocation}
        travelMode={travelMode}
        landmarks={landmarks}
        onApplyOptimizedRoute={handleApplyOptimizedRoute}
      />

      {/* Street View & VR 360 Modal */}
      {streetViewLandmark && (
        <StreetViewVRModal
          landmark={streetViewLandmark}
          apiKey={apiKey}
          isDark={isDark}
          onClose={() => setStreetViewLandmark(null)}
        />
      )}
    </div>
  );
}
