'use client'

import { useEffect, useRef } from 'react'

/**
 * Shared infinite-scroll sentinel hook.
 * Attach the returned ref to a sentinel element; when it enters the viewport
 * (within `rootMargin`), `onLoadMore` fires. Pass `enabled=false` to pause.
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  enabled: boolean,
  rootMargin = '800px',
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore

  useEffect(() => {
    if (!enabled) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onLoadMoreRef.current()
      },
      { rootMargin, threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled, rootMargin])

  return sentinelRef
}
