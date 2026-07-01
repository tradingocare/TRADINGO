'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WalletTransactionFilters } from '@/components/wallet/wallet-transaction-filters';
import { WalletTimeline } from '@/components/wallet/wallet-timeline';
import { WalletAnalyticsBar } from '@/components/wallet/wallet-analytics-bar';
import {
  Award, ArrowUpRight, ArrowDownLeft, AlertCircle, Download, DollarSign, Lock, TrendingUp,
  Gift, Megaphone, ShoppingCart, FileText, Sparkles, ExternalLink
} from 'lucide-react';
import { useBuyerWalletSummary, useBuyerTransactions } from '@/hooks/use-wallet';
import { toast } from '@/components/ui/use-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function BuyerGocashPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ direction: '', type: '', from: '', to: '', search: '' });
  const [appliedFilters, setAppliedFilters] = useState({ direction: '', type: '', from: '', to: '', search: '' });
  const [statementPeriod, setStatementPeriod] = useState('monthly');

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useBuyerWalletSummary();
  const { data: txnsData, isLoading: txnsLoading, error: txnsError } = useBuyerTransactions(
    { page, limit: 20, ...appliedFilters }
  );

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
    setTimeout(() => window.open(`/wallet/buyer/statement?period=${statementPeriod}`, '_blank'), 500);
  };

  const recentTxns = useMemo(() =>
    summary?.recentTransactions ?? [],
    [summary?.recentTransactions]
  );

  const analyticsItems = useMemo(() => {
    if (!summary) return [];
    return [
      { label: 'Earned', value: summary.lifetimeEarned, total: Math.max(summary.lifetimeEarned, 1) },
      { label: 'Redeemed', value: summary.lifetimeRedeemed, total: Math.max(summary.lifetimeEarned, 1) },
      { label: 'Available', value: summary.available, total: Math.max(summary.available + summary.locked, 1) },
      { label: 'Locked', value: summary.locked, total: Math.max(summary.available + summary.locked, 1) },
    ];
  }, [summary]);

  if (summaryError) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="GOCASH Wallet" description="Your rewards wallet" />
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
            <p className="text-white/60">Failed to load wallet data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="GOCASH Wallet" description="Your rewards and transaction history" />

      {summaryLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Award} label="GOCASH Balance" value={formatINR(summary.balance)} />
            <StatCard icon={DollarSign} label="Available" value={formatINR(summary.available)} />
            <StatCard icon={TrendingUp} label="Lifetime Earned" value={formatINR(summary.lifetimeEarned)} />
            <StatCard icon={Lock} label="Locked" value={formatINR(summary.locked)} />
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            <Link href="/buyer/campaigns" className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-orange-500/10 to-transparent p-4 backdrop-blur-xl transition-all hover:border-orange-500/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-[#FF4D00]"><Megaphone className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-white">Campaigns</p><p className="text-xs text-white/50">Earn bonus rewards</p></div>
                <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
              </div>
            </Link>
            <Link href="/buyer/referrals" className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-blue-500/10 to-transparent p-4 backdrop-blur-xl transition-all hover:border-blue-500/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"><Gift className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-white">Referrals</p><p className="text-xs text-white/50">Invite & earn</p></div>
                <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
              </div>
            </Link>
            <Link href="/buyer/gocash/redeem" className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-green-500/10 to-transparent p-4 backdrop-blur-xl transition-all hover:border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400"><ShoppingCart className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-white">Redeem</p><p className="text-xs text-white/50">Use your GOCASH</p></div>
                <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
              </div>
            </Link>
            <button onClick={handleDownloadStatement}
              className="group rounded-2xl border border-white/[0.06] bg-gradient-to-br from-purple-500/10 to-transparent p-4 backdrop-blur-xl transition-all hover:border-purple-500/30 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400"><FileText className="h-5 w-5" /></div>
                <div><p className="text-sm font-medium text-white">Statement</p><p className="text-xs text-white/50">Download report</p></div>
                <ExternalLink className="ml-auto h-4 w-4 text-white/30" />
              </div>
            </button>
          </div>
        </>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaction History</CardTitle>
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
                  : 'No transactions yet. Earn GOCASH by participating in promotions!'}
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

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle><Sparkles className="mr-2 inline h-4 w-4" /> Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <WalletTimeline entries={recentTxns} formatCurrency={formatINR} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle><TrendingUp className="mr-2 inline h-4 w-4" /> Wallet Overview</CardTitle></CardHeader>
            <CardContent>
              <WalletAnalyticsBar items={analyticsItems} formatCurrency={formatINR} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle><Megaphone className="mr-2 inline h-4 w-4" /> Campaign Center</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-white/50">Participate in active campaigns to earn bonus GOCASH rewards.</p>
            <Link href="/buyer/campaigns">
              <Button variant="outline" size="sm"><Megaphone className="mr-1 h-3 w-3" /> Browse Campaigns</Button>
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><Gift className="mr-2 inline h-4 w-4" /> Referral Center</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-white/50">Invite your network and earn rewards for every successful referral.</p>
            <Link href="/buyer/referrals">
              <Button variant="outline" size="sm"><Gift className="mr-1 h-3 w-3" /> View Referrals</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
