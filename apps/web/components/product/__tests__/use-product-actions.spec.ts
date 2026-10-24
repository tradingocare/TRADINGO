/**
 * R6 — Product Card gated-CTA authentication return context.
 * Unauthenticated gated CTAs must redirect to /login with the intended
 * destination encoded in `next`; authenticated callers execute the action.
 */
import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useProductActions } from '../use-product-actions';
import type { ProductCardModel } from '@/types/product-card';

// Mock state lives inside the jest.mock factory closures so the factories
// (hoisted above imports) never reference outer `const`s before init.
// Tests reach the shared fns via the __accessors + jest.requireMock.
jest.mock('next/navigation', () => {
  const push = jest.fn();
  return {
    useRouter: () => ({ push }),
    __push: () => push,
  };
});

jest.mock('@/store/auth-store', () => {
  let user: { id: string; role: string } | null = null;
  return {
    useAuthStore: () => ({ user }),
    __setUser: (value: { id: string; role: string } | null) => {
      user = value;
    },
  };
});

jest.mock('@/store/compare-store', () => ({
  useCompareStore: () => ({ items: [], toggle: jest.fn() }),
}));

jest.mock('@/store/wishlist-store', () => {
  const toggle = jest.fn();
  return {
    useWishlistStore: () => ({ ids: [], loaded: true, fetch: jest.fn(), toggle }),
    __toggle: () => toggle,
  };
});

jest.mock('@/components/ui/use-toast', () => {
  const toast = jest.fn();
  return { toast, __toast: () => toast };
});

jest.mock('@/lib/messaging/chat-navigation', () => {
  const openChat = jest.fn();
  return { openChat, __openChat: () => openChat };
});

const navigation = jest.requireMock('next/navigation');
const authStore = jest.requireMock('@/store/auth-store');
const wishlistStore = jest.requireMock('@/store/wishlist-store');
const useToast = jest.requireMock('@/components/ui/use-toast');
const chatNavigation = jest.requireMock('@/lib/messaging/chat-navigation');

const push = navigation.__push();
const toast = useToast.__toast();
const openChat = chatNavigation.__openChat();
const toggleWishlist = wishlistStore.__toggle();

const product: ProductCardModel = {
  id: 'prod-1',
  slug: 'steel-316-sheet',
  title: 'SS 316 Sheet 2mm',
  images: ['/img.jpg'],
  categoryName: 'Steel & Metals',
  price: 450,
  unit: 'kg',
  moq: 50,
  rating: 4.5,
  reviewCount: 12,
  inStock: true,
  seller: {
    id: 'seller-co',
    name: 'Metals India Co',
    slug: 'metals-india',
    isVerified: true,
    trustScore: 88,
    city: 'Mumbai',
  },
};

const renderActions = () => renderHook(() => useProductActions(product));

beforeEach(() => {
  jest.clearAllMocks();
  authStore.__setUser(null);
});

describe('useProductActions gated CTAs (R6 return context)', () => {
  it('Buy Now redirects to /login with the checkout destination preserved', () => {
    const { result } = renderActions();

    act(() => {
      result.current.handleBuyNow(50);
    });

    expect(toast).toHaveBeenCalledWith({ title: 'Login karke continue karein', variant: 'destructive' });
    expect(push).toHaveBeenCalledWith('/login?next=%2Fcheckout%3FproductId%3Dprod-1%26qty%3D50');
  });

  it('Buy Now falls back to the product MOQ when no quantity is supplied', () => {
    const { result } = renderActions();

    act(() => {
      result.current.handleBuyNow();
    });

    expect(push).toHaveBeenCalledWith('/login?next=%2Fcheckout%3FproductId%3Dprod-1%26qty%3D50');
  });

  it('RFQ redirects to /login with the RFQ builder destination preserved', () => {
    const { result } = renderActions();

    act(() => {
      result.current.handleRFQ();
    });

    expect(push).toHaveBeenCalledWith(
      '/login?next=%2Fbuyer%2Frfq%2Fnew%3Fsource%3DPRODUCT%26sourceId%3Dprod-1',
    );
  });

  it('Chat redirects to /login with the product page destination preserved', () => {
    const { result } = renderActions();

    act(() => {
      result.current.handleChat();
    });

    expect(openChat).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/login?next=%2Fproducts%2Fsteel-316-sheet');
  });

  it('Chat passes the product page as openChat returnUrl for the authenticated path', () => {
    authStore.__setUser({ id: 'buyer-1', role: 'BUYER' });
    const { result } = renderActions();

    act(() => {
      result.current.handleChat();
    });

    expect(openChat).toHaveBeenCalledWith({
      router: expect.anything(),
      companyId: 'seller-co',
      productId: 'prod-1',
      title: 'SS 316 Sheet 2mm',
      returnUrl: '/products/steel-316-sheet',
    });
    expect(push).not.toHaveBeenCalledWith(expect.stringContaining('/login'));
  });

  it('Save redirects to /login with the current page as return target', () => {
    const { result } = renderActions();

    act(() => {
      void result.current.handleSave();
    });

    expect(push).toHaveBeenCalledWith(
      `/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`,
    );
    expect(toggleWishlist).not.toHaveBeenCalled();
  });

  it('authenticated buyer executes the gated action directly (no login hop)', () => {
    authStore.__setUser({ id: 'buyer-1', role: 'BUYER' });
    const { result } = renderActions();

    act(() => {
      result.current.handleRFQ();
    });

    expect(push).toHaveBeenCalledWith('/buyer/rfq/new?source=PRODUCT&sourceId=prod-1');
    expect(push).not.toHaveBeenCalledWith(expect.stringContaining('/login'));
  });

  it('Save still blocks non-buyer roles after authentication (unchanged)', async () => {
    authStore.__setUser({ id: 'seller-1', role: 'SELLER' });
    const { result } = renderActions();

    await act(async () => {
      await result.current.handleSave();
    });

    expect(toast).toHaveBeenCalledWith({
      title: 'Sirf buyer account se save kar sakte hain',
      variant: 'destructive',
    });
    expect(toggleWishlist).not.toHaveBeenCalled();
  });
});
