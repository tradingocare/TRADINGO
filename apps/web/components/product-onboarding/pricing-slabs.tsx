'use client';

import { useState } from 'react';
import { Plus, Trash2, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import type { ProductDraftPriceSlab } from '@/lib/product-onboarding/types';

interface PricingSlabsProps {
  slabs: ProductDraftPriceSlab[];
  onSlabsChange: (slabs: ProductDraftPriceSlab[]) => void;
  moq: number;
  onMoqChange: (moq: number) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
}

function validateSlabOverlap(slabs: ProductDraftPriceSlab[]): string | null {
  const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.maxQty === undefined || prev.maxQty === null) {
      return `Slab ${i}: previous slab has no max, cannot add more slabs.`;
    }
    if (curr.minQty <= prev.maxQty) {
      return `Slab ${i + 1}: min qty (${curr.minQty}) overlaps with previous max qty (${prev.maxQty}).`;
    }
    if (curr.minQty > prev.maxQty + 1) {
      return `Slab ${i + 1}: gap between slabs - previous max is ${prev.maxQty}, this min is ${curr.minQty}.`;
    }
  }
  return null;
}

export function PricingSlabs({
  slabs,
  onSlabsChange,
  moq,
  onMoqChange,
  unit,
  onUnitChange,
}: PricingSlabsProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const addSlab = () => {
    const lastMax = slabs.length > 0 ? Math.max(...slabs.map((s) => s.maxQty || s.minQty)) : 0;
    const newSlab: ProductDraftPriceSlab = {
      id: '',
      draftId: '',
      minQty: lastMax + 1,
      maxQty: lastMax + 100,
      price: 0,
      currency: 'INR',
    };
    const updated = [...slabs, newSlab];
    const err = validateSlabOverlap(updated);
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError(null);
    onSlabsChange(updated);
  };

  const updateSlab = (index: number, field: keyof ProductDraftPriceSlab, value: any) => {
    const updated = slabs.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    const err = validateSlabOverlap(updated);
    if (err) {
      setValidationError(err);
    } else {
      setValidationError(null);
    }
    onSlabsChange(updated);
  };

  const removeSlab = (index: number) => {
    onSlabsChange(slabs.filter((_, i) => i !== index));
    setValidationError(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="moq">Minimum Order Quantity (MOQ)</Label>
          <Input
            id="moq"
            type="number"
            min={1}
            value={moq || ''}
            onChange={(e) => onMoqChange(Number(e.target.value))}
            placeholder="e.g. 10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            type="text"
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            placeholder="e.g. Pieces, Kg, Meters"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Bulk Pricing Slabs</Label>
        <p className="text-xs text-text-tertiary">
          Define volume-based pricing. Slabs must be contiguous without gaps or overlaps.
        </p>
      </div>

      {validationError && (
        <Alert variant="error">
          {validationError}
        </Alert>
      )}

      <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border">
        <Table>
          <THead>
            <TR className="border-b border-border bg-surface-secondary dark:border-dark-border dark:bg-dark-surface-secondary">
              <TH>Min Qty</TH>
              <TH>Max Qty</TH>
              <TH>Price (INR)</TH>
              <TH className="text-right">Action</TH>
            </TR>
          </THead>
          <TBody>
            {slabs.map((slab, index) => (
              <TR
                key={slab.id || index}
                className="border-b border-border transition-colors hover:bg-surface-secondary/50 last:border-b-0 dark:border-dark-border dark:hover:bg-dark-surface-secondary/50"
              >
                <TD>
                  <Input
                    type="number"
                    min={1}
                    value={slab.minQty}
                    onChange={(e) => updateSlab(index, 'minQty', Number(e.target.value))}
                    className="h-8 w-20 text-xs"
                  />
                </TD>
                <TD>
                  <Input
                    type="number"
                    min={slab.minQty + 1 || 1}
                    value={slab.maxQty ?? ''}
                    onChange={(e) =>
                      updateSlab(index, 'maxQty', e.target.value === '' ? undefined : Number(e.target.value))
                    }
                    placeholder="∞"
                    className="h-8 w-20 text-xs"
                  />
                </TD>
                <TD>
                  <div className="relative">
                    <IndianRupee className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={slab.price}
                      onChange={(e) => updateSlab(index, 'price', Number(e.target.value))}
                      className="h-8 w-28 pl-7 text-xs"
                    />
                  </div>
                </TD>
                <TD className="text-right">
                  <button
                    type="button"
                    onClick={() => removeSlab(index)}
                    className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TD>
              </TR>
            ))}
            {slabs.length === 0 && (
              <TR>
                <TD colSpan={4} className="text-center text-sm text-text-tertiary">No pricing slabs defined.</TD>
              </TR>
            )}
          </TBody>
        </Table>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addSlab}>
        <Plus className="mr-1 h-4 w-4" />
        Add Slab
      </Button>
    </div>
  );
}
