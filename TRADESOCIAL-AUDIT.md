# TRADESOCIAL — Complete Infrastructure Audit

> Phase D1 | TradeSocial & Business Collaboration | Audit Only
> Generated: 2026-07-19

---

## 1. Executive Summary

This document is the complete audit of the TRADINGO codebase (260+ Prisma models, 92+ API modules, 155 controllers, 1,329 endpoints, 281+ frontend routes) for the purpose of building a **Business Collaboration Platform** (TradeSocial) on top of existing infrastructure.

### Key Finding

**TRADINGO has ZERO social/collaboration features.** The platform is purely transactional — built for B2B commerce (RFQs, quotes, orders, payments, disputes, chat, notifications, communities). There is no social graph, no content posting/feed, no commenting/liking/sharing, no follow/connection mechanism, no social activity stream, no hashtags, and no centralized media management.

However, **the supporting infrastructure is exceptionally mature** — notifications (100+ types, WebSocket, BullMQ), chat/messaging (full conversation system), AI (6 agents, 111 actions, 5 providers), search (OpenSearch with 4 indices), analytics (growth intelligence + ecosystem), and RBAC — all ready to be extended for social features with zero new infrastructure.

---

## 2. TradeTalk Module (The Closest Existing Feature)

### Backend: 15 files, ~1,626 lines

**Location:** `apps/api/src/modules/tradetalk/`

**Files:**
| File | Lines | Purpose |
|------|-------|---------|
| `tradetalk.module.ts` | 16 | Module registration (imports PrismaModule, AiGatewayModule) |
| `tradetalk.controller.ts` | 211 | 30 endpoints under `/tradetalk` |
| `tradetalk-admin.controller.ts` | 60 | 6 admin endpoints under `/admin/tradetalk` |
| `tradetalk.service.ts` | 797 | 29 service methods (27 public, 2 private) |
| `ai-tradetalk.controller.ts` | 65 | 9 AI endpoints under `/tradetalk/ai` |
| `ai-tradetalk.service.ts` | 235 | 12 service methods (10 public + 2 private) |
| 8 DTO files | ~234 | 8 DTOs |

**Total Backend: 41 service methods, 45 endpoints**

### Controllers & Endpoints

**TradeTalkController** (`/tradetalk`, JWT-guarded):
- Categories: list, discover
- Communities: CRUD, discover (featured/trending/recommended/nearby/by-industry), join/leave, members CRUD, invite/accept/reject
- Rooms: CRUD within communities
- Rankings: community rankings
- Members: featured members, community leaders
- Dashboard: user stats

**TradeTalkAdminController** (`/admin/tradetalk`, ADMIN-guarded):
- Categories: full CRUD
- Communities: list all, get insights

**AiTradeTalkController** (`/tradetalk/ai`, JWT-guarded):
- Copilot, summary, suggested communities/members, networking suggestions, discussion ideas, insights, dashboard widgets, notification prep

### Service Methods

**TradeTalkService** (797 lines):
- Categories: listCategories, createCategory, updateCategory, deleteCategory
- Communities: discoverCommunities, getCommunity, createCommunity, updateCommunity, deleteCommunity
- Members: joinCommunity, leaveCommunity, listMembers, updateMemberRole, removeMember, myCommunities
- Invitations: inviteMember, listInvitations, acceptInvitation, rejectInvitation, cancelInvitation
- Discovery: discoverFeatured, discoverTrending, discoverRecommended, discoverNearby, discoverByIndustry
- Rankings & Leaders: getRankings, getFeaturedMembers, getCommunityLeaders
- Rooms: createRoom, updateRoom, deleteRoom, listRooms
- Insights: getCommunityInsights, getDashboardStats
- Private: requireCommunityAccess, getTrendingIndustries

**AiTradeTalkService** (235 lines):
- aiCommunityCopilot, aiCommunitySummary, aiSuggestedCommunities, aiSuggestedMembers, aiNetworkingSuggestions, aiDiscussionIdeas, aiCommunityInsights, aiDashboardWidgets, aiNotificationPrep
- Private: enrichCommunityContext, enrichUserContext
- All use `TaskType.COMMUNITY_ANALYSIS` (auto-seeded prompt, 0.3 temperature, 2048 maxTokens)

### Prisma Models (5 models, 4 enums)

