# Founder AI Executive Operating System API Guide

## Overview

Founder AI is the executive operating system for TradHexa platform administrators and founders. It provides AI-powered business intelligence, decision support, and strategic insights by aggregating data across all platform modules. Founder AI is designed to give executive leaders a comprehensive, real-time understanding of platform health, risks, opportunities, and performance.

All endpoints are restricted to `SUPER_ADMIN` and `ADMIN` roles.

## Authentication

```
Authorization: Bearer <access_token>
```

All Founder AI endpoints require admin-level authentication.

## Endpoints

### 1. Morning Brief

Provides a daily executive summary of platform performance, key metrics, and notable events.

```typescript
const API = 'https://api.tradhexa.com/api/v1';

async function getMorningBrief() {
  const res = await fetch(`${API}/admin/founder-ai/morning-brief`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    date: string;
    summary: string;
    keyMetrics: {
      dailyActiveUsers: number;
      newRegistrations: number;
      totalOrders: number;
      revenueToday: number;
      rfqsCreated: number;
      quotesAccepted: number;
    };
    topEvents: Array<{
      type: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      entityId?: string;
    }>;
    alerts: Array<{
      severity: 'critical' | 'warning' | 'info';
      message: string;
      actionable: boolean;
    }>;
    recommendations: string[];
  };
}
```

### 2. Evening Summary

End-of-day performance summary with day-over-day and week-over-week comparisons.

