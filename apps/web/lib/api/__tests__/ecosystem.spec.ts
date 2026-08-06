import { apiClient } from '../client';

jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('ecosystem API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('imports API functions without error', () => {
    const mod = require('../ecosystem');
    expect(mod.getEcosystemDashboard).toBeDefined();
    expect(mod.getXpBalance).toBeDefined();
    expect(mod.getXpHistory).toBeDefined();
    expect(mod.getCheckin).toBeDefined();
    expect(mod.performCheckin).toBeDefined();
    expect(mod.getStreaks).toBeDefined();
    expect(mod.getLevels).toBeDefined();
    expect(mod.getUserBadges).toBeDefined();
    expect(mod.getMissions).toBeDefined();
  });

  it('getEcosystemDashboard calls correct endpoint', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { totalXp: 1000 } });
    const { getEcosystemDashboard } = require('../ecosystem');
    const result = await getEcosystemDashboard();
    expect(apiClient.get).toHaveBeenCalledWith('/ecosystem/dashboard');
    expect(result.totalXp).toBe(1000);
  });

  it('performCheckin calls correct endpoint', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { performCheckin } = require('../ecosystem');
    const result = await performCheckin();
    expect(apiClient.post).toHaveBeenCalledWith('/ecosystem/checkin');
    expect(result.success).toBe(true);
  });

  it('getXpHistory calls correct endpoint with pagination', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [], meta: {} } });
    const { getXpHistory } = require('../ecosystem');
    await getXpHistory({ page: 1, limit: 20 });
    expect(apiClient.get).toHaveBeenCalledWith('/ecosystem/xp/history', { params: { page: 1, limit: 20 } });
  });
});
