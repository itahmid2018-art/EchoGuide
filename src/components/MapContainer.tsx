import React, { useCallback, useEffect, useState } from 'react';
import { APIProvider, Map, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { Landmark, TravelMode, UserPosition } from '../types/tour';
import { UserLocationMarker } from './UserLocationMarker';
import { ClusteredLandmarkMarkers } from './ClusteredLandmarkMarkers';
import { TourRoutePolyline } from './TourRoutePolyline';
import { Crosshair } from 'lucide-react';
import { GOOGLE_MAPS_NIGHT_STYLES, GOOGLE_MAPS_DAY_STYLES } from '../utils/themeUtils';

interface MapContainerProps {
  apiKey: string;
  isDark: boolean;
  userLocation: UserPosition;
  travelMode: TravelMode;
  landmarks: Landmark[];
  walkingRoute: { lat: number; lng: number }[];
  visitedTrail: { lat: number; lng: number }[];
  selectedLandmarkId: string | null;
  activeNarratingId: string | null;
  nearbyInRangeId: string | null;
  onSelectLandmark: (landmark: Landmark) => void;
  onNarrateLandmark: (landmark: Landmark) => void;
  onMapClickPosition: (lat: number, lng: number) => void;
  initialCenter: { lat: number; lng: number };
  initialZoom: number;
}

// Internal map controller for smooth centering
const MapViewController: React.FC<{
  userLocation: UserPosition;
  recenterTrigger: number;
}> = ({ userLocation, recenterTrigger }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo({ lat: userLocation.lat, lng: userLocation.lng });
    map.setZoom(15);
  }, [map, recenterTrigger, userLocation.lat, userLocation.lng]);

  return null;
};

export const MapContainer: React.FC<MapContainerProps> = ({
  apiKey,
  isDark,
  userLocation,
  travelMode,
  landmarks,
  walkingRoute,
  visitedTrail,
  selectedLandmarkId,
  activeNarratingId,
  nearbyInRangeId,
  onSelectLandmark,
  onNarrateLandmark,
  onMapClickPosition,
  initialCenter,
  initialZoom,
}) => {
  const [recenterCounter, setRecenterCounter] = useState(0);

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (e.detail.latLng) {
        onMapClickPosition(e.detail.latLng.lat, e.detail.latLng.lng);
      }
    },
    [onMapClickPosition]
  );

  return (
    <div className="relative w-full h-full min-h-[450px] flex-1 overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          id="city-tour-map"
          mapId="DEMO_MAP_ID"
          defaultCenter={initialCenter}
          defaultZoom={initialZoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          clickableIcons={false}
          styles={isDark ? GOOGLE_MAPS_NIGHT_STYLES : GOOGLE_MAPS_DAY_STYLES}
          onClick={handleMapClick}
          // Mandatory internal usage attribution required by skill guidelines
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          className="w-full h-full min-h-full"
          style={{ width: '100%', height: '100%' }}
        >
          {/* Map centering controller */}
          <MapViewController
            userLocation={userLocation}
            recenterTrigger={recenterCounter}
          />

          {/* Planned Tour Route Polyline & Visited Breadcrumb Trail */}
          <TourRoutePolyline
            path={walkingRoute}
            visitedTrail={visitedTrail}
          />

          {/* Clustered Landmark Markers */}
          <ClusteredLandmarkMarkers
            landmarks={landmarks}
            selectedLandmarkId={selectedLandmarkId}
            activeNarratingId={activeNarratingId}
            nearbyInRangeId={nearbyInRangeId}
            onSelectLandmark={onSelectLandmark}
            onNarrateLandmark={onNarrateLandmark}
          />

          {/* User Live Location Marker with Animated Radar Pulse & Heading Arrow */}
          <UserLocationMarker
            position={userLocation}
            travelMode={travelMode}
          />
        </Map>
      </APIProvider>

      {/* Floating Recenter Map Button */}
      <button
        type="button"
        onClick={() => setRecenterCounter((c: number) => c + 1)}
        className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl glass-panel text-xs font-semibold shadow-xl transition-colors cursor-pointer ${
          isDark
            ? 'text-white hover:bg-slate-800'
            : 'text-slate-800 hover:bg-slate-100/90'
        }`}
        title="Center map on your current location"
      >
        <Crosshair className="w-4 h-4 text-indigo-500" />
        <span className="hidden sm:inline">Center on Me</span>
      </button>

      {/* Floating Map Legend Indicator */}
      <div
        className={`absolute top-4 left-4 z-20 hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-panel text-[11px] font-medium shadow ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Tour Path</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Sights</span>
        </div>
      </div>
    </div>
  );
};
