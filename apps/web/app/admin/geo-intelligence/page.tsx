'use client'

import { useState } from 'react'
import { useLocationSummary, useGeoClusters } from '@/hooks/use-marketplace-intelligence'
import { EmptyState } from '@/components/ui/empty-state'
import { MapPin, Navigation, Globe, Database, RefreshCw, Map, Layers } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Select } from '@/components/ui/select'

export default function AdminGeoIntelligencePage() {
  const [period, setPeriod] = useState('daily')
  const { data: summary, isLoading: summaryLoading } = useLocationSummary()
  const { data: clusters, isLoading: clustersLoading } = useGeoClusters('supplier', period)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Geo Intelligence</h1>
          <p className="text-sm text-white/50">Location coverage, heatmaps, and marketplace intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs w-auto"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <SummaryCard
          icon={<Globe size={16} />}
          label="Total Locations"
          value={summary?.totalLocations}
          loading={summaryLoading}
          color="#3D8BFF"
        />
        <SummaryCard
          icon={<MapPin size={16} />}
          label="Geocoded"
          value={summary?.geocoded}
          loading={summaryLoading}
          color="#4ade80"
        />
        <SummaryCard
          icon={<Map size={16} />}
          label="Unlocated"
          value={summary?.unlocated}
          loading={summaryLoading}
          color="#f87171"
        />
        <SummaryCard
          icon={<Navigation size={16} />}
          label="GPS Capture"
          value={summary?.gpsCapture}
          loading={summaryLoading}
          color="#F2C94C"
        />
        <SummaryCard
          icon={<Database size={16} />}
          label="Auto-Geocoded"
          value={summary?.autoGeocoded}
          loading={summaryLoading}
          color="#f59e0b"
        />
        <SummaryCard
          icon={<Layers size={16} />}
          label="Heatmap Clusters"
          value={clusters?.length}
          loading={clustersLoading}
          color="#9B5DE5"
        />
      </div>

      <div className="surface-card p-4">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Map size={14} style={{ color: '#f59e0b' }} />
          Supplier Heatmap ({period})
        </h2>
        {clustersLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="default" />
          </div>
        ) : !clusters?.length ? (
          <EmptyState icon={Map} title="No heatmap data yet" description="Geocode suppliers first." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {clusters.slice(0, 50).map((c, i) => (
              <div
                key={`${c.latitude}-${c.longitude}-${i}`}
                className="rounded-lg px-3 py-2 flex items-center justify-between bg-surface"
              >
                <div className="flex items-center gap-2">
                  <MapPin size={12} style={{ color: '#f59e0b' }} />
                  <span className="text-xs text-white/60">
                    {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                  </span>
                </div>
                <span className="text-xs font-bold text-accent-500">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="surface-card p-4">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <RefreshCw size={14} style={{ color: '#4ade80' }} />
          Geo Operations
        </h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => fetch('/api/internal/geocode-all', { method: 'POST' })}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all hover:opacity-80"
            style={{ background: '#f59e0b' }}
          >
            Geocode All Unlocated
          </button>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon, label, value, loading, color,
}: {
  icon: React.ReactNode
  label: string
  value?: number | string
  loading: boolean
  color: string
}) {
  return (
    <div className="surface-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] text-white/50 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">
        {loading ? '-' : value ?? '0'}
      </div>
    </div>
  )
}
