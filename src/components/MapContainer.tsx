import React, { useCallback, useEffect, useState, useRef } from 'react';
import { APIProvider, Map, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { Landmark, TravelMode, UserPosition } from '../types/tour';
import { UserLocationMarker } from './UserLocationMarker';
import { ClusteredLandmarkMarkers } from './ClusteredLandmarkMarkers';
import { TourRoutePolyline } from './TourRoutePolyline';
import { Crosshair, Plus, Minus, Layers, Move, ChevronDown, ChevronUp, Eye, Glasses } from 'lucide-react';
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
  onOpenStreetView?: (landmark: Landmark) => void;
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

// Custom Movable Map Controls Toolbar inside APIProvider
const MapToolbarOverlay: React.FC<{
  isDark: boolean;
  userLocation: UserPosition;
  onRecenter: () => void;
  landmarks?: Landmark[];
  selectedLandmarkId?: string | null;
  onOpenStreetView?: (landmark: Landmark) => void;
}> = ({ isDark, userLocation, onRecenter, landmarks = [], selectedLandmarkId, onOpenStreetView }) => {
  const map = useMap();
  const [isSatellite, setIsSatellite] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Draggable position state
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 16,
    initialY: 16,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    setPos({
      x: Math.max(8, dragStartRef.current.initialX + dx),
      y: Math.max(8, dragStartRef.current.initialY + dy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore if already released
      }
    }
  };

  const handleZoomIn = () => {
    if (map) {
      const z = map.getZoom() || 15;
      map.setZoom(z + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const z = map.getZoom() || 15;
      map.setZoom(Math.max(2, z - 1));
    }
  };

  const handleToggleMapType = () => {
    if (map) {
      const nextMode = !isSatellite;
      setIsSatellite(nextMode);
      map.setMapTypeId(nextMode ? 'hybrid' : 'roadmap');
    }
  };

  return (
    <div
      style={{ top: `${pos.y}px`, right: `${pos.x}px` }}
      className={`absolute z-30 flex flex-col items-end gap-1.5 touch-none select-none transition-shadow ${
        isDragging ? 'opacity-90 shadow-2xl scale-105' : ''
      }`}
    >
      {/* Unified Draggable Control Panel */}
      <div
        className={`glass-panel rounded-2xl shadow-xl border p-1.5 flex flex-col gap-1 transition-colors ${
          isDark ? 'bg-slate-900/90 border-slate-700/80 text-white' : 'bg-white/95 border-slate-300 text-slate-800'
        }`}
      >
        {/* Drag Handle & Collapse Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between gap-2 px-2 py-1 rounded-xl bg-slate-800/40 cursor-grab active:cursor-grabbing hover:bg-slate-800/60 transition-colors"
          title="Drag to reposition map controls anywhere on screen"
        >
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">
            <Move className="w-3 h-3 text-indigo-400" />
            <span className="hidden sm:inline">Move</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
            className="p-0.5 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand controls' : 'Collapse controls'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isCollapsed && (
          <>
            {/* Center on Me Button */}
            <button
              type="button"
              onClick={onRecenter}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isDark
                  ? 'bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30'
                  : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200'
              }`}
              title="Center map on your location"
            >
              <Crosshair className="w-4 h-4 text-indigo-400" />
              <span className="text-xs">Recenter</span>
            </button>

            {/* Map Zoom In & Out */}
            <div className="flex items-center gap-1 bg-slate-800/40 p-1 rounded-xl border border-slate-700/50 justify-between">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-slate-700" />
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Satellite / Terrain View Toggle */}
            <button
              type="button"
              onClick={handleToggleMapType}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors cursor-pointer ${
                isSatellite
                  ? 'bg-emerald-600 text-white shadow'
                  : isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Toggle Satellite vs Map view"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSatellite ? 'Satellite View' : 'Map View'}</span>
            </button>

            {/* Quick 360 Street View & VR Launch Button */}
            {onOpenStreetView && (
              <button
                type="button"
                onClick={() => {
                  const target = landmarks.find((l) => l.id === selectedLandmarkId) || landmarks[0];
                  if (target) {
                    onOpenStreetView(target);
                  }
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-gradient-to-r from-rose-600 via-indigo-600 to-purple-600 hover:from-rose-700 hover:to-indigo-700 text-white shadow-lg transition-all cursor-pointer"
                title="Explore current sight in 360° Google Street View & VR Cardboard mode"
              >
                <Glasses className="w-3.5 h-3.5" />
                <span>360° Street View & VR</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
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
  onOpenStreetView,
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
          disableDefaultUI={true}
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
            onOpenStreetView={onOpenStreetView}
          />

          {/* User Live Location Marker with Animated Radar Pulse & Heading Arrow */}
          <UserLocationMarker
            position={userLocation}
            travelMode={travelMode}
          />

          {/* Draggable Custom Map Controls (Zoom, Recenter, Map Type, VR) */}
          <MapToolbarOverlay
            isDark={isDark}
            userLocation={userLocation}
            onRecenter={() => setRecenterCounter((c) => c + 1)}
            landmarks={landmarks}
            selectedLandmarkId={selectedLandmarkId}
            onOpenStreetView={onOpenStreetView}
          />
        </Map>
      </APIProvider>

      {/* Floating Map Legend Indicator at top-left */}
      <div
        className={`absolute top-4 left-4 z-20 hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-panel text-[11px] font-medium shadow border ${
          isDark ? 'text-slate-300 border-slate-700/60 bg-slate-900/80' : 'text-slate-700 border-slate-200/90 bg-white/90'
        }`}
      >
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm" />
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm" />
          <span>Tour Path</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm" />
          <span>Sights</span>
        </div>
      </div>
    </div>
  );
};
