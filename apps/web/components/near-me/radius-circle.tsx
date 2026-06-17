'use client';

import { useEffect, useMemo } from 'react';
import { Circle, useMap } from 'react-leaflet';

interface RadiusCircleProps {
  center: { lat: number; lng: number };
  radiusKm: number;
}

export function RadiusCircle({ center, radiusKm }: RadiusCircleProps) {
  const map = useMap();

  const circleOptions = useMemo(() => ({
    color: '#2563eb',
    fillColor: '#2563eb',
    fillOpacity: 0.06,
    weight: 2,
    opacity: 0.5,
    interactive: false,
  }), []);

  useEffect(() => {
    if (center.lat && center.lng) {
      map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
    }
  }, [center.lat, center.lng, map]);

  return (
    <Circle
      center={[center.lat, center.lng]}
      radius={radiusKm * 1000}
      pathOptions={circleOptions}
      aria-label={`Search radius: ${radiusKm} km`}
    />
  );
}
