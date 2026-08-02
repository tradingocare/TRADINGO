'use client';

import { useState } from 'react';
import { CalendarDays, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { DashboardPageHeader, StatCard, TableSkeleton, StatusBadge } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { useAdminBookingStats, useAdminBookings } from '@/hooks/use-tradeserv';
import type { Booking } from '@/lib/api/tradeserv';

export default function AdminTradeservBookingsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: stats, isLoading: statsLoading } = useAdminBookingStats();
  const { data: bookingsData, isLoading: listLoading, error: listError } = useAdminBookings(
    { page, limit: 20, ...(statusFilter ? { status: statusFilter } : {}) },
  );

  const r = bookingsData as { data: Booking[]; meta?: { total?: number; totalPages?: number } } | undefined;
  const bookings = r?.data ?? [];
  const totalPages = r?.meta?.totalPages ?? 0;
  const total = r?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="TradeServ Bookings"
        description="Monitor and manage all professional service bookings"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={CalendarDays} label="Total" value={statsLoading ? '-' : String(stats?.total ?? 0)} />
        <StatCard icon={Clock} label="Pending" value={statsLoading ? '-' : String(stats?.pending ?? 0)} />
        <StatCard icon={CheckCircle} label="Confirmed" value={statsLoading ? '-' : String(stats?.confirmed ?? 0)} />
        <StatCard icon={Loader2} label="In Progress" value={statsLoading ? '-' : String(stats?.inProgress ?? 0)} />
        <StatCard icon={CheckCircle} label="Completed" value={statsLoading ? '-' : String(stats?.completed ?? 0)} />
        <StatCard icon={XCircle} label="Cancelled" value={statsLoading ? '-' : String(stats?.cancelled ?? 0)} />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Select
              className="h-9 w-44 text-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>

          {listLoading ? (
            <TableSkeleton rows={8} />
          ) : listError ? (
            <p className="py-4 text-center text-sm text-red-400">Failed to load bookings.</p>
          ) : bookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No bookings found"
              description={statusFilter ? 'No bookings match the selected status' : 'No bookings have been made yet'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Professional</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Client</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Status</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Amount</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Payment</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                        <td className="py-3 font-medium text-text-primary">
                          {b.company?.name || '-'}
                        </td>
                        <td className="py-3 text-text-secondary">
                          {b.clientId ? (b as any).client?.name || b.clientId.slice(0, 8) : '-'}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="py-3 text-text-primary">
                          {b.amount ? `₹${Number(b.amount).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3">
                          <StatusBadge status={b.paymentStatus || 'PENDING'} />
                        </td>
                        <td className="py-3 text-xs text-text-tertiary">
                          {new Date(b.scheduledAt).toLocaleDateString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm text-text-tertiary">
                    Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary disabled:opacity-40"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </button>
                    <button
                      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-primary disabled:opacity-40"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
