'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Shield, Star, Clock, Briefcase, Users, ArrowRight, CheckCircle } from 'lucide-react';
import { TRADESERV_CATEGORIES as CATEGORIES } from '@/lib/data/tradeserv';
import { useTradeServSearchV2 } from '@/hooks/use-tradeserv';
import { ProfessionalCard } from '@/components/tradeserv/professional-card';
import { AnimatedSection } from '@/components/shared/animated-section';

export default function CategoryListingClient() {
  const params = useParams();
  const slug = params.slug as string;
  const category = CATEGORIES.find((c) => c.slug === slug);
  const { data: searchData, isLoading } = useTradeServSearchV2(
    category ? { category: category.title } : { query: '' }
  );
  const profiles = searchData?.data ?? [];

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="text-center px-4">
          <p className="text-6xl font-bold text-accent">404</p>
          <p className="mt-4 text-lg text-text-tertiary">Category not found</p>
          <Link
            href="/tradeserv/categories"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-btn-primary-text"
          >
            Browse all categories
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.06), transparent)',
        }}
      />
      <div className="relative z-10 py-12 sm:py-16">
        <div className="container-main max-w-5xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/tradeserv/categories"
              className="mb-6 inline-flex items-center gap-2 text-sm text-text-tertiary transition-colors hover:text-accent"
            >
              <ArrowLeft size={14} />
              All categories
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-3xl">
              {category.icon}
            </span>
            <h1 className="mt-4 text-2xl font-bold text-text-primary sm:text-3xl">
              {category.title}s
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-text-tertiary">{category.description}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-text-tertiary">
              <Users size={12} />
              {profiles.length > 0
                ? `${profiles.length} professional(s) available`
                : 'No professionals listed yet'}
            </div>
          </motion.div>

          {isLoading ? (
            <div className="mt-10 flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            </div>
          ) : profiles.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((profile: any) => (
                <ProfessionalCard key={profile.slug ?? profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <AnimatedSection>
              <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
                <Briefcase size={32} className="mx-auto text-text-tertiary" />
                <h3 className="mt-4 text-lg font-semibold text-text-tertiary">No professionals listed yet</h3>
                <p className="mt-2 text-sm text-text-tertiary max-w-md mx-auto">
                  Be the first {category.title?.toLowerCase()} professional to join TradeServ and get discovered by businesses across India.
                </p>
                <Link
                  href="/tradeserv/register"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-btn-primary-text transition-all hover:bg-accent/90"
                >
                  Register as a {category.title}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </AnimatedSection>
          )}

          <AnimatedSection>
            <div className="mt-16 rounded-2xl border border-border bg-surface p-8">
              <h2 className="text-xl font-semibold text-text-primary">About this service</h2>
              <p className="mt-4 leading-relaxed text-text-tertiary">{category.detailedDescription}</p>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-text-primary">Key services offered</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.benefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent/20 hover:bg-surface-secondary"
                  >
                    <CheckCircle size={18} className="mt-0.5 shrink-0 text-accent" />
                    <span className="text-sm text-text-secondary">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-text-primary">Who needs this</h2>
              <div className="mt-6 flex flex-wrap gap-3">
                {category.whoNeedsIt.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-tertiary transition-colors hover:border-accent/30 hover:text-text-primary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <div className="mt-12 rounded-xl border border-accent/20 bg-accent/[0.04] p-6 text-center">
              <h3 className="text-sm font-semibold text-text-primary">Are you a {category.title}?</h3>
              <p className="mt-1 text-xs text-text-tertiary">
                Create your profile and get discovered by businesses looking for your expertise.
              </p>
              <Link
                href="/tradeserv/register"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90"
              >
                Join TradeServ
                <ArrowRight size={14} />
              </Link>
            </div>
          </AnimatedSection>

          <div className="mt-8">
            <Link
              href="/tradeserv"
              className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            >
              &larr; Back to TradeServ Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
