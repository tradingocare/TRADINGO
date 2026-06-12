import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SearchService } from '../../search/search.service';
import { AutocompleteService } from './autocomplete.service';

const mockOpenSearchClient = {
  search: jest.fn(),
};

jest.mock('@opensearch-project/opensearch', () => ({
  Client: jest.fn(() => mockOpenSearchClient),
}));

describe('AutocompleteService', () => {
  let service: AutocompleteService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutocompleteService,
        SearchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'opensearch.url': 'http://localhost:9200',
                'opensearch.username': 'admin',
                'opensearch.password': 'admin',
                'opensearch.rejectUnauthorized': false,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();
    service = module.get<AutocompleteService>(AutocompleteService);
  });

  it('should return empty array when no results', async () => {
    mockOpenSearchClient.search.mockResolvedValue({
      body: { hits: { hits: [] } },
    });

    const results = await service.autocomplete('test', 10);
    expect(results).toEqual([]);
  });

  it('should return autocomplete results for products', async () => {
    mockOpenSearchClient.search.mockImplementation(async ({ index }: { index: string }) => {
      if (index === 'products') {
        return {
          body: {
            hits: {
              hits: [
                {
                  _id: 'p1',
                  _source: { name: 'Test Product', slug: 'test-product', shortDescription: 'A test' },
                },
              ],
            },
          },
        };
      }
      return { body: { hits: { hits: [] } } };
    });

    const results = await service.autocomplete('test', 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].type).toBe('products');
    expect(results[0].text).toBe('Test Product');
    expect(results[0].slug).toBe('test-product');
  });

  it('should return autocomplete results for companies', async () => {
    mockOpenSearchClient.search.mockImplementation(async ({ index }: { index: string }) => {
      if (index === 'companies') {
        return {
          body: {
            hits: {
              hits: [
                {
                  _id: 'c1',
                  _source: { name: 'Test Company', slug: 'test-company', city: 'Mumbai', state: 'MH' },
                },
              ],
            },
          },
        };
      }
      return { body: { hits: { hits: [] } } };
    });

    const results = await service.autocomplete('test', 10);
    const companyResults = results.filter((r) => r.type === 'companies');
    expect(companyResults.length).toBeGreaterThan(0);
    expect(companyResults[0].subText).toBe('Mumbai, MH');
  });

  it('should sort exact matches first', async () => {
    mockOpenSearchClient.search.mockImplementation(async ({ index }: { index: string }) => {
      if (index === 'products') {
        return {
          body: {
            hits: {
              hits: [
                {
                  _id: 'p1',
                  _source: { name: 'Test Product', slug: 'test-product' },
                },
                {
                  _id: 'p2',
                  _source: { name: 'Test', slug: 'test' },
                },
              ],
            },
          },
        };
      }
      return { body: { hits: { hits: [] } } };
    });

    const results = await service.autocomplete('Test', 10);
    expect(results[0].text).toBe('Test');
    expect(results[1].text).toBe('Test Product');
  });

  it('should respect limit parameter', async () => {
    mockOpenSearchClient.search.mockResolvedValue({
      body: { hits: { hits: [] } },
    });

    const results = await service.autocomplete('test', 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('should handle search failures gracefully', async () => {
    mockOpenSearchClient.search.mockRejectedValue(new Error('Search failed'));
    const results = await service.autocomplete('test');
    expect(results).toEqual([]);
  });
});
