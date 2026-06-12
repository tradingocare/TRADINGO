import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';

const mockClient = {
  index: jest.fn(),
  search: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn(() => mockClient),
}));

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              const config: Record<string, unknown> = {
                'opensearch.url': 'http://localhost:9200',
                'opensearch.username': 'admin',
                'opensearch.password': 'admin',
                'opensearch.rejectUnauthorized': true,
              };
              return key in config ? config[key] : defaultValue;
            }),
          },
        },
      ],
    }).compile();
    service = module.get<SearchService>(SearchService);
  });

  describe('indexDocument', () => {
    it('should index a document', async () => {
      mockClient.index.mockResolvedValue({ body: { result: 'created' } });
      await service.indexDocument('products', 'doc-1', { name: 'Test', price: 100 });
      expect(mockClient.index).toHaveBeenCalledWith({
        index: 'products',
        id: 'doc-1',
        body: { name: 'Test', price: 100 },
        refresh: 'wait_for',
      });
    });
  });

  describe('search', () => {
    it('should return hits and total count', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: {
            hits: [
              { _id: 'doc-1', _source: { name: 'Product 1' } },
              { _id: 'doc-2', _source: { name: 'Product 2' } },
            ],
            total: { value: 2 },
          },
        },
      });

      const result = await service.search('products', 'test query');
      expect(result.hits).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hits[0]).toEqual({ id: 'doc-1', name: 'Product 1' });
    });

    it('should handle numeric total', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: { hits: [], total: 0 },
        },
      });

      const result = await service.search('products', '');
      expect(result.total).toBe(0);
    });

    it('should pass filters as term queries', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: { hits: [], total: { value: 0 } },
        },
      });

      await service.search('products', '', { categoryId: 'cat-1', status: 'ACTIVE' });
      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  { term: { categoryId: 'cat-1' } },
                  { term: { status: 'ACTIVE' } },
                ]),
              }),
            }),
          }),
        }),
      );
    });

    it('should skip undefined filters', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: { hits: [], total: { value: 0 } },
        },
      });

      await service.search('products', '', { categoryId: 'cat-1', status: undefined });
      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: [{ term: { categoryId: 'cat-1' } }],
              }),
            }),
          }),
        }),
      );
    });

    it('should apply pagination', async () => {
      mockClient.search.mockResolvedValue({
        body: {
          hits: { hits: [], total: { value: 0 } },
        },
      });

      await service.search('products', '', {}, { page: 2, limit: 10 });
      expect(mockClient.search).toHaveBeenCalledWith(
        expect.objectContaining({ from: 10, size: 10 }),
      );
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document', async () => {
      mockClient.delete.mockResolvedValue({ body: { result: 'deleted' } });
      await service.deleteDocument('products', 'doc-1');
      expect(mockClient.delete).toHaveBeenCalledWith({ index: 'products', id: 'doc-1' });
    });
  });
});
