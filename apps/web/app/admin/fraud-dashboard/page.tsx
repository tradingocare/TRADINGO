'use client';

import { DashboardPageHeader, StatCard } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert, Users, Scale, AlertTriangle, Ban, TrendingUp, Activity } from 'lucide-react';
import { useFraudSummary } from '@/hooks/use-wallet';

export default function FraudDashboardPage() {
  const { data: fraud, isLoading, error } = useFraudSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Fraud Detection" description="Monitor and investigate suspicious activity on the platform" />
        <div className="grid gap-6 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-secondary/50 dark:bg-dark-surface-secondary/50" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-surface-secondary/50 dark:bg-dark-surface-secondary/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Fraud Detection" description="Monitor and investigate suspicious activity on the platform" />
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <ShieldAlert className="h-10 w-10 text-red-400" />
            <p className="mt-3 text-sm text-text-secondary dark:text-dark-text-secondary">Failed to load fraud data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = fraud?.summary;
  const flaggedOrders = s?.highVelocityWallets ?? 0;
  const suspiciousUsers = s?.rejectedReferrals24h ?? 0;
  const disputedTransactions = s?.openDisputes ?? 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Fraud Detection"
        description="Monitor and investigate suspicious activity on the platform"
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard icon={AlertTriangle} label="Flagged Wallets" value={String(flaggedOrders)} change="High velocity" changeType={flaggedOrders > 0 ? 'negative' : 'positive'} />
        <StatCard icon={Users} label="Rejected Referrals (24h)" value={String(suspiciousUsers)} change="Fraud attempts" changeType={suspiciousUsers > 0 ? 'negative' : 'positive'} />
        <StatCard icon={Scale} label="Open Disputes" value={String(disputedTransactions)} change="Awaiting resolution" changeType={disputedTransactions > 0 ? 'negative' : 'positive'} />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-red-400" />
            <div>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Failed Txns (24h)</p>
              <p className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{s?.failedTransactions24h ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Ban className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Reversals (24h)</p>
              <p className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{s?.reversals24h ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Activity className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Blacklisted Entries</p>
              <p className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{s?.blacklistedEntries ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="h-8 w-8 text-cyan-400" />
            <div>
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">Referral Alerts (24h)</p>
              <p className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{s?.referralAuditAlerts24h ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallet Fraud Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {fraud?.walletAlerts && fraud.walletAlerts.length > 0 ? (
            <div className="space-y-3">
              {fraud.walletAlerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                  <p className="text-sm text-text-primary dark:text-dark-text-primary">{alert}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-text-secondary dark:text-dark-text-secondary">
              <ShieldAlert className="h-8 w-8" />
              <p className="mt-2 text-sm">No active fraud alerts. Platform is running normally.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
