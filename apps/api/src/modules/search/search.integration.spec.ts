import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';

const mockConfig = { get: jest.fn() };

jest.mock('@opensearch-project/opensearch', () => {
  const mockClient = {
    index: jest.fn(),
    search: jest.fn(),
    delete: jest.fn(),
  };
  return {
    Client: jest.fn(() => mockClient),
  };
});

describe('Search Flow Integration', () => {
  let service: SearchService;
  let mockClient: Record<string, jest.Mock>;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfig.get.mockImplementation((key: string) => {
      if (key === 'opensearch.url') return 'http://localhost:9200';
      if (key === 'opensearch.username') return 'admin';
      if (key === 'opensearch.password') return 'admin';
      if (key === 'opensearch.rejectUnauthorized') return false;
      return undefined;
    });

    const { Client } = require('@opensearch-project/opensearch');
    mockClient = new Client();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => { jest.restoreAllMocks(); });

  describe('Index Document Flow', () => {
    const index = 'products';
    const id = 'prod-1';
    const body = { name: 'Test Product', price: 100, status: 'ACTIVE' };

    it('indexes document successfully', async () => {
      mockClient.index.mockResolvedValue({ body: { result: 'created' } });

      await service.indexDocument(index, id, body);

      expect(mockClient.index).toHaveBeenCalledWith({
        index,
        id,
        body,
        refresh: 'wait_for',
      });
    });

    it('indexes complex document with nested data', async () => {
      const complexBody = {
        name: 'Complex Product',
        slug: 'complex-product',
        categoryId: 'cat-1',
        categoryName: 'Category',
        companyId: 'comp-1',
        companyName: 'Company',
        specifications: { weight: '1kg', color: 'red' },
        minPrice: 100,
        maxPrice: 500,
        inventoryStatus: 'IN_STOCK',
        availableQuantity: 50,
      };
      mockClient.index.mockResolvedValue({ body: { result: 'created' } });

      await service.indexDocument(index, id, complexBody);

      expect(mockClient.index).toHaveBeenCalledWith({
        index, id, body: complexBody, refresh: 'wait_for',
      });
    });

    it('propagates errors from OpenSearch', async () => {
      mockClient.index.mockRejectedValue(new Error('OpenSearch unavailable'));

      await expect(service.indexDocument(index, id, body))
        .rejects.toThrow('OpenSearch unavailable');
    });
  });

  describe('Search Flow', () => {
    const index = 'companies';

    it('searches with query string', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            hits: [
              { _id: 'c1', _source: { name: 'Company 1', slug: 'company-1' } },
              { _id: 'c2', _source: { name: 'Company 2', slug: 'company-2' } },
            ],
            total: { value: 2 },
          },
        },
      });

      const result = await service.search(index, 'company');

      expect(result.hits).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockClient.search).toHaveBeenCalledWith(expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({ multi_match: expect.objectContaining({ query: 'company' }) }),
              ]),
            }),
          }),
        }),
      }));
    });

    it('searches with filters', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: { hits: [{ _id: 'c1', _source: { name: 'C1' } }], total: { value: 1 } },
        },
      });

      const result = await service.search(index, 'query', {
        status: 'ACTIVE',
        businessType: 'MANUFACTURER',
        undefinedFilter: undefined,
      });

      expect(result.hits).toHaveLength(1);
      expect(mockClient.search).toHaveBeenCalledWith(expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { status: 'ACTIVE' } },
                { term: { businessType: 'MANUFACTURER' } },
              ]),
            }),
          }),
        }),
      }));
    });

    it('searches without query (match_all)', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: { hits: [{ _id: 'c1', _source: { name: 'C1' } }], total: { value: 1 } },
        },
      });

      const result = await service.search(index, '', {});

      expect(result.hits).toHaveLength(1);
      expect(mockClient.search).toHaveBeenCalledWith(expect.objectContaining({
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({ match_all: {} }),
              ]),
            }),
          }),
        }),
      }));
    });

    it('handles pagination correctly', async () => {
      mockClient.search.mockResolvedValue({
        body: { hits: { hits: [], total: { value: 0 } } },
      });

      await service.search(index, 'query', {}, { page: 3, limit: 10 });

      expect(mockClient.search).toHaveBeenCalledWith(expect.objectContaining({
        from: 20,
        size: 10,
      }));
    });

    it('handles numeric total response', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: { hits: [], total: 5 },
        },
      });

      const result = await service.search(index, 'test');

      expect(result.total).toBe(5);
    });
  });

  describe('Delete Document Flow', () => {
    const index = 'products';
    const id = 'prod-1';

    it('deletes document successfully', async () => {
      mockClient.delete.mockResolvedValue({ body: { result: 'deleted' } });

      await service.deleteDocument(index, id);

      expect(mockClient.delete).toHaveBeenCalledWith({ index, id });
    });

    it('propagates delete errors', async () => {
      mockClient.delete.mockRejectedValue(new Error('Not found'));

      await expect(service.deleteDocument(index, id)).rejects.toThrow('Not found');
    });
  });
});
