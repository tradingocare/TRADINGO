'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/page-header';
import { Package } from 'lucide-react';

export default function QuickListProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/seller/products/quick', {
        name: name.trim(),
        categoryId: categoryId || undefined,
        price: price ? Number(price) : undefined,
      });
      setSuccess(true);
      setName('');
      setPrice('');
      setCategoryId('');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <PageHeader title="Quick List Product" description="Add a product with minimal fields" />
      <div className="max-w-lg mx-auto mt-6 space-y-4">
        {success && (
          <div className="bg-surface rounded-xl p-4 text-center space-y-3">
            <Package className="w-12 h-12 text-accent mx-auto" />
            <p className="text-text-primary font-medium">Product created successfully!</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setSuccess(false)}>Add Another</Button>
              <Button onClick={() => router.push('/seller/products')}>View Products</Button>
            </div>
          </div>
        )}
        {!success && (
          <form onSubmit={handleSubmit} className="bg-surface rounded-xl p-6 space-y-4">
            {error && (
              <div className="bg-status-error/10 border border-status-error/30 text-status-error text-sm p-3 rounded-lg">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Product Name *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter product name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Category</label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Select category (optional)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Price (₹)</label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !name.trim()}>
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
