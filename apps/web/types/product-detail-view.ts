export interface ProductDetailViewDocument {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface ProductDetailViewSeller {
  id?: string;
  name: string;
  slug?: string;
  logo?: string;
  website?: string;
  location?: string;
  distance?: string;
  yearsInBusiness?: number;
  verified: boolean;
  elite?: boolean;
  gstVerified?: boolean;
  isoCertified?: boolean;
  trustScore?: number;
  responseRate?: number;
  productsListed?: number;
}

export interface ProductDetailViewStats {
  onTimeDelivery?: string;
  responseRate?: string;
  happyBuyers?: string;
}

export interface ProductDetailViewBreadcrumb {
  label: string;
  href: string;
}

export interface ProductDetailViewStock {
  inStock: boolean;
  statusLabel: string;
  quantity?: number;
}

export interface ProductDetailViewSpec {
  key: string;
  label?: string;
  value: string;
}

export interface ProductDetailViewData {
  id: string;
  productId: string;
  slug: string;
  title: string;
  brand?: string;
  category?: { name: string; slug: string };
  breadcrumb: ProductDetailViewBreadcrumb[];
  images: string[];
  price: number;
  mrp?: number;
  discount?: number;
  unit?: string;
  moq: number;
  leadTime?: string;
  stock: ProductDetailViewStock;
  seller: ProductDetailViewSeller;
  rating?: number;
  reviewCount?: number;
  gocash: { eligible: boolean; earn?: number };
  stats?: ProductDetailViewStats;
  specs?: ProductDetailViewSpec[];
  highlights?: string[];
  documents?: ProductDetailViewDocument[];
  listedDate?: string;
  securePayments?: boolean;
  returnPolicy?: string;
  warranty?: string;
  freeDeliveryAbove?: number;
  supportPhone?: string;
  supportEmail?: string;
}
