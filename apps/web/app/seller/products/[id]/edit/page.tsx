'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api/client'
import { Loader2, ChevronLeft } from 'lucide-react'

export default function EditProductPage() {
  const { id } = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    api.get(`/seller/products/${id}`)
      .then(res => setProduct(res.data?.data || res.data))
      .catch(() => router.push('/seller/products'))
      .finally(() => setLoading(false))
  }, [id])

  const [name, setName] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [sku, setSku] = useState('')
  const [moq, setMoq] = useState(1)
  const [unit, setUnit] = useState('')
  const [price, setPrice] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setShortDescription(product.shortDescription || '')
      setDescription(product.description || '')
      setBrand(product.brand || '')
      setModel(product.model || '')
      setSku(product.sku || '')
      setMoq(product.moq || 1)
      setUnit(product.unit || '')
      setPrice(product.originalPrice || '')
      setStatus(product.status || '')
    }
  }, [product])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.patch(`/seller/products/${id}`, { name, shortDescription, description, brand, model, sku, moq, unit, originalPrice: price ? Number(price) : undefined })
      router.push('/seller/products')
    } catch {}
    finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 size={24} className="animate-spin text-orange-500" /></div>
  if (!product) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} className="text-gray-600" /></button>
        <div>
          <h1 className="text-xl font-black text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-500">{product.slug}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Product Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Brand</label>
            <input value={brand} onChange={e => setBrand(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Model</label>
            <input value={model} onChange={e => setModel(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">SKU</label>
            <input value={sku} onChange={e => setSku(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Price (₹)</label>
            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">MOQ</label>
            <input type="number" value={moq} onChange={e => setMoq(Number(e.target.value))} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Unit</label>
            <input value={unit} onChange={e => setUnit(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Short Description</label>
          <textarea value={shortDescription} onChange={e => setShortDescription(e.target.value)} rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 resize-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-orange-400 resize-none" />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
            status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
            status === 'PENDING_APPROVAL' ? 'bg-yellow-50 text-yellow-700' :
            status === 'REJECTED' ? 'bg-red-50 text-red-700' :
            status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
            'bg-gray-100 text-gray-500'
          }`}>{status}</span>
          <button onClick={handleSave} disabled={saving || !name.trim()}
            className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
