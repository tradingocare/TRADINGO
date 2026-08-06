'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { getSynonyms, createSynonym, updateSynonym, deleteSynonym, getIndustryCategoryMappings, createIndustryCategoryMapping, deleteIndustryCategoryMapping } from '@/lib/api/enterprise-catalog'
import { Plus, Edit2, Trash2, Loader2, Search, Link2, Languages } from 'lucide-react'

function SynonymsPanel({ onRefresh }: { onRefresh: () => void }) {
  const [synonyms, setSynonyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ term: '', synonyms: '', locale: 'en' });
  const { toast } = useToast();

  const fetchSynonyms = useCallback(async () => {
    try {
      const res = await getSynonyms(search || undefined);
      setSynonyms(Array.isArray(res) ? res : []);
    } catch { toast({ title: 'Error', description: 'Failed to load synonyms', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [search, toast]);

  useEffect(() => { fetchSynonyms(); }, [fetchSynonyms]);

  const handleSubmit = async () => {
    try {
      const payload = { term: form.term, synonyms: form.synonyms.split(',').map((s: string) => s.trim()).filter(Boolean), locale: form.locale };
      if (editId) { await updateSynonym(editId, payload); toast({ title: 'Synonym updated' }); }
      else { await createSynonym(payload); toast({ title: 'Synonym created' }); }
      setShowForm(false); setEditId(null); setForm({ term: '', synonyms: '', locale: 'en' }); fetchSynonyms(); onRefresh();
    } catch { toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this synonym?')) return;
    try { await deleteSynonym(id); toast({ title: 'Synonym deleted' }); fetchSynonyms(); onRefresh(); }
    catch { toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' }); }
  };

  const startEdit = (syn: any) => {
    setForm({ term: syn.term, synonyms: syn.synonyms.join(', '), locale: syn.locale });
    setEditId(syn.id); setShowForm(true);
  };

  return (
    <div>
      <div className="flex gap-3 items-center mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input className="w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Search terms..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button onClick={() => { setEditId(null); setForm({ term: '', synonyms: '', locale: 'en' }); setShowForm(true); }} className="bg-accent text-btn-primary-text hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" /> Add Synonym</Button>
      </div>

      {showForm && (
        <Card className="mb-4 border border-border bg-surface">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm text-text-secondary mb-1">Term *</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.term} onChange={e => setForm(p => ({ ...p, term: e.target.value }))} /></div>
              <div><label className="block text-sm text-text-secondary mb-1">Synonyms (comma-separated) *</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.synonyms} onChange={e => setForm(p => ({ ...p, synonyms: e.target.value }))} placeholder="syn1, syn2, syn3" /></div>
              <div><label className="block text-sm text-text-secondary mb-1">Locale</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.locale} onChange={e => setForm(p => ({ ...p, locale: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSubmit} className="bg-accent text-btn-primary-text hover:bg-accent/90">{editId ? 'Update' : 'Create'}</Button>
              <Button onClick={() => { setShowForm(false); setEditId(null); }} className="bg-surface-secondary text-text-primary border border-border hover:bg-surface">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center mt-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> :
       synonyms.length === 0 ? <div className="text-center mt-8 text-text-tertiary">No synonyms found.</div> :
       <div className="space-y-2">
         {synonyms.map((syn: any) => (
           <div key={syn.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-secondary transition-colors">
             <div className="flex items-center gap-3">
               <Languages className="h-4 w-4 text-accent" />
               <span className="text-sm font-medium text-text-primary">{syn.term}</span>
               <span className="text-xs text-text-tertiary">→ {syn.synonyms.join(', ')}</span>
               <span className="text-xs text-text-tertiary">[{syn.locale}]</span>
             </div>
             <div className="flex items-center gap-2">
               <button onClick={() => startEdit(syn)} className="text-xs text-accent hover:text-accent/80 p-1"><Edit2 className="h-3.5 w-3.5" /></button>
               <button onClick={() => handleDelete(syn.id)} className="text-xs text-red-400 hover:text-red-300 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
             </div>
           </div>
         ))}
       </div>
      }
    </div>
  );
}

function MappingsPanel({ onRefresh }: { onRefresh: () => void }) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [industries, setIndustries] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ industryId: '', categoryId: '', description: '' });
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    try {
      const { default: api } = await import('@/lib/api/client');
      const [mappingsRes, industriesRes, categoriesRes] = await Promise.all([
        getIndustryCategoryMappings(),
        api.get('/industries').then((r: any) => r.data),
        api.get('/categories/tree').then((r: any) => r.data),
      ]);
      setMappings(Array.isArray(mappingsRes) ? mappingsRes : []);
      setIndustries(Array.isArray(industriesRes) ? industriesRes : []);
      setCategories(Array.isArray(categoriesRes) ? categoriesRes : []);
    } catch { toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSubmit = async () => {
    try {
      await createIndustryCategoryMapping(form);
      toast({ title: 'Mapping created' }); setShowForm(false); setForm({ industryId: '', categoryId: '', description: '' }); fetchAll(); onRefresh();
    } catch { toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mapping?')) return;
    try { await deleteIndustryCategoryMapping(id); toast({ title: 'Mapping deleted' }); fetchAll(); onRefresh(); }
    catch { toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' }); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowForm(true)} className="bg-accent text-btn-primary-text hover:bg-accent/90"><Plus className="h-4 w-4 mr-1" /> Add Mapping</Button>
      </div>

      {showForm && (
        <Card className="mb-4 border border-border bg-surface">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm text-text-secondary mb-1">Industry *</label>
                <select className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.industryId} onChange={e => setForm(p => ({ ...p, industryId: e.target.value }))}>
                  <option value="">Select industry...</option>
                  {industries.map((ind: any) => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-text-secondary mb-1">Category *</label>
                <select className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}>
                  <option value="">Select category...</option>
                  {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-text-secondary mb-1">Description</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSubmit} className="bg-accent text-btn-primary-text hover:bg-accent/90">Create</Button>
              <Button onClick={() => setShowForm(false)} className="bg-surface-secondary text-text-primary border border-border hover:bg-surface">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? <div className="flex justify-center mt-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div> :
       mappings.length === 0 ? <div className="text-center mt-8 text-text-tertiary">No mappings found.</div> :
       <div className="space-y-2">
         {mappings.map((m: any) => (
           <div key={m.id} className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 hover:bg-surface-secondary transition-colors">
             <div className="flex items-center gap-3">
               <Link2 className="h-4 w-4 text-accent" />
               <span className="text-sm font-medium text-text-primary">{m.industry?.name || 'Unknown'}</span>
               <span className="text-text-tertiary">→</span>
               <span className="text-sm text-text-secondary">{m.category?.name || 'Unknown'}</span>
               {m.description && <span className="text-xs text-text-tertiary">- {m.description}</span>}
             </div>
             <button onClick={() => handleDelete(m.id)} className="text-xs text-red-400 hover:text-red-300 p-1"><Trash2 className="h-3.5 w-3.5" /></button>
           </div>
         ))}
       </div>
      }
    </div>
  );
}

export default function AdminTaxonomyPage() {
  const [tab, setTab] = useState('synonyms');
  const [refreshKey, setRefreshKey] = useState(0);
  const onRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader title="Taxonomy Engine" description="Manage search synonyms, industry-category mappings, and taxonomic relationships." />

        <div className="mt-8">
          <Tabs
            tabs={[
              { value: 'synonyms', label: 'Synonyms', icon: <Languages className="h-4 w-4" /> },
              { value: 'mappings', label: 'Industry-Category Mappings', icon: <Link2 className="h-4 w-4" /> },
            ]}
            value={tab}
            onChange={setTab}
          />
          <div className="mt-4" key={refreshKey}>
            {tab === 'synonyms' && <SynonymsPanel onRefresh={onRefresh} />}
            {tab === 'mappings' && <MappingsPanel onRefresh={onRefresh} />}
          </div>
        </div>
      </div>
    </div>
  );
}
