# Ecosystem Integration Guide

## Overview
This document details how the GOCASH Ecosystem 2.0 integrates with all platform domains: Membership, Advertising, CRM, Marketplace, Referral, Campaigns, AI, Finance, TradeServ, and Notifications.

## Integration Points

### 1. Membership Integration
**Component**: `MembershipBenefitsCard`
- Displays plan name, XP multiplier, AI credits, bonus missions, advertising credits, priority support, marketplace/tradeserv visibility, referral bonus
- Fetches from `GET /membership/current` via `getCurrentPlan()`
- Plan benefits statically mapped per plan slug
- Upgrade CTA links to `/pricing`

**Data Flow**:
```
MembershipBenefitsCard
  → useAuth() for user context
  → getCurrentPlan() → GET /membership/current
  → Plan slug → PLAN_BENEFITS static map
  → Renders 11 benefit rows
```

### 2. Notification Integration
**Backend**: `GocashEcosystemService` calls `NotificationService.createWithTemplate()` on 4 events:
- Check-in → `NotificationType.DAILY_CHECKIN`
- Level up → `NotificationType.LEVEL_UP`
- Badge earned → `NotificationType.BADGE_EARNED`
- Mission completed → `NotificationType.MISSION_COMPLETED`

**14 Ecosystem Notification Templates** in `FALLBACK_TEMPLATES`:
| Type | Title | Body Template |
|------|-------|--------------|
| MISSION_COMPLETED | Mission Complete | 🎯 Mission "{{missionName}}" completed! +{{xpReward}} XP earned. |
| BADGE_EARNED | New Badge Earned | 🏅 Congratulations! You earned the "{{badgeName}}" badge! |
| LEVEL_UP | Level Up! | 🎉 Level Up! You reached {{newLevel}} — Rewards unlocked! |
| DAILY_CHECKIN | Daily Check-in | ✅ Day {{streakCount}} check-in streak! +{{xpEarned}} XP earned. |
| REWARD_EXPIRING | Reward Expiring Soon | ⏰ Your {{rewardType}} reward of {{amount}} expires in {{days}} days. |
| LEADERBOARD_IMPROVED | Leaderboard Update | 📊 You moved up to #{{rank}} on the {{period}} leaderboard! |
| CAMPAIGN_STARTED | Campaign Started | 📢 "{{campaignName}}" is now live! Participate to earn rewards. |
| CAMPAIGN_ENDING | Campaign Ending Soon | ⏰ "{{campaignName}}" ends in {{days}} days. Complete tasks now! |
| AI_SUGGESTED_MISSION | AI Mission Suggestion | 🤖 {{suggestion}} |
| REFERRAL_REWARD | Referral Reward | 🎁 You earned {{amount}} GOCASH from a successful referral! |
| REFERRAL_MILESTONE | Referral Milestone | 🏆 You reached {{count}} successful referrals! Keep sharing. |
| MEMBERSHIP_UPGRADED | Membership Upgraded | ⭐ Your plan has been upgraded to {{plan}}. Enjoy new benefits! |
| MEMBERSHIP_EXPIRING | Membership Expiring | ⚠️ Your {{plan}} plan expires in {{days}} days. Renew to keep benefits. |
| AI_CREDIT_ADDED | AI Credits Added | 🤖 {{amount}} AI credits have been added to your {{plan}} plan. |

### 3. Dashboard Integration
**Buyer Dashboard** (`/buyer/dashboard`):
- Ecosystem widget: Level, XP, Badges, Check-in button, Today's XP, Today's Rewards, Recommended Action, Business Impact
- Platform Integrations Card: 8 integration links with XP/GOCASH/value badges

**Seller Dashboard** (`/seller/dashboard`):
- Ecosystem widget: Level, XP & Badges, Daily Streak, Today's XP, Today's Rewards, Recommended Action, Business Impact
- Platform Integrations Card: 12 integration links with XP/value badges

**Admin Dashboard** (`/admin/dashboard`):
- Ecosystem stat cards (via existing AI Admin Copilot)

### 4. AI Intelligence Integration
**Component**: `AiSuggestedMissions`
- Receives `AiIntelligence` data from `GET /ecosystem/ai-intelligence`
- Displays top 5 recommendations with XP/GOCASH badges
- Per-recommendation icons based on action type

**Component**: `RewardSummary`
- Shows top XP sources (30 days) with counts and amounts
- Displays AI recommendations with actionable tips

### 5. Platform Integrations Card
**Component**: `PlatformIntegrationsCard`
- Receives `IntegrationLink[]` prop
- Each link shows label, icon, XP badge, GOCASH badge, value badge
- Links navigate to respective platform pages

**Buyer Integrations** (8 links):
AI Workspace, Marketplace, RFQs, Orders, Campaigns, Referrals, Analytics, GOCASH Wallet

**Seller Integrations** (12 links):
AI Workspace, Products, Advertising, CRM, Quotes, Orders, Campaigns, Referrals, Analytics, Finance, TradeServ, GOCASH Wallet

### 6. Event-Driven Rewards (via GocashIntegrationModule)
The `GocashIntegrationModule` at `apps/api/src/modules/gocash-integration/` processes rewards for:
- Membership signup (200 GOCASH)
- Plan upgrade (500 GOCASH)
- Order completed (50 GOCASH)
- RFQ created (25 GOCASH)
- Quote accepted (100 GOCASH — dual party: buyer + seller)
- Negotiation completed (75 GOCASH)
- PO confirmed (100 GOCASH)
- Shipment confirmed (50 GOCASH)
- Delivery confirmed (75 GOCASH)
- Milestone detection (100/1000/2500 GOCASH at 10/50/100 orders)

## Adding a New Integration

1. **Backend**: Add event handler in `GocashEcosystemService` or `GocashIntegrationService`
2. **Notification**: Use appropriate `NotificationType` from the 14 ecosystem types
3. **Frontend API**: Add typed function in `lib/api/ecosystem.ts`
4. **Hook**: Add React Query hook in `hooks/use-ecosystem.ts`
5. **Component**: Create or extend ecosystem component in `components/ecosystem/`
6. **Page**: Add component to relevant ecosystem/dashboard page
7. **Integration Card**: Add `IntegrationLink` entry to `BUYER_INTEGRATIONS` or `SELLER_INTEGRATIONS`

## Verification Checklist
- [ ] prisma validate && prisma generate
- [ ] tsc (api) 0 errors
- [ ] tsc (web) 0 errors
- [ ] turbo typecheck 6/6
- [ ] next build succeeds (247+ routes)
