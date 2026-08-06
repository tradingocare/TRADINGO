export function ProductSkeleton() {
  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="mx-auto max-w-[1600px] px-6 sm:px-8 lg:px-12 pt-24">
        {/* Breadcrumb skeleton */}
        <div className={`h-8 w-72 rounded-full ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
        <div className="mt-8 grid gap-8 lg:grid-cols-12 xl:gap-12">
          {/* Gallery column (4/12) */}
          <div className="lg:col-span-4 space-y-3">
            <div className={`aspect-square w-full rounded-2xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-16 w-16 rounded-xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              ))}
            </div>
          </div>

          {/* Center column (5/12) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl bg-surface border border-border p-6 space-y-4">
              <div className={`h-9 w-3/4 rounded-2xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              <div className={`h-8 w-full rounded-2xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`h-7 w-20 rounded-full ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
                ))}
              </div>
              <div className={`h-16 w-full rounded-2xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              <div className={`h-12 w-full rounded-2xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              <div className={`h-10 w-full rounded-2xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              <div className={`space-y-3 rounded-2xl p-4 ${shimmer}`} style={{ background: 'var(--bg-elevated)' }}>
                <div className={`h-5 w-1/2 rounded-xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
                <div className={`h-4 w-full rounded-xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
                <div className={`h-4 w-3/4 rounded-xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              </div>
            </div>
          </div>

          {/* Purchase panel column (3/12) */}
          <div className="hidden lg:block lg:col-span-3 space-y-4">
            <div className="rounded-2xl p-6 bg-surface border border-accent/10 space-y-4">
              <div className={`h-5 w-1/2 rounded-2xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`h-4 w-full rounded-xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
                ))}
              </div>
              <div className={`h-10 w-full rounded-xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              <div className={`h-12 w-full rounded-2xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              <div className="flex gap-2">
                <div className={`h-10 flex-1 rounded-xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
                <div className={`h-10 flex-1 rounded-xl ${shimmer}`} style={{ background: 'var(--bg-elevated)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
