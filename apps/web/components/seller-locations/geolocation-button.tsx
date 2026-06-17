'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface GeolocationButtonProps {
  onLocationDetected: (lat: number, lng: number) => void;
  disabled?: boolean;
}

export function GeolocationButton({ onLocationDetected, disabled }: GeolocationButtonProps) {
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationDetected(position.coords.latitude, position.coords.longitude);
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location access denied. Please enable it in your browser settings.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case err.TIMEOUT:
            setError('The request to get your location timed out.');
            break;
          default:
            setError('An unknown error occurred.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={detectLocation}
        disabled={disabled || detecting}
        className="inline-flex items-center gap-2 rounded-lg border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface px-3 py-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary disabled:opacity-50 transition-colors"
      >
        {detecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
        {detecting ? 'Detecting...' : 'Use Current Location'}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
