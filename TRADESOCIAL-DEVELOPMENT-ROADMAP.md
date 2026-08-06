# TRADESOCIAL — Development Roadmap

> Phase D1 | TradeSocial & Business Collaboration | Audit Only
> Generated: 2026-07-19

---

## Roadmap Overview

```
D2 ─── Post Model + Feed Engine ─────────────── 5 days
D3 ─── Social Graph + Follow System ─────────── 3 days
D4 ─── Social Profiles + Hashtags ───────────── 3 days
D5 ─── Media Upload + Comments ──────────────── 4 days
D6 ─── AI Moderation + Trending ─────────────── 3 days
D7 ─── Social Analytics + Admin Panel ───────── 3 days
      ──────────────────────────────────────────────
      TOTAL: ~21 days engineering, ~$19,800–$29,700
```

---

## Phase D2 — Post Model & Feed Engine

**Objective:** Create the core content layer — Post model, post CRUD, community feed, personalized feed, BullMQ feed generation

**Duration:** 5 days

**Prisma Changes (3 new models):**
- `SocialPost` (18 fields, 6 indexes, 4 FKs)
- `SocialPostLike` (3 fields, composite unique)
- `SocialSavedPost` (3 fields, composite unique)
- `SocialPostMedia` (10 fields, 1 index)
- Extend: `Community` → add `postCount Int @default(0)`
- Extend: `NotificationType` → add `POST_CREATED`, `POST_LIKED`
- Extend: `ConversationType` → add `POST_COMMENT`
- New: `SocialPostType` enum, `SocialContentStatus` enum

**Backend (9 new files):**
- `apps/api/src/modules/tradetalk/services/social-post.service.ts` — CRUD, like, bookmark, share (300-400 lines)
- `apps/api/src/modules/tradetalk/services/social-feed.service.ts` — Feed generation + caching (250 lines)
- `apps/api/src/modules/tradetalk/processors/social-feed.processor.ts` — BullMQ queue processor (80 lines)
- `apps/api/src/modules/tradetalk/dto/social-post.dto.ts` — CreatePostDto, UpdatePostDto, PostFilterDto, FeedQueryDto (100 lines)
- `apps/api/src/modules/tradetalk/dto/social-response.dto.ts` — PostResponse, FeedResponse, LikeResponse (60 lines)
- `apps/api/src/modules/tradetalk/handlers/social-event.handler.ts` — @OnEvent handlers for social.* events (120 lines)
- Extend: `apps/api/src/modules/tradetalk/tradetalk.controller.ts` — +11 endpoints (200 lines)
- Extend: `apps/api/src/modules/tradetalk/tradetalk.module.ts` — register services, processors, imports BullMQ

**Frontend (5 new files):**
- `apps/web/lib/api/tradetalk.ts` — Extend with 11 social API functions
- `apps/web/hooks/use-tradetalk.ts` — Extend with 10 social hooks
- `apps/web/components/social/post-card.tsx` — Post display component (200 lines)
- `apps/web/components/social/post-detail.tsx` — Full post view (250 lines)
- `apps/web/components/social/feed-list.tsx` — Infinite-scroll feed (150 lines)
- `apps/web/components/social/create-post.tsx` — Post creation form (180 lines)
- `apps/web/components/social/like-button.tsx` — Toggle like component (60 lines)
- Extend: `apps/web/app/tradetalk/communities/[slug]/page.tsx` — Add Feed tab

**Infrastructure:**
- Register `social-feed` BullMQ queue in queue registry
- Add Redis feed cache TTL config (24h default)

**Contracts:**
| Endpoint | Payload | Response |
|----------|---------|----------|
| POST /tradetalk/communities/:id/posts | { content, mediaIds?, links? } | SocialPost |
| GET /tradetalk/communities/:id/posts | ?page&limit&sort | PaginatedResponse<SocialPost> |
| GET /tradetalk/posts/:id | — | SocialPost (with comments, likes) |
| PATCH /tradetalk/posts/:id | { content, mediaIds? } | SocialPost |
| DELETE /tradetalk/posts/:id | — | 204 |
| POST /tradetalk/posts/:id/like | — | { liked: boolean, likeCount: number } |
| GET /tradetalk/posts/:id/likes | ?page | PaginatedResponse<User> |
| POST /tradetalk/posts/:id/bookmark | — | { bookmarked: boolean } |
| POST /tradetalk/posts/:id/share | — | { shareCount: number } |
| GET /tradetalk/feed | ?page&limit | PaginatedResponse<SocialPost> |