| Model | Fields | Key Relations |
|-------|--------|---------------|
| `CommunityCategory` | id, name (unique), slug (unique), description?, icon?, sortOrder, isActive | communities Community[] |
| `Community` | id, name, slug (unique), description?, longDescription?, logo?, banner?, categoryId?, visibility, joinSetting, ownerId (Restrict), companyId? (SetNull), tags[], memberCount, roomCount, isActive, isFeatured, deletedAt? | members, rooms, invitations |
| `IndustryRoom` | id, communityId (Cascade), name, slug, description?, icon?, industryId?, sortOrder, isActive, memberCount | community, industry? |
| `CommunityMember` | id, communityId (Cascade), userId (Cascade), companyId? (SetNull), role, status, joinedAt, invitedById? (SetNull), lastActiveAt? | community, user, company?, invitedBy? |
| `CommunityInvitation` | id, communityId (Cascade), invitedById (Cascade), email, token (unique), role, status, message?, expiresAt | community, invitedBy |

**Enums:** CommunityVisibility (PUBLIC/PRIVATE/INVITE_ONLY), CommunityJoinSetting (OPEN/APPROVAL_REQUIRED/INVITE_ONLY), CommunityMemberRole (OWNER/ADMIN/MODERATOR/MEMBER), CommunityMemberStatus (ACTIVE/INACTIVE/BANNED/PENDING)

### Frontend — Pages (7 pages, ~1,139 lines)

| Page | Lines | Type | Hooks Used |
|------|-------|------|-------------|
| `/tradetalk` | 466 | Static server | None (fully static marketing) |
| `/tradetalk/communities` | 178 | Client | useCategories, useDiscoverCommunities, useDiscoverFeatured/Trending/Recommended |
| `/tradetalk/community/[slug]` | 237 | Client | useCommunity, useMyCommunities, useJoin/LeaveCommunity, useMembers, AiCommunityCopilot |
| `/tradetalk/community/[slug]/manage` | 370 | Client | useCommunity, useMembers, useInvitations, useRooms, useUpdateMemberRole, useCreate/DeleteRoom |
| `/tradetalk/my` | 123 | Client | useMyCommunities |
| `/tradetalk/invitations` | 103 | Client | useMyCommunities (filters pending), useAccept/RejectInvitation |
| `/tradetalk/rankings` | 83 | Client | useRankings |

### Frontend — Components (2 files, 307 lines)

- **TradeTalkDashboardWidget** (140 lines): Integrated into buyer/seller dashboards — stats, recommended communities, trending industries, AI Opportunities
- **AiCommunityCopilot** (167 lines): FAB + 5-tab panel on community detail page — Summary/Members/Network/Ideas/Insights

### Frontend — API Layer (2 files, 342 lines, 31 functions)

- `lib/api/tradetalk.ts` (295 lines): 22 typed functions, 17 TypeScript interfaces
- `lib/api/ai-tradetalk.ts` (47 lines): 9 typed AI functions

### Frontend — Hooks (2 files, 307 lines, 34 hooks)

- `hooks/use-tradetalk.ts` (265 lines): 18 query hooks + 11 mutation hooks
- `hooks/use-ai-tradetalk.ts` (42 lines): 9 mutation hooks

### Key Architectural Notes
- Soft delete (deletedAt + isActive) on Community
- Cascade on CommunityMember, CommunityInvitation, IndustryRoom from Community
- Restrict on Community.ownerId → User (critical ownership protection)
- SetNull on CommunityCategory, Company, Industry relations
- Composite unique: CommunityMember[communityId+userId], IndustryRoom[communityId+slug]
- No actual discussion/posts/feed model exists — communities are membership-only
- Landing page is fully static with hardcoded "Coming Soon" values

---

## 3. Chat/Messaging System (Reusable for Comments)

### Location: `apps/api/src/modules/communication/`

### Prisma Models (8 models)

| Model | Purpose |
|-------|---------|
| `Conversation` | Chat thread with type, source, sourceId, rfqId, orderId |
| `ConversationParticipant` | User/Company membership in conversations (role, status, lastReadAt, isOnline, isArchived) |
| `Message` | Message with type (TEXT/IMAGE/FILE/SYSTEM), content, replyToId, isDeleted, status |
| `MessageAttachment` | File attachments on messages (type, url, mimeType, fileSize, dimensions) |
| `BlockedUser` | Per-conversation blocking |
| `ReportedMessage` | Message reports with ModerationAction (WARNING/MESSAGE_REMOVED/USER_BLOCKED/CONVERSATION_CLOSED/DISMISSED) |
| `ConversationLabel` | Company-scoped conversation labels |
| `ConversationLabelAssignment` | Label-to-conversation mapping |

