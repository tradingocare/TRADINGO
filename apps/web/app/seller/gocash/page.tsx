'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { WalletTransactionFilters } from '@/components/wallet/wallet-transaction-filters';
import { WalletTimeline } from '@/components/wallet/wallet-timeline';
import { WalletAnalyticsBar } from '@/components/wallet/wallet-analytics-bar';
import {
  Award, ArrowUpRight, ArrowDownLeft, AlertCircle, Download, DollarSign, TrendingUp,
  Users, Gift, Megaphone, ShoppingBag, FileText, Sparkles, BarChart3, ExternalLink
} from 'lucide-react';
import { useSellerWalletSummary, useSellerTransactions, useSellerAnalytics } from '@/hooks/use-wallet';
import { toast } from '@/components/ui/use-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function SellerGocashPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ direction: '', type: '', from: '', to: '', search: '' });
  const [appliedFilters, setAppliedFilters] = useState({ direction: '', type: '', from: '', to: '', search: '' });
  const [statementPeriod, setStatementPeriod] = useState('monthly');

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useSellerWalletSummary();
  const { data: txnsData, isLoading: txnsLoading, error: txnsError } = useSellerTransactions(
    { page, limit: 20, ...appliedFilters }
  );
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useSellerAnalytics();

  const txns = txnsData?.data ?? [];
  const totalPages = txnsData?.totalPages ?? 0;

  const applyFilters = () => { setAppliedFilters(filters); setPage(1); };
  const resetFilters = () => {
    setFilters({ direction: '', type: '', from: '', to: '', search: '' });
    setAppliedFilters({ direction: '', type: '', from: '', to: '', search: '' });
    setPage(1);
  };

  const handleDownloadStatement = () => {
    toast({ title: 'Preparing statement...', description: 'Your download will start shortly.' });
    setTimeout(() => window.open(`/wallet/seller/statement?period=${statementPeriod}`, '_blank'), 500);
  };

  const recentTxns = useMemo(() =>
    summary?.recentTransactions ?? [],
    [summary?.recentTransactions]
  );

  const rewardBreakdown = useMemo(() => {
    if (!analytics) return [];
    return [
      { label: 'Membership', value: analytics.membershipRewards.total, total: analytics.totalEarned, count: analytics.membershipRewards.count },
      { label: 'Referral', value: analytics.referralRewards.total, total: analytics.totalEarned, count: analytics.referralRewards.count },
      { label: 'Campaign', value: analytics.campaignRewards.total, total: analytics.totalEarned, count: analytics.campaignRewards.count },
    ].filter((i) => i.value > 0);
  }, [analytics]);

  const byTypeItems = useMemo(() => {
    if (!analytics?.byType) return [];
    return Object.entries(analytics.byType)
      .map(([key, val]) => ({ label: key.replace(/_/g, ' '), value: val.total, total: analytics.totalEarned, count: val.count }))
      .sort((a, b) => b.value - a.value);
  }, [analytics]);

  if (summaryError) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="GOCASH Wallet" description="Your earnings and rewards" />
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
            <p className="text-white/60">Failed to load wallet data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="GOCASH Wallet"
        description="Your earnings and rewards"
        actions={
          <div className="flex gap-2">
            <select
              className="h-8 rounded-lg border border-white/[0.06] bg-white/[0.04] px-2 text-xs text-white backdrop-blur-xl"
              value={statementPeriod}
              onChange={(e) => setStatementPeriod(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Button variant="outline" size="sm" onClick={handleDownloadStatement}>
              <Download className="mr-1 h-3 w-3" /> CSV
            </Button>
          </div>
        }
      />

      {summaryLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : summary ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Award} label="Balance" value={formatINR(summary.balance)} />
          <StatCard icon={DollarSign} label="Available" value={formatINR(summary.available)} />
          <StatCard icon={TrendingUp} label="Lifetime Earned" value={formatINR(summary.lifetimeEarned)} />
          <StatCard icon={ArrowDownLeft} label="Redeemed" value={formatINR(summary.lifetimeRedeemed)} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-4">
        <Link href="/seller/campaigns" className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-orange-500/10 to-transparent p-4 backdrop-blur-xl transition-all hover:border-orange-500/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#FF4D00]"><Megaphone className="h-5 w-5" /></div>
            <div><p className="text-sm font-medium text-white">Campaigns</p><p className="text-xs text-white/50">Promote & earn</p></div>
            <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
          </div>
        </Link>
        <Link href="/seller/referrals" className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-blue-500/10 to-transparent p-4 backdrop-blur-xl transition-all hover:border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><Users className="h-5 w-5" /></div>
            <div><p className="text-sm font-medium text-white">Referrals</p><p className="text-xs text-white/50">Refer partners</p></div>
            <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
          </div>
        </Link>
        <Link href="/seller/products" className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-green-500/10 to-transparent p-4 backdrop-blur-xl transition-all hover:border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400"><ShoppingBag className="h-5 w-5" /></div>
            <div><p className="text-sm font-medium text-white">Products</p><p className="text-xs text-white/50">Manage listings</p></div>
            <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
          </div>
        </Link>
        <Link href="/seller/analytics" className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-purple-500/10 to-transparent p-4 backdrop-blur-xl transition-all hover:border-purple-500/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400"><BarChart3 className="h-5 w-5" /></div>
            <div><p className="text-sm font-medium text-white">Analytics</p><p className="text-xs text-white/50">View insights</p></div>
            <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
          </div>
        </Link>
      </div>

      {analyticsError ? (
        <Card>
          <CardContent className="flex flex-col items-center py-4 text-center">
            <AlertCircle className="mb-2 h-5 w-5 text-red-500" />
            <p className="text-sm text-white/50">Failed to load analytics data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {analytics && (
            <Card>
              <CardHeader><CardTitle><Award className="mr-2 inline h-4 w-4" /> Reward Breakdown</CardTitle></CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>
                ) : (
                  <WalletAnalyticsBar items={rewardBreakdown} formatCurrency={formatINR} />
                )}
              </CardContent>
            </Card>
          )}

          {byTypeItems.length > 0 && (
            <Card>
              <CardHeader><CardTitle><BarChart3 className="mr-2 inline h-4 w-4" /> By Transaction Type</CardTitle></CardHeader>
              <CardContent>
                <WalletAnalyticsBar items={byTypeItems} formatCurrency={formatINR} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle><Sparkles className="mr-2 inline h-4 w-4" /> Quick Stats</CardTitle></CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>
              ) : analytics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-white/70">Membership</span>
                    </div>
                    <span className="text-sm font-medium text-white">{formatINR(analytics.membershipRewards.total)} <span className="text-xs text-white/40">({analytics.membershipRewards.count})</span></span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-white/70">Referrals</span>
                    </div>
                    <span className="text-sm font-medium text-white">{formatINR(analytics.referralRewards.total)} <span className="text-xs text-white/40">({analytics.referralRewards.count})</span></span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3">
                    <div className="flex items-center gap-2">
                      <Megaphone className="h-4 w-4 text-orange-400" />
                      <span className="text-sm text-white/70">Campaigns</span>
                    </div>
                    <span className="text-sm font-medium text-white">{formatINR(analytics.campaignRewards.total)} <span className="text-xs text-white/40">({analytics.campaignRewards.count})</span></span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Total Transactions</span>
                    <span className="text-sm font-semibold text-white">{analytics.totalTransactions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Current Balance</span>
                    <span className="text-sm font-semibold text-white">{formatINR(analytics.currentBalance)}</span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
            <Button variant="outline" size="sm" onClick={handleDownloadStatement}>
              <Download className="mr-1 h-3 w-3" /> CSV
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <WalletTransactionFilters
              filters={filters}
              onChange={setFilters}
              onApply={applyFilters}
              onReset={resetFilters}
            />
            {txnsLoading ? (
              <TableSkeleton />
            ) : txnsError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load transactions.</p>
            ) : !txns.length ? (
              <p className="py-4 text-center text-sm text-white/40">
                {appliedFilters.direction || appliedFilters.type || appliedFilters.from || appliedFilters.search
                  ? 'No transactions match your filters.'
                  : 'No transactions yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="sticky top-0 bg-background pb-3 font-medium text-white/60">Date</th>
                      <th className="sticky top-0 bg-background pb-3 font-medium text-white/60">Type</th>
                      <th className="sticky top-0 bg-background pb-3 font-medium text-white/60">Direction</th>
                      <th className="sticky top-0 bg-background pb-3 font-medium text-white/60">Amount</th>
                      <th className="sticky top-0 bg-background pb-3 font-medium text-white/60">Balance</th>
                      <th className="sticky top-0 bg-background pb-3 font-medium text-white/60">Description</th>
                      <th className="sticky top-0 bg-background pb-3 font-medium text-white/60">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.map((txn) => (
                      <tr key={txn.id} className="border-b border-white/[0.06] last:border-0">
                        <td className="py-3 text-white/50">{new Date(txn.createdAt).toLocaleDateString()}</td>
                        <td className="py-3">
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs font-medium text-white/70">{txn.type.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="py-3">
                          {txn.direction === 'CREDIT' ? (
                            <span className="flex items-center text-green-400"><ArrowUpRight className="mr-1 h-3 w-3" /> Earned</span>
                          ) : (
                            <span className="flex items-center text-red-400"><ArrowDownLeft className="mr-1 h-3 w-3" /> Spent</span>
                          )}
                        </td>
                        <td className={`py-3 font-medium ${txn.direction === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                          {txn.direction === 'CREDIT' ? '+' : '-'}{formatINR(txn.amount)}
                        </td>
                        <td className="py-3 text-white/50">{formatINR(txn.balanceAfter)}</td>
                        <td className="max-w-xs truncate py-3 text-white/50">{txn.reason}</td>
                        <td className="py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            txn.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400' :
                            txn.status === 'FAILED' ? 'bg-red-500/10 text-red-400' :
                            txn.status === 'REVERSED' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-white/5 text-white/40'
                          }`}>{txn.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle><Sparkles className="mr-2 inline h-4 w-4" /> Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <WalletTimeline entries={recentTxns} formatCurrency={formatINR} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
