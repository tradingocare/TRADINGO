import type { ProductDraftVariant, VariantType } from './types';

export function generateVariantMatrix(
  types: VariantType[],
  values: Record<VariantType, string[]>,
): Record<VariantType, string>[] {
  if (types.length === 0) return [];

  const result: Record<VariantType, string>[] = [];

  function cartesian(index: number, current: Record<VariantType, string>): void {
    if (index === types.length) {
      result.push({ ...current });
      return;
    }

    const type = types[index];
    const typeValues = values[type] || [];
    for (const val of typeValues) {
      current[type] = val;
      cartesian(index + 1, current);
    }
  }

  cartesian(0, {} as Record<VariantType, string>);
  return result;
}

export function mergeVariants(
  existing: ProductDraftVariant[],
  generated: Record<VariantType, string>[],
  basePrice?: number,
): Omit<ProductDraftVariant, 'id' | 'draftId'>[] {
  const lookup = new Map<string, ProductDraftVariant>();

  for (const variant of existing) {
    const key = `${variant.variantType}:${variant.value}`;
    lookup.set(key, variant);
  }

  return generated.map((combo) => {
    const entry = Object.entries(combo);
    const variantType = entry[0]?.[0] as VariantType;
    const value = entry[0]?.[1] || '';
    const key = `${variantType}:${value}`;
    const existingVariant = lookup.get(key);

    return {
      variantType,
      value,
      customName: existingVariant?.customName,
      sku: existingVariant?.sku || '',
      price: existingVariant?.price ?? basePrice ?? 0,
      compareAtPrice: existingVariant?.compareAtPrice,
      currency: existingVariant?.currency || 'INR',
      quantity: existingVariant?.quantity ?? 0,
      isActive: existingVariant?.isActive ?? true,
      sortOrder: existingVariant?.sortOrder ?? 0,
    };
  });
}

export function calculateVariantPrice(
  basePrice: number,
  modifier: { type?: 'fixed' | 'percentage'; value?: number } | undefined,
): number {
  if (!modifier || modifier.value === undefined || modifier.value === null) {
    return basePrice;
  }

  if (modifier.type === 'percentage') {
    return Math.round(basePrice * (1 + modifier.value / 100) * 100) / 100;
  }

  return Math.round((basePrice + modifier.value) * 100) / 100;
}

export function generateSku(
  prefix: string,
  variant: Record<string, string>,
  index: number,
): string {
  const parts = [prefix.toUpperCase()];
  const orderedKeys = Object.keys(variant);
  for (const key of orderedKeys) {
    const val = variant[key]
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    if (val) parts.push(val);
  }
  parts.push(String(index + 1).padStart(3, '0'));
  return parts.join('-');
}

export function getVariantDisplayName(
  variant: ProductDraftVariant | Record<VariantType, string>,
): string {
  const entries = Object.entries(variant).filter(
    ([key]) => key !== 'id' && key !== 'draftId' && key !== 'sku' && key !== 'price' && key !== 'compareAtPrice' && key !== 'currency' && key !== 'quantity' && key !== 'isActive' && key !== 'sortOrder' && key !== 'customName',
  );

  return entries
    .map(([, val]) => String(val))
    .join(', ');
}

export function groupVariantsByType(
  variants: ProductDraftVariant[],
): Record<VariantType, ProductDraftVariant[]> {
  const grouped: Record<string, ProductDraftVariant[]> = {};

  for (const variant of variants) {
    const key = variant.variantType;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(variant);
  }

  return grouped as Record<VariantType, ProductDraftVariant[]>;
}
