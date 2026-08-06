'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import {
  reindexEnterpriseSearch,
  getEnterpriseSearchHealth,
  getEnterpriseSearchAnalyticsSummary,
  getEnterpriseTopQueries,
  getEnterpriseZeroResultQueries,
  getEnterprisePopularBrands,
  getEnterprisePopularCategories,
  getEnterprisePopularAttributes,
  type IndexHealth,
  type SearchAnalyticsSummary,
  type PopularItem,
} from '@/lib/api/enterprise-search'
import {
  Database,
  Search,
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  TrendingUp,
  Tag,
  Layers,
  AlertTriangle,
  Award,
} from 'lucide-react'

const ALL_INDICES = ['enterprise_brands', 'enterprise_attributes', 'enterprise_synonyms', 'enterprise_mappings']

const BUILTIN_SYNONYMS = [
  { term: 'mobile', synonyms: ['cellphone', 'smartphone', 'handset'] },
  { term: 'laptop', synonyms: ['notebook', 'ultrabook'] },
  { term: 'shoes', synonyms: ['footwear', 'sneakers', 'trainers'] },
  { term: 'tv', synonyms: ['television', 'led tv', 'smart tv'] },
  { term: 'car', synonyms: ['automobile', 'vehicle'] },
  { term: 'apparel', synonyms: ['clothing', 'garments', 'attire'] },
  { term: 'furniture', synonyms: ['furnishings', 'home decor'] },
  { term: 'electronics', synonyms: ['gadgets', 'electrical appliances'] },
  { term: 'cosmetics', synonyms: ['makeup', 'beauty products', 'skincare'] },
  { term: 'machinery', synonyms: ['equipment', 'industrial equipment'] },
]

