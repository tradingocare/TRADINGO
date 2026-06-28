'use client';

import { useState } from 'react';
import { useRfqWizardStore } from '@/store/rfq-wizard-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search, Package } from 'lucide-react';

export function StepProducts() {
  const { products, addProduct, removeProduct, updateProduct } = useRfqWizardStore();
  const [newProduct, setNewProduct] = useState({ productName: '', quantity: 1, unit: 'pcs', targetPrice: 0, categoryId: '', description: '' });

  const handleAdd = () => {
    if (!newProduct.productName.trim()) return;
    addProduct({
      productName: newProduct.productName,
      quantity: newProduct.quantity,
      unit: newProduct.unit,
      targetPrice: newProduct.targetPrice || undefined,
      categoryId: newProduct.categoryId || undefined,
      description: newProduct.description || undefined,
    });
    setNewProduct({ productName: '', quantity: 1, unit: 'pcs', targetPrice: 0, categoryId: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Products</h2>

      <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1 lg:col-span-2">
            <Label className="text-xs text-white/60">Product Name *</Label>
            <Input
              placeholder="Search product or type name..."
              value={newProduct.productName}
              onChange={(e) => setNewProduct({ ...newProduct, productName: e.target.value })}
              className="bg-white/[0.04] border-white/[0.06] text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/60">Qty</Label>
            <Input
              type="number" min={1}
              value={newProduct.quantity}
              onChange={(e) => setNewProduct({ ...newProduct, quantity: parseInt(e.target.value) || 1 })}
              className="bg-white/[0.04] border-white/[0.06] text-white"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/60">Unit</Label>
            <select
              value={newProduct.unit}
              onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              {['pcs', 'kg', 'ton', 'm', 'L', 'box', 'set', 'pair', 'dozen'].map((u) => (
                <option key={u} value={u} className="bg-gray-900 text-white">{u}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/60">Target Price (₹)</Label>
            <Input
              type="number" min={0}
              value={newProduct.targetPrice || ''}
              onChange={(e) => setNewProduct({ ...newProduct, targetPrice: parseFloat(e.target.value) || 0 })}
              className="bg-white/[0.04] border-white/[0.06] text-white"
            />
          </div>
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={handleAdd} disabled={!newProduct.productName.trim()}>
          <Plus className="mr-1 h-3 w-3" /> Add Product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.06] p-8 text-center">
          <Package className="h-8 w-8 text-white/30" />
          <p className="mt-2 text-sm text-white/60">No products added yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.04] p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                <Package className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{p.productName}</p>
                <p className="text-xs text-white/40">{p.quantity} {p.unit}{p.targetPrice ? ` · ₹${p.targetPrice}/${p.unit}` : ''}</p>
              </div>
              <Badge variant="secondary">{p.quantity} {p.unit}</Badge>
              <button onClick={() => removeProduct(i)} className="text-red-400 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
