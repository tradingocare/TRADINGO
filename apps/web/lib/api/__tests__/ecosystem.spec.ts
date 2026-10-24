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

  it('getEcosystemDashboard calls correct endpoint', async () => {
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { totalXp: 1000 } });
    const { getEcosystemDashboard } = require('../ecosystem');
    const result = await getEcosystemDashboard();
    expect(apiClient.get).toHaveBeenCalledWith('/ecosystem/dashboard');
    expect(result.totalXp).toBe(1000);
  });

  it('dailyCheckin calls correct endpoint', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });
    const { dailyCheckin } = require('../ecosystem');
    const result = await dailyCheckin();
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