**Events Emitted:**
- `social.post.created` — Post created
- `social.post.liked` — Post liked/unliked
- `social.post.shared` — Post shared

**Verification:**
- prisma validate ✅, generate ✅
- tsc api 0 errors ✅
- tsc web 0 errors ✅
- next build ✅

**Cost Estimate:** 5 days × $900/day = $4,500

---

## Phase D3 — Social Graph + Follow System

**Objective:** Company follow/unfollow, follower counts, social graph queries, network pages

**Duration:** 3 days

**Prisma Changes (1 new model):**
- `SocialCompanyFollow` (3 fields, composite unique, 2 indexes)
- Extend: `Company` → add `followerCount Int @default(0)`

**Backend (4 new files):**
- `apps/api/src/modules/tradetalk/services/social-graph.service.ts` — Follow, unfollow, followers, following, counts (200 lines)
- Extend: `apps/api/src/modules/tradetalk/tradetalk.controller.ts` — +3 endpoints (60 lines)
- Extend: `apps/api/src/modules/tradetalk/dto/social-post.dto.ts` — FollowDto, FollowResponse (30 lines)
- Extend: `apps/web/lib/api/company.ts` — Add follow/unfollow API functions
- Extend: `apps/web/hooks/use-company.ts` — Add follow hooks

**Frontend (2 new files):**
- `apps/web/components/social/follow-button.tsx` — Toggle follow button (80 lines)
- `apps/web/components/social/follower-list.tsx` — Followers modal/list (120 lines)
- Extend: `apps/web/app/companies/[slug]/page.tsx` — Add follower count + follow button to company header

**Events Emitted:**
- `social.company.followed` — Company followed
- `social.company.unfollowed` — Company unfollowed

**Verification:**
- prisma validate ✅, generate ✅
- tsc api 0 errors ✅, tsc web 0 errors ✅, next build ✅

**Cost Estimate:** 3 days × $900/day = $2,700

---

## Phase D4 — Social Profiles + Hashtags

**Objective:** User social profiles (bio, avatar, headline), hashtag system with trending, post tagging

**Duration:** 3 days

**Prisma Changes (3 new models):**
- `SocialHashtag` (5 fields, 2 unique, 1 index)
- `SocialPostHashtag` (3 fields, composite ID, 2 indexes)
- Extend: `User` → add `bio String?`, `avatar String?`, `coverPhoto String?`, `headline String?`, `socialLinks Json?`

**Backend (4 new files):**
- `apps/api/src/modules/tradetalk/services/social-hashtag.service.ts` — Parse, upsert, trending, search (200 lines)
- `apps/api/src/modules/tradetalk/dto/social-hashtag.dto.ts` — HashtagResponse, TrendingResponse (40 lines)
- Extend: `apps/api/src/modules/tradetalk/tradetalk.controller.ts` — +3 endpoints (40 lines)
- Extend: `apps/api/src/modules/user/user.controller.ts` — Extend PATCH /auth/me for social profile fields
- Extend: `apps/api/src/modules/user/dto/update-settings.dto.ts` — Add bio, avatar, headline fields

**Frontend (3 new files):**
- `apps/web/components/social/hashtag-link.tsx` — Styled hashtag link component (40 lines)
- `apps/web/app/tradetalk/tags/[slug]/page.tsx` — Hashtag search results page (120 lines)
- Extend: `apps/web/app/buyer/settings/page.tsx` — Add bio, avatar, headline fields
- Extend: `apps/web/app/seller/settings/page.tsx` — Add bio, avatar, headline fields
- Extend: Social post creation — Hash/mension auto-detection in content

**Events Emitted:**
- `social.hashtag.used` — Hashtag appeared in new post

