'use client';

import { useState, useCallback } from 'react';
import { X, Loader2, MapPin } from 'lucide-react';
import type { GeographicReach } from '@prisma/client';
import { GeolocationButton } from './geolocation-button';
import { RadiusSelector } from './radius-selector';

interface BulkLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: { latitude: number; longitude: number; visibilityRadius?: GeographicReach }) => Promise<void>;
  productCount: number;
}

export function BulkLocationModal({ isOpen, onClose, onApply, productCount }: BulkLocationModalProps) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState<GeographicReach>('LOCAL');
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleGeoDetect = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setValidationError(null);
  }, []);

  const validate = (): boolean => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      setValidationError('Please enter valid latitude and longitude values');
      return false;
    }
    if (lat < -90 || lat > 90) {
      setValidationError('Latitude must be between -90 and 90');
      return false;
    }
    if (lng < -180 || lng > 180) {
      setValidationError('Longitude must be between -180 and 180');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleApply = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onApply({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        visibilityRadius: radius,
      });
      onClose();
    } catch {
      setValidationError('Failed to apply locations. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg mx-4 rounded-xl bg-surface dark:bg-dark-surface shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border dark:border-dark-border">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary dark:text-primary-dark" />
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
              Bulk Set Location
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-tertiary dark:text-dark-text-tertiary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
            Set the same location for <span className="font-semibold">{productCount} product{productCount !== 1 ? 's' : ''}</span>.
          </p>

          <GeolocationButton onLocationDetected={handleGeoDetect} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => { setLatitude(e.target.value); setValidationError(null); }}
                placeholder="e.g. 19.076"
                className="w-full rounded-lg border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface px-3 py-2 text-sm text-text-primary dark:text-dark-text-primary placeholder:text-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => { setLongitude(e.target.value); setValidationError(null); }}
                placeholder="e.g. 72.8777"
                className="w-full rounded-lg border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface px-3 py-2 text-sm text-text-primary dark:text-dark-text-primary placeholder:text-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
              />
            </div>
          </div>

          <RadiusSelector value={radius} onChange={setRadius} />

          {validationError && (
            <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
          )}

          {latitude && longitude && (
            <p className="text-xs text-text-tertiary dark:text-dark-text-tertiary">
              Location: {latitude}, {longitude} &middot; Radius: {radius}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-surface-border dark:border-dark-border bg-surface-secondary dark:bg-dark-surface-secondary rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-surface dark:hover:bg-dark-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={saving || !latitude || !longitude}
            className="inline-flex items-center gap-2 rounded-lg bg-primary dark:bg-primary-dark px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                Apply to {productCount} product{productCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
