function s(...classes: string[]) {
  return classes.join(' ');
}

export default function CompanyCardSkeleton() {
  const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-border before:to-transparent'

  return (
    <div className={s('rounded-2xl overflow-hidden', 'bg-surface', 'border border-border')}>
      <div className={s('h-24', 'bg-surface', shimmer)} />
      <div className="px-4 pb-4 -mt-4">
        <div className="flex items-end gap-3 mb-3">
          <div className={s('w-14 h-14 rounded-xl', 'bg-surface', shimmer)} />
          <div className="flex-1 space-y-1.5 pb-1">
            <div className={s('h-3 rounded', 'bg-surface', shimmer)} />
            <div className={s('h-2 rounded', 'bg-surface', shimmer)} />
          </div>
        </div>
        <div className={s('h-2 rounded mb-1.5', 'bg-surface', shimmer)} />
        <div className={s('h-2 rounded mb-3', 'bg-surface', shimmer)} />
        <div className="flex gap-1.5 mb-3">
          {[1,2,3].map(i => (
            <div key={i} className={s('h-5 w-16 rounded-full', 'bg-surface', shimmer)} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2.5">
          {[1,2,3].map(i => (
            <div key={i} className="text-center space-y-1">
              <div className={s('h-3 rounded mx-auto w-10', 'bg-surface', shimmer)} />
              <div className={s('h-2 rounded mx-auto w-12', 'bg-surface', shimmer)} />
            </div>
          ))}
        </div>
        <div className={s('h-1 rounded-full mt-3', 'bg-surface', shimmer)} />
      </div>
    </div>
  )
}
