'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { getQualityDashboard, listScores, detectDuplicates, getBulkCompleteness, getBulkStats, type HealthDashboard, type CatalogScore, type DuplicateResult, type BulkCompletenessResponse, type ProductCompletenessResponse } from '@/lib/api/ai'
import { Loader2, Shield, AlertTriangle, Image, FileText, ListChecks, Award, TrendingUp, BarChart3, Search, Package, Layers, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminCatalogIntelligencePage() {
  const [dashboard, setDashboard] = useState<HealthDashboard | null>(null)
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([])
  const [loading, setLoading] = useState(true)
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<ProductCompletenessResponse[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'duplicates' | 'completeness'>('overview')
  const [lowScoreProducts, setLowScoreProducts] = useState<CatalogScore[]>([])
  const { toast } = useToast()

  useEffect(() => {
    getQualityDashboard()
      .then(setDashboard)
      .catch(() => toast({ title: 'Error', description: 'Failed to load catalog intelligence dashboard', variant: 'destructive' }))
      .finally(() => setLoading(false))
    listScores({ minScore: 0, maxScore: 50, limit: 10 })
      .then(r => setLowScoreProducts(r.data || []))
      .catch((err) => { console.error('Failed to load low-score products:', err); toast({ title: 'Error', description: 'Failed to load low-score products', variant: 'destructive' }); })
  }, [toast])

  const handleDetectDuplicates = async () => {
    setDuplicateLoading(true)
    try {
      const result = await detectDuplicates({})
      setDuplicates(result)
    } catch {
      toast({ title: 'Error', description: 'Failed to detect duplicates', variant: 'destructive' })
    } finally {
      setDuplicateLoading(false)
    }
  }

  const handleBulkCompleteness = async () => {
    setBulkLoading(true)
    try {
      const allScores = await listScores({ limit: 50 })
      const lowIds = (allScores.data || []).filter(s => s.total < 70).map(s => s.productId)
      if (lowIds.length === 0) {
        toast({ title: 'Info', description: 'No low-scoring products found for analysis', variant: 'default' })
        setBulkLoading(false)
        return
      }
      const chunked: string[][] = []
      for (let i = 0; i < lowIds.length; i += 10) chunked.push(lowIds.slice(i, i + 10))
      const allResults: ProductCompletenessResponse[] = []
      for (const chunk of chunked) {
        const result = await getBulkCompleteness(chunk)
        allResults.push(...result.results)
      }
      setBulkResult(allResults)
      toast({ title: 'Success', description: `Analyzed ${allResults.length} products`, variant: 'default' })
    } catch {
      toast({ title: 'Error', description: 'Failed to run bulk completeness check', variant: 'destructive' })
    } finally {
      setBulkLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  )

  const statCards = [
    { label: 'Avg Quality Score', value: `${dashboard?.avgScore || 0}/100`, sub: `${dashboard?.scoredProducts || 0} products scored`, icon: Award, color: (dashboard?.avgScore || 0) >= 70 ? 'text-emerald-400' : (dashboard?.avgScore || 0) >= 50 ? 'text-amber-400' : 'text-red-400' },
    { label: 'Missing Images', value: dashboard?.missingImages || 0, sub: 'products without images', icon: Image, color: (dashboard?.missingImages || 0) > 50 ? 'text-red-400' : 'text-amber-400' },
    { label: 'Missing SEO', value: dashboard?.missingSeo || 0, sub: 'products without meta', icon: FileText, color: (dashboard?.missingSeo || 0) > 100 ? 'text-red-400' : 'text-amber-400' },
    { label: 'Missing Specs', value: dashboard?.missingSpecs || 0, sub: 'products without specs', icon: ListChecks, color: (dashboard?.missingSpecs || 0) > 50 ? 'text-red-400' : 'text-amber-400' },
    { label: 'Duplicate Risk', value: dashboard?.duplicateRiskCount || 0, sub: 'potential duplicates', icon: AlertTriangle, color: 'text-orange-400' },
    { label: 'Low Scoring', value: dashboard?.lowScoringProducts || 0, sub: 'score < 50', icon: BarChart3, color: 'text-rose-400' },
  ]

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader title="Catalog Intelligence" description="Enterprise catalog quality, completeness, and commerce intelligence dashboard." />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="border-border bg-surface">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-text-secondary">{card.label}</CardTitle>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-text-primary">{card.value}</div>
                <p className="text-xs text-text-tertiary mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex gap-2 border-b border-border">
          {(['overview', 'duplicates', 'completeness'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}>
              {tab === 'overview' && <BarChart3 className="h-4 w-4 inline mr-1" />}
              {tab === 'duplicates' && <AlertTriangle className="h-4 w-4 inline mr-1" />}
              {tab === 'completeness' && <CheckCircle className="h-4 w-4 inline mr-1" />}
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border bg-surface">
              <CardHeader><CardTitle className="text-text-primary">Quality Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Title Quality', value: dashboard?.avgTitleQuality || 0, color: 'bg-blue-500' },
                  { label: 'Description Quality', value: dashboard?.avgDescQuality || 0, color: 'bg-emerald-500' },
                  { label: 'Image Quality', value: dashboard?.avgImageQuality || 0, color: 'bg-purple-500' },
                  { label: 'Specification Quality', value: dashboard?.avgSpecQuality || 0, color: 'bg-amber-500' },
                  { label: 'SEO Quality', value: dashboard?.avgSeoQuality || 0, color: 'bg-cyan-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{item.label}</span>
                      <span className="text-text-primary font-medium">{item.value}/100</span>
                    </div>
                    <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${item.color}`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border bg-surface">
              <CardHeader><CardTitle className="text-text-primary">Low Scoring Products</CardTitle></CardHeader>
              <CardContent>
                {lowScoreProducts.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No low-scoring products found</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {lowScoreProducts.slice(0, 10).map(score => (
                      <div key={score.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-secondary">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate">{score.product?.name || 'Unknown'}</p>
                          <p className="text-xs text-text-tertiary">{score.product?.companyId?.slice(0, 8)}</p>
                        </div>
                        <span className={`text-sm font-bold ml-2 ${score.total < 30 ? 'text-red-400' : 'text-amber-400'}`}>{score.total}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/admin/products" className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:text-accent/80">
                  View all products <Package className="h-3 w-3" />
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border bg-surface">
              <CardHeader><CardTitle className="text-text-primary">Quick Actions</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Link href="/admin/brands" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-3 py-2 text-sm text-text-primary transition-colors"><Award className="h-4 w-4 text-accent" /> Manage Brands</Link>
                <Link href="/admin/attributes" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-3 py-2 text-sm text-text-primary transition-colors"><Layers className="h-4 w-4 text-accent" /> Attributes</Link>
                <Link href="/admin/search-console" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-3 py-2 text-sm text-text-primary transition-colors"><Search className="h-4 w-4 text-accent" /> Search Console</Link>
                <button onClick={handleDetectDuplicates} disabled={duplicateLoading}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-3 py-2 text-sm text-text-primary transition-colors disabled:opacity-50">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  {duplicateLoading ? 'Scanning...' : 'Scan Duplicates'}
                </button>
                <button onClick={handleBulkCompleteness} disabled={bulkLoading}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-3 py-2 text-sm text-text-primary transition-colors disabled:opacity-50">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  {bulkLoading ? 'Analyzing...' : 'Bulk Completeness'}
                </button>
                <Link href="/admin/products/approval" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-3 py-2 text-sm text-text-primary transition-colors"><Package className="h-4 w-4 text-accent" /> Approvals</Link>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'duplicates' && (
          <div className="mt-6">
            <Card className="border-border bg-surface">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-text-primary">Duplicate Detection</CardTitle>
                <button onClick={handleDetectDuplicates} disabled={duplicateLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-primary text-sm font-medium disabled:opacity-50">
                  {duplicateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {duplicateLoading ? 'Scanning...' : 'Run Scan'}
                </button>
              </CardHeader>
              <CardContent>
                {duplicates.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
                    <p className="text-text-primary font-medium">No duplicates detected</p>
                    <p className="text-sm text-text-tertiary mt-1">Click "Run Scan" to check for duplicate products</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-text-secondary text-xs uppercase">
                          <th className="text-left py-2 px-3">Product</th>
                          <th className="text-left py-2 px-3">Similar To</th>
                          <th className="text-center py-2 px-3">Confidence</th>
                          <th className="text-left py-2 px-3">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {duplicates.map((d, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-surface-secondary transition-colors">
                            <td className="py-2 px-3 text-text-primary">{d.productName || d.productId?.slice(0, 8)}</td>
                            <td className="py-2 px-3 text-text-secondary">{d.similarTo?.slice(0, 30)}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                d.confidence === 'HIGH' ? 'bg-red-500/20 text-red-400'
                                : d.confidence === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {d.confidence === 'HIGH' && <AlertCircle className="h-3 w-3" />}
                                {d.confidence === 'MEDIUM' && <AlertTriangle className="h-3 w-3" />}
                                {d.confidence === 'LOW' && <XCircle className="h-3 w-3" />}
                                {d.confidence}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-text-tertiary text-xs">{d.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'completeness' && (
          <div className="mt-6">
            <Card className="border-border bg-surface">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-text-primary">Product Completeness Analysis</CardTitle>
                <button onClick={handleBulkCompleteness} disabled={bulkLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-primary text-sm font-medium disabled:opacity-50">
                  {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                  {bulkLoading ? 'Analyzing...' : 'Analyze Low-Score Products'}
                </button>
              </CardHeader>
              <CardContent>
                {bulkResult.length === 0 ? (
                  <div className="text-center py-8">
                    <ListChecks className="h-12 w-12 text-accent mx-auto mb-3" />
                    <p className="text-text-primary font-medium">No completeness data</p>
                    <p className="text-sm text-text-tertiary mt-1">Click "Analyze Low-Score Products" to start</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {bulkResult.map(r => (
                      <div key={r.productId} className="p-3 rounded-lg bg-surface-secondary border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-text-primary truncate">{r.productName || r.productId.slice(0, 8)}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            r.grade === 'A' ? 'bg-emerald-500/20 text-emerald-400'
                            : r.grade === 'B' ? 'bg-blue-500/20 text-blue-400'
                            : r.grade === 'C' ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                          }`}>Grade {r.grade}</span>
                        </div>
                        <div className="w-full h-1.5 bg-bg-base rounded-full overflow-hidden mb-2">
                          <div className={`h-full rounded-full ${
                            r.completionPercent >= 80 ? 'bg-emerald-500' : r.completionPercent >= 60 ? 'bg-blue-500' : r.completionPercent >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${r.completionPercent}%` }} />
                        </div>
                        <div className="flex gap-3 text-xs text-text-tertiary">
                          <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-400" /> {r.presentFields} present</span>
                          <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-400" /> {r.incompleteFields} incomplete</span>
                          <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-400" /> {r.missingFields} missing</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}