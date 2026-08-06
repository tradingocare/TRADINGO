# TRADESOCIAL — Gap Analysis

> Phase D1 | TradeSocial & Business Collaboration | Audit Only
> Generated: 2026-07-19

---

## Gap Summary

| # | Feature | Priority | Status | Impact |
|---|---------|----------|--------|--------|
| 1 | Social Post / Feed | 🔴 Critical | ❌ Full gap | Core feature — without posts, there is no social platform |
| 2 | Comments on Posts | 🔴 Critical | ❌ Full gap | Core engagement feature |
| 3 | Likes on Posts | 🔴 Critical | ❌ Full gap | Core engagement metric |
| 4 | Follow Companies | 🔴 Critical | ❌ Full gap | Core social graph — enables feed personalization |
| 5 | Media Upload (S3/minio) | 🔴 Critical | ❌ Full gap | Required for image/video posts |
| 6 | Hashtag / Topic System | 🟡 High | ❌ Full gap | Content discovery and categorization |
| 7 | Social Feed (Personalized) | 🟡 High | ❌ Full gap | Algorithmic or chronological feed per user |
| 8 | Post Sharing (Platform) | 🟡 High | ❌ Full gap | Content virality (share within platform) |
| 9 | Bookmark/Save Posts | 🟡 High | ❌ Full gap | Content curation for users |
| 10 | Business Pages (Enhanced) | 🟡 High | ⚠️ Partial | Company profiles exist but no social features |
| 11 | User Social Profiles | 🟡 High | ❌ Full gap | No bio, headline, avatar standard fields |
| 12 | Social Analytics | 🟡 High | ❌ Full gap | Engagement metrics, viral coefficient |
| 13 | AI Content Moderation | 🟡 High | ❌ Full gap | Automated moderation pipeline needed at scale |
| 14 | Content Reporting | 🟡 Medium | ⚠️ Partial | Chat ReportedMessage exists, needs extension for posts |
| 15 | Trending Topics | 🟡 Medium | ❌ Full gap | Trending hashtags/posts |
| 16 | Follow Professionals (TradeServ) | 🟡 Medium | ❌ Full gap | Social graph for professional services |
| 17 | Rich Text Editor | 🟡 Medium | ❌ Full gap | Required for post content creation |
| 18 | Polls in Posts | 🟢 Low | ❌ Full gap | Engagement feature |
| 19 | Post Scheduling | 🟢 Low | ❌ Full gap | Advanced content publishing |
| 20 | Company Timeline / Milestones | 🟢 Low | ❌ Full gap | Business storytelling |
| 21 | Endorsements / Testimonials | 🟢 Low | ❌ Full gap | Social proof |
| 22 | Events / Calendar / Meetings | 🟢 Low | ❌ Full gap | Business networking events |
| 23 | Follow Buyers | 🟢 Low | ❌ Full gap | Social graph completeness |
| 24 | User Mentions (@user) | 🟢 Low | ❌ Full gap | Social notification pattern |

---

## Gap Breakdown

### Gap 1: Social Post / Feed (🔴 Critical)

**Evidence:** No Post, Feed, Timeline, or SocialPost model exists anywhere in the Prisma schema. The closest is Community — a membership-only group without post/feed capability.

**Required:** New Prisma models for Post content (text, images, poll data, author reference, community/room scope), feed generation service, and feed API endpoints.

**Reuse:** TradeTalk Communities provide the container structure (Community → IndustryRoom). Posts should be scoped to Communities or IndustryRooms, not global.

**Estimated schema models needed:** 2-3 (Post, PostMedia, FeedConfig/FeedCache)

---

### Gap 2: Comments on Posts (🔴 Critical)

**Evidence:** No Comment model exists. The existing Chat/Message model provides the closest pattern (Message has content, sender, reply threading, attachments).

**Strategy:** Reuse the existing `Message` model by creating a new `Conversation` type (e.g., `POST_COMMENT`) scoped to each post. Each post would have one auto-created conversation for its comments.

**Schema changes:** Extend ConversationType enum (minimal), no new model needed.

---

### Gap 3: Likes on Posts (🔴 Critical)

**Evidence:** No Like model exists anywhere.

