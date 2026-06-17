'use client';

import { useMemo, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

import { RadiusCircle } from './radius-circle';
import { MarkerPopup } from './marker-popup';
import { MapSkeleton } from './map-skeleton';
import type { NearMeProduct } from '@/lib/api/near-me';

interface MapViewProps {
  center: { lat: number; lng: number };
  radiusKm: number;
  products: NearMeProduct[];
  onCenterChange?: (center: { lat: number; lng: number }) => void;
  className?: string;
}

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function MapViewInner({ center, radiusKm, products, className }: MapViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const markerIcon = useMemo(() => {
    if (typeof window === 'undefined') return L.divIcon({ className: '' });
    return L.divIcon({
      className: 'custom-product-marker',
      html: `<div style="
        width: 24px; height: 24px;
        background: #2563eb;
        border: 2.5px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.25);
        cursor: pointer;
        transition: transform 0.15s;
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -14],
    });
  }, []);

  const verifiedIcon = useMemo(() => {
    if (typeof window === 'undefined') return L.divIcon({ className: '' });
    return L.divIcon({
      className: 'custom-product-marker-verified',
      html: `<div style="
        width: 26px; height: 26px;
        background: #16a34a;
        border: 2.5px solid #fff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.25);
        cursor: pointer;
      "></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
      popupAnchor: [0, -15],
    });
  }, []);

  if (!mounted) {
    return <MapSkeleton />;
  }

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={10}
      className={`h-full w-full rounded-xl z-0 ${className || ''}`}
      zoomControl={true}
      aria-label="Product discovery map"
    >
      <TileLayer
        url={TILE_URL}
        attribution={TILE_ATTRIBUTION}
      />

      <RadiusCircle center={center} radiusKm={radiusKm} />

      {products.map((product) => (
        <Marker
          key={product.productId}
          position={[product.latitude, product.longitude]}
          icon={product.isVerified ? verifiedIcon : markerIcon}
          aria-label={`${product.name} - ${product.companyName}`}
        >
          <Popup maxWidth={300} minWidth={220} closeButton={true}>
            <MarkerPopup product={product} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export function MapView(props: MapViewProps) {
  return <MapViewInner {...props} />;
}
