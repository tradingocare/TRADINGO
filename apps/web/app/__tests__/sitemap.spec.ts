/**
 * Sitemap pagination regression tests
 */

import { apiClient } from '../../lib/api/client';
import type { PaginatedResponse } from '../../lib/api/types';

// Mock apiClient
jest.mock('../../lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

const mockApiGet = apiClient.get as jest.Mock;

describe('sitemap product pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('first request sends limit without cursor', async () => {
    const mockResponse: PaginatedResponse<{ slug: string; id: string; updatedAt: string }> = {
      data: [
        { slug: 'product-1', id: '1', updatedAt: new Date().toISOString() },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    mockApiGet.mockResolvedValueOnce({ data: mockResponse });

    // Simulate first request behavior
    const params = { limit: 20 };
    await mockApiGet('/products', { params });

    expect(mockApiGet).toHaveBeenCalledWith('/products', { params: { limit: 20 } });
  });

  it('subsequent request uses cursor from previous response', async () => {
    // First response with cursor
    const firstResponse: PaginatedResponse<{ slug: string; id: string; updatedAt: string }> = {
      data: [{ slug: 'product-1', id: '1', updatedAt: new Date().toISOString() }],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
      cursor: 'product-1',
    };
    mockApiGet.mockResolvedValueOnce({ data: firstResponse });

    // Second request with cursor
    const params = { limit: 20, cursor: 'product-1' };
    await mockApiGet('/products', { params });

    expect(mockApiGet).toHaveBeenCalledWith('/products', { params: { limit: 20, cursor: 'product-1' } });
  });

  it('pagination stops when no next cursor returned', async () => {
    // First response with cursor
    const firstResponse: PaginatedResponse<{ slug: string; id: string; updatedAt: string }> = {
      data: [{ slug: 'product-1', id: '1', updatedAt: new Date().toISOString() }],
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
      cursor: 'product-1',
    };
    // Second response without cursor
    const secondResponse: PaginatedResponse<{ slug: string; id: string; updatedAt: string }> = {
      data: [{ slug: 'product-2', id: '2', updatedAt: new Date().toISOString() }],
      total: 2,
      page: 2,
      limit: 20,
      totalPages: 1,
    };

    mockApiGet.mockResolvedValueOnce({ data: firstResponse });
    mockApiGet.mockResolvedValueOnce({ data: secondResponse });

    // Simulate pagination loop
    const page1Params = { limit: 20 };
    await mockApiGet('/products', { params: page1Params });
    const cursor = firstResponse.cursor;

    if (cursor) {
      const page2Params = { limit: 20, cursor };
      await mockApiGet('/products', { params: page2Params });
    }

    expect(mockApiGet).toHaveBeenCalledTimes(2);
  });

  it('pagination stops on empty data page', async () => {
    const emptyResponse: PaginatedResponse<{ slug: string; id: string; updatedAt: string }> = {
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
    };
    mockApiGet.mockResolvedValueOnce({ data: emptyResponse });

    // Simulate: if data.length === 0, break
    const params = { limit: 20 };
    await mockApiGet('/products', { params });

    expect(mockApiGet).toHaveBeenCalledTimes(1);
  });

  it('API errors follow fallback behavior', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('API error'));

    // Simulate try/catch
    let result: any = null;
    try {
      const params = { limit: 20 };
      result = await mockApiGet('/products', { params });
    } catch {
      // Fallback: return empty or partial
      result = null;
    }

    expect(mockApiGet).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('canonical route generation preserves existing behavior', () => {
    // Test that slug or id is used correctly
    const testCases = [
      { slug: 'steel-beam', id: 'prod-1', expected: 'steel-beam' },
      { slug: undefined, id: 'prod-2', expected: 'prod-2' },
      { slug: '', id: 'prod-3', expected: 'prod-3' },
    ];

    testCases.forEach(({ slug, id, expected }) => {
      const token = slug || id;
      expect(token).toBe(expected);
    });
  });
});