### Key Features
- Full conversation lifecycle (create, add/remove participants, archive, mute, pin)
- Message CRUD with reply threading, attachment support
- Read receipts, typing indicators, online status
- Moderation (report, review, dismiss, warn, remove, block)
- Audit logging for all conversation actions
- WebSocket gateway (`/chat` namespace)

### Reuse Potential: **HIGH**
- Message model can be reused/extended for social post comments
- Conversation model can serve as post-thread context
- ReportedMessage + ModerationAction can be reused for content moderation
- WebSocket gateway can be extended for real-time social notifications

---

## 4. Notification System (Fully Reusable)

### Location: `apps/api/src/modules/notification/` (8 files, @Global module)

### Capabilities
- **100+ NotificationType values** covering: RFQ, Negotiation, PO, Order, Shipment, Delivery, Payment, GOCASH, Subscription, Chat, Escrow, Settlement, Dispute, KYC, Trust, Company, Onboarding, Ecosystem, Community, Security, General
- **BullMQ queue** (`notification`): concurrency 5, lockDuration 30s, exponential backoff (2^n × 2s), max 3 retries → DEAD_LETTER
- **WebSocket gateway** (`/chat` namespace): real-time `notification:new` event
- **Template engine**: DB-backed + 96 fallback templates with `{{variable}}` interpolation
- **Multi-channel**: IN_APP, EMAIL, SMS, PUSH, WHATSAPP_FUTURE
- **Delivery tracking**: NotificationDelivery model with status, attempt count, retry scheduling
- **Preference system**: Per-user/channel/type enable/disable
- **Analytics**: NotificationAnalyticsService

### Reuse Potential: **HIGH**
- Add 5 new NotificationType values for social events (POST_CREATED, POST_LIKED, POST_COMMENTED, NEW_FOLLOWER, POST_SHARED)
- Add 5 new fallback templates
- Reuse existing notification.createWithTemplate() pattern
- Reuse existing WebSocket delivery

---

## 5. Media System (Needs Extension)

### Current State: URL-only, no file upload infrastructure

**Three disjoint subsystems:**
1. **MediaLibrary** (`modules/seller-product/media-library.*`): Product media (ProductMedia model), folder tree (MediaFolder), no upload endpoint
2. **Gallery** (`modules/gallery/`): Company gallery images (CompanyGalleryImage), moderation status, plan-based limits
3. **FileScan** (`modules/malware/ + modules/storage/`): Malware scanning (stubbed — TODO for ClamAV)

**Key gap:** No S3/minio/multipart upload endpoint exists. All systems store URLs only.

### Reuse Potential: **MEDIUM**
- ProductMedia model can be extended or adapted for post media
- MediaFolder tree structure is reusable for post media organization
- Need to add actual file upload endpoint + storage backend for post images/videos

---

## 6. Event System (Fully Reusable)

### EventEmitter2 — 20+ events, 13 handlers

| Event | Handler | Purpose |
|-------|---------|---------|
| `product.*` events | EnterpriseCommerceEventHandler | Rewards, analytics, auto-promotion |
| `ecosystem.level.up` / badge / checkin / mission | GocashEcosystemService | Gamification |
| `security.*` events | IncidentResponseService | Security incidents |
| `ai-runtime.event` | AiStreamingRuntimeService | Streaming |
| `federation.collaboration.*` | AgentFederationService | Multi-agent |
| `agent.msg.*` | AgentMessagingService | Agent communication |

### Reuse Potential: **HIGH**
- Add `social.*` events for POST_CREATED, POST_LIKED, POST_COMMENTED, NEW_FOLLOWER, POST_SHARED
- Add SocialEventHandler for rewards, notifications, analytics, feed updates
- No new infrastructure needed

---

## 7. BullMQ Queue System (Fully Reusable)

**14 queues, 13 processors:**
| Queue | Processor | Jobs |
|-------|-----------|------|
| notification | NotificationProcessor | 9 job types |
| email | EmailProcessor | 5 job types |
| tracking | TrackingProcessor | Growth tracking |
| ai | AiProcessor | 10 job types |
| analytics | AnalyticsProcessor | 3 job types |
| + 9 more (rfq, export, escrow, settlement, dispute, certification, subscription, bestseller, malware) | | |

### Reuse Potential: **HIGH**
- Add `social-feed` queue for async feed generation
- Add `social-moderation` queue for content moderation pipelines
- Existing infrastructure (BullModule, Redis connection, job scheduler) is ready

---

## 8. AI Layer (Fully Reusable)

### Current Capabilities

