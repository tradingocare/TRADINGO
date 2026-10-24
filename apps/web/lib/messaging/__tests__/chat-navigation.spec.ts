/**
 * P1-02 Part 1 — openChat helper unit tests.
 * Role-aware routing, context preservation, safe fallbacks, no dead-ends.
 */
import { inboxListPath, inboxThreadPath, openChat } from '../chat-navigation';
import { useAuthStore } from '@/store/auth-store';
import { communicationApi } from '@/lib/api/communication';
import { toast } from '@/components/ui/use-toast';

jest.mock('@/store/auth-store', () => ({ useAuthStore: { getState: jest.fn() } }));
jest.mock('@/lib/api/communication', () => ({
  communicationApi: { conversations: { open: jest.fn() } },
}));
jest.mock('@/components/ui/use-toast', () => ({ toast: jest.fn() }));
jest.mock('next/navigation', () => ({}));

const mockStore = useAuthStore as unknown as { getState: jest.Mock };
const mockOpen = communicationApi.conversations.open as jest.Mock;
const mockToast = toast as unknown as jest.Mock;

describe('inbox path helpers (P1-02 Part 1)', () => {
  it('sellers land in the seller inbox', () => {
    expect(inboxListPath('SELLER')).toBe('/seller/inbox');
    expect(inboxThreadPath('SELLER', 'c1')).toBe('/seller/inbox/c1');
  });

  it('buyers (and everyone else) land in the buyer inbox', () => {
    expect(inboxListPath('BUYER')).toBe('/buyer/inbox');
    expect(inboxThreadPath('BUYER', 'c1')).toBe('/buyer/inbox/c1');
    expect(inboxListPath('ADMIN')).toBe('/buyer/inbox');
    expect(inboxListPath(undefined)).toBe('/buyer/inbox');
  });
});

describe('openChat (P1-02 Part 1)', () => {
  const router = { push: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('buyer Chat CTA opens a contextual thread in the buyer inbox', async () => {
    mockStore.getState.mockReturnValue({ user: { id: 'buyer-1', role: 'BUYER' } });
    mockOpen.mockResolvedValue({ id: 'conv-1' });

    await openChat({ router, companyId: 'seller-co', productId: 'prod-1', title: 'Widget' });

    expect(mockOpen).toHaveBeenCalledWith({ companyId: 'seller-co', productId: 'prod-1', title: 'Widget' });
    expect(router.push).toHaveBeenCalledWith('/buyer/inbox/conv-1');
    expect(mockToast).not.toHaveBeenCalled();
  });

  it('seller Chat CTA opens the thread in the seller inbox', async () => {
    mockStore.getState.mockReturnValue({ user: { id: 'seller-1', role: 'SELLER' } });
    mockOpen.mockResolvedValue({ id: 'conv-2' });

    await openChat({ router, companyId: 'other-co' });

    expect(router.push).toHaveBeenCalledWith('/seller/inbox/conv-2');
  });

  it('missing company id falls back to the safe inbox list (no manufactured IDs, no dead route)', async () => {
    mockStore.getState.mockReturnValue({ user: { id: 'buyer-1', role: 'BUYER' } });

    await openChat({ router, companyId: '' });

    expect(mockOpen).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/buyer/inbox');
  });

  it('unauthenticated caller follows the canonical login flow (R6: return context preserved)', async () => {
    mockStore.getState.mockReturnValue({ user: null });

    await openChat({ router, companyId: 'seller-co' });

    expect(mockOpen).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith(
      `/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`,
    );
  });

  it('unauthenticated caller preserves an explicit returnUrl (R6)', async () => {
    mockStore.getState.mockReturnValue({ user: null });

    await openChat({ router, companyId: 'seller-co', returnUrl: '/products/steel-316-sheet' });

    expect(mockOpen).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/login?next=%2Fproducts%2Fsteel-316-sheet');
  });

  it('encodes query-bearing return targets safely (R6)', async () => {
    mockStore.getState.mockReturnValue({ user: null });

    await openChat({ router, companyId: 'seller-co', returnUrl: '/products/steel-316-sheet?mode=buy&sort=price_asc' });

    expect(router.push).toHaveBeenCalledWith(
      `/login?next=${encodeURIComponent('/products/steel-316-sheet?mode=buy&sort=price_asc')}`,
    );
  });

  it('returnUrl does not interfere with the authenticated flow (R6)', async () => {
    mockStore.getState.mockReturnValue({ user: { id: 'buyer-1', role: 'BUYER' } });
    mockOpen.mockResolvedValue({ id: 'conv-r6' });

    await openChat({ router, companyId: 'seller-co', productId: 'prod-1', title: 'Widget', returnUrl: '/products/widget' });

    expect(mockOpen).toHaveBeenCalledWith({ companyId: 'seller-co', productId: 'prod-1', title: 'Widget' });
    expect(router.push).toHaveBeenCalledWith('/buyer/inbox/conv-r6');
  });

  it('API failure toasts instead of dead-ending', async () => {
    mockStore.getState.mockReturnValue({ user: { id: 'buyer-1', role: 'BUYER' } });
    mockOpen.mockRejectedValue(new Error('no company'));

    await openChat({ router, companyId: 'seller-co', productId: 'prod-1' });

    expect(router.push).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalled();
  });

  it('concurrent clicks share one open call (no duplicate threads from double-click)', async () => {
    mockStore.getState.mockReturnValue({ user: { id: 'buyer-1', role: 'BUYER' } });
    let resolve!: (v: any) => void;
    mockOpen.mockReturnValue(new Promise((r) => { resolve = r; }));

    const a = openChat({ router, companyId: 'seller-co', productId: 'prod-1' });
    const b = openChat({ router, companyId: 'seller-co', productId: 'prod-1' });
    resolve({ id: 'conv-9' });
    await Promise.all([a, b]);

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith('/buyer/inbox/conv-9');
  });
});
