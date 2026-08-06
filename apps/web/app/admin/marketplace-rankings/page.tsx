'use client'

import { useEffect, useState } from 'react'
import { getMarketplaceRankings, MarketplaceRankings, RankingEntry } from '@/lib/api/marketplace-intelligence'
import { Alert } from '@/components/ui/alert';
import { TrendingUp, Users, Package, Grid3X3, Building2, Globe, Award } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import Link from 'next/link'

const SECTION_CONFIG = [
  { key: 'suppliers', label: 'Top Suppliers', icon: Building2, color: 'border-l-emerald-500' },
  { key: 'buyers', label: 'Active Buyers', icon: Users, color: 'border-l-blue-500' },
  { key: 'products', label: 'Popular Products', icon: Package, color: 'border-l-purple-500' },
  { key: 'categories', label: 'Categories', icon: Grid3X3, color: 'border-l-amber-500' },
  { key: 'cities', label: 'Top Cities', icon: Globe, color: 'border-l-rose-500' },
  { key: 'states', label: 'Top States', icon: TrendingUp, color: 'border-l-cyan-500' },
  { key: 'industries', label: 'Industries', icon: Award, color: 'border-l-indigo-500' },
] as const

const CHANGE_ICONS = { up: '↑', down: '↓', stable: '→' } as const
const CHANGE_COLORS = { up: 'text-emerald-400', down: 'text-red-400', stable: 'text-gray-400' } as const

function RankingCard({ title, icon: Icon, entries, color }: {
  title: string
  icon: any
  entries: RankingEntry[]
  color: string
}) {
  return (
    <div className={`rounded-lg border border-border bg-surface border-l-4 ${color}`}>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="h-4 w-4 text-gray-400" />
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <span className="ml-auto text-xs text-text-secondary">{entries.length} entries</span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry) => (
          <div key={`${title}-${entry.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-secondary text-xs font-bold text-text-tertiary">
              {entry.rank}
            </span>
            <div className="flex-1 truncate">
              {entry.slug ? (
                <Link href={`/${entry.slug}`} className="text-sm font-medium text-text-primary hover:text-blue-400">
                  {entry.name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-text-primary">{entry.name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-tertiary">{entry.score}</span>
              <span className={`text-xs ${CHANGE_COLORS[entry.change ?? 'stable']}`}>
                {CHANGE_ICONS[entry.change ?? 'stable']}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminMarketplaceRankingsPage() {
  const [rankings, setRankings] = useState<MarketplaceRankings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMarketplaceRankings()
      .then(setRankings)
      .catch((e) => setError(e?.message ?? 'Failed to load rankings'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Alert variant="error" title="Failed to load rankings" className="w-auto">{error}
          <div className="mt-3"><button onClick={() => window.location.reload()} className="text-sm text-blue-400 hover:underline">Retry</button></div>
        </Alert>
      </div>
    )
  }

  if (!rankings) return null

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Marketplace Rankings</h1>
        <p className="mt-1 text-sm text-text-tertiary">Live rankings across all marketplace dimensions</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {SECTION_CONFIG.map(({ key, label, icon, color }) => (
          <RankingCard
            key={key}
            title={label}
            icon={icon}
            entries={rankings[key as keyof MarketplaceRankings] as RankingEntry[]}
            color={color}
          />
        ))}
      </div>
    </div>
  )
}
