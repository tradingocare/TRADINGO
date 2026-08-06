'use client'

import { useState, useEffect } from 'react'
import { getTerritoryTree, getTerritoryCoverage, type TerritoryNode } from '@/lib/api/territory-intelligence'
import { Globe, Users, Map, ChevronRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function AdminTerritoryIntelligencePage() {
  const [tree, setTree] = useState<TerritoryNode[]>([])
  const [coverage, setCoverage] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTerritoryTree(),
      getTerritoryCoverage(),
    ]).then(([t, c]) => {
      setTree(t)
      setCoverage(c)
    }).finally(() => setLoading(false))
  }, [])

  const renderTree = (nodes: TerritoryNode[], depth = 0) => (
    <div style={{ marginLeft: depth * 16 }}>
      {nodes.map((node) => (
        <div key={node.id}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface-secondary">
            {node.children?.length ? <ChevronRight size={12} className="text-white/30" /> : <span className="w-3" />}
            <span className="text-xs text-white">{node.name}</span>
            <span className="text-[10px] text-white/40">{node.type}</span>
            {node.rmId && <span className="text-[10px] text-white/30">RM: {node.rmId}</span>}
          </div>
          {node.children?.length ? renderTree(node.children, depth + 1) : null}
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Territory Intelligence</h1>
        <p className="text-sm text-white/50">RM territory management and coverage analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={<Globe size={16} />} label="Total Territories" value={coverage?.totalTerritories} loading={loading} color="#3D8BFF" />
        <StatCard icon={<Map size={16} />} label="Covered States" value={coverage?.coveredStates} loading={loading} color="#4ade80" />
        <StatCard icon={<Users size={16} />} label="Assigned RMs" value={coverage?.territoryBreakdown?.filter((t: any) => t.rmId).length} loading={loading} color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-bold text-white mb-3">Territory Hierarchy</h2>
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : !tree.length ? (
            <p className="text-xs text-white/40">No territories defined</p>
          ) : renderTree(tree)}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="text-sm font-bold text-white mb-3">Coverage Map</h2>
          {loading ? (
            <LoadingSpinner size="sm" />
          ) : !coverage?.coverage?.length ? (
            <p className="text-xs text-white/40">No coverage data</p>
          ) : (
            <div className="space-y-1">
              {coverage.coverage.slice(0, 30).map((c: any) => (
                <div key={c.state} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface">
                  <span className="text-xs text-white/70">{c.state}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">{c.totalLocations} locations</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      c.assignedToTerritory ? 'bg-emerald-400/20 text-emerald-400' : 'bg-red-400/20 text-red-400'
                    }`}>{c.assignedToTerritory ? 'Covered' : 'Uncovered'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, loading, color }: { icon: React.ReactNode; label: string; value?: number | string; loading: boolean; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] text-white/50 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-xl font-bold text-white">{loading ? '-' : value ?? '0'}</div>
    </div>
  )
}
