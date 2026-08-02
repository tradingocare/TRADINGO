'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Wand2, FileText, BarChart3, Trophy, Award, Lightbulb, TrendingUp, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAiDashboardWidgets, useAiMarketplaceSuggestions, useAiGrowthSuggestions, useAiFounderInsights, useAiTradTrustSuggestions, useAiGocashRewards, useAiMembershipBenefits } from '@/hooks/use-tradeserv-ai';

const tabs = [
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'suggestions', label: 'Suggestions', icon: Wand2 },
  { id: 'trust', label: 'Trust', icon: Award },
  { id: 'rewards', label: 'Rewards', icon: Trophy },
];

export function AiTradeservCopilot() {
  const [activeTab, setActiveTab] = useState('insights');
  const [isOpen, setIsOpen] = useState(false);

  const { data: widgets, isLoading: widgetsLoading } = useAiDashboardWidgets();
  const { data: marketplace, isLoading: marketplaceLoading } = useAiMarketplaceSuggestions();
  const { data: growth, isLoading: growthLoading } = useAiGrowthSuggestions();
  const { data: insights, isLoading: insightsLoading } = useAiFounderInsights();
  const { data: trust, isLoading: trustLoading } = useAiTradTrustSuggestions();
  const { data: rewards, isLoading: rewardsLoading } = useAiGocashRewards();
  const { data: membership, isLoading: membershipLoading } = useAiMembershipBenefits();

  const loading = widgetsLoading || marketplaceLoading || growthLoading || insightsLoading || trustLoading || rewardsLoading || membershipLoading;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300',
          'bg-gradient-to-br from-accent-500 to-orange-600 text-white hover:scale-105 hover:shadow-xl',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base',
        )}
        aria-label="Toggle AI TradeServ Copilot"
      >
        <Sparkles className={cn('h-6 w-6 transition-transform', isOpen && 'rotate-45')} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 rounded-2xl border border-border bg-surface shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-500" />
              <span className="text-sm font-semibold text-text-primary">AI Copilot</span>
            </div>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-text-tertiary" />}
          </div>

          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  activeTab === tab.id ? 'text-accent-500 border-b-2 border-accent-500' : 'text-text-tertiary hover:text-text-secondary',
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-96 overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-text-tertiary" />
              </div>
            )}

            {!loading && activeTab === 'insights' && renderInsightsTab(insights, widgets, membership)}
            {!loading && activeTab === 'suggestions' && renderSuggestionsTab(marketplace, growth)}
            {!loading && activeTab === 'trust' && renderTrustTab(trust)}
            {!loading && activeTab === 'rewards' && renderRewardsTab(rewards)}
          </div>
        </div>
      )}
    </>
  );
}

function StatPill({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className="text-sm font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function renderInsightsTab(insights: any, widgets: any, membership: any) {
  const widgetsData = widgets?.data;
  const insightsData = insights?.data as Array<{ insight: string; type: string }> | undefined;

  return (
    <div className="space-y-3">
      {widgetsData && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Your Profile</h4>
          <StatPill label="Profile Complete" value={widgetsData.profileCompletion ? `${widgetsData.profileCompletion}%` : null} />
          <StatPill label="Trust Grade" value={widgetsData.trustGrade} />
          <StatPill label="Services" value={widgetsData.servicesCount} />
          <StatPill label="Portfolio" value={widgetsData.portfolioCount} />
          <StatPill label="Certifications" value={widgetsData.certificationsCount} />
        </div>
      )}

      {membership?.data && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Membership</h4>
          <StatPill label="Plan" value={membership.data.plan} />
          <div className="flex flex-wrap gap-1.5">
            {(membership.data.benefits ?? []).filter((b: any) => b.available).map((b: any, i: number) => (
              <span key={i} className="rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] font-medium text-accent-500">
                {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {insightsData && insightsData.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Founder Insights</h4>
          {insightsData.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-secondary/50 px-3 py-2">
              <div className="flex items-start gap-2">
                {item.type === 'trust' ? <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-500" /> :
                 <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />}
                <p className="text-xs text-text-secondary">{item.insight}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderSuggestionsTab(marketplace: any, growth: any) {
  const marketplaceData = marketplace?.data as string[] | undefined;
  const growthData = growth?.data as Array<{ area: string; suggestion: string; impact: string }> | undefined;

  return (
    <div className="space-y-3">
      {marketplaceData && marketplaceData.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Quick Wins</h4>
          {(marketplaceData as string[]).map((item, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-surface-secondary/50 px-3 py-2">
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-500" />
              <p className="text-xs text-text-secondary">{item}</p>
            </div>
          ))}
        </div>
      )}

      {growthData && growthData.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Growth Opportunities</h4>
          {growthData.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-secondary/50 p-3">
              <p className="text-xs font-medium text-text-primary">{item.area}</p>
              <p className="mt-1 text-[11px] text-text-secondary">{item.suggestion}</p>
              <p className="mt-1 text-[10px] text-emerald-500">{item.impact}</p>
            </div>
          ))}
        </div>
      )}

      {(!marketplaceData || marketplaceData.length === 0) && (!growthData || growthData.length === 0) && (
        <p className="text-center text-xs text-text-tertiary py-4">No suggestions yet. Complete your profile to get personalized recommendations.</p>
      )}
    </div>
  );
}

function renderTrustTab(trust: any) {
  const data = trust?.data as { score: number | null; grade?: string; riskLevel?: string; suggestions: Array<{ factor: string; score: number; tip: string }> } | undefined;

  return (
    <div className="space-y-3">
      {data?.score !== null && data?.score !== undefined ? (
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-full bg-accent-500/10 px-4 py-2">
            <span className="text-2xl font-bold text-accent-500">{data.score}</span>
            {data.grade && <span className="ml-2 text-sm font-medium text-text-tertiary">{data.grade}</span>}
          </div>
          {data.riskLevel && <p className="mt-1 text-[11px] text-text-tertiary">Risk: {data.riskLevel}</p>}
        </div>
      ) : (
        <p className="text-center text-xs text-text-tertiary py-2">No TradTrust score yet</p>
      )}

      {data?.suggestions && data.suggestions.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Improvement Tips</h4>
          {data.suggestions.map((item, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface-secondary/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-primary capitalize">{item.factor.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-xs font-semibold text-accent-500">{item.score}/100</span>
              </div>
              <p className="mt-1 text-[11px] text-text-secondary">{item.tip}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function renderRewardsTab(rewards: any) {
  const data = rewards?.data as { balance: any; available: any; kycVerified: boolean; isActive: boolean; earningOpportunities: Array<{ action: string; reward: string }> } | undefined;

  return (
    <div className="space-y-3">
      {data ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-surface-secondary p-3 text-center">
              <p className="text-xs text-text-tertiary">Balance</p>
              <p className="text-lg font-bold text-text-primary">₹{Number(data.balance ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-surface-secondary p-3 text-center">
              <p className="text-xs text-text-tertiary">Available</p>
              <p className="text-lg font-bold text-emerald-500">₹{Number(data.available ?? 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', data.kycVerified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500')}>
              KYC {data.kycVerified ? 'Verified' : 'Pending'}
            </span>
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', data.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500')}>
              {data.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {data.earningOpportunities && data.earningOpportunities.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Earn More</h4>
              {data.earningOpportunities.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-surface-secondary/50 px-3 py-2">
                  <span className="text-xs text-text-secondary">{item.action}</span>
                  <span className="text-xs font-semibold text-emerald-500">{item.reward}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-xs text-text-tertiary py-4">Create a GOCASH wallet to start earning rewards</p>
      )}
    </div>
  );
}
