'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { DashboardPageHeader } from '@/components/dashboard/page-header';
import { LocationForm } from '@/components/seller-locations/location-form';
import { getCompanyAddress, updateProductLocation, getSellerProductLocations } from '@/lib/api/product-locations';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function SingleProductLocationPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState<{
    id: string;
    name: string;
    slug: string;
    latitude: number | null;
    longitude: number | null;
    visibilityRadius: any;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await getSellerProductLocations({ page: 1, limit: 100 });
        const found = result.data.find((p) => p.id === productId);
        if (!found) {
          setNotFound(true);
          return;
        }
        setProduct({
          id: found.id,
          name: found.name,
          slug: found.slug,
          latitude: found.latitude,
          longitude: found.longitude,
          visibilityRadius: found.visibilityRadius,
        });
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  const handleSave = async (data: { latitude: number; longitude: number; visibilityRadius?: any }) => {
    setSaving(true);
    try {
      await updateProductLocation(productId, data);
      toast({ title: 'Location Updated', description: 'Product location has been saved and indexed for Near Me discovery.' });
      router.push('/seller/products/locations');
    } catch {
      toast({ title: 'Error', description: 'Failed to update location. Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyFromCompany = async () => {
    try {
      const address = await getCompanyAddress();
      return address || null;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-text-tertiary dark:text-dark-text-tertiary" />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Product Not Found" description="This product could not be found or you don't have access to it." />
        <Link
          href="/seller/products/locations"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary dark:text-primary-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Locations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title={`Location: ${product.name}`}
        description={`Set geo-location for Near Me discovery`}
        actions={
          <Link
            href="/seller/products/locations"
            className="inline-flex items-center gap-2 rounded-lg border border-surface-border dark:border-dark-border px-4 py-2 text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        }
      />

      <div className="rounded-xl border border-surface-border dark:border-dark-border bg-surface dark:bg-dark-surface p-6">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-5 w-5 text-primary dark:text-primary-dark" />
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            Location Details
          </h2>
        </div>
        <LocationForm
          initialLatitude={product.latitude}
          initialLongitude={product.longitude}
          initialRadius={product.visibilityRadius}
          onSave={handleSave}
          onCopyFromCompany={handleCopyFromCompany}
          saving={saving}
        />
      </div>
    </div>
  );
}
