'use client';

import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEnrichedCategories } from '@/hooks/use-tradeserv';

export function CatalogEnrichmentBadge({ categoryTitle }: { categoryTitle: string }) {
  const { data, isLoading } = useEnrichedCategories();

  if (isLoading) return null;

  const categories = Array.isArray(data) ? data : [];
  const hasMapping = categories.some(
    (e) => e.catalogCategory !== null && e.category.toLowerCase() === categoryTitle.toLowerCase(),
  );

  if (!hasMapping) return null;

  return (
    <Badge variant="success" className="gap-1 px-2 py-0.5 text-[10px]">
      <CheckCircle className="h-2.5 w-2.5" />
      Catalog
    </Badge>
  );
}
