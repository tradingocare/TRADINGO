'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { getCatalogDashboard, type CatalogDashboard } from '@/lib/api/enterprise-catalog'
import { LayoutGrid, Package, Tags, Layers, Award, BarChart3, Shield, Search, Loader2 } from 'lucide-react'

export default function AdminCatalogPage() {
  const [data, setData] = useState<CatalogDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getCatalogDashboard()
      .then(setData)
      .catch(() => toast({ title: 'Error', description: 'Failed to load catalog dashboard', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );

  const statCards = [
    { label: 'Categories', value: `${data?.categories.active || 0}/${data?.categories.total || 0}`, sub: 'Active / Total', icon: Layers, href: '/admin/categories', color: 'text-blue-400' },
    { label: 'Global Brands', value: data?.brands.total || 0, sub: `${data?.brands.verified || 0} Verified`, icon: Award, href: '/admin/brands', color: 'text-emerald-400' },
    { label: 'Attributes', value: data?.attributes.total || 0, sub: 'Reusable definitions', icon: Tags, href: '/admin/attributes', color: 'text-purple-400' },
    { label: 'Synonyms', value: data?.synonyms.total || 0, sub: 'Search terms', icon: Search, href: '/admin/taxonomy', color: 'text-amber-400' },
    { label: 'Industry Mappings', value: data?.industryMappings.total || 0, sub: 'Category links', icon: LayoutGrid, href: '/admin/taxonomy', color: 'text-rose-400' },
    { label: 'Products', value: data?.products.total || 0, sub: `${data?.products.pendingApprovals || 0} pending`, icon: Package, href: '/admin/products', color: 'text-cyan-400' },
    { label: 'Quality Score', value: data?.quality.avgScore || 0, sub: `${data?.quality.scoredProducts || 0} scored`, icon: BarChart3, href: '/admin/products', color: data && data.quality.avgScore >= 70 ? 'text-emerald-400' : 'text-orange-400' },
    { label: 'Import Jobs', value: data?.imports.totalJobs || 0, sub: 'Catalog imports', icon: Shield, href: '/admin/catalog-import', color: 'text-indigo-400' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader title="Catalog Console" description="Enterprise Master Catalog management dashboard." />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <Card className="border-border bg-surface hover:bg-surface-secondary transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-text-secondary">{card.label}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-text-primary">{card.value}</div>
                  <p className="text-xs text-text-tertiary mt-1">{card.sub}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border bg-surface">
            <CardHeader><CardTitle className="text-text-primary">Quick Actions</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link href="/admin/categories" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-4 py-3 text-sm text-text-primary transition-colors"><Layers className="h-4 w-4 text-accent" /> Manage Categories</Link>
              <Link href="/admin/brands" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-4 py-3 text-sm text-text-primary transition-colors"><Award className="h-4 w-4 text-accent" /> Manage Brands</Link>
              <Link href="/admin/attributes" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-4 py-3 text-sm text-text-primary transition-colors"><Tags className="h-4 w-4 text-accent" /> Manage Attributes</Link>
              <Link href="/admin/taxonomy" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-4 py-3 text-sm text-text-primary transition-colors"><Search className="h-4 w-4 text-accent" /> Manage Taxonomy</Link>
              <Link href="/admin/catalog-import" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-4 py-3 text-sm text-text-primary transition-colors"><Shield className="h-4 w-4 text-accent" /> Import Catalog</Link>
              <Link href="/admin/products/approval" className="flex items-center gap-2 rounded-xl border border-border bg-surface-secondary hover:bg-surface px-4 py-3 text-sm text-text-primary transition-colors"><Package className="h-4 w-4 text-accent" /> Product Approvals</Link>
            </CardContent>
          </Card>

          <Card className="border-border bg-surface">
            <CardHeader><CardTitle className="text-text-primary">Product Health</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Pending Approval', value: data?.products.pendingApprovals || 0, max: Math.max(data?.products.total || 1, 1), color: 'bg-amber-500' },
                { label: 'Missing Images', value: data?.products.missingImages || 0, max: Math.max(data?.products.total || 1, 1), color: 'bg-red-500' },
                { label: 'Missing SEO', value: data?.products.missingSeo || 0, max: Math.max(data?.products.total || 1, 1), color: 'bg-orange-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-secondary">{item.label}</span>
                    <span className="text-text-primary font-medium">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-border overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-secondary">Average Quality Score</span>
                  <span className={`font-medium ${data && data.quality.avgScore >= 70 ? 'text-emerald-400' : 'text-orange-400'}`}>{data?.quality.avgScore || 0}/100</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${data && data.quality.avgScore >= 70 ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${data?.quality.avgScore || 0}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
