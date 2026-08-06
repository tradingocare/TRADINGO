'use client';

import { useState } from 'react';
import {
  useCommunityDashboardCopilot, useNetworkingAdvisor, useCommunityIntelligence,
  useKnowledgeDiscovery, useCollaborationAdvisor, useCommunityReputation,
} from '@/hooks/use-community-agent';
import {
  LayoutDashboard, Users, BarChart3, BookOpen, Handshake, Shield,
  Sparkles, AlertTriangle, ArrowRight, MessageCircle, TrendingUp, Store,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import Link from 'next/link';

type Tab = 'dashboard' | 'networking' | 'intelligence' | 'knowledge' | 'collaboration' | 'reputation';

const TABS: { key: Tab; label: string; icon: React.ElementType; desc: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & alerts' },
  { key: 'networking', label: 'Networking', icon: Users, desc: 'Connections & experts' },
  { key: 'intelligence', label: 'Intelligence', icon: BarChart3, desc: 'Community analytics' },
  { key: 'knowledge', label: 'Knowledge', icon: BookOpen, desc: 'Discussions & insights' },
  { key: 'collaboration', label: 'Collaboration', icon: Handshake, desc: 'Partnership opportunities' },
  { key: 'reputation', label: 'Reputation', icon: Shield, desc: 'Community standing' },
];

export default function CommunityAgentPage() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Community Agent</h1>
          <p className="mt-1 text-sm text-text-secondary">Intelligent community networking and collaboration advisor</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-tertiary">
          <Sparkles className="h-4 w-4 text-accent" />
          Powered by TradeAI
        </div>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />

      <div className="rounded-xl border border-border bg-surface p-6">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'networking' && <NetworkingTab />}
        {activeTab === 'intelligence' && <IntelligenceTab />}
        {activeTab === 'knowledge' && <KnowledgeTab />}
        {activeTab === 'collaboration' && <CollaborationTab />}
        {activeTab === 'reputation' && <ReputationTab />}
      </div>
    </div>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: typeof TABS; active: string; onChange: (k: Tab) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-secondary p-1">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <button key={tab.key} onClick={() => onChange(tab.key)} className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${isActive ? 'bg-accent text-btn-primary-text shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-surface'}`}>
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-1/3 rounded bg-border" />
          <div className="h-3 w-full rounded bg-border" />
          <div className="h-3 w-2/3 rounded bg-border" />
        </div>
      ))}
    </div>
  );
}

