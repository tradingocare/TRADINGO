'use client';

export function SearchSkeleton() {
  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent';

  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`rounded-3xl p-5 ${shimmer}`}
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}
        >
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-surface" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
              <div className="h-3 w-1/2 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
              <div className="flex gap-2">
                <div className="h-3 w-16 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
                <div className="h-3 w-20 rounded-lg" style={{ background: 'var(--bg-elevated)' }} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
