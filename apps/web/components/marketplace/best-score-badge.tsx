'use client'

interface BestScoreBadgeProps {
  score: number
  recommendation?: 'BEST' | 'STRONG' | 'GOOD' | 'AVERAGE' | 'POOR'
  size?: 'sm' | 'md'
}

const COLORS: Record<string, { bg: string; text: string; label: string }> = {
  BEST:   { bg: 'from-emerald-600 to-green-500', text: 'text-emerald-900', label: 'BEST' },
  STRONG: { bg: 'from-blue-600 to-blue-400',  text: 'text-blue-900',  label: 'STRONG' },
  GOOD:   { bg: 'from-[#FF4D00] to-cyan-400', text: 'text-black', label: 'GOOD' },
  AVERAGE: { bg: 'from-gray-500 to-gray-400', text: 'text-gray-700',  label: 'AVG' },
  POOR:   { bg: 'from-red-500 to-red-400',    text: 'text-red-900',  label: 'POOR' },
}

export function BestScoreBadge({ score, recommendation = 'GOOD', size = 'sm' }: BestScoreBadgeProps) {
  const c = COLORS[recommendation] || COLORS.GOOD
  const px = size === 'md' ? 'px-2 py-1' : 'px-1.5 py-0.5'
  const fs = size === 'md' ? 'text-xs' : 'text-[10px]'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-r ${c.bg} ${px} font-bold ${fs} text-primary shadow-sm`}
      title={`Marketplace Score: ${score}/100 — ${c.label}`}
    >
      {c.label}
      <span className="opacity-80">{score}</span>
    </span>
  )
}