function DashboardTab() {
  const { data, isLoading, error } = useCommunityDashboardCopilot();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load community dashboard" />;
  if (!data) return <EmptyState title="No community data available" />;

  return (
    <div className="space-y-8">
      {data.metrics && Object.keys(data.metrics).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(data.metrics).map(([key, val]) => (
            <div key={key} className="rounded-lg border border-border bg-surface-secondary p-4">
              <p className="text-xs text-text-tertiary uppercase">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="mt-1 text-2xl font-bold text-text-primary">{String(val)}</p>
            </div>
          ))}
        </div>
      )}

      {data.todaysDiscussions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Today's Discussions</h3>
          <div className="space-y-2">
            {data.todaysDiscussions.map((d, i) => (
              <div key={i} className="flex items-start justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{d.title}</p>
                  <p className="text-xs text-text-tertiary mt-1">{d.communityName} · {d.replyCount} replies</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendedCommunities.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Recommended Communities</h3>
          <div className="space-y-2">
            {data.recommendedCommunities.map((c) => (
              <Link key={c.id} href={`/tradetalk/communities/${c.slug}`} className="flex items-start justify-between rounded-lg border border-border bg-surface-secondary p-3 hover:bg-surface transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{c.name}</p>
                  <p className="text-xs text-text-tertiary mt-1">{c.matchReason} · {c.memberCount} members</p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-tertiary shrink-0 ml-3" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.alerts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Alerts</h3>
          {data.alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 text-sm ${a.impact === 'high' ? 'text-status-error' : a.impact === 'medium' ? 'text-status-warning' : 'text-text-secondary'}`}>
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{a.description || a.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NetworkingTab() {
  const { data, isLoading, error } = useNetworkingAdvisor();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load networking advisor" />;
  if (!data) return <EmptyState title="No networking data available" />;

  return (
    <div className="space-y-8">
      {data.recommendedBusinesses.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Recommended Businesses</h3>
          <div className="space-y-2">
            {data.recommendedBusinesses.map((b) => (
              <Link key={b.companyId} href={`/company/${b.slug}`} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3 hover:bg-surface transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">{b.name}</p>
                  <p className="text-xs text-text-tertiary">{b.industry} · {b.location} · Trust: {b.trustScore}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{b.reason}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-tertiary shrink-0 ml-3" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.recommendedProfessionals.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Recommended Professionals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recommendedProfessionals.map((p) => (
              <Link key={p.companyId} href={`/tradeserv/professionals/${p.slug}`} className="rounded-lg border border-border bg-surface-secondary p-3 hover:bg-surface transition-colors">
                <p className="text-sm font-medium text-text-primary">{p.name}</p>
                <p className="text-xs text-text-tertiary">{p.professionalType} · Trust: {p.trustScore}</p>
                <p className="text-xs text-text-tertiary mt-1">{p.reason}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.industryExperts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Industry Experts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.industryExperts.map((e, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-3">
                <p className="text-sm font-medium text-text-primary">{e.name}</p>
                <p className="text-xs text-text-tertiary">Leads {e.communitiesLed} communities · Expertise: {e.expertise.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function IntelligenceTab() {
  const { data, isLoading, error } = useCommunityIntelligence();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load community intelligence" />;
  if (!data) return <EmptyState title="No intelligence data available" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Communities</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{data.totalCommunities}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Total Members</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{data.totalMembers}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Engagement Rate</p>
          <p className="mt-1 text-2xl font-bold text-accent">{data.engagementRate}%</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Active Member Rate</p>
          <p className="mt-1 text-2xl font-bold text-accent">{data.activeMemberRate}%</p>
        </div>
      </div>

      {data.topIndustries.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Top Industries</h3>
          <div className="space-y-2">
            {data.topIndustries.map((ind, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex items-center gap-3">
                  <Store className="h-4 w-4 text-text-tertiary" />
                  <span className="text-sm text-text-primary">{ind.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-text-tertiary">
                  <span>{ind.communityCount} communities</span>
                  <span>{ind.memberCount} members</span>
                  <span className={ind.growth >= 0 ? 'text-status-success' : 'text-status-error'}>{ind.growth >= 0 ? '+' : ''}{ind.growth}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendations.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Recommendations</h3>
          <div className="space-y-2">
            {data.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-primary">
                <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KnowledgeTab() {
  const { data, isLoading, error } = useKnowledgeDiscovery();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load knowledge discovery" />;
  if (!data) return <EmptyState title="No knowledge data available" />;

  return (
    <div className="space-y-8">
      {data.trendingDiscussions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Trending Discussions</h3>
          <div className="space-y-2">
            {data.trendingDiscussions.map((d, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{d.title}</p>
                    <p className="text-xs text-text-tertiary">{d.communityName} · by {d.authorName} · {d.replyCount} replies</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.industryUpdates.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Industry Updates</h3>
          <div className="space-y-2">
            {data.industryUpdates.map((u, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface-secondary p-3">
                <div className="flex items-start gap-2">
                  <TrendingUp className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{u.title}</p>
                    <p className="text-xs text-text-tertiary">{u.industry} · Relevance: {u.relevanceScore}%</p>
                    <p className="text-xs text-text-tertiary mt-1">{u.summary}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.recommendedExperts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Recommended Experts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.recommendedExperts.map((e) => (
              <Link key={e.companyId} href={`/tradeserv/professionals/${e.slug}`} className="rounded-lg border border-border bg-surface-secondary p-3 hover:bg-surface transition-colors">
                <p className="text-sm font-medium text-text-primary">{e.name}</p>
                <p className="text-xs text-text-tertiary">{e.professionalType} · {e.serviceCount} services · Trust: {e.trustScore}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CollaborationTab() {
  const { data, isLoading, error } = useCollaborationAdvisor();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load collaboration advisor" />;
  if (!data) return <EmptyState title="No collaboration data available" />;

  return (
    <div className="space-y-8">
      {data.potentialPartnerships.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Potential Partnerships</h3>
          <div className="space-y-2">
            {data.potentialPartnerships.map((p) => (
              <Link key={p.companyId} href={`/company/${p.companyId}`} className="flex items-start justify-between rounded-lg border border-border bg-surface-secondary p-3 hover:bg-surface transition-colors">
                <div>
                  <p className="text-sm font-medium text-text-primary">{p.name}</p>
                  <p className="text-xs text-text-tertiary">{p.industry} · Trust: {p.trustScore} · {p.opportunity}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-text-tertiary shrink-0 ml-3" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.marketplaceOpportunities.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Marketplace Opportunities</h3>
          <div className="space-y-2">
            {data.marketplaceOpportunities.map((o, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3">
                <div>
                  <p className="text-sm text-text-primary">{o.category}</p>
                  <p className="text-xs text-text-tertiary">Demand: {o.demandLevel} · {o.professionalCount} professionals</p>
                </div>
                <span className="text-sm font-medium text-accent">Score: {o.potentialScore}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReputationTab() {
  const { data, isLoading, error } = useCommunityReputation();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState title="Error" message="Failed to load reputation data" />;
  if (!data) return <EmptyState title="No reputation data available" />;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Overall Grade</p>
          <p className="mt-1 text-3xl font-bold text-accent">{data.overallGrade}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Participation</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{data.participationScore}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Credibility</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{data.credibilityScore}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-secondary p-4">
          <p className="text-xs text-text-tertiary">Leadership</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{data.leadershipScore}</p>
        </div>
      </div>

      {data.breakdown.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Score Breakdown</h3>
          <div className="space-y-3">
            {data.breakdown.map((b, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-primary">{b.factor}</span>
                  <span className="text-text-secondary">{b.score}/{b.maxScore}</span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(b.score / b.maxScore) * 100}%` }} />
                </div>
                <p className="text-xs text-text-tertiary">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.improvements.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-text-primary mb-3">Improvement Suggestions</h3>
          <div className="space-y-2">
            {data.improvements.map((imp, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-text-primary">
                <Sparkles className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
