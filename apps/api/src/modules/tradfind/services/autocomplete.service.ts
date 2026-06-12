import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../../search/search.service';
import { AutocompleteResult } from '../interfaces/search-types';
import { SearchEntity } from '../enums/search.enums';
import { PRODUCTS_INDEX, COMPANIES_INDEX, CATEGORIES_INDEX, INDUSTRIES_INDEX } from '../tradfind.config';

@Injectable()
export class AutocompleteService {
  private readonly logger = new Logger(AutocompleteService.name);

  constructor(private readonly searchService: SearchService) {}

  async autocomplete(query: string, limit: number = 10): Promise<AutocompleteResult[]> {
    const results: AutocompleteResult[] = [];

    const indices = [
      { index: PRODUCTS_INDEX, type: SearchEntity.PRODUCTS },
      { index: COMPANIES_INDEX, type: SearchEntity.COMPANIES },
      { index: CATEGORIES_INDEX, type: SearchEntity.CATEGORIES },
      { index: INDUSTRIES_INDEX, type: SearchEntity.INDUSTRIES },
    ];

    const perIndex = Math.max(1, Math.ceil(limit / indices.length));

    const openSearchClient = (this.searchService as any).client;

    for (const { index, type } of indices) {
      try {
        const body: Record<string, unknown> = {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query,
                    fields: ['name^3', 'name.autocomplete^2', 'autocomplete'],
                    type: 'bool_prefix',
                    fuzziness: 'AUTO',
                    prefix_length: 1,
                  },
                },
              ],
              filter: index === PRODUCTS_INDEX
                ? [{ term: { status: 'ACTIVE' } }]
                : index === COMPANIES_INDEX
                  ? [{ terms: { status: ['ACTIVE', 'VERIFIED'] } }]
                  : index === CATEGORIES_INDEX
                    ? [{ term: { isActive: true } }]
                    : undefined,
            },
          },
          size: perIndex,
          _source: ['id', 'name', 'slug', 'logo', 'description', 'city', 'state', 'shortDescription'],
        };

        const response = await openSearchClient.search({ index, body });

        const hits = response.body.hits.hits || [];
        for (const hit of hits) {
          const source = hit._source || {};
          results.push({
            type,
            id: hit._id,
            text: source.name as string || '',
            slug: source.slug as string | undefined,
            logo: source.logo as string | undefined,
            subText: this.buildSubText(source, type),
          });
        }
      } catch (err) {
        this.logger.warn(`Autocomplete failed for ${index}: ${(err as Error).message}`);
      }
    }

    results.sort((a, b) => {
      const aExact = a.text.toLowerCase() === query.toLowerCase() ? 0 : 1;
      const bExact = b.text.toLowerCase() === query.toLowerCase() ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.text.length - b.text.length;
    });

    return results.slice(0, limit);
  }

  private buildSubText(source: Record<string, unknown>, type: SearchEntity): string | undefined {
    switch (type) {
      case SearchEntity.PRODUCTS:
        return [source.shortDescription, source.city, source.state]
          .filter(Boolean)
          .slice(0, 1)
          .map(String)
          .join(', ') || undefined;
      case SearchEntity.COMPANIES:
        return [source.city, source.state]
          .filter(Boolean)
          .map(String)
          .join(', ') || undefined;
      case SearchEntity.CATEGORIES:
        return source.description as string | undefined;
      case SearchEntity.INDUSTRIES:
        return source.description as string | undefined;
      default:
        return undefined;
    }
  }
}
