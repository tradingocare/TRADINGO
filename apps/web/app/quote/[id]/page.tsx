import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { IndianRupee, CalendarDays, FileText, Hash, User, Clock } from 'lucide-react';
import { getQuote } from '@/lib/api/quotes';
import type { Quote } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/dashboard/status-badge';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const quote = await getQuote(id);
    return {
      title: `Quote #${quote.id.slice(0, 8)}`,
      description: `Quote for ₹${quote.amount.toLocaleString()} - ${quote.status}`,
    };
  } catch {
    return { title: 'Quote Not Found' };
  }
}

function QuoteSkeleton() {
  return (
    <div className="container-main py-20">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-6 h-10 w-64" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div><Skeleton className="h-72 w-full" /></div>
      </div>
    </div>
  );
}

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<QuoteSkeleton />}>
      <QuoteContent id={id} />
    </Suspense>
  );
}

async function QuoteContent({ id }: { id: string }) {
  let quote: Quote;
  try {
    quote = await getQuote(id);
  } catch {
    notFound();
  }

  const validityDate = new Date(quote.validityDate).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const createdDate = new Date(quote.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <section className="border-b border-border bg-surface-secondary/50 pb-8 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
        <div className="container-main">
          <nav className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <span className="text-text-primary dark:text-dark-text-primary">Quote #{quote.id.slice(0, 8)}</span>
          </nav>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
                Quote #{quote.id.slice(0, 8)}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <StatusBadge status={quote.status} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-main">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <IndianRupee className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Quote Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-text-primary dark:text-dark-text-primary">
                    ₹{quote.amount.toLocaleString()}
                  </p>
                  {quote.deliveryDays && (
                    <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      Estimated delivery in {quote.deliveryDays} day{quote.deliveryDays !== 1 ? 's' : ''}
                    </p>
                  )}
                </CardContent>
              </Card>

              {quote.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                      {quote.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <Hash className="h-4 w-4" /> Quote ID
                    </span>
                    <span className="font-mono text-sm text-text-primary dark:text-dark-text-primary">
                      {quote.id.slice(0, 8)}...
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <User className="h-4 w-4" /> Seller
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">
                      #{quote.sellerId.slice(0, 8)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <FileText className="h-4 w-4" /> RFQ
                    </span>
                    <Link href={`/rfq/${quote.rfqId}`} className="font-medium text-primary-600 hover:underline dark:text-primary-400">
                      #{quote.rfqId.slice(0, 8)}
                    </Link>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <Clock className="h-4 w-4" /> Status
                    </span>
                    <StatusBadge status={quote.status} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <CalendarDays className="h-4 w-4" /> Valid Until
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{validityDate}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <CalendarDays className="h-4 w-4" /> Created
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{createdDate}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
