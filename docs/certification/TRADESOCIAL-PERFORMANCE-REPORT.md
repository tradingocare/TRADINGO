# TradeSocial Performance Report

**Phase**: D8 — TradeSocial Enterprise Certification
**Date**: 2026-07-19
**Status**: COMPLETE

---

## 1. Schema & Index Analysis

### 1.1 Existing Indexes

| Model | Index | Type | Purpose |
|-------|-------|------|---------|
| Community | slug | Unique B-tree | Community lookup by slug |
| Community | deletedAt | B-tree | Soft-delete filtering |
| CommunityMember | userId, communityId | Unique composite | Membership uniqueness |
| SocialPost | createdAt | B-tree | Chronological ordering |
| SocialPost | isPinned | B-tree | Pinned post filtering |
| SocialPostLike | postId, userId | Unique composite | Prevent duplicate likes |
| SocialSavedPost | userId, postId | Unique composite | Prevent duplicate saves |
| SocialFollow | followerId, followingId, followingType | Unique composite | Follow uniqueness |
| CommunityInvitation | status | B-tree | Invitation status filtering |

### 1.2 Missing Indexes

| Model | Recommended Index | Query Pattern | Impact |
|-------|-------------------|---------------|--------|
| SocialPost | **(communityId, createdAt)** | `WHERE communityId = ? ORDER BY createdAt DESC` | Community feed — sequential scan without this |
| SocialPost | **(authorId, createdAt)** | `WHERE authorId = ? ORDER BY createdAt DESC` | User post list — sequential scan |
| SocialPostLike | **(postId)** | `WHERE postId = ?` | Count likes per post — partial index scan |
| SocialSavedPost | **(userId)** | `WHERE userId = ?` | User bookmarks list |
| CommunityMember | **(communityId, role)** | `WHERE communityId = ? AND role = ?` | Member filtering by role |
| CommunityMember | **(userId)** | `WHERE userId = ?` | User community membership list |
| SocialFollow | **(followerId, followingType)** | `WHERE followerId = ? AND followingType = ?` | User following list filtering |
| SocialFollow | **(followingId, followingType)** | `WHERE followingId = ? AND followingType = ?` | Follower count queries |
| Community | **(categoryId, deletedAt)** | `WHERE categoryId = ? AND deletedAt IS NULL` | Category-based community listing |
| CommunityRoom | **(communityId, isActive)** | `WHERE communityId = ? AND isActive = ?` | Active room listing |

### 1.3 Table Size Estimates (at scale)

| Model | Est. Rows (10K communities, 100K users) | Growth Rate |
|-------|------------------------------------------|-------------|
| Community | 10,000 | Linear |
| CommunityMember | 500,000 | O(n*m) |
| SocialPost | 1,000,000 | 10/community/day |
| SocialPostLike | 5,000,000 | 5x posts |
| SocialSavedPost | 500,000 | 0.5x posts |
| SocialFollow | 2,000,000 | O(n*m) |
| CommunityInvitation | 100,000 | Lower volume |
| CommunityRoom | 30,000 | 3/community |

---

## 2. Query Pattern Analysis

### 2.1 Critical Path Queries

| Query | Frequency | Current Plan | Optimization |
|-------|-----------|--------------|--------------|
| `getCommunityFeed(communityId)` | Per page load | `WHERE communityId = ? ORDER BY createdAt DESC` | Needs composite index |
| `getTrending()` | Per explore page | `GROUP BY postId ORDER BY likeCount DESC` | Needs caching |
| `getFollowingFeed(userId)` | Per home page | `WHERE authorId IN (following)` | Could use materialized path |
| `getUserPosts(userId)` | Per profile | `WHERE authorId = ? ORDER BY createdAt DESC` | Needs composite index |
| `getComments(postId)` | Per post expand | `WHERE conversationId = ?` | Needs index on Message.conversationId |

### 2.2 N+1 Analysis

