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
  RefreshCw, Loader2, Clock, CheckCircle, XCircle, Play, FileText, Eye,
} from 'lucide-react'
import Link from 'next/link'

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
            <div className="bg-gray-800/50 rounded-xl p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <RefreshCw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Pending Jobs</p>
                <p className="text-lg font-bold">{bulkStats?.pending ?? 0}</p>
              </div>
            </div>
            {creditBalance && (
              <div className="bg-gray-800/50 rounded-xl p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  creditBalance.remaining <= 0 ? 'bg-red-500/20 text-red-400' :
                  creditBalance.remaining <= Math.round(creditBalance.total * 0.2) ? 'bg-orange-500/20 text-orange-400' :
                  'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">AI Credits</p>
                  <p className={`text-lg font-bold ${
                    creditBalance.remaining <= 0 ? 'text-red-400' :
                    creditBalance.remaining <= Math.round(creditBalance.total * 0.2) ? 'text-orange-400' :
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
                <div className="text-center py-8 text-gray-500">
                  <Sparkles className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No products scored yet</p>
                  <p className="text-xs text-gray-400 mt-1">Visit a product page and use the AI Copilot to generate content</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scoresData.data.map(s => (
                    <Link key={s.productId} href={`/seller/products/${s.productId}/edit`}
                      className="block rounded-lg border border-gray-100 p-3 hover:border-orange-200 hover:bg-orange-50/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{s.product?.name || 'Unknown Product'}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          s.total >= 80 ? 'bg-green-50 text-green-700' :
                          s.total >= 50 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>{Math.round(s.total)}%</span>
                      </div>
                      <div className="flex gap-3 text-[10px] text-gray-400">
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
                        bulkTab === t ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-100'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <TableSkeleton rows={4} />
              ) : !bulkJobs?.data?.length ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="mx-auto h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No bulk jobs yet</p>
                  <p className="text-xs text-gray-400 mt-1">Select multiple products and run bulk AI actions</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-100 text-left text-gray-400 text-xs">
                      <th className="pb-2 pr-3">Product</th>
                      <th className="pb-2 pr-3">Type</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2 pr-3">Date</th>
                    </tr></thead>
                    <tbody>
                      {bulkJobs.data.map(job => (
                        <tr key={job.id} className="border-b border-gray-50">
                          <td className="py-2 pr-3 text-gray-700">{job.product?.name || job.productId.slice(0, 8)}</td>
                          <td className="py-2 pr-3 text-gray-500">{job.jobType.replace(/_/g, ' ')}</td>
                          <td className="py-2 pr-3">
                            <Badge className={
                              job.status === 'COMPLETED' ? 'bg-green-50 text-green-700' :
                              job.status === 'FAILED' ? 'bg-red-50 text-red-700' :
                              job.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700' :
                              'bg-gray-50 text-gray-500'
                            }>{job.status}</Badge>
                          </td>
                          <td className="py-2 pr-3 text-gray-400 text-xs">{new Date(job.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
              <div className="flex justify-between"><span className="text-gray-500">Scored Products</span><span className="font-medium">{dashboard?.scoredProducts ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Low Scoring</span><span className="font-medium text-red-600">{dashboard?.lowScoringProducts ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Missing Specs</span><span className="font-medium text-yellow-600">{dashboard?.missingSpecs ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Avg Title Quality</span><span className="font-medium">{dashboard?.avgTitleQuality ?? 0}%</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Avg Desc Quality</span><span className="font-medium">{dashboard?.avgDescQuality ?? 0}%</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
