'use client'
import { useState } from 'react'
import { DashboardPageHeader, TableSkeleton } from '@/components/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCreditSummary, useCompanyCreditDetail, useResetCompanyCredits } from '@/hooks/use-ai-credits'
import { useToast } from '@/components/ui/use-toast'
import { Coins, RefreshCw, RotateCcw, Search, Loader2 } from 'lucide-react'

export default function AdminAiCreditsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)

  const { data: summary, isLoading: summaryLoading } = useCreditSummary()
  const { data: companyDetail, isLoading: detailLoading } = useCompanyCreditDetail(selectedCompany || '')
  const resetMutation = useResetCompanyCredits()

  const handleReset = async (companyId: string) => {
    try {
      await resetMutation.mutateAsync(companyId)
      toast({ title: 'Credits Reset', description: `Company ${companyId.slice(0, 8)} credits reset to 0` })
    } catch {
      toast({ title: 'Reset Failed', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="AI Credits" description="Manage AI credit usage across all companies" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400"><Coins className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-400">Total Used (This Month)</p>
              <p className="text-lg font-bold text-white">{summary?.totalUsed ?? 0}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400"><RefreshCw className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-400">Companies Using AI</p>
              <p className="text-lg font-bold text-white">{summary?.topConsumers?.length ?? 0}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400"><RotateCcw className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-gray-400">Top Consumer Usage</p>
              <p className="text-lg font-bold text-white">{summary?.topConsumers?.[0]?.used ?? 0}</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Top AI Consumers</CardTitle>
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search company..."
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 outline-none focus:border-orange-400 w-40"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <TableSkeleton rows={5} />
            ) : !summary?.topConsumers?.length ? (
              <div className="text-center py-8 text-gray-500">
                <Coins className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">No AI usage this month</p>
              </div>
            ) : (
              <div className="space-y-2">
                {summary.topConsumers
                  .filter(c => !searchQuery || c.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(consumer => (
                    <button
                      key={consumer.companyId}
                      onClick={() => setSelectedCompany(consumer.companyId)}
                      className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                        selectedCompany === consumer.companyId
                          ? 'border-orange-500/30 bg-orange-500/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-white/80">{consumer.companyName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-white/60">{consumer.used} used</span>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleReset(consumer.companyId) }} disabled={resetMutation.isPending}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </button>
                  ))}
                {summary.topConsumers.filter(c => !searchQuery || c.companyName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <p className="text-center text-sm text-gray-500 py-4">No companies match your search</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Credit Detail</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedCompany ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="mx-auto h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Select a company from the list to view credit details</p>
              </div>
            ) : detailLoading ? (
              <TableSkeleton rows={4} />
            ) : companyDetail ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-white/10 p-3 text-center">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="text-lg font-bold text-emerald-400">{companyDetail.total}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 p-3 text-center">
                    <p className="text-xs text-gray-400">Used</p>
                    <p className="text-lg font-bold text-orange-400">{companyDetail.used}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 p-3 text-center">
                    <p className="text-xs text-gray-400">Remaining</p>
                    <p className="text-lg font-bold text-white">{companyDetail.remaining}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  <p>Plan: {companyDetail.planName}</p>
                  <p>Period: {new Date(companyDetail.periodStart).toLocaleDateString()} — {new Date(companyDetail.periodEnd).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleReset(selectedCompany)} disabled={resetMutation.isPending}>
                  {resetMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RotateCcw className="mr-1 h-3 w-3" />}
                  Reset Credits
                </Button>
                {companyDetail.monthlyHistory?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Monthly History</h4>
                    <div className="space-y-1">
                      {companyDetail.monthlyHistory.map(h => (
                        <div key={h.periodStart} className="flex justify-between text-xs text-white/50">
                          <span>{new Date(h.periodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                          <span className="font-mono">{h.used} credits</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
