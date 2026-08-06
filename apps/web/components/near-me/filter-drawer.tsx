'use client';

import { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer } from '@/components/ui/drawer';


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
          <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-600 text-[10px] text-gray-900">
            !
          </span>
        )}
      </Button>

      <Drawer open={open} onClose={() => setOpen(false)} side="right" title="Filters">
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Price Range (₹)</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => update('minPrice', e.target.value)} className="h-9 text-sm" />
              <span className="text-text-tertiary">-</span>
              <Input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <Separator />
          <div>
            <Label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Min Trust Score</Label>
            <Input type="number" placeholder="e.g. 50" min={0} max={100} value={filters.minTrustScore} onChange={(e) => update('minTrustScore', e.target.value)} className="mt-1.5 h-9 text-sm" />
          </div>
          <Separator />
          <div>
            <Label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Max MOQ</Label>
            <Input type="number" placeholder="e.g. 100" value={filters.maxMoq} onChange={(e) => update('maxMoq', e.target.value)} className="mt-1.5 h-9 text-sm" />
          </div>
          <Separator />
          <div>
            <Label className="text-sm font-medium text-text-primary dark:text-dark-text-primary">Max Delivery Time</Label>
            <Input type="text" placeholder="e.g. 7 days" value={filters.deliveryTime} onChange={(e) => update('deliveryTime', e.target.value)} className="mt-1.5 h-9 text-sm" />
          </div>
          <Separator />
          <div className="space-y-3">
            <Checkbox checked={filters.verifiedOnly} onChange={(e) => update('verifiedOnly', e.target.checked)} label="Verified Sellers Only" />
            <Checkbox checked={filters.tradgoOnly} onChange={(e) => update('tradgoOnly', e.target.checked)} label="TRADGO Badge Only" />
          </div>
        </div>
        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { onReset(); setOpen(false); }}>Reset</Button>
          <Button className="flex-1" onClick={() => setOpen(false)}>Apply Filters</Button>
        </div>
      </Drawer>
    </>
  );
}