| Endpoint | Pattern | Risk |
|----------|---------|------|
| Community feed | Loads posts, then for each post loads author + likes + saves | HIGH — each post triggers 3 sub-queries |
| Comment thread | Loads messages, then for each loads sender profile | HIGH — already optimized via `include` |
| Community list | Loads communities with _count members | MEDIUM — _count is a subquery per row |
| Follow lists | Loads follows, then each user/company | MEDIUM — needs batch resolution |

### 2.3 Mitigation Strategy

```prisma
// Recommended: Use Prisma select projection for feed queries
const posts = await this.prisma.socialPost.findMany({
  where: { communityId },
  orderBy: { createdAt: 'desc' },
  take: limit,
  skip: offset,
  select: {
    id: true, content: true, createdAt: true, mediaUrls: true,
    linkUrl: true, type: true, isPinned: true, authorId: true,
    author: { select: { id: true, name: true, avatar: true } },
    _count: { select: { likes: true, savedBy: true, comments: true } },
  },
});
```

---

## 3. Caching Recommendations

### 3.1 Redis Cache Candidates

| Data | TTL | Invalidation Trigger | Est. Hit Rate |
|------|-----|---------------------|---------------|
| Community details | 5 min | Community update | 95% |
| Community feed (page 1) | 2 min | New post | 80% |
| Trending posts | 5 min | New like/bookmark | 90% |
| Community categories | 1 hour | Category CRUD | 99% |
| AI suggestions | 10 min | None (immutable) | 90% |
| Top communities | 5 min | Join/leave | 85% |

### 3.2 Implementation Pattern

```typescript
// Recommended: Cache-aside pattern
async getCommunityFeed(communityId: string, page: number, userId?: string) {
  const cacheKey = `feed:community:${communityId}:page:${page}`;
  const cached = await this.redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const posts = await this.prisma.socialPost.findMany({
    where: { communityId, deletedAt: null },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 20,
    skip: (page - 1) * 20,
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });

  await this.redis.setex(cacheKey, 120, JSON.stringify(posts));
  return posts;
}
```

---

## 4. Pagination Audit

| Endpoint | Method | Pagination | Issue |
|----------|--------|------------|-------|
| List posts | cursor/take | ✅ PaginatedResponse | Good |
| List comments | skip/take | ✅ PaginatedResponse | Good |
| List communities | take/skip | ✅ PaginatedResponse | Good |
| List members | take/skip | ✅ PaginatedResponse | Good |
| List invitations | — | ❌ No pagination | May load hundreds of invitations |
| Community activity | limit param | ✅ Manual limit | Acceptable |
| Trending feed | default 20 | ✅ | Acceptable |

---

## 5. AI Endpoint Performance

| AI Action | Est. Latency | Gateway Action | Notes |
|-----------|-------------|----------------|-------|
| generate-post | 2-5s | TRADETALK_AI | Full text generation |
| rewrite-post | 2-5s | TRADETALK_AI | Depends on content length |
| improve-grammar | 1-3s | TRADETALK_AI | Faster — proofreading only |
| detect-spam | 0.5-2s | TRADETALK_AI | Lightweight classification |
| detect-offensive | 0.5-2s | TRADETALK_AI | Lightweight classification |
| suggest-hashtags | 1-3s | TRADETALK_AI | Content extraction |
| summarize | 1-4s | TRADETALK_AI | Depends on content length |
| translate | 1-4s | TRADETALK_AI | Depends on language pair |

No rate limiting on any AI endpoint — all 15 actions can be spammed simultaneously.

---

## 6. Performance Scorecard

| Category | Score | Critical Issues |
|----------|-------|-----------------|
| Index Coverage | 60/100 | 10 missing composite indexes |
| Query Optimization | 70/100 | N+1 risk on feed with includes |
| Caching | 30/100 | Zero Redis cache hits |
| Pagination | 85/100 | Invitations list not paginated |
| AI Performance | 50/100 | No rate limiting, no caching |
| Scalability | 65/100 | Missing indexes will cause degradation at scale |

**Overall**: 60/100 — Performance is adequate for current scale but will degrade significantly beyond 10K communities without index and caching improvements.
