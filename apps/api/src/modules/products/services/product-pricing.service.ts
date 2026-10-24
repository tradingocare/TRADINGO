import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * R1 — server-authoritative product pricing.
 *
 * Slab rule (P0 remediation audit, frozen):
 *   A slab matches a requested quantity when `minQty <= quantity` AND
 *   (`maxQty` is null OR `quantity <= maxQty`) — both bounds inclusive.
 *   Among matching slabs the one with the LARGEST `minQty` wins (the
 *   volume tier the buyer has actually reached).
 *   Deterministic tie-break (only reachable with data that bypassed
 *   write-time validation, which rejects overlap between bounded slabs):
 *   the tighter `maxQty` wins (null = unbounded), then the earliest
 *   slab in stored order.
 *   No matching slab => the product is NOT purchasable at that quantity.
 *   There is never a fallback price — no ₹0, no base price.
 *   `Product.originalPrice` is display-only and is never transactional.
 */

export type ProductPricingReason =
  | 'OK'
  | 'PRODUCT_NOT_FOUND'
  | 'INVALID_QUANTITY'
  | 'NO_SLABS'
  | 'QUANTITY_BELOW_FIRST_SLAB'
  | 'QUANTITY_ABOVE_FINAL_SLAB'
  | 'QUANTITY_BETWEEN_SLABS'
  | 'NO_MATCHING_SLAB';

export interface ProductPricingSlab {
  id: string;
  minQty: number;
  maxQty: number | null;
  /** Authoritative unit price, fixed 2-decimal string (Prisma Decimal(12,2)). */
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
  reason: ProductPricingReason;
  /** Human-readable explanation of the outcome (safe to show to buyers). */
  message: string;
}

type PricingSlabRow = {
  id: string;
  minQty: number;
  maxQty: number | null;
  price: Prisma.Decimal;
  currency: string;
};

/**
 * Pure slab selector — exported for deterministic testing.
 * Returns the matching slab with the largest `minQty`, or null when no
 * slab's inclusive range contains the requested quantity.
 */
export function selectSlabForQuantity(
  slabs: readonly PricingSlabRow[],
  quantity: number,
): PricingSlabRow | null {
  let best: PricingSlabRow | null = null;
  for (const slab of slabs) {
    if (slab.minQty > quantity) continue;
    if (slab.maxQty != null && quantity > slab.maxQty) continue;
    if (best == null) {
      best = slab;
      continue;
    }
    if (slab.minQty > best.minQty) {
      best = slab;
    } else if (slab.minQty === best.minQty) {
      const bestBound = best.maxQty ?? Number.POSITIVE_INFINITY;
      const slabBound = slab.maxQty ?? Number.POSITIVE_INFINITY;
      if (slabBound < bestBound) best = slab;
    }
  }
  return best;
}

@Injectable()
export class ProductPricingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve the authoritative price for a product at a requested quantity.
   * The ONLY inputs are the product id and the quantity — a price can never
   * be supplied or overridden by a client (no such parameter exists on this
   * path). All money arithmetic uses Prisma.Decimal (decimal.js) so no
   * floating-point rounding is introduced.
   */
  async resolvePricing(productId: string, quantity: number): Promise<ProductPricingResult> {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null, status: 'ACTIVE' },
      select: {
        id: true,
        slug: true,
        moq: true,
        priceSlabs: { orderBy: { minQty: 'asc' } },
      },
    });

    if (!product) {
      return {
        productId,
        productSlug: null,
        moq: 0,
        purchasable: false,
        quantity,
        unitPrice: null,
        subtotal: null,
        currency: 'INR',
        slab: null,
        displayPrice: null,
        reason: 'PRODUCT_NOT_FOUND',
        message: 'Product not found.',
      };
    }

    const slabs = product.priceSlabs as unknown as PricingSlabRow[];

    if (!Number.isInteger(quantity) || !Number.isFinite(quantity) || quantity < 1) {
      return {
        productId,
        productSlug: product.slug,
        moq: product.moq,
        purchasable: false,
        quantity,
        unitPrice: null,
        subtotal: null,
        currency: slabs.length > 0 ? slabs[0].currency : 'INR',
        slab: null,
        displayPrice: slabs.length > 0 ? this.toFixed2(slabs[0].price) : null,
        reason: 'INVALID_QUANTITY',
        message: 'Quantity must be a positive whole number.',
      };
    }

    if (slabs.length === 0) {
      return {
        productId,
        productSlug: product.slug,
        moq: product.moq,
        purchasable: false,
        quantity,
        unitPrice: null,
        subtotal: null,
        currency: 'INR',
        slab: null,
        displayPrice: null,
        reason: 'NO_SLABS',
        message: 'This product has no pricing slabs and cannot be purchased.',
      };
    }

    // From here the slab list is non-empty: the first slab
    // (minQty ascending) is the MOQ tier used for display.
    const firstSlab = slabs[0];

    const winning = selectSlabForQuantity(slabs, quantity);

    if (!winning) {
      const sorted = [...slabs].sort((a, b) => a.minQty - b.minQty);
      const firstMinQty = sorted[0].minQty;
      const lastSlab = sorted[sorted.length - 1];
      let reason: ProductPricingReason;
      let message: string;
      if (quantity < firstMinQty) {
        reason = 'QUANTITY_BELOW_FIRST_SLAB';
        message = `Quantity is below the minimum price-tier quantity of ${firstMinQty}.`;
      } else if (lastSlab.maxQty != null && quantity > lastSlab.maxQty) {
        reason = 'QUANTITY_ABOVE_FINAL_SLAB';
        message = `Quantity exceeds the maximum price-tier quantity of ${lastSlab.maxQty}.`;
      } else {
        reason = 'QUANTITY_BETWEEN_SLABS';
        message = `No price tier covers quantity ${quantity}.`;
      }
      return {
        productId,
        productSlug: product.slug,
        moq: product.moq,
        purchasable: false,
        quantity,
        unitPrice: null,
        subtotal: null,
        currency: firstSlab.currency,
        slab: null,
        displayPrice: this.toFixed2(firstSlab.price),
        reason,
        message,
      };
    }

    const unitPrice = winning.price;
    const subtotal = unitPrice.times(quantity);
    return {
      productId,
      productSlug: product.slug,
      moq: product.moq,
      purchasable: true,
      quantity,
      unitPrice: this.toFixed2(unitPrice),
      subtotal: this.toFixed2(subtotal),
      currency: winning.currency,
      slab: {
        id: winning.id,
        minQty: winning.minQty,
        maxQty: winning.maxQty,
        price: winning.price.toFixed(2),
        currency: winning.currency,
      },
      displayPrice: this.toFixed2(firstSlab.price),
      reason: 'OK',
      message: `Authoritative price resolved for ${quantity} unit${quantity === 1 ? '' : 's'}.`,
    };
  }

  private toFixed2(value: Prisma.Decimal | null): string | null {
    if (value == null) return null;
    return value.toFixed(2);
  }
}
