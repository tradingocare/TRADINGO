export interface ProductDetailMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  url: string;
  title?: string;
}

export interface ProductDetailSpec {
  id: string;
  key: string;
  label?: string;
  value: string;
}

export interface ProductDetailVariant {
  id: string;
  variantType: string;
  value: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  stockStatus?: string;
  quantity?: number;
  isActive: boolean;
}

export interface ProductDetailPriceSlab {
  id: string;
  minQty: number;
  maxQty?: number;
  price: number;
  currency: string;
}

export interface ProductDetailReview {
  id: string;
  rating: number;
  title?: string;
  review?: string;
  userName?: string;
  createdAt: string;
  helpfulCount: number;
}

export interface ProductDetailQa {
  id: string;
  question: string;
  answer?: string;
  askedBy?: string;
  answeredAt?: string;
  createdAt: string;
}

export interface ProductDetailSeller {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  businessType?: string;
  trustScore: number;
  verificationLevel: string;
  city?: string;
  state?: string;
  responseRate?: number;
  responseTime?: string;
  yearsActive?: number;
  ordersFulfilled?: number;
  isGstRegistered?: boolean;
  isTradgoElite?: boolean;
  createdAt: string;
}

export interface ProductDetailRelated {
  id: string;
  name: string;
  slug: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  unit?: string;
  companyName?: string;
  rating?: number;
  reviewCount?: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  brand?: string;
  model?: string;
  sku?: string;
  moq: number;
  unit?: string;
  productType: string;
  status: string;
  isFeatured: boolean;
  isBestseller?: boolean;
  originalPrice?: number;
  viewCount?: number;
  savedCount?: number;
  monthlyOrders?: number;
  videoUrl?: string;
  maxOrderQty?: number;
  deliveryEta?: string;
  freeDeliveryAbove?: number;
  gstInvoiceAvailable?: boolean;
  tradeCreditEligible?: boolean;
  returnPolicy?: string;
  trustScoreSnapshot: number;
  latitude?: number;
  longitude?: number;
  isSampleOrder?: boolean;
  exportSupported?: boolean;
  goCashEligible?: boolean;
  tradgoEligible?: boolean;
  escrowEligible?: boolean;
  media: ProductDetailMedia[];
  specifications: ProductDetailSpec[];
  variants: ProductDetailVariant[];
  priceSlabs: ProductDetailPriceSlab[];
  inventory?: { availableQuantity: number; stockStatus: string };
  company: ProductDetailSeller;
  category?: { id: string; name: string; slug: string };
  createdAt: string;
}
