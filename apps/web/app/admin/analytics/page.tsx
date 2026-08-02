'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, DashboardSkeleton } from '@/components/dashboard';
import { Alert } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { useAnalytics } from '@/hooks';
import { useGrowthSummary, useAcquisitionFunnel, useCampaignPerformance, useReferralConversion, useLeadConversion, useTopLandingPages, useTrafficSources } from '@/hooks/use-growth-intelligence';
import { Users, Building2, ShoppingCart, IndianRupee, TrendingUp, Activity, Target, Megaphone, Link, Globe, GitBranch, BarChart3 } from 'lucide-react';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const DAY_PRESETS = [7, 30, 90] as const;

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading, error } = useAnalytics();
  const summary = useGrowthSummary(days);
  const funnel = useAcquisitionFunnel(days);
  const campaign = useCampaignPerformance(days);
  const referral = useReferralConversion(days);
  const lead = useLeadConversion(days);
  const landing = useTopLandingPages(days);
  const sources = useTrafficSources(days);

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Platform Analytics" description="Overall platform metrics" />
        <Alert variant="error" title="Failed to load analytics">{error.message}</Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Platform Analytics" description="Overall platform metrics" />
        <DashboardSkeleton />
      </div>
    );
  }

  const {
    gmv = 0,
    orders = 0,
    totalSellers = 0,
    rfqs = 0,
    payments = 0,
    growth,
  } = data ?? {};
  const growthRate = growth?.growthRate ?? 0;
  const aov = orders > 0 ? Math.round(gmv / orders) : 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Platform Analytics"
        description="Overall platform metrics"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total RFQs" value={String(rfqs)} change="All time" changeType="neutral" />
        <StatCard icon={Building2} label="Total Orders" value={String(orders)} change="All time" changeType="neutral" />
        <StatCard icon={ShoppingCart} label="Total Sellers" value={String(totalSellers)} change="Listed" changeType="neutral" />
        <StatCard icon={IndianRupee} label="GMV" value={formatINR(gmv)} change={growthRate > 0 ? `+${growthRate}%` : `${growthRate}%`} changeType={growthRate >= 0 ? 'positive' : 'negative'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Monthly Trades</h2>
              <p className="mt-1 text-sm text-text-secondary">Number of completed trades per month</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between gap-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
              const heights = [40, 55, 45, 70, 60, 85];
              return (
                <div key={month} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-accent-200"
                    style={{ height: `${heights[i]}px` }}
                  />
                  <span className="text-xs text-text-tertiary">{month}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Revenue Trend</h2>
              <p className="mt-1 text-sm text-text-secondary">Platform revenue over time</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-6 flex items-end justify-between gap-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, i) => {
              const heights = [50, 45, 60, 55, 75, 90];
              return (
                <div key={month} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-md bg-accent-200"
                    style={{ height: `${heights[i]}px` }}
                  />
                  <span className="text-xs text-text-tertiary">{month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary">Average Order Value</h3>
          <p className="mt-4 text-3xl font-bold text-text-primary">{formatINR(aov)}</p>
          <div className="mt-4 flex items-center gap-1 text-sm text-accent-600">
            <TrendingUp className="h-4 w-4" />
            <span>Per order</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-surface-tertiary">
            <div className="h-2 w-3/4 rounded-full bg-accent-500" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary">Total Orders</h3>
          <p className="mt-4 text-3xl font-bold text-text-primary">{orders}</p>
          <div className="mt-4 flex items-center gap-1 text-sm text-accent-600">
            <TrendingUp className="h-4 w-4" />
            <span>All time</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-surface-tertiary">
            <div className="h-2 w-2/3 rounded-full bg-accent-500" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-text-primary">Growth Rate</h3>
          <p className="mt-4 text-3xl font-bold text-text-primary">{growthRate}%</p>
          <div className="mt-4 flex items-center gap-1 text-sm text-accent-600">
            <TrendingUp className="h-4 w-4" />
            <span>Period growth</span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-surface-tertiary">
            <div className="h-2 w-1/4 rounded-full bg-accent-500" />
          </div>
        </div>
      </div>

      {/* Growth Intelligence Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-text-primary">Growth Intelligence</h2>
        </div>
        <div className="flex gap-2">
          {DAY_PRESETS.map((d) => (
            <Button key={d} variant={days === d ? 'default' : 'outline'} size="sm" onClick={() => setDays(d)}>
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Activity} label="Visitors" value={String(summary.data?.totalVisitors ?? 0)} change={`Last ${days}d`} changeType="neutral" />
        <StatCard icon={Target} label="Leads" value={String(summary.data?.totalLeads ?? 0)} change={summary.data?.totalVisitors ? `${((summary.data.totalLeads / summary.data.totalVisitors) * 100).toFixed(1)}%` : '0%'} changeType="neutral" />
        <StatCard icon={GitBranch} label="Referrals" value={String(summary.data?.totalReferrals ?? 0)} change={`Last ${days}d`} changeType="neutral" />
        <StatCard icon={ShoppingCart} label="Order Leads" value={String(summary.data?.totalOrders ?? 0)} change={`Last ${days}d`} changeType="neutral" />
      </div>

      {/* Acquisition Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-accent" />
            Acquisition Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {funnel.isLoading ? (
            <DashboardSkeleton />
          ) : funnel.error ? (
            <Alert variant="error" title="Failed to load funnel data">{(funnel.error as Error).message}</Alert>
          ) : funnel.data && funnel.data.stages.length > 0 ? (
            <div className="space-y-3">
              {funnel.data.stages.map((stage) => (
                <div key={stage.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{stage.label}</span>
                    <span className="text-text-secondary">{stage.count} ({stage.dropOff.toFixed(1)}% drop-off)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-tertiary">
                    <div className="h-2 rounded-full bg-accent-500" style={{ width: `${Math.max(5, stage.dropOff === 100 ? 5 : 100 - stage.dropOff)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Activity} title="No funnel data" description="Not enough events collected yet." />
          )}
        </CardContent>
      </Card>

      {/* Campaign Performance + Referral Conversion */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4 text-accent" />
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.isLoading ? (
              <DashboardSkeleton />
            ) : campaign.error ? (
              <Alert variant="error" title="Failed to load campaign data">{(campaign.error as Error).message}</Alert>
            ) : campaign.data ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-tertiary">Active / Total</p>
                  <p className="text-lg font-semibold text-text-primary">{campaign.data.activeCampaigns} / {campaign.data.totalCampaigns}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Total Spent</p>
                  <p className="text-lg font-semibold text-text-primary">{formatINR(campaign.data.totalSpent)}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Conversions</p>
                  <p className="text-lg font-semibold text-text-primary">{campaign.data.totalConversions}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">ROI</p>
                  <p className="text-lg font-semibold text-text-primary">{campaign.data.roi.toFixed(1)}x</p>
                </div>
              </div>
            ) : (
              <EmptyState icon={Megaphone} title="No campaign data" description="Start running campaigns to see data." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="h-4 w-4 text-accent" />
              Referral Conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {referral.isLoading ? (
              <DashboardSkeleton />
            ) : referral.error ? (
              <Alert variant="error" title="Failed to load referral data">{(referral.error as Error).message}</Alert>
            ) : referral.data ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-text-tertiary">Referral Codes</p>
                  <p className="text-lg font-semibold text-text-primary">{referral.data.totalCodes}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Total Usages</p>
                  <p className="text-lg font-semibold text-text-primary">{referral.data.totalUsages}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Successful</p>
                  <p className="text-lg font-semibold text-text-primary">{referral.data.successfulRewards}</p>
                </div>
                <div>
                  <p className="text-xs text-text-tertiary">Conversion</p>
                  <p className="text-lg font-semibold text-text-primary">{(referral.data.conversionRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            ) : (
              <EmptyState icon={GitBranch} title="No referral data" description="Referral program has no activity yet." />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lead Conversion */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-accent" />
            Lead Conversion by Source
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lead.isLoading ? (
            <DashboardSkeleton />
          ) : lead.error ? (
            <Alert variant="error" title="Failed to load lead data">{(lead.error as Error).message}</Alert>
          ) : lead.data && lead.data.sourceBreakdown.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>Source</TH>
                  <TH>Leads</TH>
                  <TH>Converted</TH>
                  <TH>Conversion Rate</TH>
                </TR>
              </THead>
              <TBody>
                {lead.data.sourceBreakdown.map((item) => (
                  <TR key={item.source}>
                    <TD><span className="capitalize text-text-primary">{item.source}</span></TD>
                    <TD>{item.count}</TD>
                    <TD>{item.converted}</TD>
                    <TD>{item.count > 0 ? `${((item.converted / item.count) * 100).toFixed(1)}%` : '-'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={Target} title="No lead data" description="Collect CRM leads to see conversion breakdown." />
          )}
        </CardContent>
      </Card>

      {/* Top Landing Pages + Traffic Sources */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link className="h-4 w-4 text-accent" />
              Top Landing Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {landing.isLoading ? (
              <DashboardSkeleton />
            ) : landing.error ? (
              <Alert variant="error" title="Failed to load landing page data">{(landing.error as Error).message}</Alert>
            ) : landing.data && landing.data.length > 0 ? (
              <Table>
                <THead>
                  <TR>
                    <TH>URL</TH>
                    <TH>Visits</TH>
                    <TH>Leads</TH>
                    <TH>Conv. Rate</TH>
                  </TR>
                </THead>
                <TBody>
                  {landing.data.map((page) => (
                    <TR key={page.url}>
                      <TD className="max-w-[200px] truncate text-text-primary">{page.url}</TD>
                      <TD>{page.visits}</TD>
                      <TD>{page.leads}</TD>
                      <TD>{page.visits > 0 ? `${(page.conversionRate * 100).toFixed(1)}%` : '-'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            ) : (
              <EmptyState icon={Link} title="No landing page data" description="Track page views to see landing page performance." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-accent" />
              Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sources.isLoading ? (
              <DashboardSkeleton />
            ) : sources.error ? (
              <Alert variant="error" title="Failed to load traffic data">{(sources.error as Error).message}</Alert>
            ) : sources.data && sources.data.length > 0 ? (
              <div className="space-y-3">
                {sources.data.map((src) => (
                  <div key={src.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-text-primary">{src.source}</span>
                      <span className="text-text-secondary">{src.visits} ({src.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-surface-tertiary">
                      <div className="h-2 rounded-full bg-accent-500" style={{ width: `${Math.max(2, src.percentage)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Globe} title="No traffic data" description="Enable UTM tracking to see traffic sources." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
