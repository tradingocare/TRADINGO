import { apiClient } from '../client';

jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('advertising API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('imports all API functions', () => {
    const mod = require('../advertising');
    expect(mod.getMyAds).toBeDefined();
    expect(mod.createAd).toBeDefined();
    expect(mod.getAdById).toBeDefined();
    expect(mod.updateAd).toBeDefined();
    expect(mod.deleteAd).toBeDefined();
    expect(mod.pauseAd).toBeDefined();
    expect(mod.resumeAd).toBeDefined();
    expect(mod.stopAd).toBeDefined();
    expect(mod.fundAd).toBeDefined();
    expect(mod.getPlacements).toBeDefined();
  });

  it('getMyAds calls correct endpoint', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: [] });
    const { getMyAds } = require('../advertising');
    await getMyAds({ page: 1, limit: 10 });
    expect(apiClient.get).toHaveBeenCalledWith('/advertising/my-ads', { params: { page: 1, limit: 10 } });
  });

  it('createAd posts to correct endpoint', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { id: 'ad-1' } });
    const { createAd } = require('../advertising');
    const payload = { type: 'SPONSORED_PRODUCT', title: 'Test Ad', budget: 5000 };
    await createAd(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/advertising', payload);
  });

  it('pauseAd calls correct endpoint', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { status: 'PAUSED' } });
    const { pauseAd } = require('../advertising');
    await pauseAd('ad-1');
    expect(apiClient.post).toHaveBeenCalledWith('/advertising/ad-1/pause');
  });
});
