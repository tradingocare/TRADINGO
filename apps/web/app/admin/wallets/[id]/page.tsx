'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { WalletTimeline } from '@/components/wallet/wallet-timeline';
import {
  useWalletDetail, useFreezeWallet, useUnfreezeWallet,
  useManualCredit, useManualDebit, useAdjustBalance, useReverseTransaction,
  useSearchLedger, useWalletAudit
} from '@/hooks/use-wallet';
import {
  DollarSign, Users, Lock, Shield, ShieldOff, AlertCircle, Activity, BookOpen,
  FileText, ChevronDown, ChevronUp, RefreshCw, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

export default function AdminWalletDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: wallet, isLoading, error: walletError } = useWalletDetail(id);
  const { data: audit, isLoading: auditLoading, error: auditError } = useWalletAudit(id);
  const freezeMutation = useFreezeWallet();
  const unfreezeMutation = useUnfreezeWallet();
  const creditMutation = useManualCredit();
  const debitMutation = useManualDebit();
  const adjustMutation = useAdjustBalance();
  const reverseMutation = useReverseTransaction();

  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState('');
  const [debitAmount, setDebitAmount] = useState(0);
  const [debitReason, setDebitReason] = useState('');
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [reverseTxnId, setReverseTxnId] = useState('');
  const [reverseReason, setReverseReason] = useState('');

  const [showLedger, setShowLedger] = useState(false);
  const [ledgerPage, setLedgerPage] = useState(1);
  const { data: ledgerData, isLoading: ledgerLoading, error: ledgerError } = useSearchLedger(
    showLedger ? { walletId: id, page: ledgerPage, limit: 20 } : undefined
  );
  const [showAudit, setShowAudit] = useState(false);

  const ledgerTxns = ledgerData?.data ?? [];
  const ledgerTotalPages = ledgerData?.totalPages ?? 0;
  const auditEntries = Array.isArray(audit) ? audit : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Wallet Details" description="Loading..." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (walletError || !wallet) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Wallet Details" description="Error" />
        <Card>
          <CardContent className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-red-500" />
            <p className="text-white/60">{walletError ? 'Failed to load wallet data.' : 'The requested wallet could not be found.'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFreeze = async () => {
    try { await freezeMutation.mutateAsync(id); toast({ title: 'Wallet frozen' }); } catch { toast({ title: 'Failed to freeze wallet', variant: 'destructive' }); }
  };

  const handleUnfreeze = async () => {
    try { await unfreezeMutation.mutateAsync(id); toast({ title: 'Wallet unfrozen' }); } catch { toast({ title: 'Failed to unfreeze wallet', variant: 'destructive' }); }
  };

  const handleCredit = async () => {
    if (!creditAmount || !creditReason) { toast({ title: 'Amount and reason required', variant: 'destructive' }); return; }
    if (creditAmount <= 0) { toast({ title: 'Amount must be greater than 0', variant: 'destructive' }); return; }
    try { await creditMutation.mutateAsync({ walletId: id, amount: creditAmount, reason: creditReason }); toast({ title: `Credited ${formatINR(creditAmount)}` }); setCreditAmount(0); setCreditReason(''); } catch { toast({ title: 'Credit failed', variant: 'destructive' }); }
  };

  const handleDebit = async () => {
    if (!debitAmount || !debitReason) { toast({ title: 'Amount and reason required', variant: 'destructive' }); return; }
    if (debitAmount <= 0) { toast({ title: 'Amount must be greater than 0', variant: 'destructive' }); return; }
    try { await debitMutation.mutateAsync({ walletId: id, amount: debitAmount, reason: debitReason }); toast({ title: `Debited ${formatINR(debitAmount)}` }); setDebitAmount(0); setDebitReason(''); } catch { toast({ title: 'Debit failed', variant: 'destructive' }); }
  };

  const handleAdjust = async () => {
    if (!adjustReason) { toast({ title: 'Reason required', variant: 'destructive' }); return; }
    if (adjustAmount === 0) { toast({ title: 'Amount must not be 0', variant: 'destructive' }); return; }
    try { await adjustMutation.mutateAsync({ walletId: id, amount: adjustAmount, reason: adjustReason }); toast({ title: `Balance adjusted by ${formatINR(adjustAmount)}` }); setAdjustAmount(0); setAdjustReason(''); } catch { toast({ title: 'Adjustment failed', variant: 'destructive' }); }
  };

  const handleReverse = async () => {
    if (!reverseTxnId || !reverseReason) { toast({ title: 'Transaction ID and reason required', variant: 'destructive' }); return; }
    try { await reverseMutation.mutateAsync({ transactionId: reverseTxnId, reason: reverseReason }); toast({ title: 'Transaction reversed' }); setReverseTxnId(''); setReverseReason(''); } catch { toast({ title: 'Reverse failed', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Wallet ${wallet.id.slice(0, 8)}...`}
        description={`${wallet.type} wallet · User ${wallet.userId.slice(0, 8)}...`}
        actions={
          <div className="flex gap-2">
            {wallet.status === 'ACTIVE' ? (
              <Button variant="destructive" size="sm" onClick={handleFreeze}><Lock className="mr-1 h-3 w-3" /> Freeze</Button>
            ) : wallet.status === 'LOCKED' ? (
              <Button variant="outline" size="sm" onClick={handleUnfreeze}><ShieldOff className="mr-1 h-3 w-3" /> Unfreeze</Button>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={DollarSign} label="Balance" value={formatINR(wallet.currentBalance)} />
        <StatCard icon={DollarSign} label="Available" value={formatINR(wallet.availableBalance)} />
        <StatCard icon={Lock} label="Locked" value={formatINR(wallet.lockedBalance)} />
        <StatCard icon={Users} label="Lifetime Earned" value={formatINR(wallet.lifetimeEarned)} />
        <StatCard icon={Activity} label="Transactions" value={String(wallet.transactionCount)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle><Shield className="mr-2 inline h-4 w-4" /> Manual Credit</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-white/60">Amount (₹)</Label>
              <Input type="number" min={0.01} value={creditAmount} onChange={(e) => setCreditAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-white/60">Reason</Label>
              <Input value={creditReason} onChange={(e) => setCreditReason(e.target.value)} placeholder="e.g., Promotional bonus" />
            </div>
            <Button className="w-full" onClick={handleCredit} disabled={creditMutation.isPending}>Credit Wallet</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle><ShieldOff className="mr-2 inline h-4 w-4" /> Manual Debit</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-white/60">Amount (₹)</Label>
              <Input type="number" min={0.01} value={debitAmount} onChange={(e) => setDebitAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-white/60">Reason</Label>
              <Input value={debitReason} onChange={(e) => setDebitReason(e.target.value)} placeholder="e.g., Penalty" />
            </div>
            <Button className="w-full" variant="destructive" onClick={handleDebit} disabled={debitMutation.isPending}>Debit Wallet</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle><RefreshCw className="mr-2 inline h-4 w-4" /> Adjust Balance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label className="text-white/60">Amount (₹) — use negative for debit</Label>
              <Input type="number" value={adjustAmount} onChange={(e) => setAdjustAmount(Number(e.target.value))} placeholder="e.g., 500 or -500" />
            </div>
            <div className="space-y-1">
              <Label className="text-white/60">Reason</Label>
              <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="e.g., Correction" />
            </div>
            <Button className="w-full" variant="secondary" onClick={handleAdjust} disabled={adjustMutation.isPending}>Adjust Balance</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle><AlertCircle className="mr-2 inline h-4 w-4" /> Reverse Transaction</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-white/60">Transaction ID</Label>
              <Input value={reverseTxnId} onChange={(e) => setReverseTxnId(e.target.value)} placeholder="UUID of transaction to reverse" className="font-mono text-xs" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-white/60">Reason for Reversal</Label>
              <Input value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} placeholder="e.g., Duplicate credit" />
            </div>
          </div>
          <Button variant="destructive" onClick={handleReverse} disabled={reverseMutation.isPending}>Reverse Transaction</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowLedger(!showLedger)}>
          <CardTitle><BookOpen className="mr-2 inline h-4 w-4" /> Ledger Explorer</CardTitle>
          {showLedger ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
        </CardHeader>
        {showLedger && (
          <CardContent className="space-y-4">
            {ledgerLoading ? (
              <TableSkeleton />
            ) : ledgerError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load ledger entries.</p>
            ) : !ledgerTxns.length ? (
              <p className="py-4 text-center text-sm text-white/40">No ledger entries for this wallet.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-left">
                        <th className="sticky top-0 bg-background pb-2 font-medium text-white/60">Date</th>
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
                          <td className="py-2"><span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/70">{txn.type.replace(/_/g, ' ')}</span></td>
                          <td className="py-2">
                            <span className={`text-xs font-medium ${txn.direction === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>{txn.direction}</span>
                          </td>
                          <td className={`py-2 text-xs font-medium ${txn.direction === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                            {txn.direction === 'CREDIT' ? '+' : '-'}{formatINR(txn.amount)}
                          </td>
                          <td className="py-2 text-xs text-white/50">{formatINR(txn.balanceAfter)}</td>
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
                {ledgerTotalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/40">Page {ledgerPage} of {ledgerTotalPages}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={ledgerPage <= 1} onClick={() => setLedgerPage(p => p - 1)}>Previous</Button>
                      <Button variant="outline" size="sm" disabled={ledgerPage >= ledgerTotalPages} onClick={() => setLedgerPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowAudit(!showAudit)}>
          <CardTitle><FileText className="mr-2 inline h-4 w-4" /> Audit Trail</CardTitle>
          {showAudit ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
        </CardHeader>
        {showAudit && (
          <CardContent>
            {auditLoading ? (
              <TableSkeleton rows={3} />
            ) : auditError ? (
              <p className="py-4 text-center text-sm text-red-400">Failed to load audit trail.</p>
            ) : !auditEntries.length ? (
              <p className="py-4 text-center text-sm text-white/40">No audit entries available.</p>
            ) : (
              <div className="space-y-2">
                {auditEntries.slice(0, 20).map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-white/[0.06] p-3">
                    <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white">{(entry as any).action ?? 'Unknown action'}</p>
                      <p className="text-xs text-white/40">
                        {(entry as any).performedBy ? `by ${(entry as any).performedBy}` : ''}
                        {(entry as any).createdAt ? ` · ${new Date((entry as any).createdAt).toLocaleString()}` : ''}
                      </p>
                      {(entry as any).details && <p className="mt-1 text-xs text-white/50">{typeof (entry as any).details === 'string' ? (entry as any).details : JSON.stringify((entry as any).details)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader><CardTitle>Wallet Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
            <div><p className="text-white/40">Status</p><Badge variant={wallet.status === 'ACTIVE' ? 'default' : 'destructive'}>{wallet.status}</Badge></div>
            <div><p className="text-white/40">KYC</p><p className="text-white">{wallet.kycVerified ? 'Verified' : 'Not Verified'}</p></div>
            <div><p className="text-white/40">Type</p><p className="text-white">{wallet.type}</p></div>
            <div><p className="text-white/40">Created</p><p className="text-white">{new Date(wallet.createdAt).toLocaleDateString()}</p></div>
            <div><p className="text-white/40">Pending</p><p className="text-white">{formatINR(wallet.pendingBalance)}</p></div>
            <div><p className="text-white/40">Expired</p><p className="text-white">{formatINR(wallet.expiredBalance)}</p></div>
            <div><p className="text-white/40">Lifetime Redeemed</p><p className="text-white">{formatINR(wallet.lifetimeRedeemed)}</p></div>
            <div><p className="text-white/40">Redemptions</p><p className="text-white">{wallet.redemptionCount}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
