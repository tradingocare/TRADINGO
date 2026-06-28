'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Plus, ShoppingCart } from 'lucide-react';
import { type ProductDetailRelated } from '@/types/product-detail';

interface FrequentlyBoughtProps {
  products: ProductDetailRelated[];
  onAddAll?: () => void;
}

export function FrequentlyBought({ products, onAddAll }: FrequentlyBoughtProps) {
  if (products.length < 2) return null;

  const totalPrice = products.reduce((sum, p) => sum + (p.price ?? 0), 0);

  return (
    <div className="rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h3 className="mb-4 text-lg font-bold text-white">Frequently Bought Together</h3>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        {products.map((product, idx) => (
          <div key={product.id} className="flex items-center gap-3">
            {idx > 0 && <Plus size={18} className="text-white/20 flex-shrink-0" />}
            <Link href={`/products/${product.slug}`} className="group block">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl transition-shadow group-hover:shadow-lg"
                style={{ background: 'rgba(255,255,255,0.04)' }}>
                {product.image ? (
                  <Image src={product.image} alt={product.name} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-white/30">No Image</div>
                )}
              </div>
              <p className="mt-1 max-w-[80px] truncate text-[11px] text-white/50">{product.name}</p>
              {product.price != null && <p className="text-xs font-bold text-white">₹{product.price.toLocaleString()}</p>}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div>
          <p className="text-[11px] text-white/40">Total price:</p>
          <p className="text-xl font-black text-white">₹{totalPrice.toLocaleString()}</p>
        </div>
        <button onClick={onAddAll}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{ background: 'linear-gradient(135deg, #FF4D00, #FF7A3D)', color: '#fff', boxShadow: '0 4px 16px rgba(255,77,0,0.3)' }}>
          <ShoppingCart size={14} /> Add All to Cart
        </button>
      </div>
    </div>
  );
}
