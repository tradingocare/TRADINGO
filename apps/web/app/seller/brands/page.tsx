'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { toast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Plus, Edit3, Trash2, Package, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editBrand, setEditBrand] = useState<any>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchBrands = async () => {
    try {
      const res = await api.get('/seller/brands')
      setBrands(res.data || [])
    } catch {
      setError(true)
      toast({ title: 'Failed to load brands', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchBrands() }, [])

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editBrand) await api.patch(`/seller/brands/${editBrand.id}`, { name, description })
      else await api.post('/seller/brands', { name, description })
      setShowModal(false); setEditBrand(null); setName(''); setDescription('')
      fetchBrands()
    } catch {
      toast({ title: editBrand ? 'Failed to update brand' : 'Failed to create brand', variant: 'destructive' })
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand?')) return
    try {
      await api.delete(`/seller/brands/${id}`)
      fetchBrands()
    } catch {
      toast({ title: 'Failed to delete brand', variant: 'destructive' })
    }
  }

  const openEdit = (brand: any) => {
    setEditBrand(brand); setName(brand.name); setDescription(brand.description || '')
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Brands</h1>
          <p className="text-sm text-white/50">Manage your product brands</p>
        </div>
        <button onClick={() => { setEditBrand(null); setName(''); setDescription(''); setShowModal(true) }}
          className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-500/90 flex items-center gap-2">
          <Plus size={16} /> Add Brand
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="xl" /></div>
      ) : error ? (
        <EmptyState icon={AlertCircle} variant="error" title="Failed to load brands" description="Please try again later." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brands.length === 0 ? (
            <div className="col-span-full"><EmptyState icon={Package} title="No brands yet" /></div>
          ) : brands.map(b => (
            <div key={b.id} className="rounded-[22px] p-5 transition-all hover:-translate-y-0.5 bg-bg-elevated border border-border">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center">
                  <Package size={22} className="text-accent-500" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-white/40 hover:text-blue-500" aria-label={`Edit ${b.name}`}><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-white/40 hover:text-red-500" aria-label={`Delete ${b.name}`}><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm font-bold text-white mt-3">{b.name}</p>
              {b.description && <p className="text-xs text-white/50 mt-1">{b.description}</p>}
              <p className="text-[10px] text-white/40 mt-2">{b._count?.products || 0} products</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editBrand ? 'Edit Brand' : 'Add Brand'}>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Brand name" className="mb-3" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-orange-400 min-h-[80px] resize-none" />
        <div className="flex items-center justify-end gap-3 mt-4">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white/60 hover:bg-surface">Cancel</button>
          <button onClick={handleSave} disabled={!name.trim() || saving}
            className="px-4 py-2 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-500/90 disabled:opacity-50">
            {saving ? <LoadingSpinner size="xs" /> : editBrand ? 'Update' : 'Create'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
