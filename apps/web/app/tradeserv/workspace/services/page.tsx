'use client';

import { useState } from 'react';
import {
  Briefcase, Plus, X, Star, Clock, DollarSign, Save, AlertCircle,
} from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { FormInput } from '@/components/tradeserv/form-input';
import { StatBox } from '@/components/tradeserv/stat-box';
import { SaveToast } from '@/components/tradeserv/save-toast';
import { useSaveToast } from '@/hooks/use-save-toast';
import { useServices, useAddService, useUpdateService, useDeleteService } from '@/hooks/use-tradeserv';
import { useToast } from '@/components/ui/use-toast';

export default function ServicesCatalogPage() {
  const { toast } = useToast();
  const { data: services, isLoading, error } = useServices();
  const addMutation = useAddService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const { saved, handleSave } = useSaveToast();

  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', category: '', priceMin: '', priceMax: '', pricingType: 'fixed', deliveryDays: '', isActive: true,
  });

  const resetForm = () => setForm({ name: '', description: '', category: '', priceMin: '', priceMax: '', pricingType: 'fixed', deliveryDays: '', isActive: true });

  const list = Array.isArray(services) ? services : [];
  const total = list.length;
  const active = list.filter((s: any) => s.isActive !== false).length;
  const draft = list.filter((s: any) => s.isActive === false).length;

  const openEdit = (svc: any) => {
    setEditId(svc.id);
    setForm({
      name: svc.name || '',
      description: svc.description || '',
      category: svc.category || '',
      priceMin: svc.priceMin?.toString() || '',
      priceMax: svc.priceMax?.toString() || '',
      pricingType: svc.pricingType || 'fixed',
      deliveryDays: svc.deliveryDays?.toString() || '',
      isActive: svc.isActive !== false,
    });
  };

  const handleSubmit = async () => {
    if (!form.name) return;
    const payload: Record<string, unknown> = {
      name: form.name,
      description: form.description || undefined,
      category: form.category || undefined,
      pricingType: form.pricingType || undefined,
      isActive: form.isActive,
    };
    if (form.priceMin) payload.priceMin = parseFloat(form.priceMin);
    if (form.priceMax) payload.priceMax = parseFloat(form.priceMax);
    if (form.deliveryDays) payload.deliveryDays = parseInt(form.deliveryDays, 10);

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
      toast({ title: 'Error', description: 'Failed to save service', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      handleSave();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete service', variant: 'destructive' });
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Services Catalog" description="Define and manage every service you offer" />
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-text-tertiary">Failed to load services. Please try again later.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Services Catalog"
        description="Define and manage every service you offer to clients"
      />

      <GlassCard>
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Briefcase className="h-5 w-5 text-[#f59e0b]" />
          Service Dashboard
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox icon={Briefcase} label="Total Services" value={total} />
          <StatBox icon={Star} label="Active" value={active} sub={total > 0 ? `${Math.round((active / total) * 100)}% published` : ''} />
          <StatBox icon={Clock} label="Draft" value={draft} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Briefcase className="h-5 w-5 text-[#f59e0b]" />
            All Services ({total})
          </h3>
          {!showNew && !editId && (
            <button type="button" onClick={() => { resetForm(); setShowNew(true); }}
              className="flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-bg-base">
              <Plus className="h-3.5 w-3.5" /> Add Service
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-secondary" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((svc: any) => (
              editId === svc.id ? (
                <div key={svc.id} className="space-y-4 rounded-xl bg-surface p-4">
                  <p className="text-xs font-semibold text-text-tertiary">Editing: {svc.name}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormInput label="Service Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                    <FormInput label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="e.g. Audit, GST, Tax" />
                  </div>
                  <FormInput label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea rows={2} />
                  <div className="grid gap-3 sm:grid-cols-4">
                    <FormInput label="Min Price (INR)" value={form.priceMin} onChange={(v) => setForm({ ...form, priceMin: v })} />
                    <FormInput label="Max Price (INR)" value={form.priceMax} onChange={(v) => setForm({ ...form, priceMax: v })} />
                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-xs text-text-tertiary">Pricing Type</label>
                      <select value={form.pricingType} onChange={(e) => setForm({ ...form, pricingType: e.target.value })}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary outline-none ring-accent focus:ring-1">
                        {['hourly', 'fixed', 'monthly', 'custom'].map((pt) => (
                          <option key={pt} value={pt}>{pt}</option>
                        ))}
                      </select>
                    </div>
                    <FormInput label="Delivery Days" value={form.deliveryDays} onChange={(v) => setForm({ ...form, deliveryDays: v })} placeholder="e.g. 7" />
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="h-4 w-4 rounded border-border bg-surface text-accent ring-accent" />
                    <span className="text-xs text-text-tertiary">Active (published)</span>
                  </label>
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
                <div key={svc.id} className={`flex items-start justify-between rounded-xl bg-surface p-3.5 ${svc.isActive === false ? 'opacity-60' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">{svc.name}</p>
                      <StatusBadge status={svc.isActive !== false ? 'active' : 'draft'} />
                    </div>
                    {svc.description && <p className="mt-0.5 text-xs text-text-tertiary">{svc.description}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {svc.category && <span className="rounded bg-surface-secondary px-1.5 py-0.5 text-[9px] text-text-tertiary">{svc.category}</span>}
                      {svc.pricingType && <span className="text-[9px] text-text-tertiary capitalize">{svc.pricingType}</span>}
                      {svc.priceMin != null && <span className="text-[9px] font-medium text-[#f59e0b]">{'\u20B9'}{svc.priceMin.toString()}{svc.priceMax ? ` - \u20B9${svc.priceMax.toString()}` : '+'}</span>}
                      {svc.deliveryDays && <span className="text-[9px] text-text-tertiary"><Clock className="mr-0.5 inline h-2.5 w-2.5" />{svc.deliveryDays} days</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <button type="button" onClick={() => openEdit(svc)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-tertiary transition-all hover:bg-accent/10 hover:text-[#f59e0b]">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button type="button" onClick={() => handleDelete(svc.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-text-tertiary transition-all hover:bg-red-500/10 hover:text-red-400">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            ))}

            {/* New Service Form */}
            {showNew && (
              <div className="space-y-4 rounded-xl bg-surface p-4">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary">
                  <Plus className="h-3.5 w-3.5" /> New Service
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Service Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <FormInput label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="e.g. Audit, GST, Tax" />
                </div>
                <FormInput label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea rows={2} />
                <div className="grid gap-3 sm:grid-cols-4">
                  <FormInput label="Min Price (INR)" value={form.priceMin} onChange={(v) => setForm({ ...form, priceMin: v })} placeholder="e.g. 15000" />
                  <FormInput label="Max Price (INR)" value={form.priceMax} onChange={(v) => setForm({ ...form, priceMax: v })} placeholder="e.g. 50000" />
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs text-text-tertiary">Pricing Type</label>
                    <select value={form.pricingType} onChange={(e) => setForm({ ...form, pricingType: e.target.value })}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary outline-none ring-accent focus:ring-1">
                      {['hourly', 'fixed', 'monthly', 'custom'].map((pt) => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>
                  <FormInput label="Delivery Days" value={form.deliveryDays} onChange={(v) => setForm({ ...form, deliveryDays: v })} placeholder="e.g. 7" />
                </div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-border bg-surface text-accent ring-accent" />
                  <span className="text-xs text-text-tertiary">Active (published immediately)</span>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSubmit} disabled={isPending}
                    className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg-base disabled:opacity-50">
                    {isPending ? 'Creating...' : 'Create Service'}
                  </button>
                  <button type="button" onClick={() => { setShowNew(false); resetForm(); }}
                    className="rounded-full border border-border px-5 py-2 text-xs text-text-tertiary">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary mb-4">
          <DollarSign className="h-5 w-5 text-[#f59e0b]" />
          Pricing Overview
        </h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {(['hourly', 'fixed', 'monthly', 'custom'] as const).map((pt) => {
            const count = list.filter((s: any) => s.pricingType === pt).length;
            return (
              <div key={pt} className="rounded-xl bg-surface p-3.5 text-center">
                <p className="text-xs text-text-tertiary capitalize">{pt}</p>
                <p className="mt-1 text-lg font-bold text-text-primary">{count}</p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <SaveToast show={saved} message="Services updated successfully" />
    </div>
  );
}
