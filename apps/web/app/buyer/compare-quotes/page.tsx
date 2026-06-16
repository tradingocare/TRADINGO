'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star, Clock, Truck, IndianRupee } from 'lucide-react';

interface QuoteComparison {
  id: string;
  productName: string;
  quantity: string;
  quotes: Quote[];
}

interface Quote {
  seller: string;
  price: number;
  deliveryTime: string;
  rating: number;
  validity: string;
  moq: number;
  paymentTerms: string;
  shipping: string;
}

const comparison: QuoteComparison = {
  id: '1',
  productName: 'Industrial Grade Circuit Board',
  quantity: '500 pcs',
  quotes: [
    { seller: 'Precision Electronics', price: 1500, deliveryTime: '7-10 days', rating: 4.7, validity: '15 days', moq: 100, paymentTerms: '50% advance, 50% on delivery', shipping: 'Included' },
    { seller: 'TechComp Solutions', price: 1425, deliveryTime: '10-14 days', rating: 4.3, validity: '20 days', moq: 200, paymentTerms: '30% advance, 70% on delivery', shipping: '₹500 extra' },
    { seller: 'CircuitPro India', price: 1620, deliveryTime: '5-7 days', rating: 4.5, validity: '10 days', moq: 50, paymentTerms: 'Full payment upfront', shipping: 'Included' },
  ],
};

export default function CompareQuotesPage() {
  const [view, setView] = useState<'table' | 'cards'>('table');

  const lowestPrice = Math.min(...comparison.quotes.map((q) => q.price));
  const highestRating = Math.max(...comparison.quotes.map((q) => q.rating));
  const shortestDelivery = Math.min(...comparison.quotes.map((q) => parseInt(q.deliveryTime)));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Compare Quotes"
        description={`Comparing quotes for: ${comparison.productName} (${comparison.quantity})`}
        actions={
          <div className="flex gap-2">
            <Button variant={view === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setView('table')}>
              Table
            </Button>
            <Button variant={view === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setView('cards')}>
              Cards
            </Button>
          </div>
        }
      />

      {view === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-secondary/50 dark:border-dark-border dark:bg-dark-surface-secondary/50">
                    <th className="px-4 py-3 text-xs font-medium uppercase text-text-secondary dark:text-dark-text-secondary">Parameter</th>
                    {comparison.quotes.map((q) => (
                      <th key={q.seller} className="px-4 py-3 text-xs font-medium uppercase text-text-secondary dark:text-dark-text-secondary">
                        {q.seller}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border dark:border-dark-border">
                    <td className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      <IndianRupee className="h-4 w-4 text-text-tertiary" />
                      Price (per unit)
                    </td>
                    {comparison.quotes.map((q) => (
                      <td key={q.seller} className={`px-4 py-3 font-semibold ${q.price === lowestPrice ? 'text-accent-600' : 'text-text-primary dark:text-dark-text-primary'}`}>
                        ₹{q.price.toLocaleString('en-IN')}
                        {q.price === lowestPrice && <span className="ml-1.5 text-xs text-accent-600">Best</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border dark:border-dark-border">
                    <td className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      <Truck className="h-4 w-4 text-text-tertiary" />
                      Delivery Time
                    </td>
                    {comparison.quotes.map((q) => (
                      <td key={q.seller} className={`px-4 py-3 ${parseInt(q.deliveryTime) === shortestDelivery ? 'font-semibold text-accent-600' : 'text-text-secondary dark:text-dark-text-secondary'}`}>
                        {q.deliveryTime}
                        {parseInt(q.deliveryTime) === shortestDelivery && <span className="ml-1.5 text-xs text-accent-600">Fastest</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border dark:border-dark-border">
                    <td className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      <Star className="h-4 w-4 text-text-tertiary" />
                      Seller Rating
                    </td>
                    {comparison.quotes.map((q) => (
                      <td key={q.seller} className={`px-4 py-3 ${q.rating === highestRating ? 'font-semibold text-amber-600' : 'text-text-secondary dark:text-dark-text-secondary'}`}>
                        {q.rating.toFixed(1)} / 5.0
                        {q.rating === highestRating && <span className="ml-1.5 text-xs text-amber-600">Top</span>}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border dark:border-dark-border">
                    <td className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      <Clock className="h-4 w-4 text-text-tertiary" />
                      Validity
                    </td>
                    {comparison.quotes.map((q) => (
                      <td key={q.seller} className="px-4 py-3 text-text-secondary dark:text-dark-text-secondary">{q.validity}</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border dark:border-dark-border">
                    <td className="px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">Min. Order Qty</td>
                    {comparison.quotes.map((q) => (
                      <td key={q.seller} className="px-4 py-3 text-text-secondary dark:text-dark-text-secondary">{q.moq} pcs</td>
                    ))}
                  </tr>
                  <tr className="border-b border-border dark:border-dark-border">
                    <td className="px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">Payment Terms</td>
                    {comparison.quotes.map((q) => (
                      <td key={q.seller} className="px-4 py-3 text-text-secondary dark:text-dark-text-secondary">{q.paymentTerms}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary dark:text-dark-text-primary">Shipping</td>
                    {comparison.quotes.map((q) => (
                      <td key={q.seller} className="px-4 py-3 text-text-secondary dark:text-dark-text-secondary">{q.shipping}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {comparison.quotes.map((q) => {
            const bestPrice = q.price === lowestPrice;
            const bestRating = q.rating === highestRating;
            const bestDelivery = parseInt(q.deliveryTime) === shortestDelivery;
            return (
              <Card key={q.seller} className={`relative ${bestPrice ? 'border-accent-500 dark:border-accent-600' : ''}`}>
                {bestPrice && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-accent-600 px-3 py-0.5 text-[10px] font-semibold text-white">
                      Best Price
                    </span>
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="text-center">
                    <h3 className="text-base font-semibold text-text-primary dark:text-dark-text-primary">{q.seller}</h3>
                    <div className="mt-1 flex items-center justify-center gap-1 text-sm text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {q.rating.toFixed(1)}
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                      ₹{q.price.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-text-secondary dark:text-dark-text-secondary">per unit</p>
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary dark:text-dark-text-secondary">Delivery</span>
                      <span className="font-medium text-text-primary dark:text-dark-text-primary">{q.deliveryTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary dark:text-dark-text-secondary">Validity</span>
                      <span className="font-medium text-text-primary dark:text-dark-text-primary">{q.validity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary dark:text-dark-text-secondary">MOQ</span>
                      <span className="font-medium text-text-primary dark:text-dark-text-primary">{q.moq} pcs</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary dark:text-dark-text-secondary">Shipping</span>
                      <span className="font-medium text-text-primary dark:text-dark-text-primary">{q.shipping}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary dark:text-dark-text-secondary">Payment</span>
                      <span className="text-right text-xs font-medium text-text-primary dark:text-dark-text-primary">{q.paymentTerms}</span>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-center gap-2">
                    {bestPrice && <StatusBadge status="verified" />}
                    {bestRating && <StatusBadge status="approved" />}
                    {bestDelivery && <StatusBadge status="completed" />}
                  </div>
                  <Button className="mt-4 w-full">Accept Quote</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
