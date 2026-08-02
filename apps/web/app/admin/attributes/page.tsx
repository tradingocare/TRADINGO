'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { getAttributes, createAttribute, updateAttribute, deleteAttribute, type GlobalAttribute } from '@/lib/api/enterprise-catalog'
import { Plus, Edit2, Trash2, Loader2, Tag, Search, GripVertical } from 'lucide-react'

const ATTRIBUTE_TYPES = ['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'COLOR', 'SIZE', 'DIMENSIONS', 'WEIGHT', 'GST', 'HSN', 'DATE', 'URL', 'FILE', 'RICH_TEXT'];

export default function AdminAttributesPage() {
  const [attributes, setAttributes] = useState<GlobalAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', label: '', type: 'TEXT', unit: '', options: '', sortOrder: 0 });
  const { toast } = useToast();

  const fetchAttributes = useCallback(async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await getAttributes(params) as any;
      setAttributes(Array.isArray(res) ? res : res?.data || []);
    } catch { toast({ title: 'Error', description: 'Failed to load attributes', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [search, typeFilter, toast]);

  useEffect(() => { fetchAttributes(); }, [fetchAttributes]);

  const handleSubmit = async () => {
    try {
      const payload = { ...form, options: form.options ? form.options.split(',').map((s: string) => s.trim()).filter(Boolean) : [], sortOrder: Number(form.sortOrder) };
      if (editId) { await updateAttribute(editId, payload); toast({ title: 'Attribute updated' }); }
      else { await createAttribute(payload); toast({ title: 'Attribute created' }); }
      setShowForm(false); setEditId(null); setForm({ name: '', label: '', type: 'TEXT', unit: '', options: '', sortOrder: 0 }); fetchAttributes();
    } catch { toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attribute?')) return;
    try { await deleteAttribute(id); toast({ title: 'Attribute deleted' }); fetchAttributes(); }
    catch { toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' }); }
  };

  const startEdit = (attr: GlobalAttribute) => {
    setForm({ name: attr.name, label: attr.label || '', type: attr.type, unit: attr.unit || '', options: attr.options.join(', '), sortOrder: attr.sortOrder });
    setEditId(attr.id); setShowForm(true);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = { TEXT: 'text-blue-400', NUMBER: 'text-emerald-400', BOOLEAN: 'text-purple-400', SELECT: 'text-amber-400', MULTI_SELECT: 'text-rose-400', COLOR: 'text-pink-400', SIZE: 'text-cyan-400', DIMENSIONS: 'text-indigo-400', WEIGHT: 'text-orange-400', GST: 'text-red-400', HSN: 'text-teal-400' };
    return colors[type] || 'text-text-tertiary';
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader title="Global Attributes" description="Reusable attribute definitions for the enterprise catalog." />

        <div className="mt-6 flex gap-3 items-center flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Search attributes..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {ATTRIBUTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button onClick={() => { setEditId(null); setForm({ name: '', label: '', type: 'TEXT', unit: '', options: '', sortOrder: 0 }); setShowForm(true); }} className="bg-accent text-btn-primary-text hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-1" /> Add Attribute
          </Button>
        </div>

        {showForm && (
          <Card className="mt-4 border border-border bg-surface">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="block text-sm text-text-secondary mb-1">Name *</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="block text-sm text-text-secondary mb-1">Label</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.label} onChange={e => setForm(p => ({ ...p, label: e.target.value }))} /></div>
                <div><label className="block text-sm text-text-secondary mb-1">Type *</label>
                  <select className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                    {ATTRIBUTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm text-text-secondary mb-1">Unit</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} /></div>
                <div><label className="block text-sm text-text-secondary mb-1">Sort Order</label><input type="number" className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))} /></div>
                <div className="md:col-span-2"><label className="block text-sm text-text-secondary mb-1">Options (comma-separated, for SELECT/MULTI_SELECT/COLOR)</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.options} onChange={e => setForm(p => ({ ...p, options: e.target.value }))} placeholder="Option1, Option2, Option3" /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSubmit} className="bg-accent text-btn-primary-text hover:bg-accent/90">{editId ? 'Update' : 'Create'}</Button>
                <Button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-surface-secondary text-text-primary border border-border hover:bg-surface">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center mt-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
        ) : attributes.length === 0 ? (
          <div className="text-center mt-12 text-text-tertiary">No global attributes found.</div>
        ) : (
          <div className="mt-6 space-y-2">
            {attributes.map((attr) => (
              <div key={attr.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-secondary transition-colors">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-text-tertiary cursor-grab" />
                  <Tag className={`h-4 w-4 ${getTypeColor(attr.type)}`} />
                  <div>
                    <span className="text-sm font-medium text-text-primary">{attr.name}</span>
                    {attr.label && <span className="text-xs text-text-tertiary ml-2">({attr.label})</span>}
                    <span className={`ml-2 text-xs ${getTypeColor(attr.type)}`}>{attr.type}</span>
                    {attr.unit && <span className="ml-2 text-xs text-text-tertiary">unit: {attr.unit}</span>}
                    {attr.options.length > 0 && <span className="ml-2 text-xs text-text-tertiary">[{attr.options.length} options]</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startEdit(attr)} className="text-xs text-accent hover:text-accent/80 p-1"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(attr.id)} className="text-xs text-red-400 hover:text-red-300 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
