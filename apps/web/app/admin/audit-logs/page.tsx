'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Calendar, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  status: string;
}

const auditLogs: AuditLog[] = [
  { id: '1', timestamp: '2026-06-14 10:32:15', user: 'admin@tradingo.com', userRole: 'Admin', action: 'UPDATE', resource: 'User', resourceId: 'USR-1234', details: 'Changed user role from BUYER to SELLER', ipAddress: '192.168.1.100', status: 'success' },
  { id: '2', timestamp: '2026-06-14 10:28:03', user: 'moderator@tradingo.com', userRole: 'Moderator', action: 'DELETE', resource: 'Review', resourceId: 'REV-5678', details: 'Deleted inappropriate product review', ipAddress: '192.168.1.101', status: 'success' },
  { id: '3', timestamp: '2026-06-14 10:15:44', user: 'seller@company.com', userRole: 'Seller', action: 'CREATE', resource: 'Product', resourceId: 'PRD-9012', details: 'Created new product listing: Premium Cotton Fabric', ipAddress: '10.0.0.55', status: 'success' },
  { id: '4', timestamp: '2026-06-14 09:55:22', user: 'system', userRole: 'System', action: 'AUTO', resource: 'Order', resourceId: 'ORD-0842', details: 'Auto-cancelled order due to payment timeout', ipAddress: '127.0.0.1', status: 'warning' },
  { id: '5', timestamp: '2026-06-14 09:30:11', user: 'buyer@example.com', userRole: 'Buyer', action: 'CREATE', resource: 'RFQ', resourceId: 'RFQ-3456', details: 'Created RFQ for Industrial Circuit Boards (500 pcs)', ipAddress: '10.0.0.88', status: 'success' },
  { id: '6', timestamp: '2026-06-14 09:12:08', user: 'unknown', userRole: 'Guest', action: 'LOGIN_FAILED', resource: 'Account', resourceId: 'USR-9999', details: 'Failed login attempt - invalid password (3rd attempt)', ipAddress: '203.0.113.50', status: 'error' },
  { id: '7', timestamp: '2026-06-14 08:45:33', user: 'admin@tradingo.com', userRole: 'Admin', action: 'VERIFY', resource: 'KYC', resourceId: 'KYC-7890', details: 'Approved KYC submission for ABC Trading Co.', ipAddress: '192.168.1.100', status: 'success' },
  { id: '8', timestamp: '2026-06-14 08:20:17', user: 'moderator@tradingo.com', userRole: 'Moderator', action: 'FLAG', resource: 'Dispute', resourceId: 'DSP-0012', details: 'Escalated dispute to admin review', ipAddress: '192.168.1.101', status: 'warning' },
  { id: '9', timestamp: '2026-06-14 07:55:44', user: 'system', userRole: 'System', action: 'AUTO', resource: 'Backup', resourceId: 'BK-2026-06-14', details: 'Automated database backup completed successfully', ipAddress: '127.0.0.1', status: 'success' },
  { id: '10', timestamp: '2026-06-14 07:30:02', user: 'admin@tradingo.com', userRole: 'Admin', action: 'UPDATE', resource: 'Settings', resourceId: 'CFG-GLOBAL', details: 'Updated platform commission rate from 2.5% to 3.0%', ipAddress: '192.168.1.100', status: 'success' },
];

const statusColors: Record<string, string> = {
  success: 'text-accent-600',
  warning: 'text-amber-600',
  error: 'text-red-600',
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 5;

  const filtered = auditLogs.filter(
    (log) =>
      log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Audit Logs"
        description="Track all platform activity and changes"
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Logs
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 border-b border-border p-4 dark:border-dark-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search logs by user, action, resource..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-1.5 h-3.5 w-3.5" />
              Date Range
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-secondary/50 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:bg-dark-surface-secondary/50 dark:text-dark-text-secondary">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="hidden px-4 py-3 md:table-cell">Details</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-secondary dark:text-dark-text-secondary">
                      No audit logs match your search.
                    </td>
                  </tr>
                ) : (
                  paginated.map((log) => (
                    <tr key={log.id} className="border-b border-border last:border-0 dark:border-dark-border hover:bg-surface-secondary/30 dark:hover:bg-dark-surface-secondary/30">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-text-secondary dark:text-dark-text-secondary">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                            {log.user}
                          </p>
                          <p className="text-[10px] text-text-tertiary">{log.userRole}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={log.action.toLowerCase()} />
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm text-text-primary dark:text-dark-text-primary">{log.resource}</p>
                          <p className="text-[10px] text-text-tertiary">{log.resourceId}</p>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 text-sm text-text-secondary dark:text-dark-text-secondary md:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="line-clamp-1">{log.details}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${statusColors[log.status] || 'text-text-secondary'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusColors[log.status]?.replace('text-', 'bg-') || 'bg-text-secondary'}`} />
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3 dark:border-dark-border">
              <p className="text-xs text-text-tertiary">
                Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
