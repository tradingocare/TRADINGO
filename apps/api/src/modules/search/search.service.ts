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
  degraded?: boolean;
  error?: string;
}

@Injectable()
export class SearchService {
  private readonly client: Client | null;
  private readonly enabled: boolean;
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly configService: ConfigService) {
    const node = this.configService.get<string>('opensearch.url')?.trim();
    this.enabled = Boolean(node);
    if (!node) {
      // Optional infrastructure: no endpoint configured => the feature is
      // explicitly disabled. No client is constructed against a fabricated URL.
      this.client = null;
      this.logger.warn('OpenSearch is not configured — search and discovery features are disabled');
      return;
    }
    const username = this.configService.get<string>('opensearch.username')?.trim();
    const password = this.configService.get<string>('opensearch.password') ?? '';
    this.client = new Client({
      node,
      ...(username ? { auth: { username, password } } : {}),
      ssl: { rejectUnauthorized: this.configService.get<boolean>('opensearch.rejectUnauthorized', true) },
      maxRetries: 1,
      requestTimeout: 30000,
    });
  }

  /** True when an OpenSearch endpoint is configured and the client is active. */
  isEnabled(): boolean {
    return this.enabled;
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const result = await this.client.ping();
      const r: any = result;
      return r === true || r === 'pong' || r?.body === true;
    } catch {
      return false;
    }
  }

  async indexDocument(index: string, id: string, body: Record<string, unknown>): Promise<void> {
    if (!this.client) {
      this.logger.warn(`Skipping index of ${index}/${id}: OpenSearch is not configured`);
      return;
    }
    await this.client.index({
      index,
      id,
      body,
      refresh: false,
    });
  }

  async bulkIndex(
    index: string,
    docs: { id: string; body: Record<string, unknown> }[],
  ): Promise<{ indexed: number; failed: number }> {
    if (docs.length === 0) return { indexed: 0, failed: 0 };
    if (!this.client) {
      this.logger.warn(`Skipping bulk index of ${docs.length} document(s) into ${index}: OpenSearch is not configured`);
      return { indexed: 0, failed: docs.length };
    }
    const operations: Record<string, unknown>[] = [];
    for (const doc of docs) {
      operations.push({ index: { _index: index, _id: doc.id } });
      operations.push(doc.body);
    }
    const response = await this.client.bulk({
      body: operations,
      refresh: false,
    });
    const items = (response.body.items ?? []) as { index?: { error?: unknown } }[];
    const failed = items.filter((item) => item.index?.error).length;
    return { indexed: docs.length - failed, failed };
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

    if (!this.client) {
      // Feature disabled: return the documented degraded shape instead of
      // failing the request (DEGRADATION_MATRIX 'opensearch' -> Prisma fallback).
      return {
        hits: [],
        total: 0,
        page,
        limit,
        degraded: true,
        error: 'opensearch_not_configured',
      };
    }

    try {
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

      return { hits, total, page, limit, degraded: false };
    } catch (err) {
      this.logger.warn(`OpenSearch search failed for index=${index}: ${(err as Error).message}`);
      return { hits: [], total: 0, page, limit, degraded: true, error: (err as Error).message || 'unknown' };
    }
  }

  async deleteDocument(index: string, id: string): Promise<void> {
    if (!this.client) return;
    await this.client.delete({
      index,
      id,
    });
  }

  async indexExists(index: string): Promise<boolean> {
    if (!this.client) return false;
    const response = await this.client.indices.exists({ index });
    return response.body as boolean;
  }

  async createIndex(index: string, body: Record<string, unknown>): Promise<void> {
    if (!this.client) return;
    const exists = await this.indexExists(index);
    if (!exists) {
      await this.client.indices.create({
        index,
        body,
      });
    }
  }

  async deleteIndex(index: string): Promise<void> {
    if (!this.client) return;
    const exists = await this.indexExists(index);
    if (exists) {
      await this.client.indices.delete({
        index,
      });
    }
  }
}
