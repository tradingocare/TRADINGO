'use client';

import Link from 'next/link';
import {
  User, Briefcase, Award, Shield, BarChart3, Eye, Copy, ExternalLink,
  ArrowRight, CheckCircle, Clock, AlertTriangle, RefreshCw, Star, BookOpen,
  MessageSquare, FileText, Image,
} from 'lucide-react';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { GlassCard } from '@/components/tradeserv/glass-card';
import { AiDashboardWidgets } from '@/components/tradeserv/ai-dashboard-widgets';
import { useDashboard, useMyProfile } from '@/hooks/use-tradeserv';

const QUICK_ACTIONS = [
  { label: 'Edit Profile', href: '/tradeserv/workspace/profile', icon: User },
  { label: 'Add Service', href: '/tradeserv/workspace/services', icon: Briefcase },
  { label: 'Upload Portfolio', href: '/tradeserv/workspace/portfolio', icon: Eye },
  { label: 'Complete Verification', href: '/tradeserv/workspace/verification', icon: Shield },
];

const ANALYTICS_CONFIG = [
  { label: 'Services', key: 'services' as const, icon: Briefcase },
  { label: 'Portfolio Items', key: 'portfolio' as const, icon: Image },
  { label: 'Bookings', key: 'bookings' as const, icon: BookOpen },
  { label: 'Reviews', key: 'reviews' as const, icon: MessageSquare },
  { label: 'Proposals', key: 'proposals' as const, icon: FileText },
];

export default function WorkspaceDashboard() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: dashboard, isLoading: dashLoading } = useDashboard();

  const name = profile?.name || 'Professional';
  const title = profile?.description || 'TradeServ Professional';
  const slug = profile?.slug || '';
  const verificationStatus = (profile?.professionalStatus || 'PENDING_REVIEW').toLowerCase();
  const trustScore = profile?.trustScore ?? null;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Workspace Dashboard"
        description="Manage your TradeServ professional profile and services"
      />

      {/* Row 1: Welcome */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
          {profileLoading ? (
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 animate-pulse rounded-xl bg-surface-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-48 animate-pulse rounded bg-surface-secondary" />
                <div className="h-4 w-64 animate-pulse rounded bg-surface-secondary" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10">
                <User className="h-7 w-7 text-[#f59e0b]" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-text-primary">Welcome back, {name}</h2>
                <p className="mt-1 text-sm text-text-tertiary">{title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={verificationStatus} />
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        {/* Public Profile */}
        <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-tertiary">
            Reserved Public Profile
          </h3>
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-sm font-mono text-text-secondary">
            <span className="truncate">tradeserv.com/p/{slug || '{slug}'}</span>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/tradeserv/p/${slug}`}
              className="flex items-center gap-1.5 rounded-full bg-surface-secondary px-4 py-1.5 text-xs font-medium text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </Link>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(`https://tradingo.com/tradeserv/p/${slug}`)}
              className="flex items-center gap-1.5 rounded-full bg-surface-secondary px-4 py-1.5 text-xs font-medium text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
            >
              <Copy className="h-3.5 w-3.5" /> Copy URL
            </button>
            <Link
              href={`/tradeserv/p/${slug}`}
              className="flex items-center gap-1.5 rounded-full bg-surface-secondary px-4 py-1.5 text-xs font-medium text-text-secondary transition-all hover:bg-surface hover:text-text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View as Visitor
            </Link>
          </div>
        </GlassCard>
      </div>

      {/* Row 2: Stats cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Profile Completion */}
        <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Profile Completion</h3>
            <span className="text-2xl font-bold text-[#f59e0b]">
              {profileLoading ? '--' : `${Math.min(profile?.profileCompletionPercentage ?? 0, 100)}%`}
            </span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(profile?.profileCompletionPercentage ?? 0, 100)}%` }}
            />
          </div>
          <Link
            href="/tradeserv/workspace/profile"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            Complete Profile <ArrowRight className="h-3 w-3" />
          </Link>
        </GlassCard>

        {/* Membership */}
        <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Membership</h3>
            <Award className="h-5 w-5 text-[#f59e0b]" />
          </div>
          <p className="text-lg font-bold text-text-primary">{profile?.subscriptionPlan || 'Trial'}</p>
          <p className="text-xs text-text-tertiary">
            {profile?.subscriptionExpiresAt
              ? `Renewal: ${new Date(profile.subscriptionExpiresAt).toLocaleDateString()}`
              : 'Active'}
          </p>
          <div className="mt-3">
            <StatusBadge status={(profile?.subscriptionStatus || 'TRIAL').toLowerCase()} />
          </div>
          <Link
            href="/tradeserv/workspace/membership"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#f59e0b] transition-colors hover:text-[#f59e0b]/80"
          >
            Upgrade <ArrowRight className="h-3 w-3" />
          </Link>
        </GlassCard>

        {/* Verification */}
        <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Verification</h3>
            <Shield className="h-5 w-5 text-[#f59e0b]" />
          </div>
          <div className="mb-3">
            <StatusBadge status={verificationStatus} />
          </div>
          {verificationStatus === 'pending_review' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <span className="text-xs text-text-tertiary">Awaiting review</span>
              </div>
            </div>
          )}
          {verificationStatus === 'approved' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="text-xs text-text-tertiary">Verified professional</span>
              </div>
            </div>
          )}
          {verificationStatus === 'rejected' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                <span className="text-xs text-text-tertiary">Verification rejected</span>
              </div>
            </div>
          )}
          {!['pending_review', 'approved', 'rejected'].includes(verificationStatus) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
                <span className="text-xs text-text-tertiary">Not submitted</span>
              </div>
            </div>
          )}
        </GlassCard>

        {/* TradTrust */}
        <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">TradTrust</h3>
            <Star className="h-5 w-5 text-[#f59e0b]" />
          </div>
          {trustScore != null && trustScore > 0 ? (
            <>
              <p className="text-2xl font-bold text-[#f59e0b]">{trustScore}</p>
              <p className="text-xs text-text-tertiary">Trust Score</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-text-tertiary">--</p>
              <p className="text-xs text-text-tertiary">Score will appear after verification</p>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-text-tertiary">Tips to improve your score:</p>
                <ul className="list-inside list-disc text-[10px] text-text-tertiary">
                  <li>Complete your profile</li>
                  <li>Get verified</li>
                  <li>Collect reviews</li>
                </ul>
              </div>
            </>
          )}
        </GlassCard>
      </div>

      {/* Row 3: Analytics + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Analytics */}
        <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Analytics Overview</h3>
            {dashLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-text-tertiary" />}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {ANALYTICS_CONFIG.map(({ label, key, icon: Icon }) => (
              <div key={key} className="rounded-xl bg-surface p-4">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-text-tertiary" />
                  <span className="text-xs text-text-tertiary">{label}</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-text-primary">
                  {dashLoading ? '...' : (dashboard?.[key] ?? 0)}
                </p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Quick Actions */}
        <GlassCard className="hover:shadow-[0_0_30px_-5px_rgba(245, 158, 11, 0.15)]">
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 rounded-xl bg-surface p-4 text-center transition-all hover:bg-surface-secondary"
              >
                <Icon className="h-5 w-5 text-[#f59e0b]" />
                <span className="text-xs font-medium text-text-secondary">{label}</span>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Row 4: AI Intelligence */}
      <AiDashboardWidgets />
    </div>
  );
}
