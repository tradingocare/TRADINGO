import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';

const TRADESERV_INDEX_VERSION = 'tradeserv_professionals_v1';
const TRADESERV_INDEX_ALIAS = 'tradeserv_professionals';

@Injectable()
export class TradeservIndexSyncService {
  private readonly logger = new Logger(TradeservIndexSyncService.name);
  private readonly client: Client;

  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.client = new Client({
      node: this.configService.get<string>('opensearch.url'),
      auth: {
        username: this.configService.get<string>('opensearch.username')!,
        password: this.configService.get<string>('opensearch.password')!,
      },
      ssl: { rejectUnauthorized: this.configService.get<boolean>('opensearch.rejectUnauthorized', true) },
      maxRetries: 3,
      requestTimeout: 10000,
    });
  }

  async ensureIndex(): Promise<void> {
    try {
      const exists = await this.searchService.indexExists(TRADESERV_INDEX_VERSION);
      if (exists) {
        await this.ensureAlias();
        return;
      }
      await this.searchService.createIndex(TRADESERV_INDEX_VERSION, {
        settings: {
          index: { number_of_shards: 1, number_of_replicas: 1 },
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
            logo: { type: 'keyword' },
            professionalType: { type: 'keyword' },
            professionalStatus: { type: 'keyword' },
            verificationLevel: { type: 'keyword' },
            description: { type: 'text', analyzer: 'tradingo_analyzer' },
            trustScore: { type: 'float' },
            responseTimeMinutes: { type: 'integer' },
            averageRating: { type: 'float' },
            reviewCount: { type: 'integer' },
            serviceCount: { type: 'integer' },
            portfolioCount: { type: 'integer' },
            establishedYear: { type: 'integer' },
            employeeCount: { type: 'integer' },
            category: { type: 'keyword' },
            city: { type: 'keyword' },
            state: { type: 'keyword' },
            languages: { type: 'keyword' },
            serviceAreaCities: { type: 'keyword' },
            certifications: { type: 'text', analyzer: 'tradingo_analyzer' },
            serviceNames: { type: 'text', analyzer: 'tradingo_analyzer' },
            serviceCategories: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      });
      await this.ensureAlias();
      this.logger.log(`Created index ${TRADESERV_INDEX_VERSION} with alias ${TRADESERV_INDEX_ALIAS}`);
    } catch (err) {
      this.logger.error(`Failed to ensure OpenSearch index: ${(err as Error).message}`);
    }
  }

  private async ensureAlias(): Promise<void> {
    try {
      const response = await this.client.indices.existsAlias({ name: TRADESERV_INDEX_ALIAS });
      if (!(response.body as boolean)) {
        await this.client.indices.putAlias({ index: TRADESERV_INDEX_VERSION, name: TRADESERV_INDEX_ALIAS });
      }
    } catch (err) {
      this.logger.warn(`Alias setup: ${(err as Error).message}`);
    }
  }

  async indexProfessional(companyId: string): Promise<void> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: {
          professionalServices: { where: { isActive: true } },
          professionalCertifications: true,
          professionalLanguages: true,
          professionalServiceAreas: true,
          locations: true,
        },
      });
      if (!company?.professionalType) return;

      const avgRating = await this.prisma.professionalReview.aggregate({
        where: { companyId },
        _avg: { rating: true },
      });
      const reviewCount = await this.prisma.professionalReview.count({ where: { companyId } });

      const doc: Record<string, unknown> = {
        id: company.id,
        name: company.name,
        slug: company.slug,
        logo: company.logo,
        professionalType: company.professionalType,
        professionalStatus: company.professionalStatus,
        verificationLevel: company.verificationLevel,
        description: company.description,
        trustScore: company.trustScore,
        responseTimeMinutes: company.responseTimeMinutes,
        averageRating: avgRating._avg.rating || 0,
        reviewCount,
        serviceCount: company.professionalServices.length,
        portfolioCount: 0,
        establishedYear: company.establishedYear,
        employeeCount: company.employeeCount,
        category: company.professionalType,
        city: company.locations.map(l => l.city).filter(Boolean),
        state: company.locations.map(l => l.state).filter(Boolean),
        languages: company.professionalLanguages.map(l => l.language),
        serviceAreaCities: company.professionalServiceAreas.map(sa => sa.city).filter(Boolean),
        certifications: company.professionalCertifications.map(c => c.name),
        serviceNames: company.professionalServices.map(s => s.name),
        serviceCategories: company.professionalServices.map(s => s.category).filter(Boolean),
        createdAt: company.createdAt,
      };

      await this.searchService.indexDocument(TRADESERV_INDEX_ALIAS, company.id, doc);
    } catch (err) {
      this.logger.error(`Failed to index professional ${companyId}: ${(err as Error).message}`);
    }
  }

  async removeProfessional(companyId: string): Promise<void> {
    try {
      await this.searchService.deleteDocument(TRADESERV_INDEX_ALIAS, companyId);
    } catch (err) {
      this.logger.warn(`Failed to remove professional ${companyId} from index: ${(err as Error).message}`);
    }
  }

  async syncAllProfessionals(): Promise<number> {
    const companies = await this.prisma.company.findMany({
      where: { professionalType: { not: null } },
      select: { id: true },
    });
    await Promise.all(companies.map(c => this.indexProfessional(c.id)));
    this.logger.log(`Synced ${companies.length} professionals to OpenSearch`);
    return companies.length;
  }

  async deleteIndex(): Promise<void> {
    try {
      await this.searchService.deleteIndex(TRADESERV_INDEX_VERSION);
      this.logger.log(`Deleted index ${TRADESERV_INDEX_VERSION}`);
    } catch (err) {
      this.logger.warn(`Failed to delete index: ${(err as Error).message}`);
    }
  }

  async searchV2(params: {
    query?: string;
    category?: string;
    city?: string;
    state?: string;
    professionalType?: string;
    minRating?: number;
    maxRating?: number;
    verificationLevel?: string;
    languages?: string[];
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const size = params.limit || 20;
    const from = (page - 1) * size;

    const must: Record<string, unknown>[] = [];
    const filter: Record<string, unknown>[] = [];

    if (params.query) {
      must.push({
        multi_match: {
          query: params.query,
          fields: ['name^3', 'description', 'serviceNames^2', 'city^2', 'certifications', 'serviceAreaCities'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    if (params.professionalType) {
      filter.push({ term: { professionalType: params.professionalType } });
    }
    if (params.category) {
      filter.push({ term: { serviceCategories: params.category } });
    }
    if (params.city) {
      filter.push({ term: { city: params.city } });
    }
    if (params.state) {
      filter.push({ term: { state: params.state } });
    }
    if (params.minRating !== undefined) {
      filter.push({ range: { averageRating: { gte: params.minRating } } });
    }
    if (params.verificationLevel) {
      filter.push({ term: { verificationLevel: params.verificationLevel } });
    }
    if (params.languages && params.languages.length > 0) {
      filter.push({ terms: { languages: params.languages } });
    }

    filter.push({ term: { professionalStatus: 'APPROVED' } });

    let sortArr: Record<string, unknown>[] = [];
    switch (params.sort) {
      case 'trustScore':
        sortArr = [{ trustScore: { order: 'desc' } }];
        break;
      case 'rating':
        sortArr = [{ averageRating: { order: 'desc' } }];
        break;
      case 'newest':
        sortArr = [{ createdAt: { order: 'desc' } }];
        break;
      default:
        sortArr = [{ _score: { order: 'desc' } }];
    }

    try {
      const response = await this.client.search({
        index: TRADESERV_INDEX_ALIAS,
        from,
        size,
        body: {
          query: { bool: { must, filter } },
          sort: sortArr,
          aggs: {
            categories: { terms: { field: 'serviceCategories', size: 20 } },
            cities: { terms: { field: 'city', size: 20 } },
            states: { terms: { field: 'state', size: 20 } },
            verificationLevels: { terms: { field: 'verificationLevel', size: 10 } },
            ratingRanges: {
              range: {
                field: 'averageRating',
                ranges: [
                  { key: '0-3', from: 0, to: 3 },
                  { key: '3-4', from: 3, to: 4 },
                  { key: '4-5', from: 4, to: 5 },
                ],
              },
            },
            professionalTypes: { terms: { field: 'professionalType', size: 20 } },
          },
        },
      });

      const rawHits = response.body.hits.hits as unknown as { _id: string; _source: Record<string, unknown>; _score?: number }[];
      const hits = rawHits.map(hit => ({
        id: hit._id,
        ...hit._source,
        _score: hit._score ?? 0,
      }));

      const totalInfo = response.body.hits.total;
      const total = typeof totalInfo === 'number' ? totalInfo : (totalInfo?.value ?? 0);

      const aggResult = (response.body.aggregations ?? {}) as Record<string, { buckets: { key: string; doc_count: number; from?: number; to?: number }[] }>;

      return {
        data: hits,
        meta: {
          total,
          page,
          limit: size,
          totalPages: Math.ceil(total / size),
          hasNext: from + size < total,
          hasPrevious: page > 1,
        },
        aggregations: {
          categories: aggResult.categories?.buckets ?? [],
          cities: aggResult.cities?.buckets ?? [],
          states: aggResult.states?.buckets ?? [],
          verificationLevels: aggResult.verificationLevels?.buckets ?? [],
          ratingRanges: aggResult.ratingRanges?.buckets ?? [],
          professionalTypes: aggResult.professionalTypes?.buckets ?? [],
        },
      };
    } catch (err) {
      this.logger.warn(`OpenSearch search failed, falling back to Prisma: ${(err as Error).message}`);
      return null;
    }
  }
}