| Component | Endpoints | Methods | Notes |
|-----------|-----------|---------|-------|
| **AI Gateway** | 27 endpoints | credit enforcement, 5 providers, fallback chain | 21 TaskTypes (1-20 credits) |
| **AI Orchestrator** | N/A | 111 registered actions across 10 services | Routes to all domain AI services |
| **AI Runtime** | 19 endpoints | BullMQ priority queues, circuit breaker, SLA monitoring | critical/default/background queues |
| **AI Federation** | 13 endpoints | 6 collaboration patterns, 4 workflows | Multi-agent orchestration |
| **Agent Framework** | Global | AgentRegistryService, AgentExecutorService | 6 registered agents |

### Registered Agents
| Agent | Capabilities | Status |
|-------|-------------|--------|
| Seller Agent | 8 (Smart Sell, Product Intelligence, Demand, Pricing, Competition, Market Intel) | ✅ Active |
| Buyer Agent | 8 (Procurement, RFQ, Supplier, Negotiation, Cost, Notifications) | ✅ Active |
| Admin Agent | 10 (System Health, User Activity, Fraud, Revenue, Moderation, Growth) | ✅ Active |
| Founder Executive | 8 (Copilot, Decisions, Risk, Opportunities, KPIs, Coordination, Analytics, Brief) | ✅ Active |
| Enterprise Intelligence | 14 (Dashboard, Revenue, Growth, Health, Anomalies, Markets, etc.) | ✅ Active |
| TradeTalk AI | 9 (Copilot, Summary, Suggestions, Ideas, Insights, etc.) | ✅ Active |

### Reuse Potential: **HIGH**
- Add SOCIAL_ANALYSIS TaskType (5 credits) for content moderation, feed curation, hashtag suggestions
- Register a Social Agent with 5-8 capabilities (content moderation, feed curation, trend detection, etc.)
- Extend TradeTalk AI service for post-level features
- Reuse AI Runtime for async moderation jobs
- Reuse AI Federation for cross-agent social insights
- Reuse circuit breaker, fallback chain, SLA monitoring

---

## 9. User & Company Profile System

### User Model (line 963)
- 22 fields, NO social profile fields
- Missing: bio, avatar (standardized), coverPhoto, headline, location (string vs lat/lng), website (separate field), socialLinks (exists on Company but not User)

### Company Model (line 1171)
- 56 fields, HAS: logo, banner, description, socialLinks (JSON), businessHours (JSON), videoIntroductionUrl
- Missing: follower count, post count, engagement metrics

### Reuse Potential: **MEDIUM**
- Extend User model with social profile fields (bio, headline, avatar)
- Extend Company model with social metrics (followerCount, postCount, socialEngagement)
- Company already has logo, banner, description, socialLinks — sufficient as business page foundation

---

## 10. RBAC & Permissions

### Guards
- `JwtAuthGuard` — Standard JWT authentication
- `RolesGuard` + `@Roles()` — Role-based access (ADMIN, SUPER_ADMIN, SELLER, BUYER, VIEWER)
- `CompanyOwnerGuard` — Company-level ownership verification

### Reuse Potential: **HIGH**
- Add SOCIAL_MODERATOR role or reuse ADMIN for content moderation
- CompanyOwnerGuard can verify post ownership
- Existing guard chain is sufficient for all social features

---

## 11. Search/OpenSearch

### Indices
| Index | Purpose |
|-------|---------|
| `enterprise_products` | Product search with 8-factor ranking |
| `enterprise_brands` | Global brand search |
| `enterprise_attributes` | Global attribute search |
| `enterprise_synonyms` | Synonym cache with 40+ B2B pairs |

### Reuse Potential: **HIGH**
- Add `social_posts` index for post search
- Add `social_tags` index for hashtag search
- Reuse synonym intelligence engine for social content
- Reuse 8-factor ranking engine adapted for social relevance
- Reuse OpenSearch connection, analyzer configuration, edge_ngram/autocomplete

---

## 12. Ecosystem / Gamification (Fully Reusable)

### 15 Models
- EcosystemLevel, EcosystemUserLevel, EcosystemXPTransaction
- EcosystemBadge, EcosystemUserBadge
- EcosystemDailyCheckin, EcosystemStreak
- EcosystemMission, EcosystemUserMission
- EcosystemAchievement, EcosystemUserAchievement
- EcosystemLeaderboardConfig, EcosystemLeaderboardEntry

### Reuse Potential: **HIGH**
- Add social missions (SHARE_POST, GET_FOLLOWER, LIKE_POST, COMMENT_ON_POST)
- Add social badges (TRENDING_POSTER, TOP_COMMENTER, NETWORK_BUILDER)
- Add social XP rewards for all social actions
- Reuse existing streak mechanism for posting streaks
- Reuse leaderboard for "Most Engaging" rankings
- Reuse existing ecosystem frontend components

