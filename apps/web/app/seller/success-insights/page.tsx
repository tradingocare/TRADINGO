'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { apiClient } from '@/lib/api-client'
import { QualityBadge } from '@/components/enterprise-catalog/quality-badge'
import { Loader2, Image, FileText, ListChecks, AlertTriangle, BarChart3, TrendingUp, Award, Search, Sparkles, Package } from 'lucide-react'
import Link from 'next/link'

interface SellerQualityDashboard {
  avgScore: number
  totalProducts: number
  scoredProducts: number
  missingImages: number
  missingSeo: number
  missingSpecs: number
  missingAttributes: number
  lowScoringProducts: number
  duplicateRiskCount: number
  scoreDistribution: Array<{ total: number; _count: { total: number } }>
}

export default function SellerSuccessInsightsPage() {
  const [data, setData] = useState<SellerQualityDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    apiClient.get<SellerQualityDashboard>('/ai/quality/seller-dashboard')
      .then(r => setData(r))
      .catch(() => toast({ title: 'Error', description: 'Failed to load seller insights', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [toast])

  if (loading) return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center"><p className="text-text-primary font-medium">Could not load insights</p></div>
    </div>
  )

  const seoHealth = data.totalProducts > 0 ? Math.round(((data.totalProducts - data.missingSeo) / data.totalProducts) * 100) : 0
  const imageHealth = data.totalProducts > 0 ? Math.round(((data.totalProducts - data.missingImages) / data.totalProducts) * 100) : 0
  const specHealth = data.totalProducts > 0 ? Math.round(((data.totalProducts - data.missingSpecs) / data.totalProducts) * 100) : 0
  const attrHealth = data.totalProducts > 0 ? Math.round(((data.totalProducts - data.missingAttributes) / data.totalProducts) * 100) : 0

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader title="Seller Success Insights" description="AI-powered intelligence to improve your product quality and marketplace performance." />

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border bg-surface">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Avg Quality Score</CardTitle></CardHeader>
            <CardContent><QualityBadge score={data.avgScore || 0} size="lg" showLabel /><p className="text-xs text-text-tertiary mt-1">{data.scoredProducts}/{data.totalProducts} products scored</p></CardContent>
          </Card>
          <Card className="border-border bg-surface">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Products Below 70</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-amber-400">{data.lowScoringProducts}</div><p className="text-xs text-text-tertiary mt-1">Need quality improvement</p></CardContent>
          </Card>
          <Card className="border-border bg-surface">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Duplicate Risk</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-orange-400">{data.duplicateRiskCount}</div><p className="text-xs text-text-tertiary mt-1">Potential duplicates</p></CardContent>
          </Card>
          <Card className="border-border bg-surface">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary">Total Products</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-text-primary">{data.totalProducts}</div><p className="text-xs text-text-tertiary mt-1">{data.scoredProducts} with quality scores</p></CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border bg-surface">
            <CardHeader><CardTitle className="text-text-primary">Health Scores</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'SEO Health', value: seoHealth, icon: Search, color: 'bg-cyan-500', textColor: 'text-cyan-400', missing: data.missingSeo },
                { label: 'Image Coverage', value: imageHealth, icon: Image, color: 'bg-purple-500', textColor: 'text-purple-400', missing: data.missingImages },
                { label: 'Specification Coverage', value: specHealth, icon: ListChecks, color: 'bg-blue-500', textColor: 'text-blue-400', missing: data.missingSpecs },
                { label: 'Attribute Coverage', value: attrHealth, icon: BarChart3, color: 'bg-emerald-500', textColor: 'text-emerald-400', missing: data.missingAttributes },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-1.5 text-text-secondary"><item.icon className="h-3.5 w-3.5" />{item.label}</span>
                    <span className={`font-medium ${item.textColor}`}>{item.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-bg-base rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${item.value}%` }} />
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{item.missing} products missing</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-surface">
            <CardHeader><CardTitle className="text-text-primary">Top Opportunities</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Sparkles, label: 'AI Improve Products', desc: `${data.lowScoringProducts} products need AI optimization`, href: '/seller/products', color: 'text-accent' },
                { icon: AlertTriangle, label: 'Fix Duplicates', desc: `${data.duplicateRiskCount} potential duplicates found`, href: '/seller/products', color: 'text-amber-400' },
                { icon: Image, label: 'Add Missing Images', desc: `${data.missingImages} products without images`, href: '/seller/products', color: 'text-purple-400' },
                { icon: Search, label: 'Improve SEO', desc: `${data.missingSeo} products missing SEO metadata`, href: '/seller/products', color: 'text-cyan-400' },
                { icon: Award, label: 'Complete Profiles', desc: `${data.lowScoringProducts} products below quality threshold`, href: '/seller/products', color: 'text-emerald-400' },
              ].map((item, i) => (
                <Link key={i} href={item.href} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-secondary hover:bg-surface border border-border transition-colors">
                  <item.icon className={`h-5 w-5 ${item.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{item.label}</p>
                    <p className="text-xs text-text-tertiary">{item.desc}</p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-text-tertiary shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Link href="/seller/products">
            <Card className="border-border bg-surface hover:bg-surface-secondary transition-colors cursor-pointer">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2"><Package className="h-4 w-4 text-accent" />Manage Products</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-text-tertiary">View and manage all your products with quality insights</p></CardContent>
            </Card>
          </Link>
          <Link href="/seller/products/new">
            <Card className="border-border bg-surface hover:bg-surface-secondary transition-colors cursor-pointer">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2"><Sparkles className="h-4 w-4 text-accent" />Create Product</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-text-tertiary">Create a new AI-optimized product with realtime quality scoring</p></CardContent>
            </Card>
          </Link>
          <Link href="/seller/ecosystem">
            <Card className="border-border bg-surface hover:bg-surface-secondary transition-colors cursor-pointer">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-text-secondary flex items-center gap-2"><Award className="h-4 w-4 text-accent" />Ecosystem Rewards</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-text-tertiary">Earn GOCASH rewards for improving product quality</p></CardContent>
            </Card>
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-text-tertiary p-3 rounded-lg bg-surface-secondary border border-border">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>AI-powered insights update in real-time. <strong className="text-text-primary">Improve your product quality</strong> to increase discoverability, trust, and sales.</span>
        </div>
      </div>
    </div>
  )
}