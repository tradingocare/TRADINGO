'use client'

interface QualityBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showBar?: boolean
}

const QUALITY_GRADES = [
  { min: 90, color: 'bg-emerald-500', text: 'text-emerald-400', label: 'Excellent', barColor: 'bg-emerald-500' },
  { min: 75, color: 'bg-blue-500', text: 'text-blue-400', label: 'Good', barColor: 'bg-blue-500' },
  { min: 60, color: 'bg-amber-500', text: 'text-amber-400', label: 'Average', barColor: 'bg-amber-500' },
  { min: 40, color: 'bg-orange-500', text: 'text-orange-400', label: 'Poor', barColor: 'bg-orange-500' },
  { min: 0, color: 'bg-red-500', text: 'text-red-400', label: 'Critical', barColor: 'bg-red-500' },
]

function getGrade(score: number) {
  return QUALITY_GRADES.find(g => score >= g.min) || QUALITY_GRADES[QUALITY_GRADES.length - 1]
}

export function QualityBadge({ score, size = 'md', showLabel = false, showBar = false }: QualityBadgeProps) {
  const grade = getGrade(score)
  const dimClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : size === 'lg' ? 'text-base px-3 py-1.5' : 'text-sm px-2 py-1'
  const dotSize = size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 rounded-md ${dimClass} ${grade.text} bg-[rgba(255,255,255,0.06)] font-semibold`}>
        <span className={`inline-block rounded-full ${dotSize} ${grade.color}`} />
        {score}
        {showLabel && <span className="font-normal opacity-70">{grade.label}</span>}
      </span>
      {showBar && (
        <div className="w-16 h-1.5 bg-bg-base rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${grade.barColor}`} style={{ width: `${score}%` }} />
        </div>
      )}
    </div>
  )
}