export const PRODUCTS_INDEX = 'products';
export const COMPANIES_INDEX = 'companies';
export const CATEGORIES_INDEX = 'categories';
export const INDUSTRIES_INDEX = 'industries';

export const SEARCH_INDICES = [PRODUCTS_INDEX, COMPANIES_INDEX, CATEGORIES_INDEX, INDUSTRIES_INDEX] as const;

export const INDEX_MAPPINGS: Record<string, Record<string, unknown>> = {
  [PRODUCTS_INDEX]: {
    settings: {
      index: {
        number_of_shards: 2,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            tradingo_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding', 'edge_ngram_filter', 'stop', 'snowball'],
            },
            autocomplete_analyzer: {
              type: 'custom',
              tokenizer: 'edge_ngram_tokenizer',
              filter: ['lowercase', 'asciifolding'],
            },
          },
          tokenizer: {
            edge_ngram_tokenizer: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 20,
              token_chars: ['letter', 'digit'],
            },
          },
          filter: {
            edge_ngram_filter: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 20,
            },
            snowball: {
              type: 'snowball',
              language: 'English',
            },
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'tradingo_analyzer',
          fields: {
            keyword: { type: 'keyword' },
            autocomplete: { type: 'text', analyzer: 'autocomplete_analyzer' },
          },
        },
        slug: { type: 'keyword' },
        shortDescription: { type: 'text', analyzer: 'tradingo_analyzer' },
        description: { type: 'text', analyzer: 'tradingo_analyzer' },
        productType: { type: 'keyword' },
        status: { type: 'keyword' },
        brand: { type: 'text', analyzer: 'tradingo_analyzer' },
        sku: { type: 'keyword' },
        moq: { type: 'integer' },
        unit: { type: 'keyword' },
        minPrice: { type: 'float' },
        maxPrice: { type: 'float' },
        currency: { type: 'keyword' },
        isFeatured: { type: 'boolean' },
        trustScoreSnapshot: { type: 'integer' },
        verificationLevel: { type: 'keyword' },
        companyId: { type: 'keyword' },
        companyName: { type: 'text', analyzer: 'tradingo_analyzer' },
        companySlug: { type: 'keyword' },
        businessType: { type: 'keyword' },
        categoryId: { type: 'keyword' },
        categoryName: { type: 'keyword' },
        industryId: { type: 'keyword' },
        industryName: { type: 'keyword' },
        location: { type: 'geo_point' },
        city: { type: 'keyword' },
        state: { type: 'keyword' },
        country: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        media: {
          type: 'nested',
          properties: {
            type: { type: 'keyword' },
            url: { type: 'keyword' },
          },
        },
        name_suggest: {
          type: 'completion',
          analyzer: 'simple',
          search_analyzer: 'simple',
        },
      },
    },
  },
  [COMPANIES_INDEX]: {
    settings: {
      index: {
        number_of_shards: 2,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            tradingo_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding', 'edge_ngram_filter', 'stop', 'snowball'],
            },
          },
          tokenizer: {
            edge_ngram_tokenizer: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 20,
              token_chars: ['letter', 'digit'],
            },
          },
          filter: {
            edge_ngram_filter: {
              type: 'edge_ngram',
              min_gram: 2,
              max_gram: 20,
            },
            snowball: {
              type: 'snowball',
              language: 'English',
            },
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'tradingo_analyzer',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        slug: { type: 'keyword' },
        description: { type: 'text', analyzer: 'tradingo_analyzer' },
        logo: { type: 'keyword' },
        banner: { type: 'keyword' },
        businessType: { type: 'keyword' },
        geographicReach: { type: 'keyword' },
        trustScore: { type: 'integer' },
        verificationLevel: { type: 'keyword' },
        status: { type: 'keyword' },
        totalProducts: { type: 'integer' },
        responseRate: { type: 'float' },
        categoryIds: { type: 'keyword' },
        categoryNames: { type: 'keyword' },
        industryIds: { type: 'keyword' },
        industryNames: { type: 'keyword' },
        location: { type: 'geo_point' },
        city: { type: 'keyword' },
        state: { type: 'keyword' },
        country: { type: 'keyword' },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        isGstVerified: { type: 'boolean' },
        isBankVerified: { type: 'boolean' },
        vendorCode: { type: 'keyword' },
        subscriptionStatus: { type: 'keyword' },
        goCashBalance: { type: 'integer' },
        profileCompletionPercentage: { type: 'integer' },
        name_suggest: {
          type: 'completion',
          analyzer: 'simple',
          search_analyzer: 'simple',
        },
      },
    },
  },
  [CATEGORIES_INDEX]: {
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            tradingo_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
            },
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'tradingo_analyzer',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        slug: { type: 'keyword' },
        description: { type: 'text', analyzer: 'tradingo_analyzer' },
        icon: { type: 'keyword' },
        image: { type: 'keyword' },
        parentId: { type: 'keyword' },
        isActive: { type: 'boolean' },
        sortOrder: { type: 'integer' },
        productCount: { type: 'integer' },
        createdAt: { type: 'date' },
        name_suggest: {
          type: 'completion',
          analyzer: 'simple',
          search_analyzer: 'simple',
        },
      },
    },
  },
  [INDUSTRIES_INDEX]: {
    settings: {
      index: {
        number_of_shards: 1,
        number_of_replicas: 1,
        analysis: {
          analyzer: {
            tradingo_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
            },
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          analyzer: 'tradingo_analyzer',
          fields: {
            keyword: { type: 'keyword' },
          },
        },
        slug: { type: 'keyword' },
        description: { type: 'text', analyzer: 'tradingo_analyzer' },
        icon: { type: 'keyword' },
        productCount: { type: 'integer' },
        createdAt: { type: 'date' },
        name_suggest: {
          type: 'completion',
          analyzer: 'simple',
          search_analyzer: 'simple',
        },
      },
    },
  },
};
