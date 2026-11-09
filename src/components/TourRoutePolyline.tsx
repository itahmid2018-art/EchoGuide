import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface TourRoutePolylineProps {
  path: { lat: number; lng: number }[];
  visitedTrail?: { lat: number; lng: number }[];
}

export const TourRoutePolyline: React.FC<TourRoutePolylineProps> = ({
  path,
  visitedTrail = [],
}) => {
  const map = useMap();
  const routePolylineRef = useRef<google.maps.Polyline | null>(null);
  const trailPolylineRef = useRef<google.maps.Polyline | null>(null);

  // Render planned scenic tour route
  useEffect(() => {
    if (!map) return;

    if (!routePolylineRef.current) {
      routePolylineRef.current = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#6366f1',
        strokeOpacity: 0.5,
        strokeWeight: 4,
        map: map,
      });
    } else {
      routePolylineRef.current.setPath(path);
      routePolylineRef.current.setMap(map);
    }

    return () => {
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }
    };
  }, [map, path]);

  // Render visited trail path
  useEffect(() => {
    if (!map) return;

    if (visitedTrail.length < 2) {
      if (trailPolylineRef.current) trailPolylineRef.current.setMap(null);
      return;
    }

    if (!trailPolylineRef.current) {
      trailPolylineRef.current = new google.maps.Polyline({
        path: visitedTrail,
        geodesic: true,
        strokeColor: '#38bdf8',
        strokeOpacity: 0.85,
        strokeWeight: 5,
        map: map,
      });
    } else {
      trailPolylineRef.current.setPath(visitedTrail);
      trailPolylineRef.current.setMap(map);
    }

    return () => {
      if (trailPolylineRef.current) {
        trailPolylineRef.current.setMap(null);
      }
    };
  }, [map, visitedTrail]);

  return null;
};
