export default function CompanyCardSkeleton() {
  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent'

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
      <div className={`h-24 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
      <div className="px-4 pb-4 -mt-4">
        <div className="flex items-end gap-3 mb-3">
          <div className={`w-14 h-14 rounded-xl ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="flex-1 space-y-1.5 pb-1">
            <div className={`h-3 rounded ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)', width:'75%' }} />
            <div className={`h-2 rounded ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)', width:'50%' }} />
          </div>
        </div>
        <div className={`h-2 rounded mb-1.5 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className={`h-2 rounded mb-3 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)', width:'80%' }} />
        <div className="flex gap-1.5 mb-3">
          {[1,2,3].map(i => (
            <div key={i} className={`h-5 w-16 rounded-full ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2.5">
          {[1,2,3].map(i => (
            <div key={i} className="text-center space-y-1">
              <div className={`h-3 rounded mx-auto w-10 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className={`h-2 rounded mx-auto w-12 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
          ))}
        </div>
        <div className={`h-1 rounded-full mt-3 ${shimmer}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
    </div>
  )
}
