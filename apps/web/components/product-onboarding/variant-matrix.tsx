'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ProductDraftVariant, VariantType } from '@/lib/product-onboarding/types';

const VARIANT_TYPE_OPTIONS: { value: VariantType; label: string }[] = [
  { value: 'COLOR', label: 'Color' },
  { value: 'SIZE', label: 'Size' },
  { value: 'WEIGHT', label: 'Weight' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'GRADE', label: 'Grade' },
  { value: 'THICKNESS', label: 'Thickness' },
  { value: 'LENGTH', label: 'Length' },
  { value: 'WIDTH', label: 'Width' },
  { value: 'HEIGHT', label: 'Height' },
  { value: 'CAPACITY', label: 'Capacity' },
  { value: 'VOLTAGE', label: 'Voltage' },
  { value: 'POWER_RATING', label: 'Power Rating' },
  { value: 'FINISH', label: 'Finish' },
  { value: 'MODEL_NUMBER', label: 'Model Number' },
  { value: 'PACKAGING_TYPE', label: 'Packaging Type' },
  { value: 'CUSTOM', label: 'Custom' },
];

interface VariantMatrixProps {
  variants: ProductDraftVariant[];
  onVariantsChange: (variants: ProductDraftVariant[]) => void;
  basePrice: number;
}

interface VariantGroup {
  type: VariantType;
  customName?: string;
  values: string[];
}

function generateCombinations(groups: VariantGroup[]): Record<string, string>[] {
  if (groups.length === 0) return [];
  const result: Record<string, string>[] = [];
  function backtrack(index: number, current: Record<string, string>) {
    if (index === groups.length) {
      result.push({ ...current });
      return;
    }
    const group = groups[index];
    for (const val of group.values) {
      current[group.customName || group.type] = val;
      backtrack(index + 1, current);
    }
  }
  backtrack(0, {});
  return result;
}

