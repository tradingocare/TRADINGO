import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareProduct {
  _id: string;
  slug: string;
  title: string;
  images: string[];
  price: number;
  unit: string;
  rating: number;
  reviewCount: number;
  moq: number;
  inStock: boolean;
  seller: {
    businessName: string;
    slug?: string;
    isVerified: boolean;
    trustScore: number;
    city: string;
  };
  deliveryEta?: string;
  stockQty?: number;
  gstInvoiceAvailable?: boolean;
  tradeCreditEligible?: boolean;
  returnPolicy?: string;
}

interface CompareState {
  items: CompareProduct[];
  toggle: (product: CompareProduct) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) => {
        const exists = get().items.some(i => i._id === product._id);
        if (exists) {
          set({ items: get().items.filter(i => i._id !== product._id) });
          return;
        }
        if (get().items.length >= 4) return;
        set({ items: [...get().items, product] });
      },
      remove: (id) => set({ items: get().items.filter(i => i._id !== id) }),
      clear: () => set({ items: [] }),
    }),
    { name: 'tradingo-compare' },
  ),
);
