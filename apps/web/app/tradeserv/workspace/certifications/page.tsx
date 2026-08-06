'use client';

import { useState } from 'react';
import { Award, Plus, X, AlertCircle } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { FormInput } from '@/components/tradeserv/form-input';
import { SaveToast } from '@/components/tradeserv/save-toast';
import { useSaveToast } from '@/hooks/use-save-toast';
import { useCertifications, useAddCertification, useUpdateCertification, useDeleteCertification } from '@/hooks/use-tradeserv';
import { useToast } from '@/components/ui/use-toast';

export default function CertificationsPage() {
  const { toast } = useToast();
  const { data: certifications, isLoading, error } = useCertifications();
  const addMutation = useAddCertification();
  const updateMutation = useUpdateCertification();
  const deleteMutation = useDeleteCertification();
  const { saved, handleSave } = useSaveToast();

  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', issuingAuthority: '', issueDate: '', expiryDate: '', certificateUrl: '',
  });

  const resetForm = () => setForm({ name: '', issuingAuthority: '', issueDate: '', expiryDate: '', certificateUrl: '' });

  const list = Array.isArray(certifications) ? certifications : [];

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      name: item.name || '',
      issuingAuthority: item.issuingAuthority || '',
      issueDate: item.issueDate ? item.issueDate.slice(0, 10) : '',
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
      certificateUrl: item.certificateUrl || '',
    });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.issuingAuthority || !form.issueDate) return;
    const payload: Record<string, unknown> = {
      name: form.name,
      issuingAuthority: form.issuingAuthority,
      issueDate: form.issueDate,
      expiryDate: form.expiryDate || undefined,
      certificateUrl: form.certificateUrl || undefined,
    };

    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
      } else {
        await addMutation.mutateAsync(payload);
      }
      resetForm();
      setEditId(null);
      setShowNew(false);
      handleSave();
    } catch {
      toast({ title: 'Error', description: 'Failed to save certification', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      handleSave();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete certification', variant: 'destructive' });
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Certifications" description="Manage your professional certifications and licenses" />
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-text-tertiary">Failed to load certifications. Please try again later.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Certifications"
        description="Manage your professional certifications and licenses"
      />

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Award className="h-5 w-5 text-[#f59e0b]" />
            Certifications & Licenses ({list.length})
          </h3>
          {!showNew && !editId && (
            <button type="button" onClick={() => { resetForm(); setShowNew(true); }}
              className="flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-bg-base">
              <Plus className="h-3.5 w-3.5" /> Add Certification
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-secondary" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {list.length === 0 && !showNew && (
              <p className="py-6 text-center text-xs text-text-tertiary">No certifications yet. Add your first certification.</p>
            )}
            {list.map((item: any) => (
              editId === item.id ? (
                <div key={item.id} className="space-y-4 rounded-xl bg-surface p-4">
                  <p className="text-xs font-semibold text-text-tertiary">Editing: {item.name}</p>
                  <FormInput label="Certification Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormInput label="Issuing Authority" value={form.issuingAuthority} onChange={(v) => setForm({ ...form, issuingAuthority: v })} />
                    <FormInput label="Issue Date" value={form.issueDate} onChange={(v) => setForm({ ...form, issueDate: v })} type="date" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormInput label="Expiry Date (optional)" value={form.expiryDate} onChange={(v) => setForm({ ...form, expiryDate: v })} type="date" />
                    <FormInput label="Certificate URL (optional)" value={form.certificateUrl} onChange={(v) => setForm({ ...form, certificateUrl: v })} placeholder="https://example.com/cert" />
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSubmit} disabled={isPending}
                      className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg-base disabled:opacity-50">
                      {isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => { setEditId(null); resetForm(); }}
                      className="rounded-full border border-border px-5 py-2 text-xs text-text-tertiary">Cancel</button>
                  </div>
                </div>
              ) : (
                <div key={item.id} className="flex items-start justify-between rounded-xl bg-surface p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">{item.name}</p>
                    <p className="mt-0.5 text-xs text-text-tertiary">{item.issuingAuthority} &middot; {new Date(item.issueDate).getFullYear()}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {item.expiryDate && (
                        <span className="text-[9px] text-text-tertiary">
                          Expires: {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                      )}
                      {item.certificateUrl && (
                        <a href={item.certificateUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[9px] text-accent hover:underline">View Certificate</a>
                      )}
                      <span className={`text-[9px] ${item.verificationStatus === 'VERIFIED' ? 'text-emerald-500' : item.verificationStatus === 'REJECTED' ? 'text-red-500' : 'text-amber-500'}`}>
                        {item.verificationStatus || 'PENDING'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button type="button" onClick={() => openEdit(item)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-tertiary transition-all hover:bg-accent/10 hover:text-[#f59e0b]">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => handleDelete(item.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-tertiary transition-all hover:bg-red-500/10 hover:text-red-400">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            ))}

            {showNew && (
              <div className="space-y-4 rounded-xl bg-surface p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary">
                  <Plus className="h-3.5 w-3.5" /> New Certification
                </h4>
                <FormInput label="Certification Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Issuing Authority" value={form.issuingAuthority} onChange={(v) => setForm({ ...form, issuingAuthority: v })} />
                  <FormInput label="Issue Date" value={form.issueDate} onChange={(v) => setForm({ ...form, issueDate: v })} type="date" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Expiry Date (optional)" value={form.expiryDate} onChange={(v) => setForm({ ...form, expiryDate: v })} type="date" />
                  <FormInput label="Certificate URL (optional)" value={form.certificateUrl} onChange={(v) => setForm({ ...form, certificateUrl: v })} placeholder="https://example.com/cert" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSubmit} disabled={isPending}
                    className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg-base disabled:opacity-50">
                    {isPending ? 'Creating...' : 'Add Certification'}
                  </button>
                  <button type="button" onClick={() => { setShowNew(false); resetForm(); }}
                    className="rounded-full border border-border px-5 py-2 text-xs text-text-tertiary">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <SaveToast show={saved} message="Certifications updated successfully" />
    </div>
  );
}
