'use client'
import { useState } from 'react'
import { DashboardPageHeader, TableSkeleton } from '@/components/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { useCreditSummary, useCompanyCreditDetail, useResetCompanyCredits } from '@/hooks/use-ai-credits'
import { useToast } from '@/components/ui/use-toast'
import { Coins, RefreshCw, RotateCcw, Search } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
            <div className="p-2 rounded-lg bg-accent/20 text-accent"><Coins className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-text-tertiary">Total Used (This Month)</p>
              <p className="text-lg font-bold text-text-primary">{summary?.totalUsed ?? 0}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-info/20 text-status-info"><RefreshCw className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-text-tertiary">Companies Using AI</p>
              <p className="text-lg font-bold text-text-primary">{summary?.topConsumers?.length ?? 0}</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-status-success/20 text-status-success"><RotateCcw className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-text-tertiary">Top Consumer Usage</p>
              <p className="text-lg font-bold text-text-primary">{summary?.topConsumers?.[0]?.used ?? 0}</p>
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
                <Search className="h-3.5 w-3.5 text-text-tertiary" />
                <Input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search company..."
                  className="w-40"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {summaryLoading ? (
              <TableSkeleton rows={5} />
            ) : !summary?.topConsumers?.length ? (
              <EmptyState icon={Coins} title="No AI usage this month" />
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
                          ? 'border-accent/30 bg-accent/10'
                          : 'border-border hover:border-border/20'
                      }`}
                    >
                      <span className="text-text-secondary">{consumer.companyName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-text-tertiary">{consumer.used} used</span>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleReset(consumer.companyId) }} disabled={resetMutation.isPending}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </button>
                  ))}
                {summary.topConsumers.filter(c => !searchQuery || c.companyName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <p className="text-center text-sm text-text-tertiary py-4">No companies match your search</p>
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
              <div className="text-center py-12 text-text-tertiary">
                <Search className="mx-auto h-10 w-10 mb-2 opacity-50 text-text-tertiary" />
                <p className="text-sm">Select a company from the list to view credit details</p>
              </div>
            ) : detailLoading ? (
              <TableSkeleton rows={4} />
            ) : companyDetail ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-text-tertiary">Total</p>
                    <p className="text-lg font-bold text-status-success">{companyDetail.total}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-text-tertiary">Used</p>
                    <p className="text-lg font-bold text-accent">{companyDetail.used}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 text-center">
                    <p className="text-xs text-text-tertiary">Remaining</p>
                    <p className="text-lg font-bold text-text-primary">{companyDetail.remaining}</p>
                  </div>
                </div>
                <div className="text-xs text-text-tertiary">
                  <p>Plan: {companyDetail.planName}</p>
                  <p>Period: {new Date(companyDetail.periodStart).toLocaleDateString()} — {new Date(companyDetail.periodEnd).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleReset(selectedCompany)} disabled={resetMutation.isPending}>
                  {resetMutation.isPending ? <LoadingSpinner size="xs" /> : <RotateCcw className="mr-1 h-3 w-3" />}
                  Reset Credits
                </Button>
                {companyDetail.monthlyHistory?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Monthly History</h4>
                    <div className="space-y-1">
                      {companyDetail.monthlyHistory.map(h => (
                        <div key={h.periodStart} className="flex justify-between text-xs text-text-tertiary">
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
