import { create } from 'zustand';
import { apiClient } from '@/lib/api/client';

interface WishlistState {
  ids: string[];
  loaded: boolean;
  fetch: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isSaved: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: [],
  loaded: false,

  fetch: async () => {
    try {
      const res = await apiClient.get('/products/wishlist');
      const list = res.data?.data || res.data || [];
      const ids = Array.isArray(list)
        ? list.map((p: any) => p.product?.id || p.productId || p._id || p.id)
        : [];
      set({ ids, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  toggle: async (productId) => {
    const exists = get().ids.includes(productId);
    set({ ids: exists ? get().ids.filter(id => id !== productId) : [...get().ids, productId] });
    try {
      if (exists) {
        await apiClient.delete(`/products/wishlist/${productId}`);
      } else {
        await apiClient.post(`/products/wishlist/${productId}`, {});
      }
    } catch {
      set({ ids: exists ? [...get().ids, productId] : get().ids.filter(id => id !== productId) });
    }
  },

  isSaved: (productId) => get().ids.includes(productId),
}));
