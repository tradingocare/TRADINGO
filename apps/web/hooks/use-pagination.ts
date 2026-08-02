'use client';

import { useState, useMemo, useCallback } from 'react';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
}

export function usePagination(opts: UsePaginationOptions = {}) {
  const [page, setPage] = useState(opts.initialPage ?? 1);
  const [limit] = useState(opts.initialLimit ?? 20);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, p));
  }, []);

  const nextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  const buildMeta = useCallback(
    (total: number): PaginationMeta => ({
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page * limit < total,
      hasPrevious: page > 1,
    }),
    [page, limit],
  );

  return useMemo(
    () => ({ page, limit, goToPage, nextPage, prevPage, resetPage, buildMeta }),
    [page, limit, goToPage, nextPage, prevPage, resetPage, buildMeta],
  );
}
