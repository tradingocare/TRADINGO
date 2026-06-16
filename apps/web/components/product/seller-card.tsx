'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Star, Award, MapPin, Clock, Shield, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type ProductDetailSeller } from '@/types/product-detail';

interface SellerCardProps {
  seller: ProductDetailSeller;
  onChat?: () => void;
}

const VERIFICATION_LABELS: Record<string, string> = {
  LEVEL_0: 'Unverified',
  LEVEL_1: 'Basic Verified',
  LEVEL_2: 'Document Verified',
  LEVEL_3: 'Fully Verified',
};

export function SellerCard({ seller, onChat }: SellerCardProps) {
  const trustColor =
    seller.trustScore >= 80
      ? 'text-accent-600 dark:text-accent-400'
      : seller.trustScore >= 50
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  const trustBg =
    seller.trustScore >= 80
      ? 'bg-accent-500/10'
      : seller.trustScore >= 50
        ? 'bg-amber-500/10'
        : 'bg-red-500/10';

  const memberSince = new Date(seller.createdAt).getFullYear();

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-surface-secondary dark:bg-dark-surface-secondary">
            {seller.logo ? (
              <Image
                src={seller.logo}
                alt={seller.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-text-tertiary dark:text-dark-text-tertiary">
                {seller.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/companies/${seller.slug}`}
              className="text-base font-semibold text-text-primary hover:text-primary-600 dark:text-dark-text-primary dark:hover:text-primary-400"
            >
              {seller.name}
            </Link>
            {seller.businessType && (
              <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                {seller.businessType}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className={cn('flex items-center gap-2 rounded-lg px-3 py-2', trustBg)}>
            <Star className={cn('h-4 w-4', trustColor)} />
            <span className={cn('text-sm font-semibold', trustColor)}>
              Trust Score: {seller.trustScore}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <Shield className="h-4 w-4" />
            <span className="font-medium text-text-primary dark:text-dark-text-primary">
              {VERIFICATION_LABELS[seller.verificationLevel] || seller.verificationLevel}
            </span>
          </div>

          {seller.city && (
            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>
                {seller.city}{seller.state ? `, ${seller.state}` : ''}
              </span>
            </div>
          )}

          {seller.responseRate != null && (
            <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>Response Rate: {seller.responseRate}%</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
            <Award className="h-4 w-4 flex-shrink-0" />
            <span>Member since {memberSince}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/companies/${seller.slug}`}
            className="inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary shadow-sm transition-all duration-200 hover:bg-surface-secondary hover:text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary"
          >
            View Profile
          </Link>
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={onChat}
          >
            <MessageCircle className="mr-1.5 h-4 w-4" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
