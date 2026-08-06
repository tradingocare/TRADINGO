# GOCASH Ecosystem 2.0 — Frontend + Platform Integration

## Overview
GOCASH Ecosystem 2.0 transforms Tradingo from a transactional marketplace into a gamified engagement platform. Buyers and sellers earn XP (Experience Points) for completing platform actions, level up through 8 tiers (BRONZE → LEGEND), earn badges and achievements, maintain daily check-in streaks, and redeem rewards — all while driving real business activity.

## Architecture

### Backend
- **Module**: `apps/api/src/modules/gocash-ecosystem/`
- **Core Service**: `GocashEcosystemService` (662 lines, 22+ methods)
- **Controllers**: `EcosystemController` (buyer/seller endpoints), `AdminEcosystemController` (admin management)
- **Prisma Models**: 8+ ecosystem models (EcosystemLevel, EcosystemUserLevel, EcosystemXPTransaction, EcosystemBadge, EcosystemUserBadge, EcosystemMission, EcosystemUserMission, EcosystemAchievement, EcosystemUserAchievement, EcosystemDailyCheckin, EcosystemStreak, EcosystemUserAchievement)

### Frontend
- **API Layer**: `apps/web/lib/api/ecosystem.ts` — 28 typed functions
- **React Query Hooks**: `apps/web/hooks/use-ecosystem.ts` — 17 hooks
- **Components**: 18 reusable components in `apps/web/components/ecosystem/`
- **Pages**: 3 ecosystem pages (`/buyer/ecosystem`, `/seller/ecosystem`, `/admin/ecosystem`)

## Key Features

### 1. XP (Experience Points) System
- Earned through: Check-in, RFQ creation, Quote submission, AI usage, Order completion, Referrals, Campaign participation
- 8-tier level system: BRONZE → SILVER → GOLD → PLATINUM → DIAMOND → TITANIUM → ELITE → LEGEND
- Level-up rewards automatically processed via GOCASH Ledger
- Membership XP multiplier (1x–3x based on plan)

### 2. Daily Check-in & Streaks
- DailyDAILY_CHECKIN streak type
- Streak bonuses for consecutive check-ins
- Check-in state persisted via `EcosystemDailyCheckin` unique constraint

### 3. Missions
- 3 periods: DAILY, WEEKLY, MONTHLY
- Action types: LOGIN, RFQ_CREATED, QUOTE_SUBMITTED, AI_USAGE, ORDER_COMPLETED, PRODUCT_LISTED, REFERRAL_MADE, CAMPAIGN_JOINED, REVIEW_WRITTEN, PROFILE_COMPLETED, SOCIAL_SHARE
- XP + GOCASH rewards on completion
- MissionCategoryTabs for period filtering

### 4. Badges & Achievements
- Badges: earned by completing specific milestones (First Check-in, Streak Master, Level Up, RFQ Creator, etc.)
- Achievements: long-term progress tracking with multi-stage completion
- Categorized badge display with icons and colors

### 5. Leaderboards
- 3 periods: DAILY, WEEKLY, MONTHLY
- Podium (top 3) + Table (ranked list) displays
- XP-based ranking across all users

### 6. AI Intelligence
- `GET /ecosystem/ai-intelligence` — generates personalized recommendations
- Analyzes 30-day XP history for top XP sources
- Detects low activity areas and suggests improvements
- Tracks pending achievements/missions for completion nudges

### 7. Membership Benefits
- Plan-specific benefits displayed via `MembershipBenefitsCard`
- XP multiplier, AI credits, bonus missions, advertising credits, priority support
- Marketplace/TradeServ visibility tiers
- Upgrade CTA linking to pricing page

### 8. Platform Integrations
- Buyer: AI Workspace, Marketplace, RFQs, Orders, Campaigns, Referrals, Analytics, GOCASH Wallet
- Seller: AI Workspace, Products, Advertising, CRM, Quotes, Orders, Campaigns, Referrals, Analytics, Finance, TradeServ, GOCASH Wallet
- Each integration shows potential XP/GOCASH/Business Value

## Notification Integration
14 ecosystem-specific notification types added to `NotificationType` enum:
- `MISSION_COMPLETED` — Mission Complete notification
- `BADGE_EARNED` — New Badge earned
- `LEVEL_UP` — Level up celebration
- `DAILY_CHECKIN` — Daily check-in streak update
- `REWARD_EXPIRING` — Reward about to expire
- `LEADERBOARD_IMPROVED` — Leaderboard rank change
- `CAMPAIGN_STARTED` — New campaign available
- `CAMPAIGN_ENDING` — Campaign ending soon
- `AI_SUGGESTED_MISSION` — AI mission suggestion
- `REFERRAL_REWARD` — Referral reward earned
- `REFERRAL_MILESTONE` — Referral count milestone
- `MEMBERSHIP_UPGRADED` — Plan upgrade notification
- `MEMBERSHIP_EXPIRING` — Plan expiry warning
- `AI_CREDIT_ADDED` — AI credits added to plan

## Dashboard Intelligence
Each role's dashboard shows:
- **Today's XP**: XP earned today
- **Today's Rewards**: Reward count today
- **Today's Mission**: Highest-priority active mission
- **Recommended Action**: AI-driven next best action
- **Business Impact**: Projected level-up timeline

## Files Created/Modified (Phase 18.3)

### New Files
- `apps/web/components/ecosystem/ai-suggested-missions.tsx`
- `apps/web/components/ecosystem/dashboard-ecosystem-widget.tsx`
- `GOCASH-ECOSYSTEM-2.0.md`
- `MISSION-ENGINE.md`
- `ECOSYSTEM-INTEGRATION.md`

### Modified Files
- `prisma/schema.prisma` — Added 14 NotificationType enum values
- `apps/api/src/modules/notification/notification.template.service.ts` — Added 14 ecosystem notification templates
- `apps/api/src/modules/gocash-ecosystem/gocash-ecosystem.service.ts` — Enhanced `getDashboard()` with daily stats, updated event handler notification types
- `apps/web/lib/api/ecosystem.ts` — Extended `EcosystemDashboard` interface
- `apps/web/components/ecosystem/membership-benefits-card.tsx` — Full benefits list (11 items)
- `apps/web/components/ecosystem/platform-integrations-card.tsx` — Extended integration sets
- `apps/web/app/buyer/ecosystem/page.tsx` — Added AI Suggested Missions
- `apps/web/app/seller/ecosystem/page.tsx` — Added AI Suggested Missions
- `apps/web/app/buyer/dashboard/page.tsx` — Enhanced ecosystem widget with daily intelligence
- `apps/web/app/seller/dashboard/page.tsx` — Enhanced ecosystem widget with daily intelligence

## Verification
- prisma validate ✅
- prisma generate ✅
- tsc (api) 0 errors ✅
- tsc (web) 0 errors ✅
- turbo typecheck 6/6 ✅
- next build 247 routes ✅
