'use client'

interface RankBadgeProps {
  rank: number | null | undefined
  total?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const rankColors: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-amber-500', text: 'text-white', label: 'Gold' },
  2: { bg: 'bg-slate-400', text: 'text-white', label: 'Silver' },
  3: { bg: 'bg-amber-700', text: 'text-white', label: 'Bronze' },
}

const sizeClasses = {
  sm: 'w-5 h-5 text-[9px]',
  md: 'w-7 h-7 text-xs',
  lg: 'w-9 h-9 text-sm',
}

export function RankBadge({ rank, total, size = 'sm', showLabel = false }: RankBadgeProps) {
  if (!rank || rank <= 0) return null

  const isTop3 = rank <= 3
  const colors = isTop3 ? rankColors[rank]! : { bg: 'bg-surface-secondary dark:bg-dark-surface-secondary', text: 'text-text-secondary dark:text-dark-text-secondary', label: '' }

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`inline-flex items-center justify-center rounded-full font-bold ${sizeClasses[size]} ${colors.bg} ${colors.text}`}
        title={isTop3 ? colors.label : `#${rank}`}
      >
        {isTop3 && showLabel ? colors.label.charAt(0) : `#${rank}`}
      </div>
      {showLabel && isTop3 && (
        <span className={`text-[10px] font-semibold ${colors.text}`}>{colors.label}</span>
      )}
      {showLabel && total && total > 0 && (
        <span className="text-[10px] text-text-secondary dark:text-dark-text-secondary">
          of {total.toLocaleString()}
        </span>
      )}
    </div>
  )
}