---

## 13. Growth Intelligence

### 7 Endpoints
- Acquisition Funnel, Campaign Performance, Referral Conversion, Lead Conversion, Top Landing Pages, Traffic Sources, Summary

### Reuse Potential: **MEDIUM**
- Add social-specific analytics to growth intelligence (viral coefficient, engagement rate, content performance)
- Reuse usage event tracking infrastructure for social events
- Reuse admin analytics page pattern for social analytics

---

## 14. Frontend UI Audit

### Navigation
- TradeTalk link exists in: buyer nav, seller nav, admin nav, public navbar
- 37 component directories in `apps/web/components/`
- No FeedCard, PostCard, TimelineCard, or SocialPost components exist

### Existing Social-Adjacent Components
| Component | Purpose | Reusable? |
|-----------|---------|-----------|
| `CompanyCard` | Company display with trust score, badges | ✅ Extend for business pages |
| `ProductCard` | Product display with gallery, compare, wishlist | ✅ Pattern for post cards |
| `ProfileShare` | Web Share API + QR + copy link | ✅ Reuse for post sharing |
| `ReferralShare` | Share referral code with QR | ✅ Reuse for social share |
| `Card` (ui/card) | Base card component | ✅ Foundation for PostCard |
| `DashboardPageHeader` | Page header with breadcrumbs | ✅ Reuse for all social pages |
| `EmptyState` | Loading/empty/error states | ✅ Reuse |
| `ShimmerSkeleton` | Loading skeletons | ✅ Reuse |
| `Pagination` | Pagination component | ✅ Reuse |

### Frontend API Layer
- `lib/api/` has typed API modules for all existing features
- `hooks/` has React Query hooks for all existing features
- Pattern is well-established: `lib/api/*.ts` + `hooks/use-*.ts`

---

## 15. Admin Panel

### Existing Pages (61 directories)
Includes: `/admin/tradetalk` (insights dashboard), `/admin/communication` (moderation queue), `/admin/analytics` (growth intelligence), `/admin/dashboard` (executive)

### Missing
- No `/admin/social` or `/admin/content` page
- No content moderation page (existing moderation under `/admin/communication` is for chat messages only)
- No social analytics dashboard

---

## 16. Summary Statistics

| Domain | Files | Lines | Reuse Potential |
|--------|-------|-------|-----------------|
| TradeTalk | 27 | ~3,721 | Foundation — posts belong to communities |
| Communication/Chat | ~15 | ~2,000+ | HIGH — comments reuse Message model |
| Notification | 15 | ~4,500 | HIGH — add 5 social types |
| Media/Upload | ~15 | ~1,500+ | MEDIUM — need upload endpoint |
| AI Layer | ~60+ | ~10,000+ | HIGH — add Social Analysis task |
| BullMQ | ~14 queues | ~2,000+ | HIGH — add social-feed queue |
| EventSystem | ~15 files | ~500+ | HIGH — add social.* events |
| RBAC/Guards | ~4 | ~200+ | HIGH — existing patterns sufficient |
| Search/OpenSearch | ~10 | ~2,000+ | HIGH — add social_posts index |
| Ecosystem/Gamification | ~20 | ~3,000+ | HIGH — add social missions/badges |
| Growth Intelligence | ~5 | ~300+ | MEDIUM — extend for social metrics |
| Audit Logs | ~10 | ~500+ | HIGH — reuse for social moderation |
| Frontend Components | ~37 dirs | ~15,000+ | HIGH — existing patterns/layouts |
| Admin Panel | 61 pages | ~8,000+ | MEDIUM — add social admin page |

**Total codebase:** ~200+ files, ~50,000+ lines of directly or indirectly reusable code

---

## 17. Key Architectural Decisions (For Phase D2+)

1. **Posts belong to Communities**, not global — every post lives in a Community or IndustryRoom, following TradeTalk's existing structure
2. **Comments reuse Message model** — extend with `Post`-scoped conversations instead of creating a new Comment model
3. **Feed is async-generated** — use existing BullMQ infrastructure with a `social-feed` queue to build personalized feeds on post creation
4. **Social graph is new** — Follow/Connection models must be created (no existing foundation)
5. **Social moderation extends ReportedMessage** — reuse existing ModerationAction enum and moderation workflow
6. **AI moderation is async** — use existing AI Runtime's background queue for content moderation jobs
7. **Media upload needs new infrastructure** — add minio/S3 integration + multipart upload endpoint
