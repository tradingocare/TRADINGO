'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Building2, Mail, Phone, Package, Star } from 'lucide-react';

interface Buyer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  totalOrders: number;
  lastOrderDate: string;
  status: string;
  rating: number;
}

const buyers: Buyer[] = [
  { id: '1', companyName: 'TechMart India', contactName: 'Rahul Sharma', email: 'rahul@techmart.in', phone: '+91-9876543210', totalOrders: 24, lastOrderDate: '2026-06-12', status: 'active', rating: 4.8 },
  { id: '2', companyName: 'Green Foods Ltd', contactName: 'Priya Patel', email: 'priya@greenfoods.com', phone: '+91-9876543211', totalOrders: 15, lastOrderDate: '2026-06-09', status: 'active', rating: 4.5 },
  { id: '3', companyName: 'BuildRight Construction', contactName: 'Amit Singh', email: 'amit@buildright.in', phone: '+91-9876543212', totalOrders: 8, lastOrderDate: '2026-05-20', status: 'active', rating: 4.2 },
  { id: '4', companyName: 'Fashion Hub India', contactName: 'Neha Gupta', email: 'neha@fashionhub.in', phone: '+91-9876543213', totalOrders: 3, lastOrderDate: '2026-04-15', status: 'inactive', rating: 3.8 },
];

export default function SellerBuyersPage() {
  const [search, setSearch] = useState('');

  const filtered = buyers.filter(
    (b) =>
      b.companyName.toLowerCase().includes(search.toLowerCase()) ||
      b.contactName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Saved Buyers"
        description="Manage your preferred buyers and trading partners"
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
        <Input
          placeholder="Search buyers by name or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <Building2 className="h-12 w-12 text-text-tertiary" />
          <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No buyers found</h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            {search ? 'Try a different search term.' : 'Saved buyers will appear here once you complete orders.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((buyer) => (
            <Card key={buyer.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
                        {buyer.companyName}
                      </h3>
                      <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                        {buyer.contactName}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={buyer.status} />
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-text-secondary dark:text-dark-text-secondary">
                    <Mail className="h-3.5 w-3.5" />
                    <span>{buyer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary dark:text-dark-text-secondary">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{buyer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary dark:text-dark-text-secondary">
                    <Package className="h-3.5 w-3.5" />
                    <span>{buyer.totalOrders} orders</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-secondary dark:text-dark-text-secondary">
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    <span>{buyer.rating.toFixed(1)} rating</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-text-tertiary dark:border-dark-border">
                  <span>Last order: {buyer.lastOrderDate}</span>
                  <Button variant="outline" size="sm">Contact</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
