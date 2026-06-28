export function ProductSkeleton() {
  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

  return (
    <div className="min-h-screen" style={{ background: '#1D0001' }}>
      <div className="mx-auto max-w-7xl px-4 pt-24">
        <div className={`h-8 w-72 rounded-full ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <div className="space-y-3">
            <div className={`aspect-square w-full rounded-3xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`h-16 w-16 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className={`h-9 w-3/4 rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className={`h-8 w-1/3 rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className={`h-20 w-full rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`h-8 w-20 rounded-full ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
            <div className="flex gap-2">
              <div className={`h-10 w-10 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className={`h-10 w-10 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className={`h-10 flex-1 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
              <div className={`h-10 flex-1 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
            <div className={`h-10 w-full rounded-2xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
            <div className={`space-y-3 rounded-3xl p-4 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className={`h-5 w-1/2 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className={`h-4 w-full rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className={`h-4 w-3/4 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
