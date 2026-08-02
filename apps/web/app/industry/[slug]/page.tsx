import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, LayoutGrid, Package, Building2 } from 'lucide-react';
import { getProducts } from '@/lib/api/products';
import { getIndustry } from '@/lib/api/industries';
import type { Product } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CTABlock } from '@/components/shared/cta-block';
import { ProductCard } from '@/components/product/product-card';
import { fromBasicProduct } from '@/components/product/card-converters';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const industry: any = await getIndustry(slug);
    return {
      title: `${industry.name} Industry | TRADINGO`,
      description: industry.description ?? `Explore ${industry.name} industry products and suppliers on TRADINGO.`,
      openGraph: {
        title: `${industry.name} Industry | TRADINGO`,
        description: `Find ${industry.name} products and suppliers.`,
      },
    };
  } catch {
    return { title: 'Industry | TRADINGO' };
  }
}

function IndustrySkeleton() {
  return (
    <div className="container-main py-20">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="mt-6 h-10 w-72" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-full" /><Skeleton className="mt-2 h-4 w-3/4" /></CardContent></Card>
        ))}
      </div>
    </div>
  );
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<IndustrySkeleton />}>
      <IndustryContent slug={slug} />
    </Suspense>
  );
}

async function IndustryContent({ slug }: { slug: string }) {
  let industry: any;
  try {
    industry = await getIndustry(slug);
  } catch {
    notFound();
  }

  let result: any;
  try {
    result = await getProducts({ industryId: industry.id, limit: 50 });
  } catch {
    result = null;
  }

  const products: Product[] = result?.data ?? [];
  const subCategories = [...new Set(products.map(p => p.category).filter(Boolean) as string[])];

  return (
    <>
      <section className="border-b border-border bg-surface-secondary/50 pb-8 pt-24">
        <div className="container-main">
          <nav className="flex items-center gap-2 text-sm text-text-secondary">
            <Link href="/products" className="hover:text-accent transition-colors">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/industries" className="hover:text-accent transition-colors">Industries</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-text-primary">{industry.name}</span>
          </nav>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
              <Building2 className="h-5 w-5" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary">
              {industry.name}
            </h1>
          </div>
          <p className="mt-2 max-w-2xl text-text-secondary">
            {industry.description ?? `Explore ${industry.name.toLowerCase()} products and connect with verified suppliers on TRADINGO.`}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {products.length} product{products.length !== 1 ? 's' : ''} available
            {subCategories.length > 0 ? ` across ${subCategories.length} sub-categor${subCategories.length !== 1 ? 'ies' : 'y'}` : ''}
            {' Â· '}{industry._count?.companies ?? 0} supplier{(industry._count?.companies ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </section>

      {subCategories.length > 0 && (
        <section className="border-b border-border bg-surface py-8">
          <div className="container-main">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-accent" />
              <h2 className="font-semibold text-text-primary">Sub-Categories</h2>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {subCategories.map((cat) => (
                <Link key={cat} href={`/categories/${cat.toLowerCase().replace(/\s+/g, '-')}`}>
                  <Badge variant="secondary" className="cursor-pointer px-4 py-1.5 text-sm hover:bg-surface-tertiary">
                    {cat}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12">
        <div className="container-main">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-text-secondary" />
              <h2 className="mt-4 text-xl font-semibold text-text-primary">
                No products in this industry yet
              </h2>
              <p className="mt-2 text-text-secondary">
                Check back later or browse other industries.
              </p>
              <Link href="/products">
                <span className="mt-6 inline-block rounded-lg bg-accent px-6 py-2 text-sm font-medium text-btn-primary-text hover:opacity-90 transition-opacity">
                  Browse All Products
                </span>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={fromBasicProduct({ ...product, image: product.images?.[0] ?? null, slug: product.id })}
                  variant="minimal"
                  features={{ showActions: false, showCompare: false, showWishlist: false }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <CTABlock
        title={`Join the ${industry.name} Industry on TRADINGO`}
        subtitle="Connect with buyers and sellers in your industry today."
        primaryLabel="Get Started"
        primaryHref="/seller-plans"
        secondaryLabel="Browse All Industries"
        secondaryHref="/industries"
        variant="accent"
      />
    </>
  );
}
