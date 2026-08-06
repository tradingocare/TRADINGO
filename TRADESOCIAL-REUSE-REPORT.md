# TRADESOCIAL — Reuse Report & Component Matrix

> Phase D1 | TradeSocial & Business Collaboration | Audit Only
> Generated: 2026-07-19

---

## Reuse Matrix

| # | Existing Component | Current Capability | Reuse Strategy | Extend? | New? |
|---|-------------------|-------------------|----------------|---------|------|
| 1 | **TradeTalk Communities** | Community CRUD, membership, rooms, categories, invitations, rankings, AI copilot | Posts live in Communities/Rooms | ✅ Extend model with `Post`/`CommunityPost` | ❌ |
| 2 | **TradeTalk Service** | 29 methods for community management | Add post/feed methods to TradeTalkService | ✅ Add 15+ methods | ❌ |
| 3 | **TradeTalk Controller** | 30 endpoints under `/tradetalk` | Add post/feed endpoints | ✅ Add 15+ endpoints | ❌ |
| 4 | **TradeTalk Admin** | 6 admin endpoints | Add content moderation endpoints | ✅ Add 5 endpoints | ❌ |
| 5 | **TradeTalk AI** | 9 AI endpoints (copilot, summary, suggestions) | Add post moderation, hashtag suggestions, feed curation | ✅ Add 3+ AI endpoints | ❌ |
| 6 | **TradeTalk Frontend** | 7 pages, 2 components, 31 API functions, 34 hooks | Add social feed pages, PostCard, Timeline | ✅ Add 5 pages, 5 components | ❌ |
| 7 | **Chat Message Model** | Message, MessageAttachment, reply threading | **Reuse Message model** for Post comments (Post-scoped Conversation) | ✅ Extend Conversation.type | ❌ |
| 8 | **Chat ReportedMessage** | Message reporting + ModerationAction enum | Reuse for social content moderation | ✅ Extend ModerationAction | ❌ |
| 9 | **Chat WebSocket** | `/chat` namespace with real-time delivery | Reuse for real-time social notifications | ✅ Extend gateway namespace | ❌ |
| 10 | **Notification System** | 100+ types, BullMQ queue, WebSocket, 96 templates | Add 5 social notification types | ✅ Add types + templates | ❌ |
| 11 | **Notification.createWithTemplate()** | Template rendering + multi-channel delivery | Reuse for social event notifications | ❌ | ❌ |
| 12 | **EventEmitter2** | 20+ events, 13 handlers | Add `social.*` events (post.created, post.liked, etc.) | ✅ Add events + handler | ❌ |
| 13 | **BullMQ Queues** | 14 queues, 13 processors, 60s lock, 5 concurrency | Add `social-feed` queue for async feed generation | ✅ Add queue + processor | ❌ |
| 14 | **BullMQ JobScheduler** | 7 queue injection, cron scheduling | Reuse for social feed refresh scheduling | ❌ | ❌ |
| 15 | **AI Gateway** | 5 providers, fallback chain, 21 TaskTypes, credit enforcement | Add SOCIAL_ANALYSIS TaskType (5 credits) | ✅ Add TaskType + model mapping | ❌ |
| 16 | **AI Runtime** | BullMQ priority queues, circuit breaker, SLA monitoring | Reuse for async content moderation | ❌ | ❌ |
| 17 | **AI Federation** | 6 collaboration patterns, 4 workflows | Reuse for cross-agent social insights | ❌ | ❌ |
| 18 | **Agent Framework** | 6 registered agents, AgentRegistry | Register Social Agent with 5-8 capabilities | ✅ Register new agent | ❌ |
| 19 | **AiOrchestratorService** | 111 actions across 10 services | Route social moderation/recommendation actions | ✅ Add actions | ❌ |
| 20 | **OpenSearch** | 4 indices, edge_ngram, synonym engine | Add `social_posts` index + `social_tags` index | ✅ Add 2 indices | ❌ |
| 21 | **EnterpriseSearchService** | Unified catalog search, autocomplete, fuzzy matching | Add social content search | ✅ Extend search service | ❌ |
| 22 | **SynonymIntelligenceService** | 40+ B2B synonym pairs, bidirectional mapping | Add social/trending synonym pairs | ✅ Extend synonym list | ❌ |
| 23 | **Growth Intelligence** | 7 endpoints (funnel, campaigns, referrals, landing pages, traffic) | Add social analytics endpoints | ✅ Add 3 endpoints | ❌ |
| 24 | **Tracking Event System** | 16 event constants, POST /track, BullMQ, 3 providers | Add social tracking events | ✅ Add 8+ event constants | ❌ |
| 25 | **UsageEvent Model** | eventName, properties, sessionId, timestamp | Reuse for social event analytics | ❌ | ❌ |
| 26 | **Ecosystem Gamification** | 15 models (levels, badges, missions, achievements, streaks, leaderboards) | Add social missions + social badges | ✅ Add social mission types | ❌ |
| 27 | **Ecosystem XP System** | XP transactions, multipliers, level-up | Reward social actions with XP | ✅ Add XP reasons | ❌ |
| 28 | **User Model** | 22 fields, no social profile | Add bio, headline, avatar fields | ✅ Add 3-5 fields | ❌ |
| 29 | **Company Model** | 56 fields, has logo/banner/description/socialLinks | Reuse as business page foundation | ✅ Add social metrics | ❌ |
| 30 | **Media Library (ProductMedia)** | URL-based product media, folder tree | Adapt for post media attachments | ✅ Extend or pattern-copy | ❌ |
| 31 | **Media Upload** | No file upload endpoint exists | **New**: Add S3/minio + multipart upload | ❌ | ✅ **NEW** |
| 32 | **Gallery (CompanyGalleryImage)** | URL-based gallery with moderation | Pattern for post image gallery | ❌ | ❌ |
| 33 | **RBAC (JwtAuthGuard + RolesGuard)** | JWT auth + role-based access (ADMIN/SELLER/BUYER) | Reuse for all social endpoints | ❌ | ❌ |
| 34 | **CompanyOwnerGuard** | Company-level ownership verification | Reuse for post ownership verification | ❌ | ❌ |
| 35 | **Post/Feed Models** | ❌ Does not exist | **New**: Post, PostMedia, PostLike, PostBookmark, Follow | ❌ | ✅ **NEW** |
| 36 | **Follow/Connection Graph** | ❌ Does not exist (no Follow/Connection model) | **New**: UserFollow, CompanyFollow, CompanyConnection | ❌ | ✅ **NEW** |
| 37 | **Hashtag/Tag Model** | ❌ No normalized tag model (tags stored as raw String[]) | **New**: Hashtag model with usageCount, slug | ❌ | ✅ **NEW** |
| 38 | **Activity Feed / Timeline** | ❌ No social feed/timeline model | **New**: FeedService with personalized feed generation | ❌ | ✅ **NEW** |
| 39 | **AuditLog Service** | Central audit log + 4 specialized models | Add social moderation audit | ✅ Add social audit types | ❌ |
| 40 | **Auth Service** | Login, register, OAuth, OTP, sessions | Reuse for social auth | ❌ | ❌ |
| 41 | **Frontend Component Library** | 37 directories, 15,000+ lines | Reuse Card, EmptyState, ShimmerSkeleton, Pagination, Modal, Tabs, etc. | ❌ | ❌ |
| 42 | **Frontend Hook Pattern** | React Query hooks for all features | Reuse pattern for social hooks | ❌ | ❌ |
| 43 | **Frontend API Layer Pattern** | Typed API modules with interfaces | Reuse pattern for social API | ❌ | ❌ |
| 44 | **Dashboard Layout** | DashboardPageHeader, StatCard, card grid patterns | Reuse for social pages | ❌ | ❌ |
| 45 | **Nav Definitions** | buyer/seller/admin nav links in master-data.ts | Add social feed link to nav | ✅ Add 1-2 nav links | ❌ |
| 46 | **TradeTalk Nav Link** | `/tradetalk/communities` (MessageCircle icon) | Add "Feed" link alongside communities | ✅ Add "Feed" link | ❌ |
| 47 | **Web Share API** | Company profile share button | Reuse for post sharing | ❌ | ❌ |
| 48 | **ReferralShare Component** | QR code, copy link | Pattern for social share component | ❌ | ❌ |
| 49 | **AuditLog: Social Events** | Currently no social audit | Log post/create/delete, moderation actions | ✅ Extend AuditLogService | ❌ |
| 50 | **FileScan** | Stubbed malware scanning | Reuse stub for social post media scanning | ✅ Implement ClamAV | ❌ |

