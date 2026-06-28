'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSavedSuppliers, useRemoveSavedSupplier } from '@/hooks';
import { Search, Building2, MapPin, Trash2, ExternalLink } from 'lucide-react';

export default function BuyerSuppliersPage() {
  const [search, setSearch] = useState('');
  const { data: suppliers, isLoading } = useSavedSuppliers();
  const removeSupplier = useRemoveSavedSupplier();

  const filtered = (suppliers ?? []).filter((s: any) =>
    s.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.company?.city?.toLowerCase().includes(search.toLowerCase())
  );

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
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Building2 className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No suppliers found</h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            {search ? 'Try a different search term.' : 'Save suppliers from their profile pages to quickly access them here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry: any) => (
            <Card key={entry.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/companies/${entry.company?.slug ?? entry.companyId}`}
                      className="text-sm font-semibold text-text-primary dark:text-dark-text-primary hover:text-[#FF5A1F] transition-colors">
                      {entry.company?.name ?? 'Unknown Supplier'}
                    </Link>
                    {(entry.company?.city || entry.company?.state) && (
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                        <MapPin className="h-3 w-3" />
                        {[entry.company.city, entry.company.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {entry.notes && (
                  <p className="mt-3 text-xs text-text-secondary dark:text-dark-text-secondary line-clamp-2">{entry.notes}</p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 dark:border-dark-border">
                  <Link href={`/companies/${entry.company?.slug ?? entry.companyId}`}>
                    <Button variant="outline" size="sm"><ExternalLink className="h-3 w-3 mr-1" /> View Profile</Button>
                  </Link>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => removeSupplier.mutate(entry.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
