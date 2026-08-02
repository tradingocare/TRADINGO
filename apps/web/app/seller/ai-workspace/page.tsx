'use client'
import { useState } from 'react'
import { DashboardPageHeader, StatCard, TableSkeleton } from '@/components/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CatalogScoreCard } from '@/components/ai/catalog-score-card'
import { SuggestionCard } from '@/components/ai/suggestion-card'
import {
  useQualityDashboard, useScores, useBulkJobs, useBulkStats, useBulkEnhance,
  useAcceptSuggestion, useCalculateScore, useAiCache, useGenerateSeo, useGenerateDescription,
} from '@/hooks/use-ai'
import { useToast } from '@/components/ui/use-toast'
import { useMyCreditBalance } from '@/hooks/use-ai-credits'
import {
  Sparkles, Package, TrendingUp, AlertTriangle, Image, Search, Coins,
  RefreshCw, Clock, CheckCircle, XCircle, Play, FileText, Eye,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'

export default function AiWorkspacePage() {
  const { toast } = useToast()
  const [bulkTab, setBulkTab] = useState<'all' | 'pending' | 'completed' | 'failed'>('all')
  const [page, setPage] = useState(1)

  const { data: dashboard, isLoading: dashLoading } = useQualityDashboard()
  const { data: scoresData, isLoading: scoresLoading } = useScores({ page, limit: 5 })
  const { data: bulkJobs, isLoading: jobsLoading } = useBulkJobs({ page, limit: 10 })
  const { data: bulkStats } = useBulkStats()
  const { data: creditBalance } = useMyCreditBalance()

  const acceptSuggestion = useAcceptSuggestion()
  const recalculateScore = useCalculateScore()

  const handleAccept = async (cacheId: string, edits?: Record<string, unknown>) => {
    try {
      await acceptSuggestion.mutateAsync({ cacheId, edits })
      toast({ title: 'Suggestion accepted and applied' })
    } catch {
      toast({ title: 'Failed to accept suggestion', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="AI Workspace" description="AI-powered catalog optimization tools" />

      {dashLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <TableSkeleton key={i} />)}
        </div>
      ) : dashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={Package} label="Total Products" value={String(dashboard.totalProducts)} />
          <StatCard icon={TrendingUp} label="Avg Quality Score" value={`${dashboard.avgScore}%`} />
          <StatCard icon={AlertTriangle} label="Missing SEO" value={String(dashboard.missingSeo)} />
          <StatCard icon={Image} label="Missing Images" value={String(dashboard.missingImages)} />
          <StatCard icon={Search} label="Duplicates" value={String(dashboard.duplicateRiskCount)} />
            <div className="bg-surface-secondary rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-text-tertiary">Pending Jobs</p>
                <p className="text-lg font-bold">{bulkStats?.pending ?? 0}</p>
              </div>
            </div>
            {creditBalance && (
              <div className="bg-surface-secondary rounded-xl p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  creditBalance.remaining <= 0 ? 'bg-red-500/20 text-red-400' :
                  creditBalance.remaining <= Math.round(creditBalance.total * 0.2) ? 'bg-orange-500/20 text-accent-500' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">AI Credits</p>
                  <p className={`text-lg font-bold ${
                    creditBalance.remaining <= 0 ? 'text-red-400' :
                    creditBalance.remaining <= Math.round(creditBalance.total * 0.2) ? 'text-accent-500' :
                    'text-emerald-400'
                  }`}>{creditBalance.remaining} / {creditBalance.total}</p>
                </div>
              </div>
            )}
          </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Catalog Scores</CardTitle>
                <Link href="/seller/products">
                  <Button variant="outline" size="sm"><Package className="mr-1 h-3 w-3" /> View Products</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {scoresLoading ? (
                <TableSkeleton rows={3} />
              ) : !scoresData?.data?.length ? (
                <EmptyState icon={Sparkles} title="No products scored yet" description="Visit a product page and use the AI Copilot to generate content" />
              ) : (
                <div className="space-y-3">
                  {scoresData.data.map(s => (
                    <Link key={s.productId} href={`/seller/products/${s.productId}/edit`}
                      className="block rounded-lg border border-border p-3 hover:border-orange-500/30 hover:bg-accent-500/15 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">{s.product?.name || 'Unknown Product'}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          s.total >= 80 ? 'bg-green-500/15 text-green-400' :
                          s.total >= 50 ? 'bg-amber-500/15 text-accent-500' :
                          'bg-red-500/15 text-red-400'
                        }`}>{Math.round(s.total)}%</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-text-tertiary">
                        <span>Title {Math.round(s.titleQuality)}%</span>
                        <span>Desc {Math.round(s.descriptionQuality)}%</span>
                        <span>SEO {Math.round(s.seoQuality)}%</span>
                        <span>Images {Math.round(s.imageQuality)}%</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bulk Processing</CardTitle>
                <div className="flex gap-1">
                  {(['all', 'pending', 'completed', 'failed'] as const).map(t => (
                    <button key={t} onClick={() => { setBulkTab(t); setPage(1) }}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize ${
                        bulkTab === t ? 'bg-orange-500 text-white' : 'text-text-tertiary hover:bg-surface'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <TableSkeleton rows={4} />
              ) : !bulkJobs?.data?.length ? (
                <EmptyState icon={Clock} title="No bulk jobs yet" description="Select multiple products and run bulk AI actions" />
              ) : (
                <Table>
                  <THead><TR><TH>Product</TH><TH>Type</TH><TH>Status</TH><TH>Date</TH></TR></THead>
                  <TBody>
                    {bulkJobs.data.map(job => (
                      <TR key={job.id}>
                        <TD className="text-text-secondary">{job.product?.name || job.productId.slice(0, 8)}</TD>
                        <TD className="text-text-tertiary">{job.jobType.replace(/_/g, ' ')}</TD>
                        <TD>
                          <Badge className={
                            job.status === 'COMPLETED' ? 'bg-green-500/15 text-green-400' :
                            job.status === 'FAILED' ? 'bg-red-500/15 text-red-400' :
                            job.status === 'PROCESSING' ? 'bg-blue-500/15 text-blue-400' :
                            'bg-surface-secondary text-text-tertiary'
                          }>{job.status}</Badge>
                        </TD>
                        <TD className="text-text-tertiary text-xs">{new Date(job.createdAt).toLocaleDateString()}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <CatalogScoreCard
            score={scoresData?.data?.[0] ? {
              total: scoresData.data[0].total,
              titleQuality: scoresData.data[0].titleQuality,
              descriptionQuality: scoresData.data[0].descriptionQuality,
              imageQuality: scoresData.data[0].imageQuality,
              specificationQuality: scoresData.data[0].specificationQuality,
              seoQuality: scoresData.data[0].seoQuality,
              completeness: scoresData.data[0].completeness,
              recommendations: scoresData.data[0].recommendations,
            } : null}
            loading={scoresLoading}
            onRecalculate={() => scoresData?.data?.[0]?.productId && recalculateScore.mutate(scoresData.data[0].productId)}
            calculating={recalculateScore.isPending}
          />

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-text-tertiary">Scored Products</span><span className="font-medium">{dashboard?.scoredProducts ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Low Scoring</span><span className="font-medium text-red-400">{dashboard?.lowScoringProducts ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Missing Specs</span><span className="font-medium text-accent-500">{dashboard?.missingSpecs ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Avg Title Quality</span><span className="font-medium">{dashboard?.avgTitleQuality ?? 0}%</span></div>
              <div className="flex justify-between"><span className="text-text-tertiary">Avg Desc Quality</span><span className="font-medium">{dashboard?.avgDescQuality ?? 0}%</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
