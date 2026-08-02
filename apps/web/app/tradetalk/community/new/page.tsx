'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateCommunity, useCategories } from '@/hooks/use-tradetalk';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CreateCommunityPage() {
  const router = useRouter();
  const { data: categories } = useCategories();
  const createMutation = useCreateCommunity();
  const [form, setForm] = useState({
    name: '', slug: '', description: '', longDescription: '',
    rules: '', categoryId: '', visibility: 'PUBLIC' as string,
    joinSetting: 'OPEN' as string, tags: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'name' ? { slug: value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') } : {}),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast({ title: 'Name and slug are required', variant: 'destructive' });
      return;
    }
    createMutation.mutate(
      {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        longDescription: form.longDescription.trim() || undefined,
        rules: form.rules.trim() || undefined,
        categoryId: form.categoryId || undefined,
        visibility: form.visibility as any,
        joinSetting: form.joinSetting as any,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      },
      {
        onSuccess: (community: any) => {
          toast({ title: 'Community created!' });
          router.push(`/tradetalk/community/${community.slug || community.id}`);
        },
        onError: (err: Error) => {
          toast({ title: 'Failed to create community', description: err.message, variant: 'destructive' });
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/tradetalk/communities" className="mb-6 flex items-center gap-2 text-sm text-text-secondary hover:text-accent transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to communities
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-text-primary">Create a Community</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Indian Textile Exporters" className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Slug *</label>
          <input name="slug" value={form.slug} onChange={handleChange} required placeholder="indian-textile-exporters" className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent" />
          <p className="mt-1 text-xs text-text-tertiary">Auto-generated from name. Used in URLs.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Short Description</label>
          <input name="description" value={form.description} onChange={handleChange} placeholder="Brief description for listing cards" maxLength={300} className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Long Description</label>
          <textarea name="longDescription" value={form.longDescription} onChange={handleChange} rows={4} placeholder="Detailed description of your community" className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-none" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Rules & Guidelines</label>
          <textarea name="rules" value={form.rules} onChange={handleChange} rows={4} placeholder="Community rules (one per line, Markdown supported)" className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Category</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent">
              <option value="">No category</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-text-primary">Visibility</label>
            <select name="visibility" value={form.visibility} onChange={handleChange} className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent">
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
              <option value="INVITE_ONLY">Invite Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Join Setting</label>
          <select name="joinSetting" value={form.joinSetting} onChange={handleChange} className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent">
            <option value="OPEN">Open — anyone can join</option>
            <option value="APPROVAL_REQUIRED">Approval Required</option>
            <option value="INVITE_ONLY">Invite Only</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-text-primary">Tags</label>
          <input name="tags" value={form.tags} onChange={handleChange} placeholder="Comma-separated: textile, export, india" className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent" />
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-btn-primary-text hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {createMutation.isPending ? 'Creating...' : 'Create Community'}
        </button>
      </form>
    </div>
  );
}
