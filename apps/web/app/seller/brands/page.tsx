'use client'
import { useState, useEffect } from 'react'
import api from '@/lib/api/client'
import { Plus, Loader2, Edit3, Trash2, Package } from 'lucide-react'

export default function BrandsPage() {
  const [brands, setBrands] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editBrand, setEditBrand] = useState<any>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchBrands = async () => {
    try {
      const res = await api.get('/seller/brands')
      setBrands(res.data || [])
    } catch {}
    finally { setLoading(false) }
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
    } catch {}
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand?')) return
    await api.delete(`/seller/brands/${id}`)
    fetchBrands()
  }

  const openEdit = (brand: any) => {
    setEditBrand(brand); setName(brand.name); setDescription(brand.description || '')
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Brands</h1>
          <p className="text-sm text-gray-500">Manage your product brands</p>
        </div>
        <button onClick={() => { setEditBrand(null); setName(''); setDescription(''); setShowModal(true) }}
          className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 flex items-center gap-2">
          <Plus size={16} /> Add Brand
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brands.map(b => (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Package size={22} className="text-orange-500" />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500"><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-900 mt-3">{b.name}</p>
              {b.description && <p className="text-xs text-gray-500 mt-1">{b.description}</p>}
              <p className="text-[10px] text-gray-400 mt-2">{b._count?.products || 0} products</p>
            </div>
          ))}
          {brands.length === 0 && (
            <div className="col-span-full py-20 text-center text-sm text-gray-400">No brands yet</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editBrand ? 'Edit Brand' : 'Add Brand'}</h3>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Brand name"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 mb-3" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 min-h-[80px] resize-none" />
            <div className="flex items-center justify-end gap-3 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={!name.trim() || saving}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : editBrand ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
