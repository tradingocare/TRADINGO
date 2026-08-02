'use client'
import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import api from '../../../../lib/api/client'
import UploadZone from '../../../../components/shared/UploadZone'
import type { SectionProps, VendorProduct } from '../../../../types/vendor-onboarding'
import { Plus, X, GripVertical, Package } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { toast } from '@/components/ui/use-toast'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

const UNITS = ['Pieces','Kg','Grams','Litre','ML','Metre','Sq Feet','Sq Metre','Dozen','Box','Set','Pair','Bundle','Bag','Ton']
const GST_RATES = [0, 5, 12, 18, 28]
const LEAD_TIMES = ['Ready Stock (Same day)','1-3 days','4-7 days','1-2 weeks','2-4 weeks','Custom']

const PRODUCT_STATUS: Record<string, string> = {
  draft: 'Draft', published: 'Active', under_review: 'Under Review', rejected: 'Rejected',
}

const emptyProduct = (): VendorProduct => ({
  name: '', description: '', price: 0, unit: 'Pieces', moq: 1,
  inStock: true, categoryId: '', subcategoryId: '',
  images: [], priceSlabs: [], specifications: [], tags: [],
})

export default function Section8Products({ vendor, onSave, onNext, onBack }: SectionProps) {
  const [products, setProducts] = useState<VendorProduct[]>(vendor?.products || [])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editIdx, setEditIdx] = useState(-1)
  const [form, setForm] = useState<VendorProduct>(emptyProduct())
  const [saving, setSaving] = useState(false)

  const openNew = () => { setForm(emptyProduct()); setEditIdx(-1); setDrawerOpen(true) }
  const openEdit = (idx: number) => { setForm({ ...products[idx] }); setEditIdx(idx); setDrawerOpen(true) }

  const saveProduct = () => {
    if (!form.name || !form.price || !form.categoryId) {
      toast.error('Name, price, and category are required')
      return
    }
    setProducts(prev => {
      const next = [...prev]
      if (editIdx >= 0) next[editIdx] = form
      else next.push(form)
      return next
    })
    setDrawerOpen(false)
    toast.success(editIdx >= 0 ? 'Product updated' : 'Product added')
  }

  const removeProduct = (idx: number) => {
    setProducts(prev => prev.filter((_, i) => i !== idx))
  }

  const saveAll = useCallback(async () => {
    setSaving(true)
    try {
      for (const p of products) {
        await api.post('/products', {
          name: p.name, description: p.description,
          price: p.price, unit: p.unit, moq: p.moq,
          categoryId: p.categoryId, stockQty: p.stockQty,
          images: p.images, specifications: p.specifications,
          tags: p.tags, hsnCode: p.hsnCode, gstRate: p.gstRate,
        })
      }
      onSave({ score: Math.min(products.length * 4, 20) })
      toast.success(`${products.length} products saved`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error saving products')
    } finally { setSaving(false) }
  }, [products, onSave])

  const addSlab = () => setForm(p => ({
    ...p, priceSlabs: [...p.priceSlabs, { minQty: 1, maxQty: null, price: 0 }]
  }))

  const addTag = (tag: string) => {
    if (!tag.trim() || form.tags.length >= 20) return
    setForm(p => ({ ...p, tags: [...p.tags, tag.trim()] }))
  }

  const addSpec = () => setForm(p => ({
    ...p, specifications: [...p.specifications, { key: '', label: '', value: '' }]
  }))

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-white font-bold text-xl">List Products</h2>
        <span className="text-white/40 text-sm">Score: {Math.min(products.length * 4, 20)}/20</span>
      </div>
      <p className="text-white/40 text-sm mb-6">Add the products you want to sell</p>

      <div className="flex items-center gap-3 mb-6">
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
          style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)', color:'#fff' }}>
          <Plus size={14} /> Add New Product
        </motion.button>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-surface border border-dashed border-border">
          <Package size={40} className="mx-auto mb-3 text-text-tertiary" />
          <p className="text-text-tertiary text-sm mb-1">No products listed yet</p>
          <p className="text-text-tertiary text-xs">Add your first product to start selling</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p, i) => (
            <div key={i}
              className="flex items-center gap-3 p-4 rounded-xl transition-all cursor-pointer hover:bg-surface-secondary bg-surface" style={{ border:'1px solid var(--border-color)' }}
              onClick={() => openEdit(i)}>
              <GripVertical size={14} className="text-text-tertiary" />
              <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center text-text-tertiary text-xs font-bold">
                {p.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">{p.name || 'New Product'}</p>
                <p className="text-text-tertiary text-xs">₹{p.price} / {p.unit} · MOQ: {p.moq}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); removeProduct(i) }}
                className="text-text-tertiary hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-8">
        {onBack && <button onClick={onBack} className="px-4 py-2 text-sm text-white/50 hover:text-white/80">Back</button>}
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
          onClick={saveAll} disabled={saving || products.length === 0}
          className="px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40"
          style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)', color:'#fff' }}>
          {saving ? 'Saving...' : `Save ${products.length} Products & Continue`}
        </motion.button>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} side="right" title={editIdx >= 0 ? 'Edit Product' : 'New Product'}>
        <div className="space-y-5">
                  <div>
                    <label className="text-white/70 text-xs font-semibold mb-1.5 block">Category *</label>
                    <select value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b]">
                      <option value="" className="bg-bg-base">Select category</option>
                      {(vendor?.categories || []).map((cat: any) => (
                        <option key={cat} value={cat} className="bg-bg-base">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-text-secondary text-xs font-semibold mb-1.5 block">Product Name *</label>
                    <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b]"
                      placeholder="Enter product name" maxLength={150} />
                  </div>

                  <div>
                    <label className="text-text-secondary text-xs font-semibold mb-1.5 block">Description</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b] min-h-[80px]"
                      placeholder="Describe your product" maxLength={1000} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-text-secondary text-xs font-semibold mb-1.5 block">Selling Price (₹) *</label>
                      <input type="number" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b]"
                        placeholder="0" min={0} />
                    </div>
                    <div>
                      <label className="text-text-secondary text-xs font-semibold mb-1.5 block">Unit *</label>
                      <select value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b]">
                        {UNITS.map(u => <option key={u} value={u} className="bg-bg-base">{u}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-text-secondary text-xs font-semibold mb-1.5 block">MOQ *</label>
                      <input type="number" value={form.moq || ''} onChange={e => setForm(p => ({ ...p, moq: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b]"
                        placeholder="1" min={1} />
                    </div>
                    <div>
                      <label className="text-text-secondary text-xs font-semibold mb-1.5 block">Delivery Time</label>
                      <select value={form.deliveryEta || ''} onChange={e => setForm(p => ({ ...p, deliveryEta: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b]">
                        <option value="" className="bg-bg-base">Select</option>
                        {LEAD_TIMES.map(lt => <option key={lt} value={lt} className="bg-bg-base">{lt}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-text-secondary text-xs font-semibold">Price Slabs (Bulk Discount)</label>
                      <button onClick={addSlab} className="text-[#f59e0b] text-xs font-semibold">+ Add Slab</button>
                    </div>
                    {form.priceSlabs.map((slab, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <input type="number" placeholder="Min" value={slab.minQty}
                          onChange={e => { const s = [...form.priceSlabs]; s[i].minQty = parseInt(e.target.value) || 0; setForm(p => ({ ...p, priceSlabs: s })) }}
                          className="w-20 px-3 py-2 rounded-lg text-text-primary text-xs bg-surface border border-border focus:outline-none focus:border-[#f59e0b]" />
                        <span className="text-text-tertiary text-xs">-</span>
                        <input type="number" placeholder="Max" value={slab.maxQty ?? ''}
                          onChange={e => { const s = [...form.priceSlabs]; s[i].maxQty = e.target.value ? parseInt(e.target.value) : null; setForm(p => ({ ...p, priceSlabs: s })) }}
                          className="w-20 px-3 py-2 rounded-lg text-text-primary text-xs bg-surface border border-border focus:outline-none focus:border-[#f59e0b]" />
                        <input type="number" placeholder="Price" value={slab.price}
                          onChange={e => { const s = [...form.priceSlabs]; s[i].price = parseFloat(e.target.value) || 0; setForm(p => ({ ...p, priceSlabs: s })) }}
                          className="w-24 px-3 py-2 rounded-lg text-text-primary text-xs bg-surface border border-border focus:outline-none focus:border-[#f59e0b]" />
                        <button onClick={() => setForm(p => ({ ...p, priceSlabs: p.priceSlabs.filter((_, j) => j !== i) }))}
                          className="text-text-tertiary hover:text-red-400"><X size={12} /></button>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-text-secondary text-xs font-semibold mb-1.5 block">HSN Code</label>
                      <input value={form.hsnCode || ''} onChange={e => setForm(p => ({ ...p, hsnCode: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b]"
                        placeholder="6-8 digits" maxLength={8} />
                    </div>
                    <div>
                      <label className="text-text-secondary text-xs font-semibold mb-1.5 block">GST Rate</label>
                      <select value={form.gstRate ?? ''} onChange={e => setForm(p => ({ ...p, gstRate: e.target.value ? parseInt(e.target.value) : undefined }))}
                        className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b]">
                        <option value="" className="bg-bg-base">Select</option>
                        {GST_RATES.map(r => <option key={r} value={r} className="bg-bg-base">{r}%</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-text-secondary text-xs font-semibold mb-2 block">Product Images</label>
                    <UploadZone
                      label="Upload product images"
                      accept="image/jpeg,image/png,image/webp"
                      maxSizeMB={5}
                      multiple
                      preview="image"
                      folder="products"
                      onUpload={urls => setForm(p => ({ ...p, images: [...p.images.filter(f => typeof f === 'string'), ...urls] }))}
                    />
                  </div>

                  <div>
                    <label className="text-white/70 text-xs font-semibold mb-1.5 block">Tags / Keywords</label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.tags.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold"
                          style={{ background:'rgba(245, 158, 11, 0.1)', color:'#f59e0b' }}>
                          {tag}
                          <button onClick={() => setForm(p => ({ ...p, tags: p.tags.filter((_, j) => j !== i) }))}><X size={10} /></button>
                        </span>
                      ))}
                    </div>
                    <input onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value = '' } }}
                      className="w-full px-4 py-3 rounded-xl text-text-primary text-sm bg-surface border border-border focus:outline-none focus:border-[#f59e0b]"
                      placeholder="Type and press Enter to add tags" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-text-secondary text-xs font-semibold">Specifications</label>
                      <button onClick={addSpec} className="text-[#f59e0b] text-xs font-semibold">+ Add Field</button>
                    </div>
                    {form.specifications.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 mb-2">
                        <input placeholder="Key" value={spec.key}
                          onChange={e => { const s = [...form.specifications]; s[i].key = e.target.value; setForm(p => ({ ...p, specifications: s })) }}
                          className="flex-1 px-3 py-2 rounded-lg text-text-primary text-xs bg-surface border border-border focus:outline-none focus:border-[#f59e0b]" />
                        <input placeholder="Value" value={spec.value}
                          onChange={e => { const s = [...form.specifications]; s[i].value = e.target.value; setForm(p => ({ ...p, specifications: s })) }}
                          className="flex-1 px-3 py-2 rounded-lg text-text-primary text-xs bg-surface border border-border focus:outline-none focus:border-[#f59e0b]" />
                        <button onClick={() => setForm(p => ({ ...p, specifications: p.specifications.filter((_, j) => j !== i) }))}
                          className="text-text-tertiary hover:text-red-400"><X size={12} /></button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" checked={form.inStock}
                        onChange={e => setForm(p => ({ ...p, inStock: e.target.checked }))} className="sr-only peer" />
                      <div className="w-10 h-5 rounded-full bg-surface-secondary after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all peer-checked:bg-accent peer-checked:after:translate-x-full" />
                    </label>
                    <span className="text-text-primary text-sm">In Stock</span>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                      onClick={saveProduct}
                      className="flex-1 px-6 py-3 rounded-xl font-bold text-sm"
                      style={{ background:'linear-gradient(135deg,#f59e0b,#fbbf24)', color:'#fff' }}>
                      {editIdx >= 0 ? 'Update Product' : 'Add Product'}
                    </motion.button>
                  </div>
        </div>
      </Drawer>
    </div>
  )
}
