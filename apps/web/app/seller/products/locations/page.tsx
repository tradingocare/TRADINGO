'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Layers } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/page-header';
import { ProductLocationTable } from '@/components/seller-locations/product-location-table';
import { BulkLocationModal } from '@/components/seller-locations/bulk-location-modal';
import {
  getSellerProductLocations,
  bulkUpdateLocations,
  type ProductWithLocation,
} from '@/lib/api/product-locations';
import { useToast } from '@/components/ui/use-toast';

export default function SellerProductLocationsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithLocation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [locationStatus, setLocationStatus] = useState<'set' | 'missing' | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getSellerProductLocations({
        search: search || undefined,
        locationStatus,
        page,
        limit: 20,
      });
      setProducts(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [search, locationStatus, page, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleBulkApply = async (data: { latitude: number; longitude: number; visibilityRadius?: any }) => {
    await bulkUpdateLocations({
      productIds: selectedIds,
      ...data,
    });
    toast({ title: 'Success', description: `Updated locations for ${selectedIds.length} products` });
    setSelectedIds([]);
    await fetchProducts();
  };

  const missingCount = products.filter((p) => !p.locationSet).length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Product Locations"
        description="Manage geo-locations for your products to enable Near Me discovery"
        actions={
          selectedIds.length > 0 ? (
            <button
              type="button"
              onClick={() => setBulkModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary dark:bg-primary-dark px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              <Layers className="h-4 w-4" />
              Bulk Set Location ({selectedIds.length})
            </button>
          ) : undefined
        }
      />

      {!loading && missingCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>
            {missingCount} product{missingCount !== 1 ? 's' : ''} without location set. Select them and use &quot;Bulk Set Location&quot; or edit individually.
          </span>
        </div>
      )}

      <ProductLocationTable
        products={products}
        total={total}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onSearch={(q) => { setSearch(q); setPage(1); }}
        onFilterLocationStatus={(s) => { setLocationStatus(s); setPage(1); }}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        loading={loading}
      />

      <BulkLocationModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onApply={handleBulkApply}
        productCount={selectedIds.length}
      />
    </div>
  );
}
