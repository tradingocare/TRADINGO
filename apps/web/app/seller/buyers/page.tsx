'use client';

import { useState } from 'react';
import { DashboardPageHeader, TableSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Search, Building2, MapPin } from 'lucide-react';

export default function SellerBuyersPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['seller', 'buyers'],
    queryFn: () => apiClient.get('/seller/buyers').then(r => r.data),
  });

  const buyers = data?.data || [];
  const filtered = buyers.filter((b: any) =>
    b.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Buyers"
        description="Companies you have done business with"
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input placeholder="Search buyers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12">
          <Building2 className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary">Failed to load buyers</h3>
          <p className="mt-1 text-sm text-text-secondary">Please try again later.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12">
          <Building2 className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary">No buyers found</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {search ? 'Try a different search term.' : 'Buyers will appear here once you complete orders.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((buyer: any) => (
            <Card key={buyer.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{buyer.name}</h3>
                      {(buyer.city || buyer.state) && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-text-secondary dark:text-dark-text-secondary">
                          <MapPin className="h-3 w-3" />
                          {[buyer.city, buyer.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
