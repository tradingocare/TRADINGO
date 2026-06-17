'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GeographicReach } from '@prisma/client';
import { GeolocationButton } from './geolocation-button';
import { RadiusSelector } from './radius-selector';
import { AddressSearchInput } from './address-search-input';

interface LocationFormProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialRadius?: GeographicReach | null;
  onSave: (data: { latitude: number; longitude: number; visibilityRadius?: GeographicReach }) => Promise<void>;
  onCopyFromCompany?: () => Promise<{ latitude: number | null; longitude: number | null } | null>;
  saving?: boolean;
}

export function LocationForm({
  initialLatitude,
  initialLongitude,
  initialRadius,
  onSave,
  onCopyFromCompany,
  saving,
}: LocationFormProps) {
  const [latitude, setLatitude] = useState(initialLatitude?.toString() || '');
  const [longitude, setLongitude] = useState(initialLongitude?.toString() || '');
  const [radius, setRadius] = useState<GeographicReach>(initialRadius || 'LOCAL');
  const [dirty, setDirty] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedFromCompany, setCopiedFromCompany] = useState(false);

  useEffect(() => {
    setLatitude(initialLatitude?.toString() || '');
    setLongitude(initialLongitude?.toString() || '');
    setRadius(initialRadius || 'LOCAL');
  }, [initialLatitude, initialLongitude, initialRadius]);

  const handleLatChange = useCallback((val: string) => {
    setLatitude(val);
    setDirty(true);
    setValidationError(null);
  }, []);

  const handleLngChange = useCallback((val: string) => {
    setLongitude(val);
    setDirty(true);
    setValidationError(null);
  }, []);

  const handleRadiusChange = useCallback((val: GeographicReach) => {
    setRadius(val);
    setDirty(true);
  }, []);

  const handleGeoDetect = useCallback((lat: number, lng: number) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setDirty(true);
    setValidationError(null);
  }, []);

  const handleAddressSelect = useCallback((lat: number, lng: number, _label: string) => {
    setLatitude(lat.toFixed(6));
    setLongitude(lng.toFixed(6));
    setDirty(true);
    setValidationError(null);
  }, []);

  const handleCopyFromCompany = async () => {
    if (!onCopyFromCompany) return;
    const addr = await onCopyFromCompany();
    if (addr && addr.latitude && addr.longitude) {
      setLatitude(addr.latitude.toFixed(6));
      setLongitude(addr.longitude.toFixed(6));
      setDirty(true);
      setCopiedFromCompany(true);
      setValidationError(null);
      setTimeout(() => setCopiedFromCompany(false), 3000);
    }
  };

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

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSave({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      visibilityRadius: radius,
    });
    setDirty(false);
  };

  const hasCoordinates = latitude !== '' && longitude !== '';

  return (
    <div className="space-y-5">
      <AddressSearchInput onSelectLocation={handleAddressSelect} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
            Latitude
          </label>
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => handleLatChange(e.target.value)}
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
            onChange={(e) => handleLngChange(e.target.value)}
            placeholder="e.g. 72.8777"
            className="w-full rounded-lg border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface px-3 py-2 text-sm text-text-primary dark:text-dark-text-primary placeholder:text-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <GeolocationButton onLocationDetected={handleGeoDetect} />
        {onCopyFromCompany && (
          <button
            type="button"
            onClick={handleCopyFromCompany}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface px-3 py-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary transition-colors"
          >
            Copy from Company Address
          </button>
        )}
        {copiedFromCompany && (
          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
            Copied!
          </span>
        )}
      </div>

      <RadiusSelector value={radius} onChange={handleRadiusChange} />

      {hasCoordinates && (
        <div className="rounded-lg bg-surface-secondary dark:bg-dark-surface-secondary p-3 text-sm text-text-secondary dark:text-dark-text-secondary">
          <span className="font-medium">Preview:</span>{' '}
          {latitude}, {longitude}
          {radius && ` \u00B7 ${radius}`}
        </div>
      )}

      {validationError && (
        <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={saving || !dirty}
        className="w-full sm:w-auto rounded-lg bg-primary dark:bg-primary-dark px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {saving ? 'Saving...' : 'Save Location'}
      </button>
    </div>
  );
}