export function VariantMatrix({ variants, onVariantsChange, basePrice }: VariantMatrixProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});

  const groups: VariantGroup[] = [];
  const groupMap = new Map<string, VariantGroup>();

  for (const v of variants) {
    const key = v.customName || v.variantType;
    if (!groupMap.has(key)) {
      const group: VariantGroup = { type: v.variantType, customName: v.customName, values: [] };
      groupMap.set(key, group);
      groups.push(group);
    }
    if (!groupMap.get(key)!.values.includes(v.value)) {
      groupMap.get(key)!.values.push(v.value);
    }
  }

  const combinations = generateCombinations(groups);

  const addGroup = (type: VariantType) => {
    setShowTypeSelector(false);
    const customName = type === 'CUSTOM' ? `Variant ${groups.length + 1}` : undefined;
    const newVariants: ProductDraftVariant[] = [
      ...variants,
      {
        id: '',
        draftId: '',
        variantType: type,
        customName,
        value: '',
        sku: '',
        price: basePrice,
        currency: 'INR',
        quantity: 0,
        isActive: true,
        sortOrder: variants.length,
      },
    ];
    onVariantsChange(newVariants);
  };

  const removeGroup = (groupKey: string) => {
    const remaining = variants.filter((v) => (v.customName || v.variantType) !== groupKey);
    onVariantsChange(remaining);
  };

  const addValueToGroup = (groupKey: string) => {
    const input = newValueInputs[groupKey]?.trim();
    if (!input) return;
    const group = groupMap.get(groupKey);
    if (!group) return;
    if (group.values.includes(input)) return;

    const newVariants = variants.map((v) => ({ ...v }));
    const newVariant: ProductDraftVariant = {
      id: '',
      draftId: '',
      variantType: group.type,
      customName: group.customName,
      value: input,
      sku: '',
      price: basePrice,
      currency: 'INR',
      quantity: 0,
      isActive: true,
      sortOrder: newVariants.length,
    };
    newVariants.push(newVariant);
    onVariantsChange(newVariants);
    setNewValueInputs((prev) => ({ ...prev, [groupKey]: '' }));
  };

  const removeValueFromGroup = (groupKey: string, value: string) => {
    const remaining = variants.filter(
      (v) => !((v.customName || v.variantType) === groupKey && v.value === value),
    );
    onVariantsChange(remaining);
  };

  const updateVariant = (variantIndex: number, key: keyof ProductDraftVariant, val: any) => {
    const updated = variants.map((v, i) => (i === variantIndex ? { ...v, [key]: val } : v));
    onVariantsChange(updated);
  };

  const groupLabel = (g: VariantGroup) => g.customName || g.type.charAt(0) + g.type.slice(1).toLowerCase().replace(/_/g, ' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {groups.map((group) => (
          <div
            key={group.customName || group.type}
            className="rounded-lg border border-border bg-surface p-3 dark:border-dark-border dark:bg-dark-surface"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                {groupLabel(group)}
              </span>
              <button
                type="button"
                onClick={() => removeGroup(group.customName || group.type)}
                className="rounded p-0.5 text-text-tertiary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.values.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 rounded-md bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-500/20 dark:text-primary-300"
                >
                  {val}
                  <button
                    type="button"
                    onClick={() => removeValueFromGroup(group.customName || group.type, val)}
                    className="rounded-full p-0.5 hover:bg-primary-500/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-1">
              <Input
                type="text"
                placeholder="Add value..."
                value={newValueInputs[group.customName || group.type] || ''}
                onChange={(e) =>
                  setNewValueInputs((prev) => ({ ...prev, [group.customName || group.type]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addValueToGroup(group.customName || group.type);
                  }
                }}
                className="h-7 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 px-2"
                onClick={() => addValueToGroup(group.customName || group.type)}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}

        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTypeSelector(!showTypeSelector)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Variant Type
          </Button>
          {showTypeSelector && (
            <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-surface p-1 shadow-lg dark:border-dark-border dark:bg-dark-surface">
              {VARIANT_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => addGroup(opt.value)}
                  className="w-full rounded-md px-3 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {combinations.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-secondary dark:border-dark-border dark:bg-dark-surface-secondary">
                {groups.map((group) => (
                  <th
                    key={group.customName || group.type}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary"
                  >
                    {groupLabel(group)}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                  SKU
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                  Price (INR)
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
                  Qty
                </th>
              </tr>
            </thead>
            <tbody>
              {combinations.map((combo, _idx) => {
                const matchIndex = variants.findIndex((v) =>
                  Object.entries(combo).every(([k, val]) => {
                    const groupKey = v.customName || v.variantType;
                    return groupKey === k && v.value === val;
                  }),
                );
                const variant = matchIndex >= 0 ? variants[matchIndex] : null;
                const rowKey = Object.values(combo).join('-');

                return (
                  <tr
                    key={rowKey}
                    className={cn(
                      'border-b border-border transition-colors last:border-b-0 hover:bg-surface-secondary/50 dark:border-dark-border dark:hover:bg-dark-surface-secondary/50',
                    )}
                  >
                    {groups.map((group) => (
                      <td
                        key={group.customName || group.type}
                        className="whitespace-nowrap px-4 py-3 text-sm text-text-primary dark:text-dark-text-primary"
                      >
                        {combo[group.customName || group.type]}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <Input
                        type="text"
                        value={variant?.sku || ''}
                        onChange={(e) => {
                          if (matchIndex >= 0) {
                            updateVariant(matchIndex, 'sku', e.target.value);
                          }
                        }}
                        placeholder="SKU"
                        className="h-8 w-28 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={variant?.price ?? basePrice}
                        onChange={(e) => {
                          if (matchIndex >= 0) {
                            updateVariant(matchIndex, 'price', Number(e.target.value));
                          }
                        }}
                        placeholder={String(basePrice)}
                        className="h-8 w-24 text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={variant?.quantity ?? 0}
                        onChange={(e) => {
                          if (matchIndex >= 0) {
                            updateVariant(matchIndex, 'quantity', Number(e.target.value));
                          }
                        }}
                        placeholder="0"
                        className="h-8 w-20 text-xs"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {groups.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-secondary p-10 text-center dark:border-dark-border dark:bg-dark-surface-secondary">
          <p className="text-sm text-text-tertiary">
            No variant types added yet. Click "Add Variant Type" to create product variations.
          </p>
        </div>
      )}
    </div>
  );
}
