'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatusBadge } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldAlert, Users, Scale, AlertTriangle, Search, Ban, Eye, MessageSquare } from 'lucide-react';

interface FlaggedItem {
  id: string;
  type: 'order' | 'user' | 'dispute';
  entity: string;
  entityId: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
  flaggedAt: string;
  flaggedBy: string;
}

const flaggedItems: FlaggedItem[] = [
  { id: '1', type: 'order', entity: 'Order #ORD-2026-0842', entityId: 'ORD-2026-0842', reason: 'Unusual payment pattern - multiple payment methods used', severity: 'high', flaggedAt: '2026-06-14 09:23', flaggedBy: 'Auto-Detect' },
  { id: '2', type: 'user', entity: 'User: shady_trader_99', entityId: 'USR-8891', reason: 'Suspicious account activity - rapid registration from VPN', severity: 'high', flaggedAt: '2026-06-14 08:15', flaggedBy: 'Auto-Detect' },
  { id: '3', type: 'order', entity: 'Order #ORD-2026-0839', entityId: 'ORD-2026-0839', reason: 'Price manipulation detected - 90% below market rate', severity: 'medium', flaggedAt: '2026-06-13 22:45', flaggedBy: 'System' },
  { id: '4', type: 'user', entity: 'User: bulk_buyer_007', entityId: 'USR-7845', reason: 'Multiple accounts with same IP and phone number', severity: 'medium', flaggedAt: '2026-06-13 18:30', flaggedBy: 'Auto-Detect' },
  { id: '5', type: 'dispute', entity: 'Dispute #DSP-2026-0012', entityId: 'DSP-0012', reason: 'Buyer filed 5 disputes in 24 hours', severity: 'low', flaggedAt: '2026-06-13 14:00', flaggedBy: 'Manual Review' },
  { id: '6', type: 'order', entity: 'Order #ORD-2026-0830', entityId: 'ORD-2026-0830', reason: 'Shipping address mismatch with billing', severity: 'low', flaggedAt: '2026-06-13 11:20', flaggedBy: 'System' },
  { id: '7', type: 'dispute', entity: 'Dispute #DSP-2026-0011', entityId: 'DSP-0011', reason: 'Fraudulent documentation submitted as evidence', severity: 'high', flaggedAt: '2026-06-12 16:45', flaggedBy: 'Manual Review' },
];

const severityConfig = {
  high: { label: 'High', variant: 'destructive' as const },
  medium: { label: 'Medium', variant: 'warning' as const },
  low: { label: 'Low', variant: 'secondary' as const },
};

const typeIcons = {
  order: ShieldAlert,
  user: Users,
  dispute: Scale,
};

const typeColors: Record<string, string> = {
  order: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
  user: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  dispute: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
};

export default function FraudDashboardPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const filtered = flaggedItems.filter((item) => {
    const matchesSearch =
      item.entity.toLowerCase().includes(search.toLowerCase()) ||
      item.reason.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || item.severity === filter;
    return matchesSearch && matchesFilter;
  });

  const highCount = flaggedItems.filter((i) => i.severity === 'high').length;
  const suspiciousUsers = flaggedItems.filter((i) => i.type === 'user').length;
  const disputedTransactions = flaggedItems.filter((i) => i.type === 'dispute').length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Fraud Detection"
        description="Monitor and investigate suspicious activity on the platform"
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard icon={AlertTriangle} label="Flagged Orders" value={String(flaggedItems.filter((i) => i.type === 'order').length)} change="High risk" changeType={highCount > 2 ? 'negative' : 'positive'} />
        <StatCard icon={Users} label="Suspicious Users" value={String(suspiciousUsers)} change="Under review" changeType="neutral" />
        <StatCard icon={Scale} label="Disputed Transactions" value={String(disputedTransactions)} change="Awaiting investigation" changeType="negative" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Flagged Items</CardTitle>
          <div className="flex items-center gap-2">
            {(['all', 'high', 'medium', 'low'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <Input placeholder="Search flagged items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-text-secondary dark:text-dark-text-secondary">
                <ShieldAlert className="h-8 w-8" />
                <p className="mt-2 text-sm">No flagged items match your criteria.</p>
              </div>
            ) : (
              filtered.map((item) => {
                const TypeIcon = typeIcons[item.type];
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-4 rounded-lg border border-border bg-surface-secondary/30 p-4 transition-colors hover:bg-surface-secondary/50 dark:border-dark-border dark:bg-dark-surface-secondary/30 dark:hover:bg-dark-surface-secondary/50"
                  >
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${typeColors[item.type]}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{item.entity}</p>
                        <StatusBadge status={severityConfig[item.severity].label} />
                      </div>
                      <p className="mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">{item.reason}</p>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-text-tertiary">
                        <span>Flagged: {item.flaggedAt}</span>
                        <span>By: {item.flaggedBy}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm"><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm"><Ban className="h-3.5 w-3.5 text-red-500" /></Button>
                      <Button variant="ghost" size="sm"><MessageSquare className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
