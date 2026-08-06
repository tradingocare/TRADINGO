'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Building2, User, Mail, Phone, FileText, DollarSign, Calendar,
  Send, Loader2, AlertTriangle,
} from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { useInquiry, useUpdateInquiryStatus } from '@/hooks/use-tradeserv';
import { useSaveToast } from '@/hooks/use-save-toast';
import { SaveToast } from '@/components/tradeserv/save-toast';

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 surface-card p-3.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="h-4 w-4 text-[#f59e0b]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-text-tertiary">{label}</p>
        <p className="text-sm text-text-primary break-words">{value}</p>
      </div>
    </div>
  );
}

export default function InquiryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: inquiry, isLoading, isError } = useInquiry(id);
  const updateStatus = useUpdateInquiryStatus();
  const { saved, handleSave } = useSaveToast();

  const handleAccept = async () => {
    await updateStatus.mutateAsync({ id, status: 'ACCEPTED' });
    handleSave();
  };

  const handleDecline = async () => {
    await updateStatus.mutateAsync({ id, status: 'REJECTED' });
    handleSave();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#f59e0b]" />
      </div>
    );
  }

  if (isError || !inquiry) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl font-bold text-text-tertiary">404</p>
        <p className="mt-2 text-sm text-text-tertiary">Inquiry not found</p>
        <Link
          href="/tradeserv/workspace/inquiries"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-xs text-text-secondary transition-all hover:bg-surface"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Inquiries
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Inquiry Detail"
        description={`From ${inquiry.clientName}${inquiry.clientCompany ? ` at ${inquiry.clientCompany}` : ''}`}
        actions={
          <Link
            href="/tradeserv/workspace/inquiries"
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs text-text-secondary transition-all hover:bg-surface-secondary"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        }
      />

      <div className="glass-card-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-text-primary">Status</h3>
            <StatusBadge status={inquiry.status.toLowerCase()} />
          </div>
          <span className="text-xs text-text-tertiary">{new Date(inquiry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <div className="glass-card-xl p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Contact Information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {inquiry.clientCompany && <InfoRow icon={Building2} label="Company" value={inquiry.clientCompany} />}
          <InfoRow icon={User} label="Contact Person" value={inquiry.clientName} />
          <InfoRow icon={Mail} label="Email" value={inquiry.email} />
          {inquiry.phone && <InfoRow icon={Phone} label="Phone" value={inquiry.phone} />}
        </div>
      </div>

      <div className="glass-card-xl p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Requirement</h3>
        <p className="text-sm leading-relaxed text-text-secondary">{inquiry.requirement}</p>
      </div>

      <div className="glass-card-xl p-5">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Project Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {inquiry.budget && <InfoRow icon={DollarSign} label="Budget" value={inquiry.budget} />}
          {inquiry.timeline && <InfoRow icon={Calendar} label="Timeline" value={inquiry.timeline} />}
        </div>
      </div>

      {inquiry.status === 'NEW' && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={updateStatus.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> {updateStatus.isPending ? 'Accepting...' : 'Accept Inquiry'}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            disabled={updateStatus.isPending}
            className="rounded-full border border-border px-6 py-2.5 text-xs font-medium text-text-secondary transition-all hover:bg-surface disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}

      <SaveToast show={saved} message="Inquiry status updated" />
    </div>
  );
}
