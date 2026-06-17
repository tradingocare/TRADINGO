'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface AddressSearchResult {
  displayName: string;
  lat: string;
  lon: string;
}

interface AddressSearchInputProps {
  onSelectLocation: (lat: number, lng: number, label: string) => void;
  disabled?: boolean;
}

export function AddressSearchInput({ onSelectLocation, disabled }: AddressSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchAddress = useCallback(async (q: string) => {
    if (!q || q.length < 3) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = await res.json();
      setResults(
        (data || []).map((item: any) => ({
          displayName: item.display_name,
          lat: item.lat,
          lon: item.lon,
        })),
      );
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  return (
    <div className="relative space-y-1">
      <label className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
        Search Location
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            const timer = setTimeout(() => searchAddress(e.target.value), 400);
            return () => clearTimeout(timer);
          }}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search city, pincode, or address..."
          disabled={disabled}
          className="w-full rounded-lg border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface px-9 py-2 text-sm text-text-primary dark:text-dark-text-primary placeholder:text-text-tertiary dark:placeholder:text-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary-dark disabled:opacity-50"
        />
        {searching ? (
          <Loader2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary dark:text-dark-text-tertiary animate-spin" />
        ) : (
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary dark:text-dark-text-tertiary" />
        )}
      </div>
      {showResults && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 rounded-lg border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface shadow-lg max-h-48 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              type="button"
              onMouseDown={() => {
                onSelectLocation(parseFloat(result.lat), parseFloat(result.lon), result.displayName);
                setQuery(result.displayName.split(',')[0]);
                setShowResults(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-text-primary dark:text-dark-text-primary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary border-b border-surface-border dark:border-dark-border last:border-0"
            >
              <span className="line-clamp-2">{result.displayName}</span>
              <span className="text-xs text-text-tertiary dark:text-dark-text-tertiary mt-0.5">
                {result.lat}, {result.lon}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
