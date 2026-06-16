'use client';

import { useState } from 'react';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Building2, Star, MapPin, TrendingUp } from 'lucide-react';

interface Supplier {
  id: string;
  companyName: string;
  location: string;
  rating: number;
  totalProducts: number;
  totalOrders: number;
  responseRate: string;
  joinedDate: string;
}

const suppliers: Supplier[] = [
  { id: '1', companyName: 'Precision Electronics', location: 'Mumbai, India', rating: 4.7, totalProducts: 156, totalOrders: 342, responseRate: '98%', joinedDate: '2024-03-15' },
  { id: '2', companyName: 'GreenField Agri Exports', location: 'Pune, India', rating: 4.5, totalProducts: 89, totalOrders: 210, responseRate: '95%', joinedDate: '2024-06-01' },
  { id: '3', companyName: 'Industrial Solutions Co.', location: 'Delhi, India', rating: 4.3, totalProducts: 234, totalOrders: 567, responseRate: '92%', joinedDate: '2024-01-10' },
  { id: '4', companyName: 'Textile World', location: 'Surat, India', rating: 4.8, totalProducts: 178, totalOrders: 423, responseRate: '99%', joinedDate: '2024-02-20' },
  { id: '5', companyName: 'ChemiTrade Ltd', location: 'Vadodara, India', rating: 4.1, totalProducts: 67, totalOrders: 145, responseRate: '88%', joinedDate: '2024-08-05' },
];

export default function BuyerSuppliersPage() {
  const [search, setSearch] = useState('');

  const filtered = suppliers.filter(
    (s) =>
      s.companyName.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Saved Suppliers"
        description="Manage your preferred suppliers"
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Building2 className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No suppliers found</h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            {search ? 'Try a different search term.' : 'Save suppliers you trust to quickly request quotes from them.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((supplier) => (
            <Card key={supplier.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                      {supplier.companyName}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                      <MapPin className="h-3 w-3" />
                      {supplier.location}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-secondary/50 p-2.5 text-center dark:bg-dark-surface-secondary/50">
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      {supplier.rating.toFixed(1)}
                    </div>
                    <p className="mt-0.5 text-[10px] text-text-tertiary">Rating</p>
                  </div>
                  <div className="rounded-lg bg-surface-secondary/50 p-2.5 text-center dark:bg-dark-surface-secondary/50">
                    <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                      {supplier.totalProducts}
                    </p>
                    <p className="mt-0.5 text-[10px] text-text-tertiary">Products</p>
                  </div>
                  <div className="rounded-lg bg-surface-secondary/50 p-2.5 text-center dark:bg-dark-surface-secondary/50">
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                      <TrendingUp className="h-3.5 w-3.5 text-accent-600" />
                      {supplier.responseRate}
                    </div>
                    <p className="mt-0.5 text-[10px] text-text-tertiary">Response</p>
                  </div>
                  <div className="rounded-lg bg-surface-secondary/50 p-2.5 text-center dark:bg-dark-surface-secondary/50">
                    <p className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                      {supplier.totalOrders}
                    </p>
                    <p className="mt-0.5 text-[10px] text-text-tertiary">Orders</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3 dark:border-dark-border">
                  <span className="text-xs text-text-tertiary">Joined {supplier.joinedDate}</span>
                  <Button variant="outline" size="sm">View Profile</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
