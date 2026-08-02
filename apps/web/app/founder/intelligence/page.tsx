'use client';

import { useState } from 'react';
import { useEnterpriseIntelligence, useDigitalTwin, useHealthIndex, useBusinessConfidence, useSupplyDemand, useCategoryMomentum, useRegionalHeatmap, useGrowthVelocity, useTrustDistribution, usePredictions, useOpportunities, useRisks, useRecommendations, useEnterpriseAnalytics } from '@/hooks/use-enterprise-intelligence';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const TABS = [
  'Marketplace', 'Finance', 'Growth', 'Risk', 'Predictions',
  'Digital Twin', 'AI', 'TradeServ', 'TradeTalk',
] as const;
type Tab = typeof TABS[number];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-4 bg-surface border-border">
      <p className="text-text-tertiary text-xs uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-text-primary mt-1">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      {sub && <p className="text-text-tertiary text-xs mt-1">{sub}</p>}
    </Card>
  );
}

function HealthGauge({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-text-secondary">{label}</span>
          <span className="text-text-primary font-semibold">{score}</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const colors: Record<string, string> = { A: 'bg-emerald-500/20 text-emerald-400', 'B': 'bg-blue-500/20 text-blue-400', 'C': 'bg-amber-500/20 text-amber-400', 'D': 'bg-red-500/20 text-red-400' };
  return <span className={`px-2 py-0.5 rounded text-xs font-bold ${colors[grade] || 'bg-gray-500/20 text-gray-400'}`}>{grade}</span>;
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = { critical: 'bg-red-500/20 text-red-400', high: 'bg-orange-500/20 text-orange-400', medium: 'bg-amber-500/20 text-amber-400', low: 'bg-blue-500/20 text-blue-400' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[severity] || 'bg-gray-500/20 text-gray-400'}`}>{severity}</span>;
}

export default function FounderIntelligencePage() {
  const [tab, setTab] = useState<Tab>('Marketplace');
  const { data: full, isLoading: fullLoading, error: fullError } = useEnterpriseIntelligence();

  if (fullLoading) {
    return (
      <div className="min-h-screen bg-bg-base p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-text-primary mb-6">Enterprise Commerce Intelligence</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-24 bg-surface rounded-lg border-border" />)}
          </div>
        </div>
      </div>
    );
  }

  if (fullError || !full) {
    return (
      <div className="min-h-screen bg-bg-base p-6 flex items-center justify-center">
        <Card className="p-8 bg-surface border-border text-center max-w-md">
          <p className="text-text-primary text-lg mb-2">Unable to load intelligence data</p>
          <p className="text-text-tertiary text-sm mb-4">{(fullError as any)?.message || 'The intelligence engine could not be reached'}</p>
          <Button onClick={() => window.location.reload()} className="bg-accent text-btn-primary-text">Retry</Button>
        </Card>
      </div>
    );
  }

  const dt = full.digitalTwin;
  const hi = full.healthIndex;
  const bc = full.businessConfidence;
  const sd = full.supplyDemand;
  const cm = full.categoryMomentum;
  const rh = full.regionalHeatmap;
  const gv = full.growthVelocity;
  const td = full.trustDistribution;
  const pred = full.predictions;
  const opp = full.opportunities;
  const ri = full.risks;
  const rec = full.recommendations;
  const ea = full.analytics;

  return (
    <div className="min-h-screen bg-bg-base p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Enterprise Commerce Intelligence</h1>
            <p className="text-text-tertiary text-sm">Digital Twin · Live Intelligence · Autonomous Insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-border text-text-secondary text-xs">{dt.timestamp ? new Date(dt.timestamp).toLocaleString() : ''}</Badge>
            <span className={`px-2 py-1 rounded text-xs font-bold ${dt.health.systemStatus === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {dt.health.systemStatus}
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-lg whitespace-nowrap transition-colors ${tab === t ? 'bg-accent text-btn-primary-text' : 'bg-surface text-text-secondary hover:text-text-primary border border-border'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {tab === 'Marketplace' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <StatCard label="Total Buyers" value={dt.marketplace.totalBuyers} />
                <StatCard label="Total Sellers" value={dt.marketplace.totalSellers} />
                <StatCard label="Active Products" value={dt.marketplace.activeProducts} />
                <StatCard label="Total Orders" value={dt.marketplace.totalOrders} />
                <StatCard label="Total Revenue" value={`₹${(dt.marketplace.totalRevenue / 100).toLocaleString()}`} sub="All Time" />
                <StatCard label="GMV" value={`₹${(dt.marketplace.gmv / 100).toLocaleString()}`} />
              </div>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Marketplace Health Index</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-text-primary">{hi.overall}<span className="text-lg text-text-tertiary">/100</span></div>
                  <GradeBadge grade={hi.grade} />
                  <span className="text-text-tertiary text-sm capitalize">{hi.trend}</span>
                </div>
                <div className="space-y-3">
                  {hi.dimensions.map(d => <HealthGauge key={d.name} score={d.score} label={d.name} />)}
                </div>
                {hi.recommendations.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-amber-400 text-sm font-medium mb-1">Recommendations</p>
                    {hi.recommendations.map((r, i) => <p key={i} className="text-text-tertiary text-xs">• {r}</p>)}
                  </div>
                )}
              </Card>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Business Confidence</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-text-primary">{bc.overall}<span className="text-lg text-text-tertiary">/100</span></div>
                  <GradeBadge grade={bc.grade} />
                </div>
                <p className="text-text-tertiary text-sm mb-3">{bc.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bc.factors.map(f => (
                    <div key={f.name} className="flex justify-between p-2 bg-bg-base rounded border border-border">
                      <span className="text-text-secondary text-sm">{f.name}</span>
                      <span className="text-text-primary font-semibold text-sm">{f.score}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-surface border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Supply-Demand Balance</h3>
                  <p className="text-text-tertiary text-sm mb-3 capitalize">Market: {sd.overall}</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sd.categories.slice(0, 10).map(c => (
                      <div key={c.name} className="flex items-center justify-between p-2 bg-bg-base rounded border border-border">
                        <span className="text-text-secondary text-sm">{c.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-border rounded overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded" style={{ width: `${c.supplyScore}%` }} />
                          </div>
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${c.imbalance === 'undersupplied' ? 'bg-red-500/20 text-red-400' : c.imbalance === 'oversupplied' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {c.imbalance}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-6 bg-surface border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Category Momentum</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cm.categories.slice(0, 10).map(c => (
                      <div key={c.name} className="flex items-center justify-between p-2 bg-bg-base rounded border border-border">
                        <span className="text-text-secondary text-sm">{c.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-border rounded overflow-hidden">
                            <div className={`h-full rounded ${c.trend === 'rising' ? 'bg-emerald-500' : c.trend === 'declining' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${c.momentum}%` }} />
                          </div>
                          <span className={`text-xs ${c.trend === 'rising' ? 'text-emerald-400' : c.trend === 'declining' ? 'text-red-400' : 'text-amber-400'}`}>{c.growthRate > 0 ? '+' : ''}{c.growthRate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === 'Finance' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Total Revenue (30d)" value={`₹${(dt.growth.revenueGrowth30d / 100).toLocaleString()}`} />
                <StatCard label="Credit Utilization" value={`${ea.finance.creditUtilization.toFixed(1)}%`} />
                <StatCard label="Outstanding Credit" value={`₹${(ea.finance.totalOutstanding / 100).toLocaleString()}`} />
              </div>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue Forecast</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-bg-base rounded border border-border">
                    <p className="text-text-tertiary text-xs uppercase">Current (30d)</p>
                    <p className="text-xl font-bold text-text-primary">₹{(pred.revenue.current / 100).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-bg-base rounded border border-border">
                    <p className="text-text-tertiary text-xs uppercase">Forecasted</p>
                    <p className="text-xl font-bold text-accent">₹{(pred.revenue.forecasted / 100).toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-bg-base rounded border border-border">
                    <p className="text-text-tertiary text-xs uppercase">Growth</p>
                    <p className="text-xl font-bold text-emerald-400">+{pred.revenue.growthRate}%</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Trust Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <StatCard label="Avg Trust Score" value={td.averageScore} />
                  <StatCard label="Pending Verifications" value={td.verificationFunnel.pending} />
                  <StatCard label="Verified" value={td.verificationFunnel.verified} />
                  <StatCard label="Rejected" value={td.verificationFunnel.rejected} />
                </div>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(td.gradeDistribution).map(([grade, count]) => (
                    <div key={grade} className="flex items-center gap-2 bg-bg-base px-3 py-1.5 rounded border border-border">
                      <GradeBadge grade={grade} />
                      <span className="text-text-primary text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {tab === 'Growth' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard label="New Users (30d)" value={dt.growth.userGrowth30d} />
                <StatCard label="New Companies (30d)" value={dt.growth.companyGrowth30d} />
                <StatCard label="New Orders (30d)" value={dt.growth.orderGrowth30d} />
                <StatCard label="New Products (30d)" value={dt.growth.productGrowth30d} />
                <StatCard label="Revenue (30d)" value={`₹${(dt.growth.revenueGrowth30d / 100).toLocaleString()}`} />
              </div>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Growth Velocity</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl font-bold text-text-primary">{gv.overall}<span className="text-lg text-text-tertiary">%</span></div>
                </div>
                <div className="space-y-3">
                  {gv.dimensions.map(d => (
                    <div key={d.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-text-secondary">{d.name}</span>
                        <span className={`font-semibold ${d.trend === 'growing' ? 'text-emerald-400' : 'text-red-400'}`}>{d.growthRate > 0 ? '+' : ''}{d.growthRate}%</span>
                      </div>
                      <div className="h-2 bg-border rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${d.trend === 'growing' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.abs(d.growthRate))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-surface border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Regional Trade Heatmap</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {rh.regions.map(r => (
                      <div key={`${r.name}-${r.state}`} className="flex justify-between p-2 bg-bg-base rounded border border-border">
                        <div>
                          <span className="text-text-secondary text-sm">{r.name}</span>
                          <span className="text-text-tertiary text-xs ml-2">{r.state}</span>
                        </div>
                        <span className="text-text-primary text-sm font-medium">{r.tradeVolume} orders</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className="p-6 bg-surface border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Opportunities</h3>
                  <p className="text-text-tertiary text-sm mb-3">{opp.totalOpportunities} opportunities identified</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {[...opp.emergingIndustries, ...opp.supplyShortages, ...opp.highGrowthRegions, ...opp.crossSelling].slice(0, 8).map(o => (
                      <div key={o.id} className="p-2 bg-bg-base rounded border border-border">
                        <div className="flex justify-between items-start">
                          <p className="text-text-primary text-sm font-medium">{o.title}</p>
                          <span className="text-xs text-text-tertiary">{o.category}</span>
                        </div>
                        <p className="text-text-tertiary text-xs mt-1">{o.description}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs text-accent">{o.confidence}% confidence</span>
                          <span className="text-xs text-text-tertiary">{o.effort} · {o.timeframe}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          )}

          {tab === 'Risk' && (
            <>
              <div className="flex items-center gap-4 mb-4">
                <div className={`text-2xl font-bold ${ri.overallHealth === 'healthy' ? 'text-emerald-400' : ri.overallHealth === 'degraded' ? 'text-amber-400' : 'text-red-400'}`}>
                  {ri.overallHealth.toUpperCase()}
                </div>
                <StatCard label="Total Risks" value={ri.totalRisks} />
                <StatCard label="Critical" value={ri.criticalCount} />
                <StatCard label="High" value={ri.highCount} />
              </div>
              {[...ri.fraudSpikes, ...ri.queueCongestion, ...ri.infrastructureRisks, ...ri.churn, ...ri.marketplaceImbalance].length > 0 ? (
                <Card className="p-6 bg-surface border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Active Risk Signals</h3>
                  <div className="space-y-3">
                    {[...ri.fraudSpikes, ...ri.queueCongestion, ...ri.infrastructureRisks].map(r => (
                      <div key={r.id} className="p-4 bg-bg-base rounded border border-border">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <SeverityBadge severity={r.severity} />
                              <span className="text-text-primary text-sm font-medium">{r.title}</span>
                            </div>
                            <p className="text-text-tertiary text-xs mt-1">{r.description}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs text-text-tertiary">
                          <span>Value: {r.currentValue} / Threshold: {r.threshold}</span>
                          <span>Affected: {r.affectedEntities}</span>
                          <span className={`${r.trend === 'increasing' ? 'text-red-400' : r.trend === 'decreasing' ? 'text-emerald-400' : ''}`}>{r.trend}</span>
                        </div>
                        <p className="text-xs text-accent mt-1">→ {r.recommendedAction}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="p-8 bg-surface border-border text-center">
                  <p className="text-emerald-400 text-lg mb-2">No active risk signals</p>
                  <p className="text-text-tertiary text-sm">Platform is operating within normal parameters</p>
                </Card>
              )}
            </>
          )}

          {tab === 'Predictions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">GMV Forecast</h3>
                <div className="text-3xl font-bold text-text-primary">₹{(pred.gmv.forecasted / 100).toLocaleString()}</div>
                <p className="text-text-tertiary text-sm mt-1">+{pred.gmv.growthRate}% from current</p>
                <p className="text-text-tertiary text-xs mt-1">Confidence: {pred.gmv.confidence}%</p>
              </Card>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Revenue Forecast</h3>
                <div className="text-3xl font-bold text-text-primary">₹{(pred.revenue.forecasted / 100).toLocaleString()}</div>
                <p className="text-text-tertiary text-sm mt-1">+{pred.revenue.growthRate}% from current</p>
                <p className="text-text-tertiary text-xs mt-1">Confidence: {pred.revenue.confidence}%</p>
              </Card>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Membership</h3>
                <div className="text-3xl font-bold text-text-primary">{pred.membership.forecasted}</div>
                <p className="text-text-tertiary text-sm mt-1">{pred.membership.current} → {pred.membership.forecasted}</p>
                <p className="text-text-tertiary text-xs mt-1">Confidence: {pred.membership.confidence}%</p>
              </Card>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Seller Growth</h3>
                <div className="text-3xl font-bold text-text-primary">{pred.sellerGrowth.forecasted}</div>
                <p className="text-text-tertiary text-sm mt-1">+{pred.sellerGrowth.growthRate}% from current</p>
              </Card>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Buyer Growth</h3>
                <div className="text-3xl font-bold text-text-primary">{pred.buyerGrowth.forecasted}</div>
                <p className="text-text-tertiary text-sm mt-1">+{pred.buyerGrowth.growthRate}% from current</p>
              </Card>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">AI Adoption</h3>
                <div className="text-3xl font-bold text-text-primary">{pred.aiAdoption.forecasted}</div>
                <p className="text-text-tertiary text-sm mt-1">{pred.aiAdoption.current} → {pred.aiAdoption.forecasted}</p>
                <p className="text-text-tertiary text-xs mt-1">+{pred.aiAdoption.growthRate}% growth</p>
              </Card>
            </div>
          )}

          {tab === 'Digital Twin' && (
            <div className="grid grid-cols-1 gap-6">
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Ecosystem Snapshot</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 bg-bg-base rounded border border-border">
                    <p className="text-text-tertiary text-xs uppercase">Marketplace</p>
                    <p className="text-text-primary text-sm mt-1">{dt.marketplace.totalBuyers + dt.marketplace.totalSellers} Companies · {dt.marketplace.activeProducts} Products · {dt.marketplace.totalOrders} Orders</p>
                  </div>
                  <div className="p-3 bg-bg-base rounded border border-border">
                    <p className="text-text-tertiary text-xs uppercase">Trust</p>
                    <p className="text-text-primary text-sm mt-1">Avg Score: {dt.trust.averageTrustScore} · {dt.trust.verifiedCompanies} Verified</p>
                  </div>
                  <div className="p-3 bg-bg-base rounded border border-border">
                    <p className="text-text-tertiary text-xs uppercase">Community</p>
                    <p className="text-text-primary text-sm mt-1">{dt.community.totalCommunities} Communities · {dt.community.totalMembers} Members</p>
                  </div>
                  <div className="p-3 bg-bg-base rounded border border-border">
                    <p className="text-text-tertiary text-xs uppercase">AI Platform</p>
                    <p className="text-text-primary text-sm mt-1">{dt.ai.totalRequests} Requests · {dt.ai.successRate}% Success</p>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">System Health</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Queue Depth" value={dt.health.queueDepth} />
                  <StatCard label="Circuit Breakers Open" value={dt.health.openCircuitBreakers} />
                  <StatCard label="AI Latency (avg)" value={`${dt.ai.avgLatencyMs}ms`} />
                  <StatCard label="Health Index" value={`${hi.overall}/100`} />
                </div>
              </Card>
            </div>
          )}

          {tab === 'AI' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="AI Requests (24h)" value={ea.aiRuntime.completedJobs24h} />
                <StatCard label="Failed Jobs (24h)" value={ea.aiRuntime.failedJobs24h} />
                <StatCard label="SLA Breaches (24h)" value={ea.aiRuntime.slaBreaches24h} />
                <StatCard label="Avg Latency" value={`${ea.aiRuntime.avgLatencyMs24h}ms`} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-surface border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">AI Runtime</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-text-secondary">Queue Depth</span><span className="text-text-primary">{ea.aiRuntime.queueDepth}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-text-secondary">Active Workers</span><span className="text-text-primary">{ea.aiRuntime.activeWorkers}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-text-secondary">Circuit Breakers</span><span className="text-text-primary">{ea.aiRuntime.circuitBreakers.closed} closed / {ea.aiRuntime.circuitBreakers.open} open</span></div>
                  </div>
                </Card>
                <Card className="p-6 bg-surface border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Federation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-text-secondary">Total Collaborations</span><span className="text-text-primary">{ea.federation.totalCollaborations}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-text-secondary">Active Collaborations</span><span className="text-text-primary">{ea.federation.activeCollaborations}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-text-secondary">Registered Agents</span><span className="text-text-primary">{ea.federation.agents.length}</span></div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {tab === 'TradeServ' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Professionals" value={dt.tradeserv.totalProfessionals} />
                <StatCard label="Services" value={dt.tradeserv.totalServices} />
                <StatCard label="Bookings" value={dt.tradeserv.totalBookings} />
                <StatCard label="Proposals" value={dt.tradeserv.totalProposals} />
              </div>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Opportunities</h3>
                {opp.tradeservDemand.length > 0 ? (
                  <div className="space-y-2">
                    {opp.tradeservDemand.map(o => (
                      <div key={o.id} className="p-3 bg-bg-base rounded border border-border">
                        <p className="text-text-primary text-sm font-medium">{o.title}</p>
                        <p className="text-text-tertiary text-xs">{o.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-tertiary text-sm">No TradeServ opportunities detected. Professionals will generate demand signals as they engage.</p>
                )}
              </Card>
            </div>
          )}

          {tab === 'TradeTalk' && (
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Communities" value={dt.community.totalCommunities} />
                <StatCard label="Members" value={dt.community.totalMembers} />
                <StatCard label="Community Growth (30d)" value={`+${dt.community.communityGrowth30d}`} />
                <StatCard label="Member Growth (30d)" value={`+${dt.community.memberGrowth30d}`} />
              </div>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Community Opportunities</h3>
                {opp.communityOpportunities.length > 0 ? (
                  <div className="space-y-2">
                    {opp.communityOpportunities.map(o => (
                      <div key={o.id} className="p-3 bg-bg-base rounded border border-border">
                        <p className="text-text-primary text-sm font-medium">{o.title}</p>
                        <p className="text-text-tertiary text-xs">{o.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-tertiary text-sm">Community opportunities will appear as engagement patterns emerge.</p>
                )}
              </Card>
              <Card className="p-6 bg-surface border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Enterprise Analytics Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-text-secondary">Notifications Sent</span><span className="text-text-primary">{ea.notifications.totalSent.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-secondary">Notif Delivery Rate</span><span className="text-text-primary">{ea.notifications.totalSent > 0 ? Math.round((ea.notifications.delivered / ea.notifications.totalSent) * 100) : 0}%</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-secondary">Trust Score (Avg)</span><span className="text-text-primary">{ea.tradtrust.averageScore}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-text-secondary">Scored Companies</span><span className="text-text-primary">{ea.tradtrust.scoredCompanies}</span></div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
