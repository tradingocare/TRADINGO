'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSavedSuppliers, useRemoveSavedSupplier } from '@/hooks';
import { Search, Building2, MapPin, Trash2, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

export default function BuyerSuppliersPage() {
  const [search, setSearch] = useState('');
  const { data: suppliers, isLoading, error, refetch } = useSavedSuppliers();
  const removeSupplier = useRemoveSavedSupplier();

  const filtered = (suppliers ?? []).filter((s: any) => {
    const loc = s.company?.locations?.[0];
    const city = loc?.city ?? '';
    const name = s.company?.name ?? '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
           city.toLowerCase().includes(search.toLowerCase());
  });

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Saved Suppliers" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-status-error/20 bg-status-error/5 p-12">
          <AlertCircle className="h-12 w-12 text-status-error" />
          <h3 className="mt-4 text-lg font-semibold text-status-error">Failed to load suppliers</h3>
          <p className="mt-1 text-sm text-text-tertiary">{(error as any)?.message || 'An error occurred'}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Saved Suppliers" description="Manage your preferred suppliers" />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><div className="h-32 animate-pulse rounded-lg bg-surface-secondary/50" /></CardContent></Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12">
          <Building2 className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary">No suppliers found</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {search ? 'Try a different search term.' : 'Save suppliers from their profile pages to quickly access them here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry: any) => {
            const loc = entry.company?.locations?.[0];
            return (
              <Card key={entry.id}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link href={`/companies/${entry.company?.slug ?? entry.companyId}`}
                        className="text-sm font-semibold text-text-primary hover:text-accent transition-colors">
                        {entry.company?.name ?? 'Unknown Supplier'}
                      </Link>
                      {(loc?.city || loc?.state) && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                          <MapPin className="h-3 w-3" />
                          {[loc.city, loc.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {entry.notes && (
                    <p className="mt-3 text-xs text-text-secondary line-clamp-2">{entry.notes}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <Link href={`/companies/${entry.company?.slug ?? entry.companyId}`}>
                      <Button variant="outline" size="sm"><ExternalLink className="h-3 w-3 mr-1" /> View Profile</Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="text-status-error hover:text-status-error hover:bg-status-error/10"
                      onClick={() => removeSupplier.mutate(entry.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