**Verification:**
- prisma validate ✅, generate ✅
- tsc api 0 errors ✅, tsc web 0 errors ✅, next build ✅

**Cost Estimate:** 3 days × $900/day = $2,700

---

## Phase D5 — Media Upload + Comments

**Objective:** File upload infrastructure (S3/minio), image processing, post comments via Chat Message reuse, rich text editor

**Duration:** 4 days

**Infrastructure (1 new service):**
- S3 integration service (or minio for self-hosted)
- Image optimization pipeline (sharp/thumbor)
- Environment variables: `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`, `S3_REGION`

**Backend (5 new/extended files):**
- `apps/api/src/modules/upload/upload.module.ts` — New upload module with S3 integration (pattern: new)
- `apps/api/src/modules/upload/upload.service.ts` — Upload, download, delete, list (200 lines)
- `apps/api/src/modules/upload/upload.controller.ts` — POST /upload, GET /upload/:id' (60 lines)
- `apps/api/src/modules/upload/dto/upload.dto.ts` — UploadResponse, UploadQuery (40 lines)
- Extend: `apps/api/src/modules/tradetalk/services/social-post.service.ts` — Accept multipart uploads for post images

**Comments (0 new files):**
- No new comment code — reuse existing Chat Message model
- Auto-create POST_COMMENT Conversation on post creation
- Wire post detail page to show Chat messages as comments

**Frontend (2 new files):**
- `apps/web/components/social/comment-thread.tsx` — Comment display component (150 lines)
- Extend: `apps/web/components/social/create-post.tsx` — Add media upload, rich text editor

**Verification:**
- tsc api 0 errors ✅, tsc web 0 errors ✅, next build ✅

**Cost Estimate:** 4 days × $900/day = $3,600 (+ S3/minio hosting ~$50/mo)

---

## Phase D6 — AI Moderation + Trending

**Objective:** SOCIAL_ANALYSIS TaskType, content moderation pipeline, trending detection, AI hashtag suggestion, content reporting

**Duration:** 3 days

**Prisma Changes (1 new model):**
- `SocialPostReport` (10 fields, 2 indexes)

**Backend (4 new files):**
- `apps/api/src/modules/tradetalk/services/social-moderation.service.ts` — Content screening, bulk scan, admin review (250 lines)
- `apps/api/src/modules/tradetalk/services/social-trending.service.ts` — Trending computation, OpenSearch aggregation (150 lines)
- `apps/api/src/modules/tradetalk/dto/social-moderation.dto.ts` — ModeratePostDto, ReportDto, ReviewReportDto (60 lines)
- Extend: `apps/api/src/modules/tradetalk/tradetalk-admin.controller.ts` — +5 admin endpoints (80 lines)
- Extend: `apps/api/src/modules/ai-gateway/ai-gateway.service.ts` — Add SOCIAL_ANALYSIS handling
- Extend: `apps/web/lib/api/tradetalk.ts` — Add moderation API functions
- Extend: `apps/web/hooks/use-tradetalk.ts` — Add moderation hooks

**AI Runtime:**
- Add SOCIAL_ANALYSIS to TaskType enum (5 credits)
- Register OpenRouter model for social analysis
- AI moderation: auto-approve, flag, or reject based on content rules

**Frontend (2 new files):**
- `apps/web/app/admin/tradetalk/moderation/page.tsx` — Moderation queue (200 lines)
- Extend: `apps/web/app/tradetalk/posts/[id]/page.tsx` — Add report button

**Verification:**
- prisma validate ✅, generate ✅
- tsc api 0 errors ✅, tsc web 0 errors ✅, next build ✅

**Cost Estimate:** 3 days × $900/day = $2,700 (+ AI API costs ~$100/mo)

---

## Phase D7 — Social Analytics + Admin Panel

**Objective:** Social analytics endpoints, admin social dashboard, engagement metrics, growth intelligence integration, social badges/missions

**Duration:** 3 days

