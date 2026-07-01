'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WalletAnalyticsBar } from '@/components/wallet/wallet-analytics-bar';
import {
  useSearchWallets, useGrowthAnalytics, useFraudAlerts, useTopWallets,
  useSearchLedger, useDistributionAnalytics, useRedemptionTrends
} from '@/hooks/use-wallet';
import {
  Search, ExternalLink, Wallet, Users, DollarSign, AlertTriangle, TrendingUp,
  BookOpen, Shield, Activity, BarChart3, RefreshCw, Award, Megaphone, Gift,
  Filter, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
const formatINRObj = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export default function AdminWalletsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerFilters, setLedgerFilters] = useState({ direction: '', search: '', from: '', to: '' });
  const [ledgerFiltersApplied, setLedgerFiltersApplied] = useState({ direction: '', search: '', from: '', to: '' });
  const [showLedger, setShowLedger] = useState(false);

  const [showFraud, setShowFraud] = useState(true);
  const [showMonitor, setShowMonitor] = useState(false);

  const { data: walletsData, isLoading: walletsLoading, error: walletsError } = useSearchWallets({ search: search || undefined, page, limit: 20 });
  const { data: growth, isLoading: growthLoading, error: growthError } = useGrowthAnalytics();
  const { data: fraud, isLoading: fraudLoading, error: fraudError } = useFraudAlerts();
  const { data: topWallets, isLoading: topLoading, error: topError } = useTopWallets(5);
  const { data: ledgerData, isLoading: ledgerLoading, error: ledgerError } = useSearchLedger(
    showLedger ? { ...ledgerFiltersApplied, page: ledgerPage, limit: 20 } : undefined
  );
  const { data: distribution, isLoading: distLoading, error: distError } = useDistributionAnalytics();
  const { data: redemptions, isLoading: redemptLoading, error: redemptError } = useRedemptionTrends();

  const wallets = walletsData?.data ?? [];
  const totalPages = walletsData?.totalPages ?? 0;
  const ledgerTxns = ledgerData?.data ?? [];
  const ledgerTotalPages = ledgerData?.totalPages ?? 0;

  const handleSearch = () => { setSearch(searchInput); setPage(1); };
  const applyLedgerFilters = () => { setLedgerFiltersApplied(ledgerFilters); setLedgerPage(1); };
  const resetLedgerFilters = () => {
    setLedgerFilters({ direction: '', search: '', from: '', to: '' });
    setLedgerFiltersApplied({ direction: '', search: '', from: '', to: '' });
    setLedgerPage(1);
  };

  const distributionItems = (distribution ?? []).map((d) => ({
    label: d.type.replace(/_/g, ' '),
    value: d.totalAmount,
    total: Math.max(...(distribution ?? []).map((x) => x.totalAmount), 1),
    count: d.count,
  }));

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Wallet Console" description="GOCASH wallet management & monitoring" />

      {growthLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : growthError ? (
        <Card>
          <CardContent className="flex flex-col items-center py-6 text-center">
            <AlertCircle className="mb-2 h-6 w-6 text-red-500" />
            <p className="text-sm text-white/50">Failed to load system stats.</p>
          </CardContent>
        </Card>
      ) : growth ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard icon={Wallet} label="Total Wallets" value={String(growth.totalWallets)} />
          <StatCard icon={Users} label="Active" value={String(growth.activeWallets)} />
          <StatCard icon={DollarSign} label="Total Balance" value={`₹${Number(growth.totalBalance).toLocaleString('en-IN')}`} />
          <StatCard icon={TrendingUp} label="30d Volume" value={`₹${Number(growth.transactionAmount30d).toLocaleString('en-IN')}`} change={`${growth.transactionVolume30d} txns`} />
          <StatCard icon={AlertTriangle} label="Fraud Alerts" value={String(fraud?.alerts?.length ?? 0)} changeType="negative" change={fraud?.totalTransactions ? `${fraud.totalTransactions} flagged` : undefined} />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Search Wallets</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <Input placeholder="Search by ID, user, or company..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
              <Button onClick={handleSearch}><Search className="h-4 w-4" /></Button>
            </div>
            {walletsLoading ? (
              <TableSkeleton />
            ) : walletsError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load wallets.</p>
            ) : !wallets.length ? (
              <p className="text-sm text-white/40">{search ? 'No wallets match your search.' : 'No wallets found.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">ID</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">User</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Type</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Balance</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Status</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((w) => (
                      <tr key={w.id} className="border-b border-white/[0.06] last:border-0">
                        <td className="py-2 font-mono text-xs text-white/50">{w.id.slice(0, 8)}...</td>
                        <td className="py-2 font-mono text-xs text-white/50">{w.userId.slice(0, 8)}...</td>
                        <td className="py-2"><Badge variant="outline">{w.type}</Badge></td>
                        <td className="py-2 font-medium text-white">₹{w.balance.toLocaleString('en-IN')}</td>
                        <td className="py-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            w.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' :
                            w.status === 'LOCKED' ? 'bg-red-500/10 text-red-400' :
                            w.status === 'SUSPENDED' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-white/5 text-white/40'
                          }`}>{w.status}</span>
                        </td>
                        <td className="py-2">
                          <Link href={`/admin/wallets/${w.id}`}>
                            <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3" /></Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
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
          <CardHeader><CardTitle><Award className="mr-2 inline h-4 w-4" /> Top Wallets</CardTitle></CardHeader>
          <CardContent>
            {topLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>
            ) : topError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load top wallets.</p>
            ) : !topWallets?.length ? (
              <p className="text-sm text-white/40">No wallets yet.</p>
            ) : (
              <div className="space-y-3">
                {topWallets.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-lg border border-white/[0.06] p-3">
                    <div>
                      <p className="text-sm font-medium text-white">#{w.rank} — {w.type}</p>
                      <p className="text-xs font-mono text-white/40">{w.id.slice(0, 12)}...</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">₹{w.balance.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-white/40">Earned: ₹{w.lifetimeEarned.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowFraud(!showFraud)}>
          <CardTitle><Shield className="mr-2 inline h-4 w-4" /> Fraud Monitoring</CardTitle>
          {showFraud ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
        </CardHeader>
        {showFraud && (
          <CardContent>
            {fraudLoading ? (
              <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>
            ) : fraudError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load fraud data.</p>
            ) : !fraud?.alerts?.length && !fraud?.highVelocity?.length ? (
              <p className="text-sm text-white/40">No fraud alerts. All clear.</p>
            ) : (
              <>
                {fraud.alerts.map((alert, i) => (
                  <div key={i} className="mb-2 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span className="text-white/80">{alert}</span>
                  </div>
                ))}
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/[0.06] p-3">
                    <p className="text-lg font-bold text-white">{fraud?.failedAttempts ?? 0}</p>
                    <p className="text-xs text-white/40">Failed Attempts (24h)</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-3">
                    <p className="text-lg font-bold text-white">{fraud?.reversedCount ?? 0}</p>
                    <p className="text-xs text-white/40">Reversals (24h)</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-3">
                    <p className="text-lg font-bold text-white">{fraud?.totalTransactions ?? 0}</p>
                    <p className="text-xs text-white/40">Flagged Transactions</p>
                  </div>
                </div>
                {fraud && fraud.highVelocity && fraud.highVelocity.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-white/70">High Velocity Wallets</p>
                    <div className="space-y-2">
                      {fraud.highVelocity.slice(0, 5).map((hv, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-2 text-sm">
                          <span className="font-mono text-xs text-white/70">{hv.walletId.slice(0, 12)}...</span>
                          <span className="text-white/60">{hv.transactionCount} txns — {hv.alert}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowLedger(!showLedger)}>
          <CardTitle><BookOpen className="mr-2 inline h-4 w-4" /> Ledger Explorer</CardTitle>
          <div className="flex items-center gap-2">
            {showLedger && (
              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); resetLedgerFilters(); }}>
                <RefreshCw className="mr-1 h-3 w-3" /> Reset
              </Button>
            )}
            {showLedger ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
          </div>
        </CardHeader>
        {showLedger && (
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60">Direction</label>
                <select className="h-9 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 text-xs text-white backdrop-blur-xl" value={ledgerFilters.direction} onChange={(e) => setLedgerFilters({ ...ledgerFilters, direction: e.target.value })}>
                  <option value="">All</option>
                  <option value="CREDIT">Credit</option>
                  <option value="DEBIT">Debit</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60">Search</label>
                <Input className="h-9 w-48 text-xs" placeholder="Wallet ID, user, reason..." value={ledgerFilters.search} onChange={(e) => setLedgerFilters({ ...ledgerFilters, search: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60">From</label>
                <Input type="date" className="h-9 w-36 text-xs" value={ledgerFilters.from} onChange={(e) => setLedgerFilters({ ...ledgerFilters, from: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-white/60">To</label>
                <Input type="date" className="h-9 w-36 text-xs" value={ledgerFilters.to} onChange={(e) => setLedgerFilters({ ...ledgerFilters, to: e.target.value })} />
              </div>
              <Button variant="outline" size="sm" onClick={applyLedgerFilters}>
                <Filter className="mr-1 h-3 w-3" /> Search
              </Button>
            </div>
            {ledgerLoading ? (
              <TableSkeleton />
            ) : ledgerError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load ledger entries.</p>
            ) : !ledgerTxns.length ? (
              <p className="py-4 text-center text-sm text-white/40">No ledger entries found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Date</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Wallet</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Type</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Direction</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Amount</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Balance</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Reason</th>
                      <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerTxns.map((txn) => (
                      <tr key={txn.id} className="border-b border-white/[0.06] last:border-0">
                        <td className="py-2 text-xs text-white/50">{new Date(txn.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 font-mono text-xs text-white/50">{txn.walletId.slice(0, 8)}...</td>
                        <td className="py-2"><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/70">{txn.type.replace(/_/g, ' ')}</span></td>
                        <td className="py-2">
                          <span className={`text-xs font-medium ${txn.direction === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>{txn.direction}</span>
                        </td>
                        <td className={`py-2 text-xs font-medium ${txn.direction === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                          {txn.direction === 'CREDIT' ? '+' : '-'}{formatINRObj(txn.amount)}
                        </td>
                        <td className="py-2 text-xs text-white/50">{formatINRObj(txn.balanceAfter)}</td>
                        <td className="max-w-[200px] truncate py-2 text-xs text-white/50" title={txn.reason}>{txn.reason}</td>
                        <td className="py-2">
                          <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
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
            {ledgerTotalPages > 1 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/40">Page {ledgerPage} of {ledgerTotalPages}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={ledgerPage <= 1} onClick={() => setLedgerPage(p => p - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={ledgerPage >= ledgerTotalPages} onClick={() => setLedgerPage(p => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle><BarChart3 className="mr-2 inline h-4 w-4" /> Distribution by Type</CardTitle></CardHeader>
          <CardContent>
            {distLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>
            ) : distError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load distribution data.</p>
            ) : (
              <WalletAnalyticsBar items={distributionItems} formatCurrency={formatINRObj} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle><Activity className="mr-2 inline h-4 w-4" /> Redemption Trends</CardTitle></CardHeader>
          <CardContent>
            {redemptLoading ? (
              <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />)}</div>
            ) : redemptError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load redemption data.</p>
            ) : redemptions ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-white/[0.06] p-3">
                    <p className="text-lg font-bold text-white">{redemptions.totalRedemptions}</p>
                    <p className="text-xs text-white/40">Total Redemptions</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-3">
                    <p className="text-lg font-bold text-white">{formatINRObj(redemptions.totalAmount)}</p>
                    <p className="text-xs text-white/40">Total Amount</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                    <p className="text-lg font-bold text-green-400">{formatINRObj(redemptions.approvedAmount)}</p>
                    <p className="text-xs text-white/40">Approved</p>
                  </div>
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                    <p className="text-lg font-bold text-yellow-400">{formatINRObj(redemptions.pendingAmount)}</p>
                    <p className="text-xs text-white/40">Pending</p>
                  </div>
                </div>
                {Object.keys(redemptions.byType).length > 0 && (
                  <>
                    <Separator />
                    <p className="text-sm font-medium text-white/70">By Redemption Type</p>
                    <div className="space-y-2">
                      {Object.entries(redemptions.byType).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-sm">
                          <span className="text-white/60">{key.replace(/_/g, ' ')}</span>
                          <span className="text-white">{val.count} — {formatINRObj(val.total)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-white/40">No redemption data available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowMonitor(!showMonitor)}>
          <CardTitle><Activity className="mr-2 inline h-4 w-4" /> System Monitor</CardTitle>
          {showMonitor ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
        </CardHeader>
        {showMonitor && (
          <CardContent>
            {growthError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load system data.</p>
            ) : growth ? (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-white/[0.06] p-4">
                    <p className="text-xs text-white/40">New Wallets (30d)</p>
                    <p className="mt-1 text-2xl font-bold text-white">{growth.newWallets30d}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-4">
                    <p className="text-xs text-white/40">Buyer Wallets</p>
                    <p className="mt-1 text-2xl font-bold text-white">{growth.buyerWallets}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-4">
                    <p className="text-xs text-white/40">Seller Wallets</p>
                    <p className="mt-1 text-2xl font-bold text-white">{growth.sellerWallets}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-4">
                    <p className="text-xs text-white/40">Locked/Suspended</p>
                    <p className="mt-1 text-2xl font-bold text-white">{growth.lockedWallets + growth.suspendedWallets}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-6 sm:grid-cols-3">
                  <div className="rounded-lg border border-white/[0.06] p-4">
                    <p className="text-xs text-white/40">Total Lifetime Earned</p>
                    <p className="mt-1 text-xl font-bold text-white">{formatINRObj(growth.totalLifetimeEarned)}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-4">
                    <p className="text-xs text-white/40">Total Lifetime Redeemed</p>
                    <p className="mt-1 text-xl font-bold text-white">{formatINRObj(growth.totalLifetimeRedeemed)}</p>
                  </div>
                  <div className="rounded-lg border border-white/[0.06] p-4">
                    <p className="text-xs text-white/40">Total Available</p>
                    <p className="mt-1 text-xl font-bold text-white">{formatINRObj(growth.totalAvailable)}</p>
                  </div>
                </div>
              </>
            ) : null}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
