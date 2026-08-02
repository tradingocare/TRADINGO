'use client';

import { useState, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
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

  return (
    <Modal open={isOpen} onClose={onClose} title="Bulk Set Location">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
          Set the same location for <span className="font-semibold">{productCount} product{productCount !== 1 ? 's' : ''}</span>.
        </p>

        <GeolocationButton onLocationDetected={handleGeoDetect} />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
              Latitude
            </label>
            <Input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => { setLatitude(e.target.value); setValidationError(null); }}
              placeholder="e.g. 19.076"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
              Longitude
            </label>
            <Input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => { setLongitude(e.target.value); setValidationError(null); }}
              placeholder="e.g. 72.8777"
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

      <div className="flex items-center justify-end gap-3 border-t border-surface-border dark:border-dark-border bg-surface-secondary dark:bg-dark-surface-secondary -mx-6 -mb-6 px-6 py-4 rounded-b-xl mt-4">
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
          className="inline-flex items-center gap-2 rounded-lg bg-primary dark:bg-primary-dark px-4 py-2 text-sm font-medium text-gray-900 hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? (
            <>
              <LoadingSpinner size="sm" color="accent" />
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
    </Modal>
  );
}