**Required:** New `PostLike` Prisma model or embedded count on Post model.

**Schema models needed:** 1 (PostLike with postId, userId, composite unique)

---

### Gap 4: Follow Companies (🔴 Critical)

**Evidence:** No Follow, Follower, Following, Connection, or Network model exists. The closest is `SavedSupplier` (bookmark, not follow) and `ConversationParticipant` (chat membership, not follow).

**Required:** New `CompanyFollow` Prisma model (userId, companyId). No existing pattern maps to a social follow graph.

**Schema models needed:** 1-2 (CompanyFollow, UserFollow)

---

### Gap 5: Media Upload (🔴 Critical)

**Evidence:** All three existing media subsystems (MediaLibrary, Gallery, FileScan) are URL-only. There is no multipart upload endpoint, no S3/minio integration, no file storage backend. File scanning is stubbed with a TODO.

**Required:** New file upload infrastructure — either S3 integration or local minio deployment. Multipart upload endpoint. File type validation. Image resizing/optimization pipeline.

**Reuse:** ProductMedia model can serve as a pattern for PostMedia.

---

### Gap 6: Hashtag / Topic System (🟡 High)

**Evidence:** Tags are stored as raw `String[]` arrays on Community and SavedSupplier. No normalized Tag/Hashtag model exists with name, slug, usageCount, or hierarchical organization.

**Required:** New `Hashtag` Prisma model with many-to-many relation to Post.

**Schema models needed:** 1 (Hashtag with id, name, slug (unique), usageCount, createdAt)

---

### Gap 7: Social Feed — Personalized (🟡 High)

**Evidence:** No activity feed, timeline, or social feed model exists. Only operational audit trails (OrderTimelineEvent, DisputeTimelineEvent, etc.).

**Required:** Feed generation service that builds personalized feeds based on:
- Companies the user follows
- Communities the user belongs to
- Trending/high-engagement posts
- Chronological vs algorithmic ranking

**Reuse:** BullMQ for async feed generation (new `social-feed` queue). Redis for feed caching. AI Runtime for algorithmic ranking.

---

### Gap 8: Post Sharing (🟡 High)

**Evidence:** Web Share API exists on company profiles (for external sharing). TradeServ ProfileShare component exists (share/QR/copy link). No internal platform sharing.

**Required:** Internal "Share Post" feature — creates a repost or shared reference. Can be implemented as a lightweight reference (Post.shareOfId self-relation) without new models.

---

### Gap 9: Bookmark/Save Posts (🟡 High)

**Evidence:** `SavedProduct` (product wishlist) and `SavedSupplier` (supplier bookmark) exist. No post bookmarking.

**Required:** New `SavedPost` model (userId, postId) following the same pattern as SavedProduct.

**Schema models needed:** 1 (SavedPost)

---

### Gap 10: Business Pages — Enhanced (🟡 High)

**Evidence:** Company profile exists with 56 fields, 6 tabs (Overview, Products, Profile, Gallery, Reviews, Contact). However, no social features (no company feed, no followers display, no engagement metrics).

**Required:** Add company feed/posts tab, follower count, engagement widgets to existing company profile page.

**Reuse:** Existing CompanyProfileClient (900+ lines, 6 tabs) — add a "Feed" tab.

---

### Gap 11: User Social Profiles (🟡 High)

**Evidence:** User model has 22 fields: no bio, no standardized avatar, no headline, no social links, no cover photo.

**Required:** Add 3-5 fields to User model for social profiles. Extend `/buyer/settings` and `/seller/settings` for social profile editing.

---

### Gap 12: Social Analytics (🟡 High)

**Evidence:** Growth Intelligence has 7 endpoints but none for social metrics.

**Required:** Add social-specific analytics: engagement rate per post, viral coefficient, follower growth, top content, time spent on feed.

**Reuse:** Growth Intelligence infrastructure (UsageEvent, tracking pipeline, admin analytics page pattern).

---

### Gap 13: AI Content Moderation (🟡 High)

**Evidence:** AI Gateway has 5 providers, 21 TaskTypes, but no SOCIAL_ANALYSIS TaskType. No automated content moderation pipeline exists.

