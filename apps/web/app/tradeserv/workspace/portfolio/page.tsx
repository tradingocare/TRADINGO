'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Image, Plus, X, Video, FileText, FolderOpen, Star, ExternalLink,
  ChevronDown, ChevronUp, Save, CheckCircle, Briefcase, Layers, Award,
  BarChart3, AlertCircle,
} from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { FormInput } from '@/components/tradeserv/form-input';
import { StatBox } from '@/components/tradeserv/stat-box';
import { SaveToast } from '@/components/tradeserv/save-toast';
import { useSaveToast } from '@/hooks/use-save-toast';
import { usePortfolio, useAddPortfolioItem, useUpdatePortfolioItem, useDeletePortfolioItem, useMyProfile } from '@/hooks/use-tradeserv';
import { useToast } from '@/components/ui/use-toast';

export default function PortfolioPage() {
  const { toast } = useToast();
  const { data: portfolio, isLoading, error } = usePortfolio();
  const addMutation = useAddPortfolioItem();
  const updateMutation = useUpdatePortfolioItem();
  const deleteMutation = useDeletePortfolioItem();
  const { data: profile } = useMyProfile();
  const { saved, handleSave } = useSaveToast();

  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', clientName: '', completionDate: '', tags: '', isFeatured: false,
  });

  const resetForm = () => setForm({ title: '', description: '', clientName: '', completionDate: '', tags: '', isFeatured: false });

  const list = Array.isArray(portfolio) ? portfolio : [];
  const imagesCount = list.filter((p: any) => p.media && typeof p.media === 'object' && Object.keys(p.media).length > 0).length;
  const featuredCount = list.filter((p: any) => p.isFeatured).length;

  const openEdit = (item: any) => {
    setEditId(item.id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      clientName: item.clientName || '',
      completionDate: item.completionDate ? item.completionDate.slice(0, 10) : '',
      tags: (item.tags || []).join(', '),
      isFeatured: item.isFeatured || false,
    });
  };

  const handleSubmit = async () => {
    if (!form.title) return;
    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || undefined,
      clientName: form.clientName || undefined,
      tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      isFeatured: form.isFeatured,
    };
    if (form.completionDate) payload.completionDate = form.completionDate;

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
      toast({ title: 'Error', description: 'Failed to save portfolio item', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      handleSave();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete portfolio item', variant: 'destructive' });
    }
  };

  const isPending = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Portfolio & Media" description="Showcase your work with projects and media" />
        <GlassCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <p className="text-sm text-text-tertiary">Failed to load portfolio. Please try again later.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Portfolio & Media"
        description="Showcase your work with projects, case studies, and media"
      />

      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[#f59e0b]" />
          <h3 className="text-sm font-semibold text-text-primary">Portfolio Overview</h3>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBox icon={Briefcase} label="Total Projects" value={list.length} sub={featuredCount > 0 ? `${featuredCount} featured` : ''} />
          <StatBox icon={Image} label="With Media" value={imagesCount} />
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
            <Briefcase className="h-5 w-5 text-[#f59e0b]" />
            Projects ({list.length})
          </h3>
          {!showNew && !editId && (
            <button type="button" onClick={() => { resetForm(); setShowNew(true); }}
              className="flex items-center gap-1 rounded-full bg-accent px-4 py-1.5 text-xs font-semibold text-bg-base">
              <Plus className="h-3.5 w-3.5" /> Add Project
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
              <p className="py-6 text-center text-xs text-text-tertiary">No portfolio items yet. Add your first project.</p>
            )}
            {list.map((item: any) => (
              editId === item.id ? (
                <div key={item.id} className="space-y-4 rounded-xl bg-surface p-4">
                  <p className="text-xs font-semibold text-text-tertiary">Editing: {item.title}</p>
                  <FormInput label="Project Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
                  <FormInput label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea rows={2} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormInput label="Client Name" value={form.clientName} onChange={(v) => setForm({ ...form, clientName: v })} />
                    <FormInput label="Completion Date" value={form.completionDate} onChange={(v) => setForm({ ...form, completionDate: v })} type="date" />
                  </div>
                  <FormInput label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="e.g. Audit, GST, Tax" />
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                      className="h-4 w-4 rounded border-border bg-surface text-accent ring-accent" />
                    <span className="text-xs text-text-tertiary">Featured project</span>
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
                <div key={item.id} className={`flex items-start justify-between rounded-xl bg-surface p-3.5 ${item.isFeatured ? 'border border-amber-500/20' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-text-primary">{item.title}</p>
                      {item.isFeatured && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    </div>
                    {item.description && <p className="mt-0.5 text-xs text-text-tertiary">{item.description}</p>}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {item.clientName && <span className="text-[9px] text-text-tertiary">Client: {item.clientName}</span>}
                      {item.tags?.length > 0 && item.tags.map((t: string) => (
                        <span key={t} className="rounded bg-surface px-1.5 py-0.5 text-[9px] text-text-tertiary">{t}</span>
                      ))}
                      {item.completionDate && <span className="text-[9px] text-text-tertiary">{new Date(item.completionDate).toLocaleDateString()}</span>}
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
                  <Plus className="h-3.5 w-3.5" /> New Project
                </h4>
                <FormInput label="Project Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
                <FormInput label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} textarea rows={2} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormInput label="Client Name" value={form.clientName} onChange={(v) => setForm({ ...form, clientName: v })} />
                  <FormInput label="Completion Date" value={form.completionDate} onChange={(v) => setForm({ ...form, completionDate: v })} type="date" />
                </div>
                <FormInput label="Tags (comma separated)" value={form.tags} onChange={(v) => setForm({ ...form, tags: v })} placeholder="e.g. Audit, GST, Tax" />
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="h-4 w-4 rounded border-border bg-surface text-accent ring-accent" />
                  <span className="text-xs text-text-tertiary">Featured project</span>
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={handleSubmit} disabled={isPending}
                    className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg-base disabled:opacity-50">
                    {isPending ? 'Creating...' : 'Add Project'}
                  </button>
                  <button type="button" onClick={() => { setShowNew(false); resetForm(); }}
                    className="rounded-full border border-border px-5 py-2 text-xs text-text-tertiary">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {list.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-[#f59e0b]" />
              <h3 className="text-sm font-semibold text-text-primary">Portfolio Preview</h3>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link href={`/tradeserv/p/${profile?.slug || 'my-profile'}`} target="_blank"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg-base transition-all hover:bg-accent/90">
              <ExternalLink className="h-3.5 w-3.5" /> View Public Profile
            </Link>
          </div>
        </GlassCard>
      )}

      <SaveToast show={saved} message="Portfolio updated successfully" />
    </div>
  );
}
