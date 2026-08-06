'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, SlidersHorizontal, Bot, Sparkles, Shield, MapPin, Star } from 'lucide-react';
import { useTradeServSearchV2, useFeaturedProfessionals } from '@/hooks/use-tradeserv';
import { ProfessionalCard } from '@/components/tradeserv/professional-card';
import { FilterPanel, type FilterState } from '@/components/tradeserv/filter-panel';
import { SortDropdown, type SortOption } from '@/components/tradeserv/sort-dropdown';
import { SearchSkeleton } from '@/components/tradeserv/search-skeleton';
import { FacetedFilters, type FacetGroup } from '@/components/tradeserv/faceted-filters';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';

const DEFAULT_FILTERS: FilterState = {
  tradtrust: 'All', experience: 'All', rating: 'All',
  languages: [], availability: 'All', membership: 'All', verification: 'All',
};

function buildFacetGroups(aggregations: Record<string, unknown> | undefined): FacetGroup[] {
  if (!aggregations) return [];
  const groups: FacetGroup[] = [];

  const cats = (aggregations as any).categories as { key: string; doc_count: number }[] | undefined;
  if (cats && cats.length > 0) {
    groups.push({ key: 'category', label: 'Category', options: cats.map(c => ({ value: c.key, label: c.key, count: c.doc_count })), type: 'checkbox' });
  }

  const cities = (aggregations as any).cities as { key: string; doc_count: number }[] | undefined;
  if (cities && cities.length > 0) {
    groups.push({ key: 'city', label: 'City', options: cities.map(c => ({ value: c.key, label: c.key, count: c.doc_count })), type: 'checkbox' });
  }

  const types = (aggregations as any).professionalTypes as { key: string; doc_count: number }[] | undefined;
  if (types && types.length > 0) {
    groups.push({ key: 'professionalType', label: 'Professional Type', options: types.map(t => ({ value: t.key, label: t.key.replace(/_/g, ' '), count: t.doc_count })), type: 'radio' });
  }

  const ratingRanges = (aggregations as any).ratingRanges as { key: string; doc_count: number }[] | undefined;
  if (ratingRanges && ratingRanges.length > 0) {
    groups.push({ key: 'rating', label: 'Rating', options: ratingRanges.map(r => ({ value: r.key, label: r.key + ' Stars', count: r.doc_count })), type: 'radio' });
  }

  return groups;
}

