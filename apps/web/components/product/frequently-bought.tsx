'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type ProductDetailRelated } from '@/types/product-detail';

interface FrequentlyBoughtProps {
  products: ProductDetailRelated[];
  onAddAll?: () => void;
}

export function FrequentlyBought({ products, onAddAll }: FrequentlyBoughtProps) {
  if (products.length < 2) return null;

  const totalPrice = products.reduce(
    (sum, p) => sum + (p.price ?? 0),
    0,
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-5 dark:bg-dark-surface dark:border-dark-border">
      <h3 className="mb-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">
        Frequently Bought Together
      </h3>

      <div className="flex items-center justify-center gap-3">
        {products.map((product, idx) => (
          <div key={product.id} className="flex items-center gap-3">
            {idx > 0 && (
              <Plus className="h-5 w-5 flex-shrink-0 text-text-tertiary dark:text-dark-text-tertiary" />
            )}
            <Link
              href={`/products/${product.slug}`}
              className="group block"
            >
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-surface-secondary transition-shadow group-hover:shadow-md dark:bg-dark-surface-secondary">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-text-tertiary dark:text-dark-text-tertiary">
                    No Image
                  </div>
                )}
              </div>
              <p className="mt-1 max-w-[80px] truncate text-xs text-text-secondary dark:text-dark-text-secondary">
                {product.name}
              </p>
              {product.price != null && (
                <p className="text-xs font-semibold text-text-primary dark:text-dark-text-primary">
                  ₹{product.price.toLocaleString()}
                </p>
              )}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 dark:border-dark-border">
        <div>
          <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
            Total price:
          </p>
          <p className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
            ₹{totalPrice.toLocaleString()}
          </p>
        </div>
        <Button onClick={onAddAll}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add All to Cart
        </Button>
      </div>
    </div>
  );
}
