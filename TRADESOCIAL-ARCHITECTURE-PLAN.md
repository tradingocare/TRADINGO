# TRADESOCIAL — Architecture Plan

> Phase D1 | TradeSocial & Business Collaboration | Audit Only
> Generated: 2026-07-19

---

## 1. Design Principles

1. **Extend, don't replace** — Every social feature must extend existing TradeTalk rather than creating a parallel system
2. **One social graph** — Single Follow model for companies, professionals, and (future) users
3. **Async feed generation** — Personalized feeds built via BullMQ, not synchronous queries
4. **Reuse before create** — Comments reuse Message, moderation reuse ReportedMessage, analytics reuse Growth Intelligence
5. **Community-scoped** — Every post belongs to a Community or IndustryRoom (not global), following TradeTalk's existing structure
6. **AI-native** — Content moderation, hashtag suggestion, and feed curation use existing AI Runtime
7. **Event-driven** — All social actions emit `social.*` events for decoupled processing (notifications, analytics, feed updates)

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     TRADESOCIAL SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐     ┌──────────────────┐              │
│  │   TRADETALK      │     │   SOCIAL CORE     │              │
│  │   Communities    │────▶│   Posts / Feed     │              │
│  │   Membership     │     │   Likes / Shares   │              │
│  │   Rooms          │     │   Follows          │              │
│  └──────────────────┘     └────────┬─────────┘              │
│                                    │                          │
│         ┌──────────────────────────┼──────────────────┐      │
│         │                          │                  │      │
│         ▼                          ▼                  ▼      │
│  ┌────────────┐          ┌──────────────┐    ┌───────────┐  │
│  │  CHAT      │          │  NOTIFICATIONS│    │   AI      │  │
│  │  Comments  │          │  Social Events│    │Moderation │  │
│  │  (Message) │          │  (5 new types)│    │Hashtags   │  │
│  └────────────┘          └──────────────┘    └───────────┘  │
│                                                               │
│         ┌──────────────────┐      ┌──────────────────┐      │
│         │  BULLMQ          │      │  OPENSEARCH       │      │
│         │  Social Feed     │      │  Social Posts     │      │
│         │  Async Gen       │      │  Trending         │      │
│         └──────────────────┘      └──────────────────┘      │
│                                                               │
│         ┌──────────────────┐      ┌──────────────────┐      │
│         │  ECOSYSTEM       │      │  GROWTH INTEL     │      │
│         │  Social Missions │      │  Social Analytics │      │
│         │  Social Badges   │      │  Engagement       │      │
│         └──────────────────┘      └──────────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Prisma Schema — Extension Plan

### 3.1 New Models (5 models, 2 enums)

