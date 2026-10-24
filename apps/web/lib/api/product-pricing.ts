import { apiClient } from './client';

export interface ProductPricingSlab {
  id: string;
  minQty: number;
  maxQty: number | null;
  /** Authoritative unit price, fixed 2-decimal string. */
  price: string;
  currency: string;
}

export interface ProductPricingResult {
  productId: string;
  productSlug: string | null;
  moq: number;
  purchasable: boolean;
  quantity: number;
  /** Authoritative unit price (2dp string); null when not purchasable. */
  unitPrice: string | null;
  /** unitPrice × quantity (2dp string); null when not purchasable. */
  subtotal: string | null;
  currency: string;
  slab: ProductPricingSlab | null;
  /** Display price at the first slab (MOQ) — UI only, never transactional. */
  displayPrice: string | null;
  reason: string;
  /** Human-readable explanation of the outcome (safe to show to buyers). */
  message: string;
}

/**
 * R1 — server-authoritative pricing. Sends ONLY the product id and
 * the requested quantity; the unit price and subtotal are always
 * computed server-side from the persisted price slabs. There is no
 * parameter through which a client can supply or override a price.
 */
export async function getProductPricing(productId: string, qty: number): Promise<ProductPricingResult> {
  const res = await apiClient.get(`/products/${productId}/pricing?qty=${encodeURIComponent(String(qty))}`);
  return (res as any).data?.data || (res as any).data;
}
