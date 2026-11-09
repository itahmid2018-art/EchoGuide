import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { UserPosition, TravelMode } from '../types/tour';
import { Navigation, PersonStanding, Bike, Car } from 'lucide-react';

interface UserLocationMarkerProps {
  position: UserPosition;
  travelMode: TravelMode;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  position,
  travelMode,
}) => {
  const heading = position.heading ?? 0;

  const renderModeIcon = () => {
    switch (travelMode) {
      case 'cycling':
        return <Bike className="w-3.5 h-3.5 text-white" />;
      case 'driving':
        return <Car className="w-3.5 h-3.5 text-white" />;
      case 'walking':
      default:
        return <PersonStanding className="w-3.5 h-3.5 text-white" />;
    }
  };

  return (
    <AdvancedMarker
      position={{ lat: position.lat, lng: position.lng }}
      zIndex={100}
      title={`Your Location (${travelMode})`}
    >
      <div className="relative flex items-center justify-center cursor-pointer select-none">
        {/* Radar beacon pulsing animation */}
        <div className="absolute w-12 h-12 rounded-full bg-blue-500/25 animate-ping" />
        <div className="absolute w-8 h-8 rounded-full bg-blue-500/40" />

        {/* Heading navigation arrow */}
        {position.heading !== undefined && (
          <div
            className="absolute -top-3 w-4 h-4 text-blue-400 transition-transform duration-300"
            style={{ transform: `rotate(${heading}deg)` }}
          >
            <Navigation className="w-4 h-4 fill-blue-500 text-blue-300 drop-shadow" />
          </div>
        )}

        {/* User core badge */}
        <div className="relative z-10 flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 border-2 border-white shadow-lg text-white">
          {renderModeIcon()}
        </div>

        {/* Tiny live accuracy pill */}
        {position.accuracy && position.accuracy < 100 && (
          <div className="absolute -bottom-5 px-1.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-[9px] font-medium text-slate-300 shadow whitespace-nowrap">
            GPS ±{Math.round(position.accuracy)}m
          </div>
        )}
      </div>
    </AdvancedMarker>
  );
};
