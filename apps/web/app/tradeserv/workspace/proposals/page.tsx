'use client';

import { useState } from 'react';
import {
  FileText, Plus, X, ChevronDown, ChevronUp,
  Clock, Send, DollarSign, CheckCircle, AlertCircle,
} from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { FormInput } from '@/components/tradeserv/form-input';
import { StatBox } from '@/components/tradeserv/stat-box';
import { SaveToast } from '@/components/tradeserv/save-toast';
import { useSaveToast } from '@/hooks/use-save-toast';
import { useProposals, useCreateProposal, useUpdateProposalStatus } from '@/hooks/use-tradeserv';
import { useToast } from '@/components/ui/use-toast';

const STATUS_BADGE_MAP: Record<string, 'approved' | 'pending' | 'draft' | 'active'> = {
  ACCEPTED: 'approved', SENT: 'active', DRAFT: 'draft', REJECTED: 'draft', EXPIRED: 'pending',
};

export default function ProposalsPage() {
  const { toast } = useToast();
  const { data: proposalsData, isLoading, error } = useProposals();
  const createMutation = useCreateProposal();
  const statusMutation = useUpdateProposalStatus();
  const { saved, handleSave } = useSaveToast();

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', amount: '', deliveryDays: '', clientId: '',
  });

  const resetForm = () => setForm({ title: '', description: '', amount: '', deliveryDays: '', clientId: '' });

  const list = proposalsData?.asProfessional ?? [];
  const total = list.length;
  const draft = list.filter((p: any) => p.status === 'DRAFT').length;
  const sent = list.filter((p: any) => p.status === 'SENT').length;
  const accepted = list.filter((p: any) => p.status === 'ACCEPTED').length;
  const rejected = list.filter((p: any) => p.status === 'REJECTED').length;
  const expired = list.filter((p: any) => p.status === 'EXPIRED').length;
  const conversion = (sent + accepted) > 0 ? Math.round((accepted / (sent + accepted)) * 100) : 0;

  const handleCreate = async () => {
    if (!form.title) return;
    const payload: Record<string, unknown> = { title: form.title, description: form.description || undefined };
    if (form.amount) payload.amount = parseFloat(form.amount);
    if (form.deliveryDays) payload.deliveryDays = parseInt(form.deliveryDays, 10);
    try {
      await createMutation.mutateAsync(payload);
      resetForm();
      setShowNew(false);
      handleSave();
    } catch {
      toast({ title: 'Error', description: 'Failed to create proposal', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await statusMutation.mutateAsync({ id, data: { status } });
      handleSave();
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const isPending = createMutation.isPending || statusMutation.isPending;

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Proposals & Quotations" description="Create, manage, and send professional proposals" />
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-text-tertiary">Failed to load proposals.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Proposals & Quotations"
        description="Create, manage, and send professional proposals to your clients"
        actions={
          <button type="button" onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-bg-base transition-all hover:bg-accent/90">
            <Plus className="h-4 w-4" /> New Proposal
          </button>
        }
      />

      <GlassCard>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          Proposal Dashboard
        </h3>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          <StatBox label="Total" value={total} />
          <StatBox label="Draft" value={draft} />
          <StatBox label="Sent" value={sent} />
          <StatBox label="Accepted" value={accepted} sub={conversion > 0 ? `${conversion}% conv.` : ''} />
          <StatBox label="Rejected" value={rejected} />
          <StatBox label="Expired" value={expired} />
        </div>
      </GlassCard>

      {showNew && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <FileText className="h-5 w-5 text-[#f59e0b]" /> New Proposal
            </h3>
            <button type="button" onClick={() => { setShowNew(false); resetForm(); }}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-tertiary hover:bg-bg-elevated transition-all">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <FormInput label="Proposal Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="e.g. Annual Audit Engagement" />
            <FormInput label="Description (optional)" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea rows={2} />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput label="Amount (INR, optional)" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} placeholder="e.g. 185000" />
              <FormInput label="Delivery Days (optional)" value={form.deliveryDays} onChange={(v) => setForm({ ...form, deliveryDays: v })} placeholder="e.g. 30" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleCreate} disabled={isPending}
                className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg-base disabled:opacity-50">
                {isPending ? 'Creating...' : 'Create Proposal'}
              </button>
              <button type="button" onClick={() => { setShowNew(false); resetForm(); }}
                className="rounded-full border border-border px-5 py-2 text-xs text-text-tertiary">Cancel</button>
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-4">
          <FileText className="h-5 w-5 text-[#f59e0b]" />
          All Proposals ({total})
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-secondary" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {list.length === 0 && (
              <p className="py-6 text-center text-xs text-text-tertiary">No proposals yet.</p>
            )}
            {list.map((p: any) => (
              <div key={p.id} className={`rounded-xl bg-surface p-3.5 ${p.status === 'ACCEPTED' ? 'border border-emerald-500/20' : p.status === 'REJECTED' ? 'border border-red-500/10' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">{p.title}</p>
                      <StatusBadge status={STATUS_BADGE_MAP[p.status] || 'draft'} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px]">
                      {p.clientId && <span className="text-text-tertiary">Client: {p.clientId.slice(0, 8)}...</span>}
                      {p.amount != null && <span className="text-text-tertiary">{'\u20B9'}{p.amount.toString()}</span>}
                      <span className="text-text-tertiary">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.status === 'DRAFT' && (
                      <button type="button" onClick={() => handleStatusChange(p.id, 'SENT')}
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-tertiary transition-all hover:bg-accent/10 hover:text-[#f59e0b]">
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {p.status === 'SENT' && (
                      <>
                        <button type="button" onClick={() => handleStatusChange(p.id, 'ACCEPTED')}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-tertiary transition-all hover:bg-emerald-500/10 hover:text-emerald-400">
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => handleStatusChange(p.id, 'REJECTED')}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-tertiary transition-all hover:bg-red-500/10 hover:text-red-400">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <SaveToast show={saved} message="Proposal updated" />
    </div>
  );
}
