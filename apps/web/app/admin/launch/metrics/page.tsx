'use client';

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { DashboardPageHeader, StatCard, DashboardSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Package,
  Search,
  Eye,
  TrendingUp,
  Users,
  Rocket,
  Activity,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import {
  getCompanyMetrics,
  getProductMetrics,
  getSearchMetrics,
  getTrafficMetrics,
  getConversionMetrics,
} from '@/lib/api/launch';

type Section = 'company' | 'products' | 'search' | 'traffic' | 'conversion';

const sections: { id: Section; label: string; icon: ReactNode }[] = [
  { id: 'company', label: 'Company Onboarding', icon: <Building2 className="h-4 w-4" /> },
  { id: 'products', label: 'Products', icon: <Package className="h-4 w-4" /> },
  { id: 'search', label: 'Search', icon: <Search className="h-4 w-4" /> },
  { id: 'traffic', label: 'Traffic', icon: <Eye className="h-4 w-4" /> },
  { id: 'conversion', label: 'Conversion', icon: <TrendingUp className="h-4 w-4" /> },
];

function ListCard({ title, items }: { title: string; items: Record<string, number> | [string, number][] }) {
  const entries: [string, number][] = Array.isArray(items) ? items : Object.entries(items);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No data</p>
        ) : (
          <div className="space-y-2">
            {entries.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-text-primary dark:text-dark-text-primary">{key}</span>
                <span className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DailyTrendCard({ title, data }: { title: string; data: { date: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No data</p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {data.map((entry) => (
              <div key={entry.date} className="flex items-center justify-between py-1">
                <span className="text-sm text-text-primary dark:text-dark-text-primary">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{entry.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function useSectionData<T>(fetcher: () => Promise<T>, active: boolean) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load section data'));
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (active && !data) {
      fetch();
    }
  }, [active, data, fetch]);

  return { data, loading, error, refetch: fetch };
}

function SectionLoading() {
  return <DashboardSkeleton />;
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
      <Activity className="h-12 w-12 text-red-500" />
      <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load section</p>
      <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{message}</p>
      <Button onClick={onRetry} className="mt-4">
        Retry
      </Button>
    </div>
  );
}

function CompanySection() {
  const { data, loading, error, refetch } = useSectionData(getCompanyMetrics, true);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error.message} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Building2} label="Total Companies" value={String(data.total)} change="Registered" changeType="neutral" />
        <StatCard icon={CheckCircle2} label="Avg Trust Score" value={String(data.avgTrustScore)} change="Score" changeType="neutral" />
        <StatCard icon={Activity} label="Avg Time to Onboard" value={`${data.avgTimeToOnboardDays}d`} change="Days" changeType="neutral" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ListCard title="By Status" items={data.byStatus} />
        <ListCard title="By Verification Level" items={data.byVerificationLevel} />
        <ListCard title="By Onboarding Step" items={data.byOnboardingStep} />
        <ListCard title="By Subscription Plan" items={data.bySubscriptionPlan} />
      </div>
    </div>
  );
}

function ProductsSection() {
  const { data, loading, error, refetch } = useSectionData(getProductMetrics, true);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error.message} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Package} label="Total Products" value={String(data.total)} change="Listed" changeType="neutral" />
        <StatCard icon={CheckCircle2} label="With Images" value={String(data.withImages)} change="Has images" changeType="neutral" />
        <StatCard icon={Eye} label="Without Images" value={String(data.withoutImages)} change="Missing images" changeType="neutral" />
        <StatCard icon={BarChart3} label="Import Jobs" value={String(data.importJobCount)} change="Jobs" changeType="neutral" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ListCard title="By Status" items={data.byStatus} />
        <ListCard title="Top Categories" items={Object.entries(data.byCategory).slice(0, 10)} />
        <ListCard title="By Type" items={data.byType} />
      </div>
    </div>
  );
}

