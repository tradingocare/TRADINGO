export const ENTERPRISE_BRANDS_INDEX = 'enterprise_brands';
export const ENTERPRISE_ATTRIBUTES_INDEX = 'enterprise_attributes';
export const ENTERPRISE_SYNONYMS_INDEX = 'enterprise_synonyms';
export const ENTERPRISE_MAPPINGS_INDEX = 'enterprise_mappings';

export const ENTERPRISE_SEARCH_INDICES = [
  ENTERPRISE_BRANDS_INDEX,
  ENTERPRISE_ATTRIBUTES_INDEX,
  ENTERPRISE_SYNONYMS_INDEX,
  ENTERPRISE_MAPPINGS_INDEX,
] as const;

const baseAnalysis = {
  analyzer: {
    tradingo_analyzer: {
      type: 'custom' as const,
      tokenizer: 'standard',
      filter: ['lowercase', 'asciifolding', 'edge_ngram_filter', 'stop', 'snowball'],
    },
    autocomplete_analyzer: {
      type: 'custom' as const,
      tokenizer: 'edge_ngram_tokenizer',
      filter: ['lowercase', 'asciifolding'],
    },
  },
  tokenizer: {
    edge_ngram_tokenizer: {
      type: 'edge_ngram' as const,
      min_gram: 2,
      max_gram: 20,
      token_chars: ['letter', 'digit'] as const,
    },
  },
  filter: {
    edge_ngram_filter: {
      type: 'edge_ngram' as const,
      min_gram: 2,
      max_gram: 20,
    },
    snowball: {
      type: 'snowball' as const,
      language: 'English',
    },
  },
};

export const ENTERPRISE_INDEX_MAPPINGS: Record<string, Record<string, unknown>> = {
  [ENTERPRISE_BRANDS_INDEX]: {
    settings: {
      index: { number_of_shards: 1, number_of_replicas: 1 },
      analysis: baseAnalysis,
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
        aliases: { type: 'text', analyzer: 'tradingo_analyzer' },
        manufacturer: { type: 'text', analyzer: 'tradingo_analyzer' },
        country: { type: 'keyword' },
        description: { type: 'text', analyzer: 'tradingo_analyzer' },
        verificationStatus: { type: 'keyword' },
        isActive: { type: 'boolean' },
        name_suggest: { type: 'completion', analyzer: 'simple', search_analyzer: 'simple' },
      },
    },
  },
  [ENTERPRISE_ATTRIBUTES_INDEX]: {
    settings: {
      index: { number_of_shards: 1, number_of_replicas: 1 },
      analysis: baseAnalysis,
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
        label: { type: 'text', analyzer: 'tradingo_analyzer' },
        type: { type: 'keyword' },
        unit: { type: 'keyword' },
        options: { type: 'text', analyzer: 'tradingo_analyzer' },
        isActive: { type: 'boolean' },
        sortOrder: { type: 'integer' },
        name_suggest: { type: 'completion', analyzer: 'simple', search_analyzer: 'simple' },
      },
    },
  },
  [ENTERPRISE_SYNONYMS_INDEX]: {
    settings: {
      index: { number_of_shards: 1, number_of_replicas: 1 },
      analysis: {
        analyzer: {
          tradingo_analyzer: {
            type: 'custom' as const,
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding'],
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        term: {
          type: 'text',
          analyzer: 'tradingo_analyzer',
          fields: { keyword: { type: 'keyword' } },
        },
        synonyms: { type: 'text', analyzer: 'tradingo_analyzer' },
        locale: { type: 'keyword' },
        isActive: { type: 'boolean' },
      },
    },
  },
  [ENTERPRISE_MAPPINGS_INDEX]: {
    settings: {
      index: { number_of_shards: 1, number_of_replicas: 1 },
      analysis: {
        analyzer: {
          tradingo_analyzer: {
            type: 'custom' as const,
            tokenizer: 'standard',
            filter: ['lowercase', 'asciifolding'],
          },
        },
      },
    },
    mappings: {
      properties: {
        id: { type: 'keyword' },
        industryId: { type: 'keyword' },
        industryName: { type: 'text', analyzer: 'tradingo_analyzer' },
        categoryId: { type: 'keyword' },
        categoryName: { type: 'text', analyzer: 'tradingo_analyzer' },
        description: { type: 'text', analyzer: 'tradingo_analyzer' },
        isActive: { type: 'boolean' },
      },
    },
  },
};
