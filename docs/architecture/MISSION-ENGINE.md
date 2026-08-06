# Mission Engine

## Overview
The Mission Engine is a core engagement system within the GOCASH Ecosystem 2.0. It drives platform activity by creating time-bound, action-oriented tasks (missions) that reward users with XP and GOCASH upon completion.

## Architecture

### Data Model
- **EcosystemMission**: Template mission definition (name, description, period, actionType, targetCount, rewards)
- **EcosystemUserMission**: Per-user mission progress (status, progress, targetCount, completion tracking)

### Periods
- **DAILY**: 24-hour missions (e.g., "Check in today", "Submit 1 quote")
- **WEEKLY**: 7-day missions (e.g., "Create 5 RFQs this week")
- **MONTHLY**: 30-day missions (e.g., "Complete 20 orders this month")

### Action Types
| Action | Description | XP | GOCASH |
|--------|-------------|----|--------|
| LOGIN | Daily platform login | 10 | 2 |
| RFQ_CREATED | Create an RFQ | 25 | 5 |
| QUOTE_SUBMITTED | Submit a quote | 30 | 8 |
| AI_USAGE | Use AI features | 15 | 3 |
| ORDER_COMPLETED | Complete an order | 50 | 15 |
| PRODUCT_LISTED | List a product | 20 | 5 |
| REFERRAL_MADE | Refer a new user | 100 | 25 |
| CAMPAIGN_JOINED | Join a campaign | 10 | 2 |
| REVIEW_WRITTEN | Write a review | 15 | 4 |
| PROFILE_COMPLETED | Complete profile | 25 | 5 |
| SOCIAL_SHARE | Share on social media | 5 | 1 |

## Backend Service

### Core Methods (GocashEcosystemService)
- `getOrCreateUserLevel()` — Auto-creates user level entry
- `getDashboard()` — Aggregated dashboard with daily stats
- `recordXpTransaction()` — Append-only XP ledger
- `processLevelUp()` — Auto-level-up with reward processing
- `handleCheckin()` — Daily check-in with streak tracking
- `handleMissionProgress()` — Mission progress on action events
- `handleBadgeEarned()` — Badge achievement processing
- `handleAchievementProgress()` — Multi-stage achievement tracking
- `getLeaderboard()` — Ranked user list by XP

### Event Handlers
All event handlers now use dedicated NotificationType values:
- `handleCheckin` → `NotificationType.DAILY_CHECKIN`
- `handleLevelUp` → `NotificationType.LEVEL_UP`
- `handleBadgeEarned` → `NotificationType.BADGE_EARNED`
- `handleMissionCompleted` → `NotificationType.MISSION_COMPLETED`

### AI Intelligence
- `aiRewardIntelligence()` — 30-day XP analysis
- Generates personalized recommendations based on activity gaps
- Detects: low login frequency, missing RFQs, no quote submissions, unused AI, broken streaks, pending achievements

## Frontend Components

### MissionCard
- Displays mission name, description, progress bar, rewards
- Shows completion status with visual indicators

### MissionCategoryTabs
- Tab switcher for DAILY / WEEKLY / MONTHLY periods
- Client-side state management

### AiSuggestedMissions
- Renders AI recommendations as actionable mission cards
- Color-coded XP/GOCASH badges per suggestion
- Links recommendations to platform actions

### XPProgressCard / XPProgressBar
- Visual progress toward next level
- Animated progress bars with Tailwind CSS

## Business Value
- **Daily active users**: Check-in mechanic drives daily return
- **Feature adoption**: Missions target specific platform actions (AI usage, RFQ creation, etc.)
- **Retention**: Streak system creates loss aversion
- **Revenue**: Order/referral missions drive direct business outcomes
- **Onboarding**: Progressive missions guide new users through platform features