export default function TradeServSearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [sort, setSort] = useState<SortOption>('near-best');
  const [showFilters, setShowFilters] = useState(false);
  const [showAiSearch, setShowAiSearch] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [facetSelected, setFacetSelected] = useState<Record<string, string[]>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== query) {
      setQuery(q);
      setSearchInput(q);
    }
  }, [searchParams]);

  const searchParamsV2 = useMemo(() => {
    const params: Record<string, string | number | undefined> = {};
    if (query) params.query = query;
    const page = searchParams.get('page');
    if (page) params.page = Number(page);
    if (sort && sort !== 'near-best') {
      const sortMap: Record<string, string> = { rating: 'rating', experience: 'trustScore', 'recently-active': 'newest', 'near-best': '' };
      params.sort = sortMap[sort] || '';
    }
    const activeFilters = Object.entries(facetSelected).filter(([_, v]) => v.length > 0);
    for (const [key, values] of activeFilters) {
      if (key === 'category') params.category = values[0];
      else if (key === 'city') params.city = values[0];
      else if (key === 'professionalType') params.professionalType = values[0];
      else if (key === 'rating') {
        const minRating = { '0-3': 0, '3-4': 3, '4-5': 4 }[values[0]];
        if (minRating !== undefined) params.minRating = minRating;
      }
    }
    return params;
  }, [query, sort, facetSelected]);

  const { data: searchResults, isLoading: searchLoading, isError } = useTradeServSearchV2(
    query ? searchParamsV2 : { query: '' }
  );
  const { data: featured } = useFeaturedProfessionals(6);

  const v2Data = searchResults as { data?: any[]; meta?: any; aggregations?: any } | undefined;
  const results = useMemo(() => {
    const raw = query ? (v2Data?.data ?? []) : (featured ?? []);
    return raw;
  }, [query, v2Data, featured]);

  const meta = v2Data?.meta;
  const aggregations = v2Data?.aggregations;
  const facetGroups = useMemo(() => buildFacetGroups(aggregations), [aggregations]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setQuery(searchInput);
    const params = new URLSearchParams(window.location.search);
    if (searchInput) params.set('q', searchInput);
    else params.delete('q');
    router.replace(`/tradeserv/search${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
  }, [searchInput, router]);

  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(value);
      const params = new URLSearchParams(window.location.search);
      if (value) params.set('q', value);
      else params.delete('q');
      router.replace(`/tradeserv/search${params.toString() ? '?' + params.toString() : ''}`, { scroll: false });
    }, 300);
  }, [router]);

  const handlePageChange = useCallback((page: number) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    router.replace(`/tradeserv/search?${params.toString()}`, { scroll: false });
  }, [router]);

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'smart-search', context: { query: aiQuery, category: 'professional-services', platform: 'tradeserv' } }),
      });
      const data = await response.json();
      setAiResult(data?.result || data?.response || 'AI search results will appear here.');
      if (data?.suggestedQuery) setSearchInput(data.suggestedQuery);
    } catch {
      setAiResult('Unable to process AI search at this time. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const clearAll = useCallback(() => {
    setSearchInput('');
    setQuery('');
    setFacetSelected({});
    router.replace('/tradeserv/search', { scroll: false });
  }, [router]);

  const isSearching = query.trim().length > 0 || results.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Find a <span className="text-accent">Professional</span>
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Search from verified accountants, legal experts, consultants, and more across India.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="mb-6">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 transition-all focus-within:border-[#f59e0b]/40 focus-within:shadow-[0_0_20px_rgba(245, 158, 11, 0.08)]">
          <Search className="h-5 w-5 shrink-0 text-text-tertiary" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search by name, category, service, location..."
            className="w-full bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none"
            aria-label="Search professionals"
          />
          {searchInput && (
            <button type="button" onClick={clearAll} className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-surface-secondary" aria-label="Clear search">
              <X className="h-4 w-4 text-text-tertiary" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowAiSearch(!showAiSearch)}
            className="flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-[10px] font-medium text-accent transition-all hover:bg-accent/10 mr-1"
            aria-label="Toggle AI search"
          >
            <Bot className="h-3 w-3" /> AI Search
          </button>
          <button type="submit" className="rounded-full bg-accent px-5 py-1.5 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90">
            Search
          </button>
        </div>
      </form>

      {showAiSearch && (
        <div className="mb-6 rounded-2xl border border-accent/20 bg-accent/[0.03] p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold text-text-primary">AI Smart Search</span>
            <span className="text-[10px] text-text-tertiary">Describe what you need in plain language</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="e.g. I need a GST consultant in Mumbai who speaks Gujarati..."
              className="flex-1 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary outline-none transition-all focus:border-accent/40"
              aria-label="AI search query"
            />
            <button
              type="button"
              onClick={handleAiSearch}
              disabled={aiLoading || !aiQuery.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiLoading ? 'Thinking...' : 'Ask AI'}
            </button>
          </div>
          {aiLoading && (
            <div className="mt-3 flex items-center gap-2 text-xs text-text-tertiary">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              Analyzing your request...
            </div>
          )}
          {aiResult && (
            <div className="mt-3 rounded-xl bg-surface p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">{aiResult}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-tertiary transition-all hover:border-border hover:text-text-secondary lg:hidden"
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>
          <p className="text-sm text-text-tertiary">
            {meta?.total != null ? `${meta.total} professional${meta.total !== 1 ? 's' : ''}` : query ? 'Searching...' : `${results.length} professionals`}
          </p>
          <div className="hidden lg:flex items-center gap-2 text-[10px] text-text-tertiary">
            <Shield className="h-3 w-3" /><span>TradTrust Verified</span>
            <span className="mx-1 text-border">|</span>
            <MapPin className="h-3 w-3" /><span>Pan-India</span>
            <span className="mx-1 text-border">|</span>
            <Star className="h-3 w-3" /><span>Verified Reviews</span>
          </div>
        </div>
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      <div className="flex gap-8">
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 shrink-0`}>
          <div className="rounded-2xl border border-border bg-surface p-4 backdrop-blur-xl lg:sticky lg:top-24">
            {facetGroups.length > 0 ? (
              <FacetedFilters
                groups={facetGroups}
                selected={facetSelected}
                onChange={(key, values) => setFacetSelected(prev => ({ ...prev, [key]: values }))}
                onReset={() => setFacetSelected({})}
              />
            ) : (
              <FilterPanel filters={DEFAULT_FILTERS} onChange={() => {}} onReset={() => {}} />
            )}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {searchLoading && query ? (
            <SearchSkeleton />
          ) : isError ? (
            <EmptyState variant="error" title="Search failed" description="Unable to search professionals. Please try again." />
          ) : !isSearching && !featured ? (
            <EmptyState
              icon={Search}
              title="Search for Professionals"
              description="Enter a name, category, service, or location above to find verified professionals."
            />
          ) : results.length === 0 ? (
            <EmptyState
              variant="error"
              icon={X}
              title={`No results found${query ? ` for "${query}"` : ''}`}
              description="Try adjusting your search terms, clearing filters, or browsing all categories."
              action={
                <button type="button" onClick={clearAll} className="rounded-full border border-border bg-surface px-5 py-2 text-xs font-medium text-text-secondary transition-all hover:bg-bg-elevated">
                  Browse All Professionals
                </button>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((profile: any) => (
                  <ProfessionalCard key={profile.slug ?? profile.id} profile={profile} />
                ))}
              </div>
              {meta && meta.totalPages > 1 && (
                <div className="mt-8">
                  <Pagination meta={meta} onPageChange={handlePageChange} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}