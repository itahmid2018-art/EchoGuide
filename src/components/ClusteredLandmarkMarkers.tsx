import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Landmark, LandmarkCategory } from '../types/tour';
import {
  Landmark as LandmarkIcon,
  Castle,
  Palette,
  ShoppingBag,
  Trees,
  Compass,
  CheckCircle2,
  Volume2,
  Sparkles,
  Eye,
  Glasses,
} from 'lucide-react';

interface ClusteredLandmarkMarkersProps {
  landmarks: Landmark[];
  selectedLandmarkId: string | null;
  activeNarratingId: string | null;
  nearbyInRangeId: string | null;
  onSelectLandmark: (landmark: Landmark) => void;
  onNarrateLandmark: (landmark: Landmark) => void;
  onOpenStreetView?: (landmark: Landmark) => void;
}

const getCategoryIcon = (category: LandmarkCategory) => {
  switch (category) {
    case 'monument':
      return <LandmarkIcon className="w-3.5 h-3.5" />;
    case 'architecture':
      return <Castle className="w-3.5 h-3.5" />;
    case 'museum':
      return <Palette className="w-3.5 h-3.5" />;
    case 'market':
      return <ShoppingBag className="w-3.5 h-3.5" />;
    case 'park':
      return <Trees className="w-3.5 h-3.5" />;
    case 'viewpoint':
    case 'activity':
    default:
      return <Compass className="w-3.5 h-3.5" />;
  }
};

const getCategoryTheme = (category: LandmarkCategory) => {
  switch (category) {
    case 'monument':
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300',
        text: 'text-amber-400',
      };
    case 'architecture':
      return {
        bg: 'bg-indigo-600',
        border: 'border-indigo-300',
        text: 'text-indigo-400',
      };
    case 'museum':
      return {
        bg: 'bg-rose-500',
        border: 'border-rose-300',
        text: 'text-rose-400',
      };
    case 'market':
      return {
        bg: 'bg-emerald-600',
        border: 'border-emerald-300',
        text: 'text-emerald-400',
      };
    case 'park':
      return {
        bg: 'bg-teal-600',
        border: 'border-teal-300',
        text: 'text-teal-400',
      };
    case 'viewpoint':
    default:
      return {
        bg: 'bg-sky-500',
        border: 'border-sky-300',
        text: 'text-sky-400',
      };
  }
};