---

## Reuse Summary by Category

### Fully Reusable (No Changes Needed)
- ✅ EventEmitter2 (emit social.* events)
- ✅ BullMQ infrastructure (connection, scheduler, patterns)
- ✅ AI Runtime (circuit breaker, SLA, queues)
- ✅ AI Federation (multi-agent orchestration)
- ✅ Agent Framework (registry, executor)
- ✅ RBAC (JwtAuthGuard, RolesGuard, CompanyOwnerGuard)
- ✅ Notification.createWithTemplate() pattern
- ✅ WebSocket gateway (real-time delivery)
- ✅ Frontend: Card, EmptyState, ShimmerSkeleton, Pagination, Modal, Tabs
- ✅ Frontend: DashboardPageHeader, StatCard, card grid patterns
- ✅ Frontend: React Query + typed API module pattern
- ✅ Web Share API
- ✅ AuditLogService (central audit)
- ✅ OpenSearch connection + analyzer configuration

### Needs Extension (Existing Component + New Code)
- ✅ TradeTalkService (+ 15 methods for posts/feed)
- ✅ TradeTalkController (+ 15+ endpoints)
- ✅ TradeTalkAdminController (+ 5 moderation endpoints)
- ✅ AiTradeTalkService (+ 3 AI endpoints for moderation/hashtags/curation)
- ✅ Chat Message model (new Conversation type for post comments)
- ✅ Chat ReportedMessage (extend for post reports)
- ✅ NotificationService (+ 5 new types + 5 templates)
- ✅ AI Gateway (+ SOCIAL_ANALYSIS TaskType, 5 credits)
- ✅ AiOrchestratorService (+ 3 actions for social)
- ✅ Agent Framework (register Social Agent)
- ✅ OpenSearch (+ social_posts + social_tags indices)
- ✅ EnterpriseSearchService (+ social content search)
- ✅ SynonymIntelligenceService (+ social synonyms)
- ✅ Growth Intelligence (+ 3 social analytics endpoints)
- ✅ Tracking Events (+ 8 social event constants)
- ✅ Ecosystem (+ social missions, social badges, social XP reasons)
- ✅ User model (+ 3-5 social profile fields)
- ✅ Company model (+ social engagement fields)
- ✅ Nav definitions (+ 1-2 nav links)

