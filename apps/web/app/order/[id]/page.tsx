import { Suspense } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IndianRupee, CalendarDays, Package, Hash, User, CreditCard, Truck, ClipboardList } from 'lucide-react';
import { getOrder } from '@/lib/api/orders';
import type { Order } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/dashboard/status-badge';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    const order = await getOrder(id);
    return {
      title: `Order ${order.orderNumber}`,
      description: `Order for ${order.productName} - ${order.status}`,
    };
  } catch {
    return { title: 'Order Not Found' };
  }
}

function OrderSkeleton() {
  return (
    <div className="container-main py-20">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-6 h-10 w-64" />
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div><Skeleton className="h-80 w-full" /></div>
      </div>
    </div>
  );
}

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderContent id={id} />
    </Suspense>
  );
}

async function OrderContent({ id }: { id: string }) {
  let order: Order;
  try {
    order = await getOrder(id);
  } catch {
    notFound();
  }

  const createdDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const updatedDate = new Date(order.updatedAt).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const timelineSteps = [
    { status: 'pending', label: 'Order Placed', description: 'Order has been placed successfully.', date: order.createdAt },
    { status: 'confirmed', label: 'Confirmed', description: 'Seller has confirmed the order.', date: order.createdAt },
    { status: 'shipped', label: 'Shipped', description: 'Order has been shipped.', date: '' },
    { status: 'delivered', label: 'Delivered', description: 'Order has been delivered.', date: '' },
  ];

  const currentStepIndex = timelineSteps.findIndex(s => s.status === order.status);
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <>
      <section className="border-b border-border bg-surface-secondary/50 pb-8 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
        <div className="container-main">
          <nav className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <span className="text-text-primary dark:text-dark-text-primary">Order {order.orderNumber}</span>
          </nav>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
                Order {order.orderNumber}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <StatusBadge status={order.status} />
                <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                  Payment: {order.paymentStatus.replace(/_/g, ' ')}
                </Badge>
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
                    <ClipboardList className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Order Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 h-full w-0.5 bg-border dark:bg-dark-border" />
                    <div className="space-y-8">
                      {timelineSteps.map((step, index) => {
                        const isActive = index <= activeStep;
                        const isCurrent = index === activeStep;
                        return (
                          <div key={step.status} className="relative pl-12">
                            <div
                              className={`absolute left-2.5 flex h-3 w-3 items-center justify-center rounded-full border-2 ${
                                isActive
                                  ? 'border-primary-600 bg-primary-600 dark:border-primary-400 dark:bg-primary-400'
                                  : 'border-border bg-surface dark:border-dark-border dark:bg-dark-surface'
                              } ${isCurrent ? 'ring-2 ring-primary-600/30 dark:ring-primary-400/30' : ''}`}
                            />
                            <div>
                              <p className={`font-medium ${isActive ? 'text-text-primary dark:text-dark-text-primary' : 'text-text-secondary dark:text-dark-text-secondary'}`}>
                                {step.label}
                              </p>
                              <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                                {step.description}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Product</span>
                      <span className="font-medium text-text-primary dark:text-dark-text-primary">{order.productName}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Quantity</span>
                      <span className="font-medium text-text-primary dark:text-dark-text-primary">
                        {order.quantity.toLocaleString()} {order.unit}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary dark:text-dark-text-secondary">Amount</span>
                      <span className="flex items-center gap-1 text-lg font-bold text-text-primary dark:text-dark-text-primary">
                        <IndianRupee className="h-4 w-4" />{order.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <Hash className="h-4 w-4" /> Order #
                    </span>
                    <span className="font-mono text-sm text-text-primary dark:text-dark-text-primary">
                      {order.orderNumber}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <User className="h-4 w-4" /> Buyer
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">
                      #{order.buyerId.slice(0, 8)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <User className="h-4 w-4" /> Seller
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">
                      #{order.sellerId.slice(0, 8)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <Truck className="h-4 w-4" /> Status
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <CreditCard className="h-4 w-4" /> Payment
                    </span>
                    <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                      {order.paymentStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <CalendarDays className="h-4 w-4" /> Created
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{createdDate}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                      <CalendarDays className="h-4 w-4" /> Updated
                    </span>
                    <span className="font-medium text-text-primary dark:text-dark-text-primary">{updatedDate}</span>
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
