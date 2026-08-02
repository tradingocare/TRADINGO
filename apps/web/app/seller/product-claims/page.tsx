'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader, StatusBadge, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { useCompanies } from '@/hooks';
import { Eye, Edit2, Trash2, FileText, Package } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface ProductMasterRef {
  id: string;
  name: string;
  slug: string;
}

interface ProductClaim {
  id: string;
  name: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  createdAt: string;
  rejectionReason?: string;
  productMaster?: ProductMasterRef;
}

interface ClaimsResponse {
  data: ProductClaim[];
  meta: { total: number };
}

export default function SellerProductClaimsPage() {
  const router = useRouter();
  const { data: companiesData, isLoading: companiesLoading } = useCompanies({ limit: 1 });
  const [claims, setClaims] = useState<ProductClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const companyId = companiesData?.data?.[0]?.id;

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError(false);
    apiClient.get<ClaimsResponse>(`/companies/${companyId}/product-claims`)
      .then((res) => {
        setClaims(res.data);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [companyId]);

  const handleDelete = async (id: string) => {
    if (!companyId) return;
    try {
      await apiClient.delete(`/companies/${companyId}/product-claims/${id}`);
      setClaims((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  };

  if (companiesLoading || !companyId) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Product Claims" description="Manage your product claims" />
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Product Claims"
        description="Manage your product claims"
        actions={
          <Button onClick={() => router.push('/seller/products/claim')}>
            <FileText className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        }
      />

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <EmptyState variant="error" title="Failed to load product claims" description="Please try again." />
      ) : claims.length === 0 ? (
        <EmptyState icon={Package} title="No claims yet" description="Claim a product from the catalog to get started." action={<Button onClick={() => router.push('/seller/products/claim')}><FileText className="mr-2 h-4 w-4" /> New Claim</Button>} />
      ) : (
        <div className="rounded-xl border border-border bg-surface dark:bg-dark-surface dark:border-dark-border">
          <div className="hidden grid-cols-12 gap-4 border-b border-border px-6 py-3 text-xs font-medium uppercase text-text-secondary dark:border-dark-border dark:text-dark-text-secondary sm:grid">
            <div className="col-span-3">Claim Name</div>
            <div className="col-span-3">Product Master</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2">Actions</div>
          </div>
          {claims.map((claim) => (
            <div key={claim.id} className="grid grid-cols-1 gap-3 border-b border-border px-6 py-4 last:border-0 sm:grid-cols-12 sm:items-center dark:border-dark-border">
              <div className="flex items-center gap-3 sm:col-span-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                  <FileText className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{claim.name}</p>
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-3">
                {claim.productMaster?.name || '—'}
              </p>
              <div className="sm:col-span-2">
                <StatusBadge status={claim.status} />
              </div>
              <p className="text-sm text-text-secondary dark:text-dark-text-secondary sm:col-span-2">
                {new Date(claim.createdAt).toLocaleDateString('en-IN')}
              </p>
              <div className="flex items-center gap-2 sm:col-span-2">
                {(claim.status === 'DRAFT') && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/seller/product-claims/${claim.id}/edit`)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(claim.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </>
                )}
                {(claim.status === 'PENDING') && (
                  <span className="text-xs text-text-tertiary">—</span>
                )}
                {(claim.status === 'PUBLISHED') && (
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/seller/products`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                {(claim.status === 'REJECTED') && (
                  <span className="text-xs text-red-500">{claim.rejectionReason || 'View reason'}</span>
                )}
                {(claim.status === 'APPROVED') && (
                  <Button variant="ghost" size="sm" onClick={() => router.push(`/seller/products`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