### Needs New Infrastructure
- ❌ **Media Upload** — S3/minio storage + multipart upload endpoint
- ❌ **Post Model** — New Prisma model for posts/content
- ❌ **Follow Model** — New Prisma model for social graph
- ❌ **Hashtag Model** — New normalized hashtag model
- ❌ **Feed Service** — Personalized feed generation (async via BullMQ)

---

## What NOT to Build

| Bad Idea | Why |
|----------|-----|
| New notification system | Existing system has 100+ types, WebSocket, BullMQ, template engine — fully sufficient |
| New event system | EventEmitter2 is already global — add `social.*` events |
| New queue infrastructure | 14 existing queues with Redis connection, scheduler, retry logic |
| New AI system | 21 task types, 5 providers, 6 agents, federation, circuit breaker |
| New search system | OpenSearch with enterprise indices, synonym engine, ranking engine |
| New auth system | JWT + RBAC fully proven across 1,329 endpoints |
| New analytics system | Growth Intelligence + tracking + UsageEvent already exist |
| New gamification system | 15 Ecosystem models cover levels, badges, missions, streaks, leaderboards |
| New notification templates | 96 existing fallback templates — add 5 more |
| New audit system | Central AuditLogService + 4 specialized models + 12 audit endpoints |
| Separate chat system | Reuse Conversation/Message model for post comments |
| Separate moderation | Reuse ReportedMessage + ModerationAction + /admin/communication |
