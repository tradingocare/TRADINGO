import '@testing-library/jest-dom';
import { getProductPricing } from './product-pricing';
import { apiClient } from './client';

jest.mock('./client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));

const PRICING = {
  productId: 'prod-1',
  productSlug: 'test-product',
  moq: 1,
  purchasable: true,
  quantity: 60,
  unitPrice: '90.00',
  subtotal: '5400.00',
  currency: 'INR',
  slab: { id: 's2', minQty: 50, maxQty: null, price: '90.00', currency: 'INR' },
  displayPrice: '100.00',
  reason: 'OK',
  message: 'Authoritative price resolved for 60 units.',
};

describe('getProductPricing (R1 client contract)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('requests the authoritative pricing endpoint with the product id and quantity', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: PRICING });
    const result = await getProductPricing('prod-1', 60);
    expect(apiClient.get).toHaveBeenCalledWith('/products/prod-1/pricing?qty=60');
    expect(result.unitPrice).toBe('90.00');
    expect(result.subtotal).toBe('5400.00');
    expect(result.slab?.minQty).toBe(50);
  });

  it('sends ONLY the qty parameter — no price, amount, subtotal or total can be supplied by the client', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: PRICING });
    await getProductPricing('prod-1', 25);
    const url = (apiClient.get as jest.Mock).mock.calls[0][0] as string;
    const [path, query = ''] = url.split('?');
    expect(path).toBe('/products/prod-1/pricing');
    expect(query).toBe('qty=25');
  });

  it('unwraps an enveloped response', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: PRICING } });
    const result = await getProductPricing('prod-1', 1);
    expect(result.purchasable).toBe(true);
    expect(result.productId).toBe('prod-1');
  });
});
