'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, Users, Clock, CheckCircle, XCircle, Star, Shield, Briefcase, CalendarDays, MessageSquare } from 'lucide-react';
import { DashboardPageHeader, StatCard, TableSkeleton, StatusBadge } from '@/components/dashboard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useAdminProfessionalStats, useAdminProfessionals, useApproveProfessional, useRejectProfessional } from '@/hooks/use-tradeserv';

export default function AdminTradeservPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const queryParams: Record<string, string | number | undefined> = { page, limit: 20 };
  if (search) queryParams.search = search;
  if (statusFilter) queryParams.status = statusFilter;

  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminProfessionalStats();
  const { data: professionalsData, isLoading: listLoading, error: listError } = useAdminProfessionals(queryParams);
  const { mutateAsync: approve } = useApproveProfessional();
  const { mutateAsync: reject } = useRejectProfessional();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleApprove = async (id: string) => {
    setActionId(id);
    try { await approve({ id }); } catch { /* toast handled by hook */ }
    setActionId(null);
  };

  const handleReject = async (id: string) => {
    setActionId(id);
    try { await reject({ id }); } catch { /* toast handled by hook */ }
    setActionId(null);
  };

  const r = professionalsData as { data: any[]; meta?: { total?: number; totalPages?: number } } | undefined;
  const professionals = r?.data ?? [];
  const totalPages = r?.meta?.totalPages ?? 0;
  const total = r?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="TradeServ"
        description="Manage professional services marketplace"
      />

      {statsError ? (
        <p className="text-sm text-red-400">Failed to load stats.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
            <StatCard icon={Users} label="Total" value={statsLoading ? '-' : String(stats?.total ?? 0)} />
            <StatCard icon={Clock} label="Pending" value={statsLoading ? '-' : String(stats?.pending ?? 0)} />
            <StatCard icon={CheckCircle} label="Approved" value={statsLoading ? '-' : String(stats?.approved ?? 0)} />
            <StatCard icon={XCircle} label="Rejected" value={statsLoading ? '-' : String(stats?.rejected ?? 0)} />
            <StatCard icon={Briefcase} label="Services" value={statsLoading ? '-' : String(stats?.services ?? 0)} />
            <Link href="/admin/tradeserv/bookings" className="block">
              <StatCard icon={CalendarDays} label="Bookings" value={statsLoading ? '-' : String(stats?.bookings ?? 0)} />
            </Link>
            <StatCard icon={MessageSquare} label="Reviews" value={statsLoading ? '-' : String(stats?.reviews ?? 0)} />
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search by name or email..."
                className="h-9 w-full max-w-sm pl-9 text-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Select
              className="h-9 w-40 text-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Status</option>
              <option value="PENDING_REVIEW">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>
            <Button variant="outline" size="sm" onClick={handleSearch}>
              <Search className="mr-1 h-3 w-3" /> Search
            </Button>
          </div>

          {listLoading ? (
            <TableSkeleton rows={8} />
          ) : listError ? (
            <p className="py-4 text-center text-sm text-red-400">Failed to load professionals.</p>
          ) : professionals.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No professionals found"
              description={search || statusFilter ? 'Try adjusting your filters' : 'No professionals have registered yet'}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Name</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Type</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Status</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Trust</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Verification</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Last Updated</th>
                      <th className="sticky top-0 bg-bg-base pb-2 font-medium text-text-tertiary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professionals.map((p: any) => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                        <td className="py-3">
                          <Link href={`/admin/tradeserv/${p.id}`} className="font-medium text-text-primary hover:text-accent">
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-3">
                          <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs text-text-secondary">
                            {p.professionalType?.replace(/_/g, ' ') || '-'}
                          </span>
                        </td>
                        <td className="py-3">
                          <StatusBadge status={p.professionalStatus || 'UNKNOWN'} />
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400" />
                            <span className="text-sm text-text-primary">{(p.trustScore ?? 0).toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          {p.verificationLevel ? (
                            <Badge variant="outline">{p.verificationLevel}</Badge>
                          ) : (
                            <span className="text-xs text-text-tertiary">-</span>
                          )}
                        </td>
                        <td className="py-3 text-xs text-text-tertiary">
                          {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <Link href={`/admin/tradeserv/${p.id}`}>
                              <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3" /></Button>
                            </Link>
                            {p.professionalStatus === 'PENDING_REVIEW' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-400 hover:text-green-300"
                                  disabled={actionId === p.id}
                                  onClick={() => handleApprove(p.id)}
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:text-red-300"
                                  disabled={actionId === p.id}
                                  onClick={() => handleReject(p.id)}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
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
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                      Next
                    </Button>
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
