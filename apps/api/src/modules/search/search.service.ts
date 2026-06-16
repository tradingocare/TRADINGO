import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';

type SearchFiltersValue = string | number | boolean | undefined;

interface SearchFilters {
  [key: string]: SearchFiltersValue;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  hits: T[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class SearchService {
  private readonly client: Client;
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new Client({
      node: this.configService.get<string>('opensearch.url'),
      auth: {
        username: this.configService.get<string>('opensearch.username')!,
        password: this.configService.get<string>('opensearch.password')!,
      },
      ssl: { rejectUnauthorized: this.configService.get<boolean>('opensearch.rejectUnauthorized', true) },
    });
  }

  async indexDocument(index: string, id: string, body: Record<string, unknown>): Promise<void> {
    await this.client.index({
      index,
      id,
      body,
      refresh: 'wait_for',
    });
  }

  async search<T>(
    index: string,
    query: string,
    filters: SearchFilters = {},
    pagination: PaginationOptions = {},
  ): Promise<SearchResult<T>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const from = (page - 1) * limit;

    const must: Record<string, unknown>[] = [];
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['*'],
          type: 'best_fields',
        },
      });
    }

    const filterClauses = Object.entries(filters)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => ({
        term: { [key]: value } as Record<string, SearchFiltersValue>,
      }));

    const response = await this.client.search({
      index,
      from,
      size: limit,
      body: {
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter: filterClauses,
          },
        },
      },
    });

    const hits = response.body.hits.hits.map((hit: { _id: string; _source: Record<string, unknown> }) => ({
      id: hit._id,
      ...hit._source,
    })) as unknown as T[];

    const totalInfo = response.body.hits.total;
    const total = typeof totalInfo === 'number' ? totalInfo : (totalInfo?.value ?? 0);

    return {
      hits,
      total,
      page,
      limit,
    };
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    await this.client.delete({
      index,
      id,
    });
  }
}