```prisma
// === NEW: Post model (extension of TradeTalk Community) ===
model SocialPost {
  id            String      @id @default(uuid())
  communityId   String?     // Nullable — global posts outside communities
  roomId        String?     // Nullable — optional room scoping
  authorId      String      // User who created the post
  companyId     String?     // Company author (if posted as company)
  type          SocialPostType @default(TEXT)
  content       String      // Post body text (Markdown)
  title         String?     // Optional post title
  mediaIds      String[]    // References to PostMedia
  hashtags      String[]    // Inline hashtag references
  pollId        String?     // Optional poll reference
  linkUrl       String?     // Share a URL
  linkTitle     String?     // Link preview title
  linkImage     String?     // Link preview image
  linkDescription String?   // Link preview description
  isPinned      Boolean     @default(false)
  isModerated   Boolean     @default(false)
  moderationStatus  SocialModerationStatus @default(PENDING)
  moderatedById String?
  moderatedAt   DateTime?
  moderationReason String?
  likeCount     Int         @default(0)
  commentCount  Int         @default(0)
  shareCount    Int         @default(0)
  viewCount     Int         @default(0)
  status        SocialContentStatus @default(PUBLISHED)
  publishedAt   DateTime    @default(now())
  scheduledAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?

  // Relations
  author        User        @relation(fields: [authorId], onDelete: Restrict)
  company       Company?    @relation(fields: [companyId], onDelete: SetNull)
  community     Community?  @relation(fields: [communityId], onDelete: SetNull)
  room          IndustryRoom? @relation(fields: [roomId], onDelete: SetNull)
  moderator     User?       @relation("PostModerator", fields: [moderatedById], onDelete: SetNull)

  // Indexes
  @@index([communityId, status, createdAt])
  @@index([authorId, status, createdAt])
  @@index([companyId, status, createdAt])
  @@index([moderationStatus])
  @@index([status, publishedAt])
  @@index([deletedAt])
}

// === NEW: Post likes ===
model SocialPostLike {
  id        String   @id @default(uuid())
  postId    String
  userId    String
  createdAt DateTime @default(now())

  post      User     @relation(fields: [postId], onDelete: Cascade)
  user      User     @relation(fields: [userId], onDelete: Cascade)

  @@unique([postId, userId])
  @@index([postId])
  @@index([userId])
}

// === NEW: Post bookmarks ===
model SocialSavedPost {
  id        String   @id @default(uuid())
  userId    String
  postId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], onDelete: Cascade)
  post      Post     @relation(fields: [postId], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([userId])
  @@index([postId])
}

// === NEW: Company follow (social graph) ===
model SocialCompanyFollow {
  id        String   @id @default(uuid())
  userId    String
  companyId String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], onDelete: Cascade)
  company   Company  @relation(fields: [companyId], onDelete: Cascade)

  @@unique([userId, companyId])
  @@index([userId])
  @@index([companyId])
}

// === NEW: Post media (pattern-copied from ProductMedia) ===
model SocialPostMedia {
  id        String   @id @default(uuid())
  postId    String
  type      MediaType @default(IMAGE)
  url       String
  title     String?
  altText   String?
  fileSize  Int?
  mimeType  String?
  width     Int?
  height    Int?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())

  post      Post     @relation(fields: [postId], onDelete: Cascade)

  @@index([postId])
}

// === NEW: Hashtag (normalized) ===
model SocialHashtag {
  id         String   @id @default(uuid())
  name       String   @unique
  slug       String   @unique
  usageCount Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([usageCount])
}

// === NEW: Post-Hashtag relation ===
model SocialPostHashtag {
  postId    String
  hashtagId String
  createdAt DateTime @default(now())

  post      Post       @relation(fields: [postId], onDelete: Cascade)
  hashtag   SocialHashtag @relation(fields: [hashtagId], onDelete: Cascade)

  @@id([postId, hashtagId])
  @@index([hashtagId])
}

// === NEW: Post report (extending ReportedMessage pattern) ===
model SocialPostReport {
  id          String       @id @default(uuid())
  postId      String
  reportedBy  String       // UserId
  reason      String
  description String?
  status      ReportStatus @default(PENDING)
  action      ModerationAction?
  reviewedBy  String?
  reviewedAt  DateTime?
  createdAt   DateTime     @default(now())

  post        Post         @relation(fields: [postId], onDelete: Cascade)
  reporter    User         @relation(fields: [reportedBy], onDelete: Restrict)

  @@index([postId])
  @@index([status, createdAt])
}

// === NEW ENUM: Post type ===
enum SocialPostType {
  TEXT
  IMAGE
  VIDEO
  LINK
  POLL
  MILESTONE
}

// === NEW ENUM: Moderation status ===
enum SocialModerationStatus {
  PENDING
  APPROVED
  REJECTED
  FLAGGED
}

// === NEW ENUM: Content status ===
enum SocialContentStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  ARCHIVED
}
```

### 3.2 Extended Enums