// Subcomponent for each landmark marker with stable ref handling
const LandmarkPinMarker = React.memo<{
  landmark: Landmark;
  isSelected: boolean;
  isNarrating: boolean;
  isInRange: boolean;
  onSelect: (landmark: Landmark) => void;
  setMarkerRef: (marker: google.maps.marker.AdvancedMarkerElement | null, id: string) => void;
}>(({ landmark, isSelected, isNarrating, isInRange, onSelect, setMarkerRef }) => {
  const theme = getCategoryTheme(landmark.category);

  const handleRef = useCallback(
    (el: google.maps.marker.AdvancedMarkerElement | null) => {
      setMarkerRef(el, landmark.id);
    },
    [landmark.id, setMarkerRef]
  );

  return (
    <AdvancedMarker
      position={{ lat: landmark.lat, lng: landmark.lng }}
      ref={handleRef}
      onClick={() => onSelect(landmark)}
      zIndex={isNarrating ? 90 : isSelected ? 80 : isInRange ? 70 : 10}
      title={landmark.name}
    >
      <div className="relative group flex flex-col items-center cursor-pointer select-none">
        {/* Proximity / Narrating active glow indicator */}
        {(isNarrating || isInRange) && (
          <div
            className={`absolute -inset-2.5 rounded-full ${
              isNarrating ? 'bg-amber-400/40 animate-ping' : 'bg-emerald-400/35 animate-pulse'
            }`}
          />
        )}

        {/* Marker pin body */}
        <div
          className={`relative flex items-center justify-center w-8 h-8 rounded-2xl shadow-xl transition-all duration-200 transform group-hover:scale-125 ${
            theme.bg
          } ${
            isSelected || isNarrating
              ? 'ring-4 ring-amber-300 scale-115 text-white'
              : isInRange
              ? 'ring-3 ring-emerald-400 text-white'
              : 'text-white/95 border-2 border-white/80'
          }`}
        >
          {landmark.visited ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-100" />
          ) : isNarrating ? (
            <Volume2 className="w-4 h-4 text-white animate-bounce" />
          ) : (
            getCategoryIcon(landmark.category)
          )}

          {/* Visited badge indicator */}
          {landmark.visited && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white" />
          )}
        </div>

        {/* Pin tail point */}
        <div
          className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] ${
            theme.bg.replace('bg-', 'border-t-')
          }`}
        />

        {/* Landmark title preview badge */}
        <div className="mt-1 px-2 py-0.5 max-w-[120px] rounded-md bg-slate-900/90 border border-slate-700/80 shadow text-center backdrop-blur-sm pointer-events-none transition-opacity">
          <p className="text-[10px] font-semibold text-slate-100 truncate">{landmark.name}</p>
          {landmark.historicalEra && (
            <p className="text-[8px] text-slate-400 truncate">{landmark.historicalEra}</p>
          )}
        </div>
      </div>
    </AdvancedMarker>
  );
});

export const ClusteredLandmarkMarkers: React.FC<ClusteredLandmarkMarkersProps> = ({
  landmarks,
  selectedLandmarkId,
  activeNarratingId,
  nearbyInRangeId,
  onSelectLandmark,
  onNarrateLandmark,
  onOpenStreetView,
}) => {
  const map = useMap();
  const markersRef = useRef<Record<string, google.maps.marker.AdvancedMarkerElement>>({});
  const syncScheduledRef = useRef<boolean>(false);

  // Initialize MarkerClusterer with customized styled clusters
  const clusterer = useMemo(() => {
    if (!map) return null;

    return new MarkerClusterer({
      map,
      renderer: {
        render({ count, position }) {
          const color = count > 8 ? '#f59e0b' : count > 4 ? '#6366f1' : '#0ea5e9';
          const outerGlow = count > 8 ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.25)';

          const div = document.createElement('div');
          div.className = 'group cursor-pointer transform transition-transform hover:scale-110';
          div.innerHTML = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
              <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: ${outerGlow}; border: 1.5px solid ${color};"></div>
              <div style="position: relative; z-index: 10; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 9999px; background: ${color}; color: #ffffff; font-weight: 700; font-size: 13px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); font-family: system-ui, sans-serif;">
                ${count}
              </div>
            </div>
          `;

          return new google.maps.marker.AdvancedMarkerElement({
            position,
            content: div,
            title: `Cluster of ${count} cultural locations`,
            zIndex: 50 + count,
          });
        },
      },
    });
  }, [map]);

  // Batched synchronization of markers with clusterer via requestAnimationFrame
  const scheduleClusterSync = useCallback(() => {
    if (syncScheduledRef.current) return;
    syncScheduledRef.current = true;

    requestAnimationFrame(() => {
      syncScheduledRef.current = false;
      if (clusterer) {
        clusterer.clearMarkers();
        const markerArray = Object.values(markersRef.current);
        if (markerArray.length > 0) {
          clusterer.addMarkers(markerArray);
        }
      }
    });
  }, [clusterer]);

  // Callback to store or remove AdvancedMarkerElement refs without calling setState
  const setMarkerRef = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement | null, key: string) => {
      if (marker) {
        markersRef.current[key] = marker;
      } else {
        delete markersRef.current[key];
      }
      scheduleClusterSync();
    },
    [scheduleClusterSync]
  );

  // Sync clusterer whenever landmarks list changes
  useEffect(() => {
    scheduleClusterSync();
  }, [landmarks, scheduleClusterSync]);

  const selectedLandmark = useMemo(
    () => landmarks.find((l) => l.id === selectedLandmarkId) || null,
    [landmarks, selectedLandmarkId]
  );

  return (
    <>
      {landmarks.map((landmark) => (
        <LandmarkPinMarker
          key={landmark.id}
          landmark={landmark}
          isSelected={landmark.id === selectedLandmarkId}
          isNarrating={landmark.id === activeNarratingId}
          isInRange={landmark.id === nearbyInRangeId}
          onSelect={onSelectLandmark}
          setMarkerRef={setMarkerRef}
        />
      ))}

      {/* InfoWindow anchored directly to landmark coordinates */}
      {selectedLandmark && (
        <InfoWindow
          position={{ lat: selectedLandmark.lat, lng: selectedLandmark.lng }}
          pixelOffset={[0, -32]}
          onCloseClick={() => onSelectLandmark(null as any)}
        >
          <div className="p-1 max-w-[290px] text-slate-900 font-sans">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                {selectedLandmark.category}
              </span>
              {selectedLandmark.historicalEra && (
                <span className="text-[10px] text-slate-500 font-medium">
                  {selectedLandmark.historicalEra}
                </span>
              )}
            </div>

            <h3 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
              {selectedLandmark.name}
            </h3>

            <p className="mt-1 text-xs text-slate-600 line-clamp-3">
              {selectedLandmark.shortDescription}
            </p>

            {selectedLandmark.funFact && (
              <div className="mt-2 p-1.5 rounded bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{selectedLandmark.funFact}</span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onNarrateLandmark(selectedLandmark)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] shadow-sm transition-colors cursor-pointer"
              >
                <Volume2 className="w-3 h-3" />
                <span>Audio Guide</span>
              </button>

              {onOpenStreetView && (
                <button
                  type="button"
                  onClick={() => onOpenStreetView(selectedLandmark)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-700 hover:to-indigo-700 text-white font-semibold text-[11px] shadow-sm transition-all cursor-pointer"
                  title="Open 360° Google Street View & VR Cardboard mode"
                >
                  <Glasses className="w-3 h-3" />
                  <span>Street View & VR</span>
                </button>
              )}
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
};
