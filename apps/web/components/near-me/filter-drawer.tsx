'use client';

import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';


export interface FilterState {
  minPrice: string;
  maxPrice: string;
  minTrustScore: string;
  verifiedOnly: boolean;
  tradgoOnly: boolean;
  maxMoq: string;
  deliveryTime: string;
}

interface FilterDrawerProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export function FilterDrawer({ filters, onChange, onReset }: FilterDrawerProps) {
  const [open, setOpen] = useState(false);

  const update = (key: keyof FilterState, value: string | boolean) => {
    onChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '' && v !== false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative"
      >
        <SlidersHorizontal className="mr-1.5 h-4 w-4" />
        Filters
        {hasActiveFilters && (
          <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] text-white">
            !
          </span>
        )}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm animate-slide-up bg-surface p-6 shadow-xl dark:bg-dark-surface">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">Filters</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-text-secondary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Price Range (₹)</Label>
                <div className="mt-1.5 flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => update('minPrice', e.target.value)}
                    className="h-9 text-sm"
                  />
                  <span className="text-text-tertiary">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => update('maxPrice', e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Min Trust Score</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50"
                  min={0}
                  max={100}
                  value={filters.minTrustScore}
                  onChange={(e) => update('minTrustScore', e.target.value)}
                  className="mt-1.5 h-9 text-sm"
                />
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Max MOQ</Label>
                <Input
                  type="number"
                  placeholder="e.g. 100"
                  value={filters.maxMoq}
                  onChange={(e) => update('maxMoq', e.target.value)}
                  className="mt-1.5 h-9 text-sm"
                />
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Max Delivery Time</Label>
                <Input
                  type="text"
                  placeholder="e.g. 7 days"
                  value={filters.deliveryTime}
                  onChange={(e) => update('deliveryTime', e.target.value)}
                  className="mt-1.5 h-9 text-sm"
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <label className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => update('verifiedOnly', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500 dark:border-dark-border"
                  />
                  <span className="text-sm text-text-primary dark:text-dark-text-primary">Verified Sellers Only</span>
                </label>
                <label className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={filters.tradgoOnly}
                    onChange={(e) => update('tradgoOnly', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500 dark:border-dark-border"
                  />
                  <span className="text-sm text-text-primary dark:text-dark-text-primary">TRADGO Badge Only</span>
                </label>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { onReset(); setOpen(false); }}>
                Reset
              </Button>
              <Button className="flex-1" onClick={() => setOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