```typescript
async function getEveningSummary() {
  const res = await fetch(`${API}/admin/founder-ai/evening-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    date: string;
    daySummary: string;
    metrics: Record<string, { value: number; change: number; trend: 'up' | 'down' | 'stable' }>;
    topPerformers: Array<{ category: string; metric: string; value: number }>;
    areasOfConcern: Array<{ area: string; description: string; severity: string }>;
    tomorrowOutlook: string;
  };
}
```

### 3. Executive Dashboard

Aggregated view of all platform KPIs with 7-dimension health scoring.

```typescript
async function getExecutiveDashboard() {
  const res = await fetch(`${API}/admin/founder-ai/executive-dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    timestamp: string;
    kpiSummary: {
      gmv: { value: number; growth: number };
      revenue: { value: number; growth: number };
      totalUsers: { value: number; growth: number };
      totalCompanies: { value: number; growth: number };
      activeListings: number;
      pendingDisputes: number;
    };
    healthScore: number; // 0-1000
    riskIndicators: Array<{ category: string; level: string; description: string }>;
    growthOpportunities: Array<{ area: string; potential: string; effort: string }>;
  };
}
```

### 4. Decision Center

Provides data-driven decision recommendations for strategic business questions.

```typescript
async function getDecisionCenter() {
  const res = await fetch(`${API}/admin/founder-ai/decision-center`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    decisions: Array<{
      id: string;
      title: string;
      context: string;
      options: Array<{
        label: string;
        pros: string[];
        cons: string[];
        expectedImpact: string;
        confidence: number;
      }>;
      recommendedAction: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      deadline?: string;
    }>;
    lastUpdated: string;
  };
}
```

### 5. Risk Intelligence

Identifies and assesses risks across the platform.

```typescript
async function getRiskIntelligence() {
  const res = await fetch(`${API}/admin/founder-ai/risk-intelligence`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    overallRiskLevel: 'low' | 'moderate' | 'elevated' | 'critical';
    riskCategories: Array<{
      category: string;
      level: string;
      score: number;
      factors: string[];
      trend: 'improving' | 'worsening' | 'stable';
    }>;
    criticalAlerts: Array<{
      title: string;
      description: string;
      severity: string;
      recommendedAction: string;
      source: string;
    }>;
    lastAssessment: string;
  };
}
```

### 6. Growth Intelligence

Identifies growth opportunities, market trends, and expansion areas.

```typescript
async function getGrowthIntelligence() {
  const res = await fetch(`${API}/admin/founder-ai/growth-intelligence`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    highGrowthCategories: Array<{
      category: string;
      growthRate: number;
      revenue: number;
      topProducts: string[];
    }>;
    geographicOpportunities: Array<{
      region: string;
      potentialScore: number;
      untappedSupply: number;
      untappedDemand: number;
    }>;
    expansionRecommendations: Array<{
      area: string;
      rationale: string;
      estimatedImpact: string;
      confidence: number;
      effort: 'low' | 'medium' | 'high';
    }>;
    marketTrends: Array<{
      trend: string;
      impact: string;
      relevance: string;
    }>;
  };
}
```

### 7. Business Health Score

A comprehensive 7-dimension health score with weighted sub-scores.

```typescript
async function getHealthScore() {
  const res = await fetch(`${API}/admin/founder-ai/health-score`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    overall: number; // 0-1000
    dimensions: {
      financial: { score: number; trend: string; factors: string[] };
      operational: { score: number; trend: string; factors: string[] };
      growth: { score: number; trend: string; factors: string[] };
      satisfaction: { score: number; trend: string; factors: string[] };
      quality: { score: number; trend: string; factors: string[] };
      compliance: { score: number; trend: string; factors: string[] };
      innovation: { score: number; trend: string; factors: string[] };
    };
    recommendations: Array<{
      dimension: string;
      action: string;
      expectedImpact: string;
    }>;
    lastUpdated: string;
  };
}
```

### 8. Executive Priorities

Top 10 ranked strategic priorities based on current platform data.

```typescript
async function getExecutivePriorities() {
  const res = await fetch(`${API}/admin/founder-ai/priorities`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    priorities: Array<{
      rank: number;
      title: string;
      category: string;
      urgency: 'critical' | 'high' | 'medium' | 'low';
      impact: string;
      effort: string;
      recommendation: string;
      rationale: string;
    }>;
    generatedAt: string;
  };
}
```

### 9. Executive Timeline

5-period historical timeline showing platform evolution and milestone tracking.

```typescript
async function getExecutiveTimeline(periods?: number) {
  const query = periods ? `?periods=${periods}` : '';
  const res = await fetch(
    `${API}/admin/founder-ai/timeline${query}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    periods: Array<{
      label: string;
      startDate: string;
      endDate: string;
      metrics: Record<string, { value: number; change: number }>;
      keyEvents: Array<{
        date: string;
        title: string;
        impact: string;
      }>;
      summary: string;
    }>;
  };
}
```

### 10. Executive Reports

Period-over-period executive reports with full analysis.

```typescript
async function getExecutiveReport(type: 'weekly' | 'monthly' | 'quarterly') {
  const res = await fetch(
    `${API}/admin/founder-ai/report/${type}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    type: string;
    period: { start: string; end: string };
    executiveSummary: string;
    sections: Array<{
      title: string;
      content: string;
      metrics: Array<{
        label: string;
        current: number;
        previous: number;
        change: number;
      }>;
      insights: string[];
    }>;
    recommendations: Array<{
      priority: string;
      action: string;
      expectedOutcome: string;
    }>;
    generatedAt: string;
  };
}
```

### Executive Copilot (Aggregated Feed)

A consolidated endpoint that returns the most relevant insights from all intelligence modules:

```typescript
async function getExecutiveCopilot() {
  const res = await fetch(`${API}/admin/founder-ai/executive-copilot`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    brief: string;
    criticalAlerts: Array<{ title: string; severity: string }>;
    strategicPriorities: Array<{ title: string; priority: string }>;
    revenue: { gmv: number; growth: number; orders: number };
    marketplaceHealth: { score: number; keyIndicators: string[] };
    quickDecisions: Array<{ question: string; options: string[] }>;
  };
}
```

## Enterprise Intelligence Extension

In addition to the Founder AI endpoints, the Enterprise Intelligence module provides predictive analytics and optimization:

```typescript
async function getEnterpriseIntelligence() {
  const res = await fetch(`${API}/enterprise-intelligence/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    revenueForecast: Array<{ period: string; predicted: number; lower: number; upper: number }>;
    anomalyDetection: Array<{ metric: string; value: number; expected: number; deviation: number }>;
    complianceStatus: { overall: string; checks: Array<{ area: string; status: string }> };
    supplierIntelligence: { total: number; atRisk: number; topPerformers: string[] };
  };
}
```

## Digital Twin Optimization

The digital twin simulates catalog changes before applying them:

```typescript
async function optimizeCatalog(action: {
  type: 'optimize' | 'split' | 'bundle' | 'reprice' | 'reclassify' | 'delist' | 'promote';
  productIds: string[];
  parameters?: Record<string, unknown>;
}) {
  const res = await fetch(`${API}/enterprise-intelligence/digital-twin/optimize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(action),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    simulationId: string;
    projectedImpact: {
      expectedRevenueChange: number;
      expectedEngagementChange: number;
      confidence: number;
    };
    risks: string[];
    recommendedAction: string;
  };
}
```

## Error Handling

All Founder AI endpoints return the standard error format:

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Requires SUPER_ADMIN or ADMIN role.",
  "error": "Forbidden",
  "timestamp": "2026-07-16T10:30:00.000Z",
  "path": "/api/v1/admin/founder-ai/morning-brief"
}
```

## Rate Limiting

Founder AI endpoints are classified under general API rate limits (100 requests/minute). AI-powered features consume credits from the `ADMIN_INTELLIGENCE` or `FOUNDER_EXECUTIVE` task types. See [RATE_LIMITING.md](RATE_LIMITING.md) and [AI_PLATFORM.md](AI_PLATFORM.md) for details.
