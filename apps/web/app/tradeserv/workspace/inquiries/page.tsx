'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Inbox, ChevronRight, Building2, DollarSign, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Tabs } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { useInquiries } from '@/hooks/use-tradeserv';

const STATUS_TABS = ['All', 'NEW', 'VIEWED', 'ACCEPTED', 'REJECTED', 'CLOSED'] as const;

const statusLabel: Record<string, string> = {
  All: 'All', NEW: 'New', VIEWED: 'Viewed', ACCEPTED: 'Accepted', REJECTED: 'Rejected', CLOSED: 'Closed',
};

export default function InquiriesPage() {
  const { data: inquiries, isLoading, isError } = useInquiries();
  const [activeTab, setActiveTab] = useState<string>('All');

  const filtered = useMemo(() => {
    if (!inquiries) return [];
    if (activeTab === 'All') return inquiries;
    return inquiries.filter((i) => i.status === activeTab);
  }, [inquiries, activeTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm text-text-secondary">Failed to load inquiries</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="My Inquiries"
        description="Manage and respond to client inquiries"
      />

      <Tabs tabs={STATUS_TABS.map(tab => ({
        value: tab,
        label: `${statusLabel[tab] || tab} (${tab === 'All' ? (inquiries?.length || 0) : (inquiries?.filter(i => i.status === tab).length || 0)})`,
      }))} value={activeTab} onChange={setActiveTab} className="rounded-2xl border border-border bg-surface p-1.5" />

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="No inquiries yet" description="When clients send you inquiries, they will appear here." />
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => (
            <Link
              key={inquiry.id}
              href={`/tradeserv/workspace/inquiries/${inquiry.id}`}
              className="group block rounded-3xl border border-border bg-surface p-5 backdrop-blur-xl transition-all hover:border-orange-500/20 hover:shadow-[0_8px_32px_rgba(245, 158, 11, 0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary group-hover:text-[#f59e0b] transition-colors">
                      {inquiry.clientName}
                    </h3>
                    <StatusBadge status={inquiry.status.toLowerCase()} />
                    <span className="text-[10px] text-text-tertiary">{new Date(inquiry.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
                    {inquiry.clientCompany && (
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{inquiry.clientCompany}</span>
                    )}
                    {inquiry.budget && (
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{inquiry.budget}</span>
                    )}
                    {inquiry.timeline && (
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{inquiry.timeline}</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-text-tertiary line-clamp-1">{inquiry.requirement}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-text-tertiary group-hover:text-[#f59e0b] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