| Enum | New Values | Purpose |
|------|-----------|---------|
| `NotificationType` | POST_CREATED, POST_LIKED, POST_COMMENTED, NEW_FOLLOWER, POST_SHARED | Social notifications |
| `EcosystemXPReason` | SOCIAL_POST, SOCIAL_LIKE, SOCIAL_COMMENT, SOCIAL_SHARE, SOCIAL_FOLLOW | Social XP rewards |
| `AnalyticsEventType` | SOCIAL_POST, SOCIAL_LIKE, SOCIAL_COMMENT, SOCIAL_FOLLOW, SOCIAL_SHARE | Social analytics |
| `TrackingEventName` | social_post_view, social_post_create, social_like, social_comment, social_follow, social_share | Tracking events |
| `TaskType` | SOCIAL_ANALYSIS | AI moderation/hashtags |
| `ConversationType` | POST_COMMENT | Post comments via chat |
| `ModerationAction` | POST_REMOVED, USER_MUTED (extend existing) | Social moderation |

### 3.3 Extended Models (Existing Fields)

| Model | New Fields | Purpose |
|-------|-----------|---------|
| `User` | bio, avatar, coverPhoto, headline, socialLinks (JSON) | Social profile |
| `Company` | followerCount, postCount, socialEngagement | Social metrics |
| `Community` | postCount (Int @default(0)) | Post tracking |

---

## 4. API Extension Plan

### 4.1 TradeTalkController — New Endpoints (+15)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | /tradetalk/communities/:id/posts | Create post in community |
| GET | /tradetalk/communities/:id/posts | List posts in community (paginated) |
| GET | /tradetalk/posts/:id | Get single post with details |
| PATCH | /tradetalk/posts/:id | Update own post |
| DELETE | /tradetalk/posts/:id | Soft-delete own post |
| POST | /tradetalk/posts/:id/like | Like/unlike a post |
| GET | /tradetalk/posts/:id/likes | List users who liked a post |
| POST | /tradetalk/posts/:id/bookmark | Bookmark/unbookmark a post |
| POST | /tradetalk/posts/:id/share | Share a post (increment counter) |
| POST | /tradetalk/posts/:id/report | Report a post for moderation |
| GET | /tradetalk/feed | Get personalized feed (paginated) |
| POST | /tradetalk/companies/:id/follow | Follow/unfollow a company |
| GET | /tradetalk/companies/:id/followers | List company followers |
| GET | /tradetalk/posts/trending | Get trending posts |
| GET | /tradetalk/hashtags/trending | Get trending hashtags |

### 4.2 TradeTalkAdminController — New Endpoints (+5)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /admin/tradetalk/posts | List all posts (with moderation filter) |
| POST | /admin/tradetalk/posts/:id/moderate | Approve/reject/flag post |
| GET | /admin/tradetalk/reports | List content reports |
| POST | /admin/tradetalk/reports/:id/review | Review a report (dismiss/warn/remove) |
| GET | /admin/tradetalk/hashtags | List/manage hashtags |

### 4.3 AiTradeTalkController — New Endpoints (+3)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | /tradetalk/ai/moderate-content | AI content moderation check |
| POST | /tradetalk/ai/suggest-hashtags | AI hashtag suggestions |
| POST | /tradetalk/ai/curate-feed | AI personalized feed curation |

### 4.4 Comments — Reuse Chat Conversation Endpoints

Comments reuse the existing Message model. Each post gets a `POST_COMMENT` type Conversation automatically on creation. No new comment endpoints needed — existing chat endpoints work:

| Method | Route | Existing? | Purpose |
|--------|-------|-----------|---------|
| GET | /communication/conversations/:id/messages | ✅ Existing | List comments on a post |
| POST | /communication/conversations/:id/messages | ✅ Existing | Add a comment |
| PATCH | /communication/messages/:id | ✅ Existing | Edit own comment |
| DELETE | /communication/messages/:id | ✅ Existing | Soft-delete comment |

---

## 5. Event Flow