function IndexesPanel() {
  const [selected, setSelected] = useState<string[]>([]);
  const [reindexing, setReindexing] = useState(false);
  const [health, setHealth] = useState<IndexHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHealth = useCallback(async () => {
    try {
      const res = await getEnterpriseSearchHealth(ALL_INDICES);
      setHealth(res);
    } catch { toast({ title: 'Error', description: 'Failed to load index health', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const toggleIndex = (name: string) => {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleReindex = async () => {
    const indices = selected.length > 0 ? selected : undefined;
    setReindexing(true);
    try {
      const res = await reindexEnterpriseSearch(indices);
      toast({ title: 'Reindex Complete', description: `${JSON.stringify(res)}` });
      fetchHealth();
    } catch { toast({ title: 'Error', description: 'Reindex failed', variant: 'destructive' });
    } finally { setReindexing(false); }
  };

  if (loading) return (
    <div className="flex justify-center mt-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
  );

  return (
    <div className="space-y-6">
      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-text-primary">Reindex Search Indices</CardTitle>
          <CardDescription>Select indices to rebuild. Leave all unchecked to reindex everything.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-4">
            {ALL_INDICES.map(name => (
              <Checkbox
                key={name}
                label={name.replace('enterprise_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                checked={selected.includes(name)}
                onChange={() => toggleIndex(name)}
              />
            ))}
          </div>
          <Button onClick={handleReindex} disabled={reindexing} className="bg-accent text-btn-primary-text hover:bg-accent/90">
            {reindexing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            {reindexing ? 'Reindexing...' : 'Reindex Selected'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border bg-surface">
        <CardHeader>
          <CardTitle className="text-text-primary">Index Health Status</CardTitle>
          <CardDescription>Current state of each search index.</CardDescription>
        </CardHeader>
        <CardContent>
              {health && (
            <div className="space-y-3">
              {Object.entries(health.indices).map(([name, idx]) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary px-4 py-3">
                  <div className="flex items-center gap-3">
                    {idx.exists
                      ? <CheckCircle2 className="h-5 w-5 text-status-success" />
                      : <XCircle className="h-5 w-5 text-status-error" />}
                    <div>
                      <div className="text-sm font-medium text-text-primary">{name}</div>
                      <div className="text-xs text-text-tertiary">{idx.exists ? 'Index exists' : 'Does not exist'}</div>
                    </div>
                  </div>
                  <Badge variant={idx.exists ? 'success' : 'destructive'}>{idx.exists ? 'Active' : 'Missing'}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SynonymsPanel() {
  const [search, setSearch] = useState('');

  const filtered = BUILTIN_SYNONYMS.filter(s =>
    !search || s.term.toLowerCase().includes(search.toLowerCase()) || s.synonyms.some(syn => syn.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <Card className="border-border bg-surface mb-6">
        <CardHeader>
          <CardTitle className="text-text-primary">Built-in Synonyms</CardTitle>
          <CardDescription>Pre-configured search synonym mappings. When the backend is available, synonyms can be managed via the Taxonomy Engine.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search terms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md mb-4"
          />
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-text-tertiary">No synonyms match your search.</div>
          ) : (
            <div className="space-y-2">
              {filtered.map(syn => (
                <div key={syn.term} className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary px-4 py-3">
                  <Search className="h-4 w-4 text-accent shrink-0" />
                  <span className="text-sm font-medium text-text-primary">{syn.term}</span>
                  <span className="text-text-tertiary">→</span>
                  <span className="text-sm text-text-secondary">{syn.synonyms.join(', ')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsPanel() {
  const [summary, setSummary] = useState<SearchAnalyticsSummary | null>(null);
  const [topQueries, setTopQueries] = useState<PopularItem[]>([]);
  const [zeroResultQueries, setZeroResultQueries] = useState<PopularItem[]>([]);
  const [popularBrands, setPopularBrands] = useState<PopularItem[]>([]);
  const [popularCategories, setPopularCategories] = useState<PopularItem[]>([]);
  const [popularAttributes, setPopularAttributes] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    try {
      const [s, tq, zr, pb, pc, pa] = await Promise.all([
        getEnterpriseSearchAnalyticsSummary(30),
        getEnterpriseTopQueries(undefined, 30, 10),
        getEnterpriseZeroResultQueries(undefined, 30, 10),
        getEnterprisePopularBrands(30, 10),
        getEnterprisePopularCategories(30, 10),
        getEnterprisePopularAttributes(30, 10),
      ]);
      setSummary(s);
      setTopQueries(Array.isArray(tq) ? tq : []);
      setZeroResultQueries(Array.isArray(zr) ? zr : []);
      setPopularBrands(Array.isArray(pb) ? pb : []);
      setPopularCategories(Array.isArray(pc) ? pc : []);
      setPopularAttributes(Array.isArray(pa) ? pa : []);
    } catch { toast({ title: 'Error', description: 'Failed to load analytics data', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return (
    <div className="flex justify-center mt-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
  );

  const statCards = [
    { label: 'Total Searches', value: summary?.totalSearches ?? 0, icon: Search, color: 'text-blue-400' },
    { label: 'Unique Queries', value: summary?.uniqueQueries ?? 0, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Zero-Result Rate', value: summary ? `${(summary.zeroResultRate * 100).toFixed(1)}%` : '0%', icon: AlertTriangle, color: summary && summary.zeroResultRate > 0.2 ? 'text-red-400' : 'text-amber-400' },
    { label: 'Zero-Result Searches', value: summary?.zeroResultSearches ?? 0, icon: BarChart3, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.label} className="border-border bg-surface">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-text-secondary">{card.label}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-text-primary">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border bg-surface">
          <CardHeader><CardTitle className="text-text-primary text-base">Top Queries</CardTitle></CardHeader>
          <CardContent>
            {topQueries.length === 0 ? (
              <div className="text-center py-6 text-text-tertiary">No data available.</div>
            ) : (
              <div className="space-y-2">
                {topQueries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
                    <span className="text-sm text-text-primary">{q.query}</span>
                    <span className="text-xs text-text-tertiary">{q.count.toLocaleString()} searches</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardHeader><CardTitle className="text-text-primary text-base">Zero-Result Queries</CardTitle></CardHeader>
          <CardContent>
            {zeroResultQueries.length === 0 ? (
              <div className="text-center py-6 text-text-tertiary">No zero-result queries.</div>
            ) : (
              <div className="space-y-2">
                {zeroResultQueries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
                    <span className="text-sm text-text-primary">{q.query}</span>
                    <span className="text-xs text-text-tertiary">{q.count.toLocaleString()} missed</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border bg-surface">
          <CardHeader className="pb-2"><CardTitle className="text-text-primary text-sm flex items-center gap-2"><Award className="h-4 w-4 text-accent" /> Popular Brands</CardTitle></CardHeader>
          <CardContent>
            {popularBrands.length === 0 ? <div className="text-center py-4 text-text-tertiary text-sm">No data.</div> : (
              <div className="space-y-1.5">
                {popularBrands.map((b, i) => (
                  <div key={i} className="flex justify-between text-sm"><span className="text-text-primary">{b.query}</span><span className="text-text-tertiary">{b.count}</span></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardHeader className="pb-2"><CardTitle className="text-text-primary text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-accent" /> Popular Categories</CardTitle></CardHeader>
          <CardContent>
            {popularCategories.length === 0 ? <div className="text-center py-4 text-text-tertiary text-sm">No data.</div> : (
              <div className="space-y-1.5">
                {popularCategories.map((c, i) => (
                  <div key={i} className="flex justify-between text-sm"><span className="text-text-primary">{c.query}</span><span className="text-text-tertiary">{c.count}</span></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-surface">
          <CardHeader className="pb-2"><CardTitle className="text-text-primary text-sm flex items-center gap-2"><Tag className="h-4 w-4 text-accent" /> Popular Attributes</CardTitle></CardHeader>
          <CardContent>
            {popularAttributes.length === 0 ? <div className="text-center py-4 text-text-tertiary text-sm">No data.</div> : (
              <div className="space-y-1.5">
                {popularAttributes.map((a, i) => (
                  <div key={i} className="flex justify-between text-sm"><span className="text-text-primary">{a.query}</span><span className="text-text-tertiary">{a.count}</span></div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HealthPanel() {
  const [health, setHealth] = useState<IndexHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchHealth = useCallback(async () => {
    try {
      const res = await getEnterpriseSearchHealth(ALL_INDICES);
      setHealth(res);
    } catch { toast({ title: 'Error', description: 'Failed to load health', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const handleCreate = async (name: string) => {
    setCreating(name);
    try {
      await reindexEnterpriseSearch([name]);
      toast({ title: 'Index Created', description: `${name} has been created and populated.` });
      fetchHealth();
    } catch { toast({ title: 'Error', description: `Failed to create ${name}`, variant: 'destructive' });
    } finally { setCreating(null); }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete index "${name}"? This action cannot be undone.`)) return;
    setDeleting(name);
    try {
      const { default: api } = await import('@/lib/api/client');
      await api.delete(`/enterprise-catalog/search/index/${name}`);
      toast({ title: 'Index Deleted', description: `${name} has been removed.` });
      fetchHealth();
    } catch { toast({ title: 'Error', description: `Failed to delete ${name}`, variant: 'destructive' });
    } finally { setDeleting(null); }
  };

  if (loading) return (
    <div className="flex justify-center mt-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
  );

  return (
    <div className="space-y-6">
      {health && (
        <Card className="border-border bg-surface">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-text-primary">Index Health Summary</CardTitle>
                <CardDescription>{health.healthyIndices} of {health.totalIndices} indices healthy.</CardDescription>
              </div>
              <Badge variant={health.allExist ? 'success' : health.healthyIndices > 0 ? 'warning' : 'destructive'} className="text-sm px-4 py-1.5">
                {health.allExist ? 'All Healthy' : health.healthyIndices > 0 ? 'Degraded' : 'Critical'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health && Object.entries(health.indices).map(([name, idx]) => (
                <div key={name} className="flex items-center justify-between rounded-xl border border-border bg-surface-secondary px-4 py-3">
                  <div className="flex items-center gap-3">
                    {idx.exists
                      ? <CheckCircle2 className="h-5 w-5 text-status-success" />
                      : <XCircle className="h-5 w-5 text-status-error" />}
                    <div>
                      <div className="text-sm font-medium text-text-primary">{name}</div>
                      <div className="text-xs text-text-tertiary">{idx.exists ? 'Exists' : 'Missing'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!idx.exists ? (
                      <Button size="sm" onClick={() => handleCreate(name)} disabled={creating === name} className="bg-accent text-btn-primary-text hover:bg-accent/90">
                        {creating === name ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Database className="h-3 w-3 mr-1" />}
                        Create
                      </Button>
                    ) : (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(name)} disabled={deleting === name}>
                        {deleting === name ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-surface">
        <CardHeader><CardTitle className="text-text-primary">Service Status</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-secondary px-4 py-3">
            {health?.allExist
              ? <CheckCircle2 className="h-6 w-6 text-status-success" />
              : <AlertTriangle className="h-6 w-6 text-status-warning" />}
            <div>
              <div className="text-sm font-medium text-text-primary">
                {health?.allExist ? 'Enterprise Search is operational' : 'Some indices require attention'}
              </div>
              <div className="text-xs text-text-tertiary">
                {health?.allExist
                  ? 'All search indices are present and healthy.'
                  : `${health ? health.totalIndices - health.healthyIndices : 0} index(es) out of ${health?.totalIndices ?? 0} are missing. Use the Create button to rebuild missing indices.`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSearchConsolePage() {
  const [tab, setTab] = useState('indexes');
  const [refreshKey, setRefreshKey] = useState(0);
  const onRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <PageHeader title="Search Console" description="Enterprise Search Intelligence Platform" />

        <div className="mt-8">
          <Tabs
            tabs={[
              { value: 'indexes', label: 'Indexes', icon: <Database className="h-4 w-4" /> },
              { value: 'synonyms', label: 'Synonyms', icon: <Search className="h-4 w-4" /> },
              { value: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
              { value: 'health', label: 'Health', icon: <Activity className="h-4 w-4" /> },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="mt-6" key={refreshKey}>
            {tab === 'indexes' && <IndexesPanel />}
            {tab === 'synonyms' && <SynonymsPanel />}
            {tab === 'analytics' && <AnalyticsPanel />}
            {tab === 'health' && <HealthPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
