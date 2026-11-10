import React, { useEffect, useRef, useState } from 'react';
import { Landmark } from '../types/tour';
import { X, Eye, Glasses, RotateCcw, MapPin, Sparkles, Navigation } from 'lucide-react';

interface StreetViewVRModalProps {
  landmark: Landmark;
  apiKey: string;
  isDark: boolean;
  onClose: () => void;
}

export const StreetViewVRModal: React.FC<StreetViewVRModalProps> = ({
  landmark,
  apiKey,
  isDark,
  onClose,
}) => {
  const panoRef = useRef<HTMLDivElement>(null);
  const [isVrMode, setIsVrMode] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');
  const [heading, setHeading] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(0);
  const panoInstanceRef = useRef<google.maps.StreetViewPanorama | null>(null);

  useEffect(() => {
    if (!window.google || !window.google.maps) {
      setLoadingStatus('unavailable');
      return;
    }

    const sv = new google.maps.StreetViewService();
    const point = { lat: landmark.lat, lng: landmark.lng };

    sv.getPanorama({ location: point, radius: 100 }, (data, status) => {
      if (status === 'OK' && data && data.location && panoRef.current) {
        setLoadingStatus('available');
        const panorama = new google.maps.StreetViewPanorama(panoRef.current, {
          position: data.location.latLng,
          pov: { heading: 165, pitch: 0 },
          zoomControl: true,
          addressControl: true,
          fullscreenControl: false,
          enableCloseButton: false,
          linksControl: true,
        });

        panorama.addListener('pov_changed', () => {
          const pov = panorama.getPov();
          if (pov) {
            setHeading(Math.round(pov.heading));
            setPitch(Math.round(pov.pitch));
          }
        });

        panoInstanceRef.current = panorama;
      } else {
        setLoadingStatus('unavailable');
      }
    });
  }, [landmark.lat, landmark.lng]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className={`relative w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Top Header Bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-100'
        } backdrop-blur-md z-10`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                {landmark.name}
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {isVrMode ? 'VR Headset Mode' : 'Street View 360°'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                {landmark.address || `${landmark.lat.toFixed(4)}, ${landmark.lng.toFixed(4)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* VR Mode Toggle Button */}
            <button
              type="button"
              onClick={() => setIsVrMode(!isVrMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
                isVrMode
                  ? 'bg-rose-600 text-white shadow-rose-500/30 ring-2 ring-rose-400'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Glasses className="w-4 h-4" />
              <span>{isVrMode ? 'Exit VR View' : 'VR Cardboard Mode'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="Close Street View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-slate-950 flex">
          {loadingStatus === 'checking' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/90 z-20 text-slate-300">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Checking Street View panorama availability...</p>
            </div>
          )}

          {loadingStatus === 'unavailable' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/95 z-20 text-center p-6 text-slate-300">
              <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Street View Not Directly Available Here</h3>
              <p className="text-sm text-slate-400 max-w-md">
                Google Street View coverage is not mapped directly at these exact coordinates ({landmark.lat.toFixed(4)}, {landmark.lng.toFixed(4)}). You can still explore the photo gallery or use the map to explore nearby streets.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                Back to Landmark Details
              </button>
            </div>
          )}

          {/* Normal vs VR Split Screen Mode */}
          {isVrMode ? (
            <div className="w-full h-full flex divide-x divide-slate-800">
              {/* Left Eye */}
              <div className="relative w-1/2 h-full overflow-hidden border-r border-slate-700">
                <div ref={panoRef} className="w-full h-full" />
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white font-mono pointer-events-none">
                  VR LEFT EYE • {heading}° HDG
                </div>
              </div>
              {/* Right Eye */}
              <div className="relative w-1/2 h-full overflow-hidden">
                <div className="absolute inset-0 pointer-events-none z-10" />
                {/* Clone or duplicate viewer for right eye */}
                <div id="vr-right-eye-clone" className="w-full h-full filter saturate-105" />
              </div>
            </div>
          ) : (
            <div ref={panoRef} className="w-full h-full" />
          )}

          {/* Floating Compass / POV Overlay */}
          {loadingStatus === 'available' && !isVrMode && (
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/85 backdrop-blur-md text-xs text-white border border-slate-700/60 shadow-xl pointer-events-none">
              <Navigation className="w-4 h-4 text-indigo-400 transform transition-transform" style={{ transform: `rotate(${heading}deg)` }} />
              <div>
                <span className="font-semibold">{heading}°</span> Heading • <span className="font-semibold">{pitch}°</span> Pitch
              </div>
            </div>
          )}
        </div>

        {/* Footer instructions for VR Mode */}
        {isVrMode && (
          <div className="bg-slate-950 px-6 py-2.5 text-center text-xs text-slate-400 border-t border-slate-800 flex items-center justify-center gap-2">
            <Glasses className="w-4 h-4 text-rose-500" />
            <span>Place your smartphone inside your Google Cardboard or VR headset to experience 360° immersive stereoscopic exploration.</span>
          </div>
        )}
      </div>
    </div>
  );
};
