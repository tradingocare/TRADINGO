import { Suspense } from 'react';
import { SearchContent } from './search-content';

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchContent q={searchParams.q || ''} />
    </Suspense>
  );
}

function SearchSkeleton() {
  return (
    <div className="container-main py-20">
      <div className="h-10 w-96 animate-pulse rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary" />
      <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-6 dark:bg-dark-surface dark:border-dark-border">
            <div className="h-40 w-full animate-pulse rounded-lg bg-surface-tertiary dark:bg-dark-surface-tertiary" />
            <div className="mt-4 h-5 w-3/4 animate-pulse rounded bg-surface-tertiary dark:bg-dark-surface-tertiary" />
            <div className="mt-2 h-6 w-1/3 animate-pulse rounded bg-surface-tertiary dark:bg-dark-surface-tertiary" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-surface-tertiary dark:bg-dark-surface-tertiary" />
          </div>
        ))}
      </div>
    </div>
  );
}