```
User creates a post
  │
  ├─▶ POST /tradetalk/communities/:id/posts
  │     │
  │     ├─▶ TradeTalkService.createPost()
  │     │     ├─▶ Create SocialPost in DB
  │     │     ├─▶ Increment community.postCount
  │     │     ├─▶ Parse hashtags → SocialHashtag upsert
  │     │     └─▶ Update SocialHashtag.usageCount
  │     │
  │     ├─▶ EventEmitter2.emit('social.post.created', { postId, authorId, communityId })
  │     │     │
  │     │     ├─▶ SocialEventHandler.handlePostCreated()
  │     │     │     ├─▶ Award XP (EcosystemXPReason.SOCIAL_POST)
  │     │     │     ├─▶ Create notifications for community members (POST_CREATED)
  │     │     │     └─▶ Track analytics event
  │     │     │
  │     │     ├─▶ BullMQ: social-feed queue
  │     │     │     └─▶ FeedService.generateFeed(postId) — async
  │     │     │           ├─▶ Update followers' cached feeds
  │     │     │           └─▶ Update community feed
  │     │     │
  │     │     ├─▶ AI Runtime (background, low priority)
  │     │     │     └─▶ AiModerationService.moderate(postId)
  │     │     │           └─▶ If flagged → set moderationStatus = FLAGGED
  │     │     │
  │     │     └─▶ OpenSearch index
  │     │           └─▶ Index SocialPost in social_posts index
  │     │
  │     └─▶ WebSocket: notification:new → community members
  │
  └─▶ Response: 201 { post }
```

---

## 6. Feed Generation Strategy

### Question: How to build the personalized feed?

**Pattern:** Pre-computed async feed via BullMQ (not real-time queries)

**Approach:**
1. Each user/company has a cached feed list in Redis (sorted set of postIds)
2. On post creation, `social-feed` queue job runs:
   - Find all followers of the poster's company
   - Prepend postId to each follower's Redis feed sorted set
   - Limit to 500 most recent posts per user
3. On follow, merge the followed company's recent posts into the user's feed
4. On page load, fetch feed from Redis, hydrate with Post details from DB
5. Periodic refresh job: purge old posts, recompute trending scores

### Why async?
- Ensures O(1) feed reads
- No complex SQL joins on every page load
- Scales to millions of posts without degrading performance
- Existing BullMQ infrastructure handles queue depth, retries, backpressure

---

## 7. AI Integration Points

| Feature | AI Service | TaskType | Credits | Priority |
|---------|-----------|----------|---------|----------|
| Content moderation | AI Runtime (background) | SOCIAL_ANALYSIS | 5 | High |
| Hashtag suggestion | AiTradeTalkService | SOCIAL_ANALYSIS | 5 | High |
| Feed curation | AiTradeTalkService | SOCIAL_ANALYSIS | 5 | Medium |
| Trending detection | AI Runtime (cron) | SOCIAL_ANALYSIS | 5 | Medium |
| Spam detection | AI Runtime (background) | SOCIAL_ANALYSIS | 5 | High |

All AI goes through existing Gateway (provider fallback, circuit breaker, credit enforcement).

---

## 8. Analytics & Tracking

| Event | Tracking Constant | Growth Intelligence Endpoint |
|-------|------------------|------------------------------|
| Post created | `social_post_create` | New: social-engagement |
| Post viewed | `social_post_view` | New: social-engagement |
| Post liked | `social_like` | New: social-engagement |
| Comment added | `social_comment` | New: social-engagement |
| Post shared | `social_share` | New: social-engagement |
| Company followed | `social_follow` | New: social-growth |

All events flow through existing `POST /track` → BullMQ tracking queue → 3 providers (UsageEvent, ClickHouse, GA4).

---

## 9. Frontend Page Structure

### New Pages (5 pages)

