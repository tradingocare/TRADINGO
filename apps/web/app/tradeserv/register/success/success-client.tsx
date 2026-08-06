'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Calendar, Clock, Shield, Briefcase, ExternalLink } from 'lucide-react';
import { getReservedSlug } from '../hooks/use-slug';
import { VERIFICATION_KEY, CATEGORIES } from '../types';
import { VerificationStatusBadge, VerificationStatusCard } from '../components/verification-status';
import { VerificationTimeline } from '../components/verification-timeline';
import { SlugReservation } from '../components/slug-reservation';
import type { VerificationData, VerificationStatus } from '../types';

export default function SuccessClientPage() {
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [category, setCategory] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VERIFICATION_KEY);
      if (raw) {
        const data = JSON.parse(raw) as VerificationData;
        setVerification(data);
      }
    } catch { /* ignore */ }

    try {
      const draftRaw = localStorage.getItem('tradeserv-registration-draft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        setCategory(draft.category || '');
      }
    } catch { /* ignore */ }
  }, []);

  const status: VerificationStatus = verification?.status || 'pending';
  const slug = verification?.slug || '';
  const categoryName = category || 'Professional Services';

  return (
    <div className="min-h-screen bg-bg-base">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.08), transparent)',
        }}
      />
      <div className="relative z-10 py-16 sm:py-24">
        <div className="container-main max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              Registration Submitted
            </h1>
            <p className="mt-3 text-base text-text-tertiary max-w-xl mx-auto">
              Thank you for registering on TradeServ. Your application is being queued for review.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 grid gap-6 sm:grid-cols-2"
          >
            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={16} className="text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Verification</span>
              </div>
              <VerificationStatusCard status={status} />
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3 mb-3">
                <Clock size={16} className="text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Estimated Time</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-text-primary">{verification?.estimatedReviewDays || 5} business days</p>
              <p className="mt-1 text-xs text-text-tertiary">Typical review and verification process</p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3 mb-3">
                <Calendar size={16} className="text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Submitted</span>
              </div>
              <p className="text-sm text-text-secondary">
                {verification?.submittedAt
                  ? new Date(verification.submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })
                  : 'Just now'}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3 mb-3">
                <Briefcase size={16} className="text-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Category</span>
              </div>
              <p className="text-sm text-text-secondary">{categoryName}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
          >
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <VerificationTimeline status={status} />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              {slug ? (
                <SlugReservation slug={slug} category={categoryName} />
              ) : (
                <p className="text-sm text-text-tertiary italic">Reserved URLs will appear here.</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-8"
          >
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-4">What happens next?</h3>
              <div className="space-y-4 text-sm text-text-secondary">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">1</div>
                  <p>Your documents and information will be reviewed by our admin team.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">2</div>
                  <p>TradTrust verification will validate your credentials, qualifications, and identity.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">3</div>
                  <p>Once approved, your profile will be published and discoverable on TradeServ search.</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">4</div>
                  <p>You will be able to receive client inquiries, manage your dashboard, and grow your practice.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/tradeserv"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 text-sm font-semibold text-text-primary transition-all duration-200 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20"
            >
              Back to TradeServ
              <ArrowRight size={16} />
            </Link>
            <Link
              href={`/tradeserv/p/${slug || 'rahul-sharma-ca'}`}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3 text-sm font-medium text-text-secondary transition-all duration-200 hover:border-accent/30 hover:text-accent"
            >
              Preview Profile
              <ExternalLink size={14} />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5"
          >
            <h4 className="text-xs font-semibold uppercase tracking-wider text-yellow-400/80">Important</h4>
            <p className="mt-2 text-xs leading-relaxed text-yellow-400/60">
              Your profile remains private until verification is complete and approved. It will not appear in
              TradeServ search results or public listings until all verification steps are passed.
              You will be notified when your profile is published.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
