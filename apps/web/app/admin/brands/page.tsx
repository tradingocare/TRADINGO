'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { getBrands, createBrand, updateBrand, deleteBrand, verifyBrand, type GlobalBrand } from '@/lib/api/enterprise-catalog'
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Loader2, Globe, Search } from 'lucide-react'

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<GlobalBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', manufacturer: '', country: '', website: '', description: '' });
  const { toast } = useToast();

  const fetchBrands = useCallback(async () => {
    try {
      const res = await getBrands({ search: search || undefined }) as any;
      setBrands(Array.isArray(res) ? res : res?.data || []);
    } catch { toast({ title: 'Error', description: 'Failed to load brands', variant: 'destructive' });
    } finally { setLoading(false); }
  }, [search, toast]);

  useEffect(() => { fetchBrands(); }, [fetchBrands]);

  const handleSubmit = async () => {
    try {
      if (editId) { await updateBrand(editId, form); toast({ title: 'Brand updated' }); }
      else { await createBrand(form); toast({ title: 'Brand created' }); }
      setShowForm(false); setEditId(null); setForm({ name: '', manufacturer: '', country: '', website: '', description: '' }); fetchBrands();
    } catch { toast({ title: 'Error', description: 'Operation failed', variant: 'destructive' }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    try { await deleteBrand(id); toast({ title: 'Brand deleted' }); fetchBrands(); }
    catch { toast({ title: 'Error', description: 'Delete failed', variant: 'destructive' }); }
  };

  const handleVerify = async (id: string) => {
    try { await verifyBrand(id); toast({ title: 'Brand verified' }); fetchBrands(); }
    catch { toast({ title: 'Error', description: 'Verification failed', variant: 'destructive' }); }
  };

  const startEdit = (brand: GlobalBrand) => {
    setForm({ name: brand.name, manufacturer: brand.manufacturer || '', country: brand.country || '', website: brand.website || '', description: brand.description || '' });
    setEditId(brand.id); setShowForm(true);
  };

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: 'var(--bg-base)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader title="Global Brands" description="Curated global brand registry for the enterprise catalog." />

        <div className="mt-6 flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent" placeholder="Search brands..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setEditId(null); setForm({ name: '', manufacturer: '', country: '', website: '', description: '' }); setShowForm(true); }} className="bg-accent text-btn-primary-text hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-1" /> Add Brand
          </Button>
        </div>

        {showForm && (
          <Card className="mt-4 border border-border bg-surface">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="block text-sm text-text-secondary mb-1">Name *</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="block text-sm text-text-secondary mb-1">Manufacturer</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.manufacturer} onChange={e => setForm(p => ({ ...p, manufacturer: e.target.value }))} /></div>
                <div><label className="block text-sm text-text-secondary mb-1">Country</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} /></div>
                <div><label className="block text-sm text-text-secondary mb-1">Website</label><input className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} /></div>
                <div className="md:col-span-2"><label className="block text-sm text-text-secondary mb-1">Description</label><textarea className="w-full rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
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
        ) : brands.length === 0 ? (
          <div className="text-center mt-12 text-text-tertiary">No global brands found.</div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <Card key={brand.id} className="border-border bg-surface">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-text-primary flex items-center gap-2">
                        <Globe className="h-4 w-4 text-accent" /> {brand.name}
                      </h3>
                      <p className="text-xs text-text-tertiary mt-1">/{brand.slug}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {brand.verificationStatus === 'VERIFIED' ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-amber-400" />}
                    </div>
                  </div>
                  {brand.description && <p className="text-sm text-text-secondary mt-2 line-clamp-2">{brand.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-text-tertiary">
                    {brand.manufacturer && <span>Mfr: {brand.manufacturer}</span>}
                    {brand.country && <span>{brand.country}</span>}
                    {brand.website && <span>{brand.website}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    {brand.verificationStatus !== 'VERIFIED' && (
                      <button onClick={() => handleVerify(brand.id)} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"><CheckCircle className="h-3 w-3" /> Verify</button>
                    )}
                    <button onClick={() => startEdit(brand)} className="flex items-center gap-1 text-xs text-accent hover:text-accent/80"><Edit2 className="h-3 w-3" /> Edit</button>
                    <button onClick={() => handleDelete(brand.id)} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300"><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
