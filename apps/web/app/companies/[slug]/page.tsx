import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Building2, IndianRupee, Package, BadgeCheck, MapPin, Phone, Shield } from 'lucide-react';
import { getCompany } from '@/lib/api/companies';
import { getProducts } from '@/lib/api/products';
import type { Company, Product } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/dashboard/status-badge';
import { CTABlock } from '@/components/shared/cta-block';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const company = await getCompany(slug);
    return {
      title: `${company.name} | Company Profile`,
      description: `View ${company.name}'s profile, products, and contact information on TRADINGO.`,
      openGraph: {
        title: `${company.name} | TRADINGO`,
        description: `Browse products from ${company.name} on TRADINGO TEM E-Marketplace.`,
      },
    };
  } catch {
    return { title: 'Company Not Found' };
  }
}

function CompanySkeleton() {
  return (
    <div className="container-main py-20">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-4 h-4 w-96" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-full" /><Skeleton className="mt-2 h-4 w-3/4" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<CompanySkeleton />}>
      <CompanyContent slug={slug} />
    </Suspense>
  );
}

async function CompanyContent({ slug }: { slug: string }) {
  let company: Company;
  let products: Product[];
  try {
    company = await getCompany(slug);
    const result = await getProducts({ limit: 50 } as Record<string, unknown> as never);
    products = result.data.filter(p => p.companyId === company.id);
  } catch {
    notFound();
  }

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    description: `${company.type} company on TRADINGO`,
    address: company.address ? { '@type': 'PostalAddress', streetAddress: company.address } : undefined,
    contactPoint: { '@type': 'ContactPoint', telephone: company.phone, contactType: 'sales' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />

      <section className="border-b border-border bg-surface-secondary/50 pb-12 pt-24 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
        <div className="container-main">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-600/10 dark:bg-primary-400/10">
                <Building2 className="h-8 w-8 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">{company.name}</h1>
                  {company.verificationStatus === 'verified' && (
                    <BadgeCheck className="h-6 w-6 text-accent-600 dark:text-accent-400" />
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <StatusBadge status={company.status} />
                  <Badge variant="outline">{company.type}</Badge>
                  <StatusBadge status={company.verificationStatus} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {company.city && (
              <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                <MapPin className="h-4 w-4" />
                <span>{company.city}{company.state ? `, ${company.state}` : ''}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                <Phone className="h-4 w-4" />
                <span>{company.phone}</span>
              </div>
            )}
            {company.gst && (
              <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                <Shield className="h-4 w-4" />
                <span>GST: {company.gst}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-main">
          <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">Products</h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
            {products.length} product{products.length !== 1 ? 's' : ''} listed
          </p>

          {products.length === 0 ? (
            <div className="mt-8 flex flex-col items-center justify-center py-16 text-center">
              <Package className="h-12 w-12 text-text-secondary dark:text-dark-text-secondary" />
              <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">No products listed yet</h3>
              <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">This seller has not listed any products yet.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex h-32 items-center justify-center rounded-lg bg-surface-secondary dark:bg-dark-surface-secondary">
                        <Package className="h-10 w-10 text-text-secondary dark:text-dark-text-secondary" />
                      </div>
                      <h3 className="mt-4 font-semibold text-text-primary dark:text-dark-text-primary line-clamp-2">{product.name}</h3>
                      <div className="mt-2 flex items-baseline gap-1">
                        <IndianRupee className="h-4 w-4 text-text-primary dark:text-dark-text-primary" />
                        <span className="text-lg font-bold text-text-primary dark:text-dark-text-primary">{product.price.toLocaleString()}</span>
                        <span className="text-xs text-text-secondary dark:text-dark-text-secondary">/{product.unit}</span>
                      </div>
                      <Badge variant={product.stock > 0 ? 'success' : 'destructive'} className="mt-2">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <CTABlock
        title={`Interested in ${company.name}'s products?`}
        subtitle="Reach out directly or post an RFQ to get the best deals."
        primaryLabel="Post an RFQ"
        primaryHref="/rfq"
        secondaryLabel="Browse Products"
        secondaryHref="/products"
        variant="accent"
      />
    </>
  );
}
