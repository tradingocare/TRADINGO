import '@testing-library/jest-dom';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import CheckoutPage from '@/app/checkout/page';
import { apiClient } from '@/lib/api/client';
import { toast } from '@/components/ui/use-toast';

const PRODUCT_ID = 'prod-1';
const QTY = 60;

const LOOKUP = {
  id: PRODUCT_ID,
  name: 'Steel Coil',
  slug: 'steel-coil',
  companyId: 'comp-seller-1',
  company: { name: 'SteelCo' },
  media: [{ url: '/coil.jpg', type: 'IMAGE' }],
};

const PRICING = {
  productId: PRODUCT_ID,
  productSlug: 'steel-coil',
  moq: 1,
  purchasable: true,
  quantity: QTY,
  unitPrice: '90.00',
  subtotal: '5400.00',
  currency: 'INR',
  slab: { id: 's2', minQty: 50, maxQty: null, price: '90.00', currency: 'INR' },
  displayPrice: '100.00',
  reason: 'OK',
  message: 'Authoritative price resolved for 60 units.',
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(`productId=${PRODUCT_ID}&qty=${QTY}`),
}));

jest.mock('@/lib/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@/store/auth-store', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: { id: 'user-1', companyId: 'comp-buyer-1' } }),
}));

jest.mock('@/components/ui/use-toast', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: new Proxy({}, { get: (_t: any, tag: string) => (props: any) => React.createElement(tag, props) }),
    AnimatePresence: ({ children }: any) => children,
  };
});

function mockApi(pricing: unknown = PRICING) {
  (apiClient.get as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/pricing')) return Promise.resolve({ data: pricing });
    return Promise.resolve({ data: LOOKUP });
  });
  (apiClient.post as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/orders')) return Promise.resolve({ data: { id: 'order-1', orderNumber: 'ORD-0001' } });
    return Promise.resolve({ data: { amount: 540000, currency: 'INR', gatewayOrderId: 'rzp-order-1' } });
  });
}

function fillInfoForm() {
  fireEvent.change(screen.getByPlaceholderText('Full Name'), { target: { value: 'A Buyer' } });
  fireEvent.change(screen.getByPlaceholderText('Email Address'), { target: { value: 'buyer@example.com' } });
  fireEvent.change(screen.getByPlaceholderText('Phone Number'), { target: { value: '9876543210' } });
  fireEvent.change(screen.getByPlaceholderText('Company Name'), { target: { value: 'Buyer Co' } });
}

function fillDeliveryForm() {
  fireEvent.change(screen.getByPlaceholderText('Address Line'), { target: { value: '12 Main St' } });
  fireEvent.change(screen.getByPlaceholderText('City'), { target: { value: 'Mumbai' } });
  fireEvent.change(screen.getByPlaceholderText('State'), { target: { value: 'MH' } });
  fireEvent.change(screen.getByPlaceholderText('Pincode'), { target: { value: '400001' } });
}

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});

describe('Checkout (R1 — server-authoritative pricing)', () => {
  it('displays the server-resolved unit price and total for the requested quantity', async () => {
    mockApi();
    render(<CheckoutPage />);
    await waitFor(() => expect(screen.getByText('₹90.00')).toBeInTheDocument());
    expect(screen.getByText('₹5400.00')).toBeInTheDocument();
    expect(screen.getByText('Volume tier 50+ units')).toBeInTheDocument();
  });

  it('posts order and payment amounts taken from the server pricing result', async () => {
    mockApi();
    (window as any).Razorpay = jest.fn().mockImplementation(() => ({ on: jest.fn(), open: jest.fn() }));
    render(<CheckoutPage />);
    await waitFor(() => expect(screen.getByText('₹90.00')).toBeInTheDocument());

    fillInfoForm();
    fireEvent.click(screen.getByText('Next'));
    fillDeliveryForm();
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Place Order'));

    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith(
        '/companies/comp-buyer-1/orders',
        expect.objectContaining({
          subtotal: 5400,
          totalAmount: 5400,
          quantity: 60,
          items: [expect.objectContaining({ productId: PRODUCT_ID, quantity: 60, unitPrice: 90 })],
        }),
      ),
    );
    expect(apiClient.post).toHaveBeenCalledWith(
      '/companies/comp-buyer-1/payments/order',
      expect.objectContaining({ type: 'ORDER_PAYMENT', amount: 540000, orderId: 'order-1' }),
    );
  });

  it('blocks the order and surfaces the server reason when the quantity is not purchasable', async () => {
    mockApi({
      ...PRICING,
      purchasable: false,
      unitPrice: null,
      subtotal: null,
      slab: null,
      reason: 'QUANTITY_BETWEEN_SLABS',
      message: 'No price tier covers quantity 60.',
    });
    render(<CheckoutPage />);
    await waitFor(() => expect(screen.getByText('Unavailable')).toBeInTheDocument());
    fillInfoForm();
    fireEvent.click(screen.getByText('Place Order'));
    expect(toast.error).toHaveBeenCalledWith('No price tier covers quantity 60.');
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('degrades honestly when live pricing cannot be loaded', async () => {
    (apiClient.get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/pricing')) return Promise.reject(new Error('pricing unavailable'));
      return Promise.resolve({ data: LOOKUP });
    });
    render(<CheckoutPage />);
    await waitFor(() => expect(screen.getByText('Live pricing unavailable')).toBeInTheDocument());
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });
});
