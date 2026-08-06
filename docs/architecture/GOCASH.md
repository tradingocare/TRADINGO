# GOCASH Wallet API Guide

## Overview

GOCASH is TradHexa's digital wallet and rewards platform. It serves as the financial backbone for marketplace incentives, enabling digital transactions, reward distributions, campaign claim processing, referral bonuses, and platform-wide gamification (XP, levels, badges, missions, streaks). All monetary operations follow an append-only ledger model for full auditability.

## Authentication

All GOCASH endpoints require authentication. Admin operations require `ADMIN` or `SUPER_ADMIN` roles.

```
Authorization: Bearer <access_token>
```

## Wallet Operations

### Get Wallet Balance

```typescript
const API = 'https://api.tradhexa.com/api/v1';

// Buyer wallet
async function getBuyerWalletSummary() {
  const res = await fetch(`${API}/wallet/buyer/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    balance: number;
    currency: string;
    lifetimeEarned: number;
    lifetimeSpent: number;
    pendingRewards: number;
    lastTransaction: { type: string; amount: number; date: string };
  };
}

// Seller wallet
async function getSellerWalletSummary() {
  const res = await fetch(`${API}/wallet/seller/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    balance: number;
    currency: string;
    lifetimeEarned: number;
    lifetimeSpent: number;
    analyticsByType: Record<string, { total: number; count: number }>;
  };
}
```

### Transaction History

```typescript
async function getTransactions(params: {
  direction?: 'CREDIT' | 'DEBIT';
  type?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API}/wallet/buyer/transactions?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}
```

Transaction types include: `SIGNUP_BONUS`, `PRODUCT_CREATED`, `PRODUCT_PUBLISHED`, `QUALITY_MILESTONE`, `AI_USED`, `CAMPAIGN_REWARD`, `REFERRAL_REWARD`, `REFERRAL_MILESTONE`, `MISSION_COMPLETED`, `BADGE_EARNED`, `LEVEL_UP`, `DAILY_CHECKIN`, `ORDER_COMPLETED`, `QUOTE_ACCEPTED`, `SERVICE_COMPLETED`, `REDEMPTION`, `ADJUSTMENT`, and more.

### Wallet Statement

```typescript
async function getStatement(params: {
  period: 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate?: string;
  endDate?: string;
}) {
  const query = new URLSearchParams({ period: params.period });
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);

  const res = await fetch(`${API}/wallet/statement?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    openingBalance: number;
    closingBalance: number;
    totalCredits: number;
    totalDebits: number;
    transactions: Array<{
      id: string;
      type: string;
      direction: string;
      amount: number;
      balance: number;
      description: string;
      createdAt: string;
    }>;
  };
}
```

### CSV Export

```typescript
async function exportTransactions(params: {
  startDate?: string;
  endDate?: string;
  type?: string;
}) {
  const query = new URLSearchParams();
  if (params.startDate) query.set('startDate', params.startDate);
  if (params.endDate) query.set('endDate', params.endDate);
  if (params.type) query.set('type', params.type);

  const res = await fetch(`${API}/wallet/export/csv?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await res.json();
  const blob = await res.blob();
  // Save or download the CSV file
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `wallet-transactions-${params.startDate || 'all'}.csv`;
  a.click();
}
```

## Redemption

```typescript
// Request redemption
async function requestRedemption(redemption: {
  amount: number;
  paymentMethod: 'BANK_TRANSFER' | 'UPI' | 'PAYPAL' | 'CRYPTO';
  accountDetails: Record<string, string>;
  notes?: string;
}) {
  const res = await fetch(`${API}/gocash/redeem`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(redemption),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    id: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
    estimatedCompletionDate?: string;
  };
}

// Admin: Approve/reject redemption
async function reviewRedemption(redemptionId: string, action: 'APPROVE' | 'REJECT', reason?: string) {
  const res = await fetch(`${API}/admin/gocash/redemptions/${redemptionId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, reason }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

## Campaign Engine

Campaigns allow companies to create promotional reward campaigns with complex eligibility rules.

### List Active Campaigns

```typescript
async function getActiveCampaigns() {
  const res = await fetch(`${API}/campaigns/active`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    rewardAmount: number;
    budget: { total: number; remaining: number };
    endsAt: string;
    rules: Array<{ field: string; operator: string; value: unknown }>;
  }>;
}
```

### Check Eligibility

```typescript
async function checkCampaignEligibility(campaignId: string) {
  const res = await fetch(
    `${API}/campaigns/${campaignId}/eligibility`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    eligible: boolean;
    reasons?: string[];
    nextAvailableAt?: string;
  };
}
```

### Claim Reward

```typescript
async function claimCampaignReward(campaignId: string) {
  const res = await fetch(`${API}/campaigns/${campaignId}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    transactionId: string;
    amount: number;
    balance: number;
  };
}
```

## Referral Engine

### Create Referral Code

```typescript
async function createReferralCode() {
  const res = await fetch(`${API}/referral/codes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    code: string; // e.g., "TRAD_a1b2c3d4e5"
    rewardAmount: number;
    usageCount: number;
    maxUsage: number;
    isActive: boolean;
  };
}
```

### Apply Referral Code

```typescript
async function applyReferralCode(code: string) {
  const res = await fetch(`${API}/referral/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    rewardAmount: number;
    referrerName: string;
  };
}
```

### Referral Statistics

```typescript
async function getReferralStats() {
  const res = await fetch(`${API}/referral/statistics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    totalReferrals: number;
    successfulConversions: number;
    totalEarned: number;
    pendingRewards: number;
    referralCodes: Array<{
      code: string;
      usageCount: number;
      totalEarned: number;
    }>;
  };
}
```

## Platform Integration Rewards

GOCASH rewards are automatically credited when platform events occur. See the constants below for reward amounts (subject to change):

| Event | Reward |
|-------|--------|
| Membership signup | 200 GOCASH |
| Plan upgrade | 500 GOCASH |
| Order completed | 50 GOCASH |
| Order milestones (10/50/100) | 200/1000/2500 GOCASH |
| RFQ created | 25 GOCASH |
| Quote accepted | 100 GOCASH (both parties) |
| Negotiation completed | 75 GOCASH |
| PO confirmed | 100 GOCASH |
| Shipment delivered | 50 GOCASH |
| Delivery confirmed | 75 GOCASH |

These rewards are automatically processed and require no additional API calls.

## Admin Operations

### Wallet Management

```typescript
// Search wallets
async function searchWallets(params: {
  search?: string;
  status?: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  userId?: string;
  companyId?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API}/admin/wallets?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}

// Freeze/unfreeze wallet
async function toggleWalletFreeze(walletId: string, freeze: boolean) {
  const res = await fetch(`${API}/admin/wallets/${walletId}/${freeze ? 'freeze' : 'unfreeze'}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Manual credit/debit/adjustment
async function manualCredit(walletId: string, payload: {
  amount: number;
  reason: string;
  reference?: string;
}) {
  const res = await fetch(`${API}/admin/wallets/${walletId}/credit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Fraud Monitoring

```typescript
async function getFraudAlerts(params: {
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API}/admin/wallets/fraud-alerts?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}
```

## Ecosystem (XP, Levels, Badges, Missions)

The GOCASH ecosystem extends beyond financial transactions to include gamification elements.

### XP Balance and History

```typescript
async function getXpBalance() {
  const res = await fetch(`${API}/ecosystem/xp/balance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    totalXp: number;
    currentLevel: number;
    levelProgress: number; // percentage to next level
    xpToNextLevel: number;
  };
}

async function getXpHistory(params: { page?: number; limit?: number }) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${API}/ecosystem/xp/history?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}
```

### Daily Check-in

```typescript
async function dailyCheckin() {
  const res = await fetch(`${API}/ecosystem/checkin`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    xpEarned: number;
    gocashEarned: number;
    streakDay: number;
    bonusMultiplier: number;
  };
}

async function getCheckinHistory() {
  const res = await fetch(`${API}/ecosystem/checkin/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function getStreaks() {
  const res = await fetch(`${API}/ecosystem/streaks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    currentStreak: number;
    longestStreak: number;
    lastCheckin: string;
    nextBonus: { day: number; reward: string };
  };
}
```

### Levels

```typescript
async function getLevels() {
  const res = await fetch(`${API}/ecosystem/levels`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as Array<{
    level: number;
    name: string;
    xpRequired: number;
    rewards: Array<{ type: string; amount: number }>;
  }>;
}
```

### Badges

```typescript
async function getBadges() {
  const res = await fetch(`${API}/ecosystem/badges`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as Array<{
    id: string;
    name: string;
    description: string;
    iconUrl: string;
    category: string;
    criteria: string;
  }>;
}

async function getUserBadges() {
  const res = await fetch(`${API}/ecosystem/badges/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as Array<{
    badge: { id: string; name: string; description: string };
    earnedAt: string;
    isFeatured: boolean;
  }>;
}
```

### Missions

```typescript
async function getMissions(category?: string) {
  const query = category ? `?category=${category}` : '';
  const res = await fetch(`${API}/ecosystem/missions${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    xpReward: number;
    gocashReward: number;
    progress: { current: number; target: number };
    isCompleted: boolean;
    expiresAt?: string;
  }>;
}

async function completeMission(missionId: string) {
  const res = await fetch(`${API}/ecosystem/missions/${missionId}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as {
    xpEarned: number;
    gocashEarned: number;
    newBadges?: string[];
    leveledUp?: boolean;
    newLevel?: number;
  };
}
```

### Leaderboard

```typescript
async function getLeaderboard(params: {
  type?: 'xp' | 'gocash' | 'missions';
  period?: 'all_time' | 'monthly' | 'weekly';
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API}/ecosystem/leaderboard?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data as Array<{
    rank: number;
    userId: string;
    companyName: string;
    score: number;
    level: number;
    badgeCount: number;
  }>;
}
```

## Error Handling

```json
{
  "statusCode": 400,
  "message": "Insufficient balance. Available: 150, Required: 500",
  "error": "Bad Request",
  "timestamp": "2026-07-16T10:30:00.000Z",
  "path": "/api/v1/gocash/redeem"
}
```

All GOCASH operations are idempotent. Retrying the same request with the same parameters will not result in duplicate transactions.
