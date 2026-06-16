import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, IndianRupee, Package, FileText, Hash, Building2, MessageSquare } from 'lucide-react';
import { getRfq } from '@/lib/api/rfqs';
import type { Rfq } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/dashboard/status-badge';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const rfq = await getRfq(id);
    return {
      title: `RFQ: ${rfq.productName}`,
      description: rfq.description?.slice(0, 160) || `Request for Quotation for ${rfq.productName}`,
      openGraph: {
        title: `RFQ: ${rfq.productName} | TRADINGO`,
        description: `View and respond to this RFQ for ${rfq.productName}.`,
      },
    };
  } catch {
    return { title: 'RFQ Not Found' };
  }
}

function RfqSkeleton() {
  return (
    <div className="container-main py-20">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-6 h-10 w-3/4" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div><Skeleton className="h-64 w-full" /></div>
      </div>
    </div>
  );
}

export default async function RfqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<RfqSkeleton />}>
      <RfqContent id={id} />
    </Suspense>
  );
}

async function RfqContent({ id }: { id: string }) {
  let rfq: Rfq;
  try {
    rfq = await getRfq(id);
  } catch {
    notFound();
  }

  const postedDate = new Date(rfq.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <section className="border-b border-border bg-surface-secondary/50 pb-8 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
        <div className="container-main">
          <nav className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <Link href="/rfq" className="hover:text-primary-600 dark:hover:text-primary-400">RFQs</Link>
            <span className="mx-2">/</span>
            <span className="text-text-primary dark:text-dark-text-primary">{rfq.productName}</span>
          </nav>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
                {rfq.productName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StatusBadge status={rfq.status} />
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">
                  <Hash className="mr-1 inline h-4 w-4" />{rfq.id.slice(0, 8)}
                </span>
              </div>
            </div>
            {rfq.status === 'open' && (
              <Button size="lg">Submit Quote</Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-main">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {rfq.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
                      {rfq.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Quotes Received
                  </CardTitle>
                  <CardDescription>
                    Responses from sellers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rfq.responseCount && rfq.responseCount > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 p-4 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
                        <div>
                          <p className="font-medium text-text-primary dark:text-dark-text-primary">
                            {rfq.responseCount} quote{rfq.responseCount !== 1 ? 's' : ''} received
                          </p>
                          <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                            Review and compare quotes from sellers
                          </p>
                        </div>
                        <Button variant="outline" size="sm">View Quotes</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <MessageSquare className="h-10 w-10 text-text-secondary dark:text-dark-text-secondary" />
                      <p className="mt-3 text-text-secondary dark:text-dark-text-secondary">
                        No quotes received yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <Package className="h-4 w-4" /> Product
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{rfq.productName}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <Hash className="h-4 w-4" /> Quantity
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">
                      {rfq.quantity.toLocaleString()} {rfq.unit}
                    </span>
                  </div>
                  {rfq.budget && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                          <IndianRupee className="h-4 w-4" /> Budget
                        </span>
                        <span className="font-medium text-text-primary dark:text-dark-text-primary">
                          ₹{rfq.budget.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <CalendarDays className="h-4 w-4" /> Posted
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{postedDate}</span>
                  </div>
                  {rfq.city && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                          <Building2 className="h-4 w-4" /> Location
                        </span>
                        <span className="font-medium text-text-primary dark:text-dark-text-primary">{rfq.city}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
