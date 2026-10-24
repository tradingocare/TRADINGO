'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/shared/page-header';
import { Sparkles } from 'lucide-react';
import { marketplaceCatalogBridgeApi, type ClassifyCatalogResult } from '@/lib/api/marketplace-catalog-bridge';

/**
 * P0-3 Step 7: quick-list follows the seller taxonomy philosophy — the
 * seller provides only product identity (name + optional price); the
 * canonical engine classifies; Tick (Confirm) persists the validated
 * canonical triple, Change re-classifies on demand. No category typing,
 * no free-text taxonomy, no dead dropdowns. LOW/unresolved results are
 * honestly reported and create uncategorized (never fabricated).
 */
export default function QuickListProductPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  // Canonical classification (Tick/Change contract from the wizard)
  const [suggestion, setSuggestion] = useState<ClassifyCatalogResult | null>(null);
  const [confirmed, setConfirmed] = useState<{ categoryId: string | null; subcategoryId: string | null; catalogItemId: string | null } | null>(null);
  const [classifying, setClassifying] = useState(false);

  const classify = async () => {
    if (!name.trim()) return;
    setClassifying(true);
    setSuggestion(null);
    try {
      const result = await marketplaceCatalogBridgeApi.classifyCatalog({
        name: name.trim(),
        context: 'product',
      });
      if (result.categoryId) {
        setSuggestion(result);
      } else {
        setError(`No confident category match for "${name.trim()}" — the product will be created uncategorized.`);
      }
    } catch {
      setError('Classification failed — you can still create the product uncategorized.');
    } finally {
      setClassifying(false);
    }
  };

  const confirmSuggestion = () => {
    if (!suggestion) return;
    setConfirmed({
      categoryId: suggestion.categoryId,
      subcategoryId: suggestion.subcategoryId,
      catalogItemId: suggestion.catalogItemId,
    });
    setSuggestion(null);
  };

  const clearTaxonomy = () => {
    setSuggestion(null);
    setConfirmed(null);
  };

  const suggestedLabel = suggestion
    ? [suggestion.categoryName, suggestion.subcategoryName].filter(Boolean).join(' / ')
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/seller/products/quick', {
        name: name.trim(),
        price: price ? Number(price) : undefined,
        // Confirmed canonical triple (server re-validates; never trusted raw)
        catalogCategoryId: confirmed?.categoryId ?? undefined,
        catalogSubcategoryId: confirmed?.subcategoryId ?? undefined,
        catalogItemId: confirmed?.catalogItemId ?? undefined,
      });
      setSuccess(true);
      setName('');
      setPrice('');
      clearTaxonomy();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base p-6">
      <PageHeader title="Quick List Product" description="Add a product with minimal fields — we handle the category" />
      <div className="max-w-lg mx-auto mt-6 space-y-4">
        {success && (
          <div className="bg-surface rounded-xl p-4 text-center space-y-3">
            <span className="inline-block text-3xl">📦</span>
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
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary mb-1">
                Product Name *
                <button
                  type="button"
                  onClick={classify}
                  disabled={classifying || !name.trim()}
                  className="ml-auto inline-flex items-center gap-1 rounded-full border border-accent/30 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/10 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" /> {classifying ? 'Classifying…' : 'Classify'}
                </button>
              </label>
              <Input value={name} onChange={(e) => { setName(e.target.value); clearTaxonomy(); }} placeholder="e.g., Stainless Steel 316L Coils" required />
            </div>

            {/* Tick/Change suggestion — reuses the wizard contract */}
            {suggestion && (
              <div className="rounded-lg border border-accent/30 bg-accent/[0.05] px-3 py-2.5" role="status" aria-label="AI category suggestion">
                <p className="text-xs font-medium text-text-primary">
                  Suggested: {suggestedLabel}
                  <span className="ml-2 text-[10px] text-text-tertiary">
                    {Math.round(suggestion.confidence * 100)}% · {suggestion.band}
                  </span>
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={confirmSuggestion}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg-base hover:bg-accent/80"
                  >
                    ✓ Use this category
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestion(null)}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {confirmed && (
              <div className="flex items-center justify-between rounded-lg border border-accent/30 bg-accent/[0.08] px-3 py-2">
                <p className="text-xs text-text-primary truncate">
                  ✓ Category: {confirmed.categoryId ? `${confirmed.categoryId.slice(0, 10)}…` : '—'}
                </p>
                <button type="button" onClick={clearTaxonomy} className="text-xs text-text-tertiary hover:text-text-primary underline">
                  Remove
                </button>
              </div>
            )}

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