function SearchSection() {
  const { data, loading, error, refetch } = useSectionData(getSearchMetrics, true);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error.message} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Search} label="Total Searches" value={String(data.totalSearches)} change="All time" changeType="neutral" />
        <StatCard icon={Users} label="Unique Searchers" value={String(data.uniqueSearchers)} change="Unique" changeType="neutral" />
        <StatCard icon={Activity} label="Zero-Result Searches" value={String(data.zeroResultSearches)} change="No results" changeType="neutral" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Queries</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topQueries.length === 0 ? (
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">No data</p>
            ) : (
              <div className="space-y-2">
                {data.topQueries.slice(0, 10).map((q, i) => (
                  <div key={q.query} className="flex items-center justify-between py-1">
                    <span className="text-sm text-text-primary dark:text-dark-text-primary">
                      {i + 1}. {q.query}
                    </span>
                    <span className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{q.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <DailyTrendCard title="Daily Trend (Last 14 Days)" data={data.dailyTrend.slice(-14)} />
      </div>
    </div>
  );
}

function TrafficSection() {
  const { data, loading, error, refetch } = useSectionData(getTrafficMetrics, true);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error.message} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
        <StatCard icon={Eye} label="Total Page Views" value={String(data.totalPageViews)} change="All time" changeType="neutral" />
        <StatCard icon={Users} label="Unique Visitors" value={String(data.uniqueVisitors)} change="Unique" changeType="neutral" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard title="Top Pages" items={Object.entries(data.byPage).slice(0, 10)} />
        <DailyTrendCard title="Daily Trend (Last 14 Days)" data={data.dailyTrend.slice(-14)} />
      </div>
    </div>
  );
}

function ConversionSection() {
  const { data, loading, error, refetch } = useSectionData(getConversionMetrics, true);

  if (loading) return <SectionLoading />;
  if (error) return <SectionError message={error.message} onRetry={refetch} />;
  if (!data) return null;

  const conversionRates: [string, number][] = [
    ['Signup → Company', data.signupToCompanyRate],
    ['Company → Product', data.companyToProductRate],
    ['Product → First Order', data.productToFirstOrderRate],
    ['First → Repeat Order', data.firstToRepeatOrderRate],
  ];

  const avgDays: [string, number][] = [
    ['Signup → Company', data.avgDaysSignupToCompany],
    ['Company → Product', data.avgDaysCompanyToProduct],
    ['Product → First Order', data.avgDaysProductToFirstOrder],
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Users} label="Signups" value={String(data.totalSignups)} change="Total" changeType="neutral" />
        <StatCard icon={Building2} label="Companies" value={String(data.companiesCreated)} change="Created" changeType="neutral" />
        <StatCard icon={Package} label="Products" value={String(data.productsAdded)} change="Added" changeType="neutral" />
        <StatCard icon={Rocket} label="First Orders" value={String(data.firstOrders)} change="First" changeType="neutral" />
        <StatCard icon={Activity} label="Repeat Orders" value={String(data.repeatOrders)} change="Repeat" changeType="neutral" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Conversion Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {conversionRates.map(([label, rate]) => (
              <div key={label}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary dark:text-dark-text-primary">{label}</span>
                  <span className="font-medium text-text-secondary dark:text-dark-text-secondary">{rate}%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
                  <div
                    className="h-2 rounded-full bg-primary-500"
                    style={{ width: `${Math.min(rate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Days Between Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {avgDays.map(([label, days]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-text-primary dark:text-dark-text-primary">{label}</span>
                <span className="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">{days.toFixed(1)} days</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const sectionComponents: Record<Section, () => ReactNode> = {
  company: CompanySection,
  products: ProductsSection,
  search: SearchSection,
  traffic: TrafficSection,
  conversion: ConversionSection,
};

export default function LaunchMetricsPage() {
  const [activeSection, setActiveSection] = useState<Section>('company');
  const SectionComponent = sectionComponents[activeSection];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Launch Metrics" description="Consolidated Phase 7E metrics" />

      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <Button
            key={s.id}
            variant={activeSection === s.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveSection(s.id)}
          >
            {s.icon}
            <span className="ml-2">{s.label}</span>
          </Button>
        ))}
      </div>

      <SectionComponent />
    </div>
  );
}
