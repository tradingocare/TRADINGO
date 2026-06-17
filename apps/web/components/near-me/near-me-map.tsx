'use client';

import dynamic from 'next/dynamic';
import { MapSkeleton } from './map-skeleton';
import { MapToolbar } from './map-toolbar';
import { MapLegend } from './map-legend';
import type { NearMeProduct } from '@/lib/api/near-me';

const MapView = dynamic(() => import('./map-view').then((m) => m.MapView), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface NearMeMapProps {
  center: { lat: number; lng: number };
  radiusKm: number;
  products: NearMeProduct[];
  onLocateMe: () => void;
  geoStatus: 'idle' | 'loading' | 'done' | 'error';
  geoLoading: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  className?: string;
}

export function NearMeMap({
  center,
  radiusKm,
  products,
  onLocateMe,
  geoStatus,
  geoLoading,
  isFullscreen,
  onToggleFullscreen,
  onCenterChange,
  className,
}: NearMeMapProps) {
  const verifiedCount = products.filter((p) => p.isVerified).length;

  return (
    <div className={`relative h-full w-full min-h-[300px] ${className || ''}`} role="region" aria-label="Map view">
      <MapView
        center={center}
        radiusKm={radiusKm}
        products={products}
        onCenterChange={onCenterChange}
      />

      <MapToolbar
        onLocateMe={onLocateMe}
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
        geoLoading={geoLoading}
        geoStatus={geoStatus}
      />

      <MapLegend
        productCount={products.length}
        verifiedCount={verifiedCount}
        radiusKm={radiusKm}
      />
    </div>
  );
}