**Prisma Changes (extend enums only):**
- Extend: `EcosystemXPReason` → add SOCIAL_POST, SOCIAL_LIKE, SOCIAL_COMMENT, SOCIAL_SHARE, SOCIAL_FOLLOW
- Extend: `AnalyticsEventType` → add SOCIAL_POST, SOCIAL_LIKE, SOCIAL_COMMENT, SOCIAL_FOLLOW
- Extend: `TrackingEventName` → add 6 social tracking constants
- Extend: `EcosystemUserBadgeType` → add SOCIAL_INFLUENCER, TRENDING_CURATOR, COMMUNITY_BUILDER
- Extend: `EcosystemMissionType` → add SOCIAL_POSTS, SOCIAL_LIKES, SOCIAL_SHARES, SOCIAL_FOLLOWS

**Backend (4 new files):**
- `apps/api/src/modules/tradetalk/services/social-analytics.service.ts` — Engagement metrics, follower growth, top content, viral coefficient (200 lines)
- Extend: `apps/api/src/modules/tradetalk/tradetalk-admin.controller.ts` — +3 admin analytics endpoints (40 lines)
- Extend: `apps/api/src/modules/growth-intelligence/growth-intelligence.controller.ts` — +3 social analytics endpoints (60 lines)
- Extend: `apps/api/src/modules/growth-intelligence/growth-intelligence.service.ts` — Social analytics aggregation (100 lines)
- Extend: `apps/api/src/modules/ecosystem/ecosystem.service.ts` — Social mission/badge triggers (80 lines)
- Extend: `apps/web/lib/api/tradetalk.ts` — +6 analytics API functions
- Extend: `apps/web/hooks/use-tradetalk.ts` — +6 analytics hooks

**Frontend (2 new files):**
- `apps/web/app/admin/tradetalk/analytics/page.tsx` — Social analytics dashboard (250 lines)
- Extend: `apps/web/app/admin/tradetalk/page.tsx` — Add social stats summary cards

**Verification:**
- tsc api 0 errors ✅, tsc web 0 errors ✅, next build ✅

**Cost Estimate:** 3 days × $900/day = $2,700

---

## Total Roadmap Summary

| Phase | Duration | Effort | Cost | Models | Endpoints | Pages |
|-------|----------|--------|------|--------|-----------|-------|
| D2 — Post + Feed | 5 days | 14 files | $4,500 | 3 + 2 extended | 10 | 0 new + 1 modified |
| D3 — Social Graph | 3 days | 6 files | $2,700 | 1 + 1 extended | 3 | 0 new + 1 modified |
| D4 — Profiles + Hashtags | 3 days | 7+ files | $2,700 | 3 + 1 extended | 3 | 1 new + 2 modified |
| D5 — Media + Comments | 4 days | 8+ files | $3,600 | 0 | 2 | 0 new + 1 modified |
| D6 — AI + Moderation | 3 days | 6+ files | $2,700 | 1 | 5 | 1 new |
| D7 — Analytics + Admin | 3 days | 6+ files | $2,700 | 0 (enum ext) | 6 | 1 new |
| **Total** | **~21 days** | **~47 files** | **~$18,900** | **8 + 4 extended** | **~29** | **3 new + 5 modified** |

**Total Engineering Cost:** ~$18,900 (at $900/day)
**Total with contingency (20%):** ~$22,680
**Monthly Infrastructure Add (S3):** ~$50/mo
**Monthly AI API Add:** ~$100/mo

---

## Build vs Buy Decision

| Feature | Build | Buy (e.g., Salesforce Chatter, Yammer) |
|---------|-------|----------------------------------------|
| Post/Feed | ✅ Build — tight TradeTalk integration | ❌ No B2B marketplace integrations |
| Social Graph | ✅ Build — company-centric, not user | ❌ General-purpose, wrong data model |
| AI Moderation | ✅ Build — reuse existing AI Runtime | ❌ External API would double latency |
| Media Upload | ✅ Build — lightweight S3 wrapper | ❌ Box/ShareFile — overkill for posts |
| Comments | ✅ Build — reuse Chat Message model | ❌ Disqus — can't authenticate to our RBAC |

**Verdict: Build all — TradeSocial is deeply integrated into TradeTalk, Ecosystem, and AI Runtime. No off-the-shelf solution matches our architecture.**