| Page | Route | Purpose | Reuse |
|------|-------|---------|-------|
| **Community Feed** | `/tradetalk/communities/:id/feed` | Posts within a community | TradeTalk community detail pattern |
| **Post Detail** | `/tradetalk/posts/:id` | Single post with comments | TradeTalk detail + Chat comments |
| **User Feed** | `/tradetalk/feed` | Personalized feed (home) | Community feed pattern |
| **Hashtag Search** | `/tradetalk/tags/:slug` | Posts by hashtag | Search results pattern |
| **Business Profile Feed** | `/companies/:slug/feed` | Company's posts tab | CompanyProfileClient tab |

### New Components (5 components)

| Component | Purpose | Reuse Pattern |
|-----------|---------|---------------|
| `SocialPostCard` | Post display in feed lists | ProductCard (403 lines) layout pattern |
| `SocialPostDetail` | Full post view with media gallery | Product detail layout |
| `SocialCommentThread` | Nested comment display | Chat message component |
| `SocialFeedList` | Infinite-scroll feed container | Pagination + product list pattern |
| `SocialCreatePost` | Post creation form with rich text | ProductWizard pattern |

### Modified Pages (4 pages)

| Page | Change |
|------|--------|
| `/tradetalk/community/[slug]` | Add "Feed" tab showing community posts |
| `/companies/[slug]` | Add "Feed" tab to existing 6-tab layout |
| `/buyer/settings` | Add social profile editing (bio, avatar, headline) |
| `/seller/settings` | Add social profile editing |

---

## 10. Security & Moderation

| Layer | Mechanism | Reuse |
|-------|-----------|-------|
| Post creation | JwtAuthGuard + CompanyOwnerGuard | Existing |
| Post deletion | Owner-only check in service | Existing pattern |
| AI moderation | SOCIAL_ANALYSIS → AI Runtime background q | New (infra exists) |
| Human moderation | Admin post review panel | /admin/communication pattern |
| User reporting | SocialPostReport model | ReportedMessage pattern |
| Rate limiting | Existing 60/min throttle on POST /track | Extend to POST /tradetalk/posts |
| Content filtering | AI moderation + manual flag | Dual-layer |

---

## 11. Estimated Complexity by Module

| Module | New Files | Modified Files | Complexity | Dependencies |
|--------|-----------|---------------|------------|--------------|
| Prisma Schema | 8 models + 3 enums | 4 models (User, Company, Community, NotificationType) | Medium | TradeTalk, Chat |
| Backend (TradeTalkExt) | 3 (service, DTOs, handler) | 4 (controller, admin, AI, module) | Medium | Prisma, EventEmitter2, BullMQ |
| Backend (Comments) | 0 | 0 (reuse Chat) | Low | Chat module |
| Backend (Moderation) | 1 (moderation service) | 1 (admin controller) | Low | ReportedMessage, AI Runtime |
| Backend (Feed) | 2 (FeedService, FeedProcessor) | 0 | Medium | BullMQ, Redis |
| Backend (AI) | 0 | 1 (ai-tradetalk.service) | Low | AI Gateway, AI Runtime |
| Backend (Notifications) | 0 | 2 (templates, types) | Low | NotificationService |
| Backend (Ecosystem) | 0 | 2 (XP reasons, mission types) | Low | EcosystemService |
| Backend (Analytics) | 0 | 2 (tracking events, GI endpoints) | Low | Growth Intelligence |
| Frontend Pages | 5 | 0 | Medium | React Query, components |
| Frontend Components | 5 | 0 | Medium | Existing component patterns |
| Frontend Modified | 0 | 4 (community, company, settings ×2) | Low | Existing pages |
| Frontend API Layer | 1 | 0 | Low | API pattern |
| Frontend Hooks | 1 | 0 | Low | Hook pattern |
| Frontend Nav | 0 | 1 (master-data.ts) | Very Low | Nav definitions |
| Infrastructure | 0 | 1 (media upload) | Medium | S3/minio |

**Total:** ~28 new files, ~18 modified files