**Required:** Add SOCIAL_ANALYSIS TaskType. Build moderation pipeline using AI Runtime's background queue. Auto-moderate posts for spam, hate speech, inappropriate content.

**Reuse:** AI Runtime (background queue, circuit breaker, SLA), AI Gateway (provider abstraction, fallback chain), agent framework.

---

### Gap 14: Content Reporting (🟡 Medium)

**Evidence:** ReportedMessage exists for chat moderation with ModerationAction enum (WARNING, MESSAGE_REMOVED, USER_BLOCKED, CONVERSATION_CLOSED, DISMISSED).

**Required:** Extend reported content system to include posts and comments. May need a new PostReport model or extend ReportedMessage for non-message content.

---

### Gap 15: Trending Topics (🟡 Medium)

**Evidence:** No trending/topics system exists.

**Required:** Compute trending hashtags and trending posts based on engagement velocity. Use OpenSearch for trending computation.

**Reuse:** OpenSearch analytics aggregation, BullMQ for periodic trending recalculation.

---

## Gap Severity Scoring

| Criteria | Weight |
|----------|--------|
| Blocks core social functionality | 5x |
| Cannot be worked around | 4x |
| Requires data model change | 3x |
| Requires new infrastructure | 3x |
| Requires new UI pages | 2x |
| Can be deferred | 1x |

### Priority Calculation

| Feature | Blocking | Workaround | Data Model | Infra | UI | Defer | Score | Priority |
|---------|----------|------------|------------|-------|----|-------|-------|----------|
| Post/Feed | 5 | 4 | 3 | 0 | 2 | 0 | 14 | 🔴 Critical |
| Comments | 5 | 4 | 1 | 0 | 2 | 0 | 12 | 🔴 Critical |
| Likes | 5 | 4 | 3 | 0 | 1 | 0 | 13 | 🔴 Critical |
| Follow | 5 | 4 | 3 | 0 | 2 | 0 | 14 | 🔴 Critical |
| Media Upload | 4 | 4 | 0 | 3 | 0 | 0 | 11 | 🔴 Critical |
| Hashtags | 3 | 3 | 3 | 0 | 1 | 0 | 10 | 🟡 High |
| Feed (Personalized) | 4 | 3 | 0 | 1 | 1 | 0 | 9 | 🟡 High |
| Post Sharing | 3 | 3 | 1 | 0 | 1 | 0 | 8 | 🟡 High |
| Bookmark Posts | 2 | 3 | 3 | 0 | 1 | 0 | 9 | 🟡 High |
| Business Pages | 2 | 2 | 0 | 0 | 2 | 1 | 7 | 🟡 High |
| User Profiles | 2 | 2 | 3 | 0 | 2 | 1 | 10 | 🟡 High |
| Social Analytics | 2 | 2 | 0 | 0 | 1 | 1 | 6 | 🟡 High |
| AI Moderation | 2 | 3 | 0 | 1 | 0 | 1 | 7 | 🟡 High |
| Content Reporting | 1 | 2 | 1 | 0 | 1 | 2 | 7 | 🟡 Medium |
| Trending Topics | 1 | 2 | 3 | 1 | 1 | 2 | 10 | 🟡 Medium |
| Follow Professionals | 1 | 3 | 3 | 0 | 1 | 2 | 10 | 🟡 Medium |
| Rich Text Editor | 3 | 2 | 0 | 0 | 1 | 2 | 8 | 🟡 Medium |
| Polls | 1 | 2 | 3 | 0 | 1 | 3 | 10 | 🟢 Low |
| Post Scheduling | 1 | 2 | 1 | 1 | 1 | 3 | 9 | 🟢 Low |
| Company Timeline | 1 | 2 | 1 | 0 | 2 | 3 | 9 | 🟢 Low |
| Endorsements | 1 | 2 | 3 | 0 | 1 | 3 | 10 | 🟢 Low |
| Events/Calendar | 1 | 2 | 3 | 0 | 1 | 3 | 10 | 🟢 Low |
| Follow Buyers | 1 | 3 | 1 | 0 | 1 | 3 | 9 | 🟢 Low |
| User Mentions | 2 | 2 | 0 | 0 | 1 | 3 | 8 | 🟢 Low |
