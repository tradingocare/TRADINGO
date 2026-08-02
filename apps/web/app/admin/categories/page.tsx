'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/components/ui/use-toast'
import { FolderTree, Plus, Edit2, Trash2, ChevronRight, Loader2 } from 'lucide-react'

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  parentId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  productCount?: number;
  serviceCount?: number;
  children?: CategoryNode[];
}

interface FormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  parentId: string;
  isActive: boolean;
  sortOrder: number;
}

const emptyForm: FormData = { name: '', slug: '', description: '', icon: '', parentId: '', isActive: true, sortOrder: 0 };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [parentOptions, setParentOptions] = useState<{ id: string; name: string }[]>([]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiClient.get<CategoryNode[]>('/categories/tree');
      setCategories(Array.isArray(data) ? data : (data as any)?.data || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    if (modalOpen) {
      apiClient.get<any>('/categories?limit=100').then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setParentOptions(list.filter((c: any) => c.id !== editingId).map((c: any) => ({ id: c.id, name: c.name })));
      }).catch(() => {});
    }
  }, [modalOpen, editingId]);

  const countChildren = (node: CategoryNode): number => {
    if (!node.children || node.children.length === 0) return 0;
    return node.children.length + node.children.reduce((sum, c) => sum + countChildren(c), 0);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = async (cat: CategoryNode) => {
    setEditingId(cat.id);
    try {
      const data = await apiClient.get<any>(`/categories/${cat.id}`);
      const c = (data as any)?.data || data;
      setForm({
        name: c.name || '',
        slug: c.slug || '',
        description: c.description || '',
        icon: c.icon || '',
        parentId: c.parentId || '',
        isActive: c.isActive !== false,
        sortOrder: c.sortOrder ?? 0,
      });
    } catch {
      setForm({
        name: cat.name || '', slug: cat.slug || '', description: '', icon: '',
        parentId: cat.parentId || '', isActive: true, sortOrder: 0,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      if (!payload.parentId) payload.parentId = null;
      if (!payload.slug) delete payload.slug;

      if (editingId) {
        await apiClient.patch(`/categories/${editingId}`, payload);
        toast({ title: 'Category updated' });
      } else {
        await apiClient.post('/categories', payload);
        toast({ title: 'Category created' });
      }
      setModalOpen(false);
      setLoading(true);
      await fetchCategories();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to save category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (id: string) => {
    setDeleting(id);
    try {
      await apiClient.delete(`/categories/${id}`);
      toast({ title: 'Category deleted' });
      setLoading(true);
      await fetchCategories();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to delete category', variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader title="Categories" description="Manage product categories and subcategories." />

        <div className="mt-8 flex justify-end gap-3">
          <Link href="/admin/categories/mapping">
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface hover:bg-surface-secondary px-5 py-2.5 text-sm font-medium text-text-primary transition-all cursor-pointer">
              <FolderTree className="h-4 w-4 text-accent" />
              Catalog Mapping Status
            </div>
          </Link>
          <button onClick={openAdd} className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-medium text-btn-primary-text transition-colors hover:bg-accent/90">
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>

        {loading ? (
          <div className="mt-8 flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-accent" /></div>
        ) : categories.length === 0 ? (
          <div className="mt-8 py-20 text-center text-text-tertiary">No categories found.</div>
        ) : (
          <div className="mt-4 space-y-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                        <FolderTree className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">{category.name}</h3>
                        <p className="text-xs text-text-tertiary">{((category.productCount || 0) + (category.serviceCount || 0)).toLocaleString()} products &middot; {countChildren(category)} subcategories</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(category)} className="rounded-lg border border-border bg-surface p-2 text-text-tertiary transition-colors hover:text-accent"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => confirmDelete(category.id)} disabled={deleting === category.id} className="rounded-lg border border-border bg-surface p-2 text-text-tertiary transition-colors hover:text-red-500 disabled:opacity-40">
                        {deleting === category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {category.children && category.children.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {category.children.map((sub) => (
                        <span key={sub.id} className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-text-tertiary">
                          {sub.name}
                          <ChevronRight className="h-3 w-3 text-text-tertiary" />
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Category' : 'Add Category'} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Category name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Slug</label>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent" placeholder="leave blank to auto-generate" />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Parent</label>
            <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="">None (root category)</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Brief description" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Icon</label>
              <input type="text" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Icon name/URL" />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent" />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-border bg-surface text-accent focus:ring-accent" />
            <span className="text-sm text-text-secondary">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded-xl border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.name} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-btn-primary-text hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
