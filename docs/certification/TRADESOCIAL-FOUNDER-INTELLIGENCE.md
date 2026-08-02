# TradeSocial Founder Intelligence Report

**Phase**: D8 — TradeSocial Enterprise Certification
**Date**: 2026-07-19
**Status**: COMPLETE

---

## 1. Existing Metrics

### 1.1 Currently Available via Founder AI

The following metrics are already queryable via `FounderAiService.tradetalkIntelligence()`:

| Metric | Source | Available |
|--------|--------|-----------|
| Total communities | `prisma.community.count()` | ✅ |
| Total members | `prisma.communityMember.count()` | ✅ |
| Community growth (30d) | % change over 30 days | ✅ |
| Member growth (30d) | % change over 30 days | ✅ |
| New communities this month | `createdAt >= monthStart` | ✅ |
| Active members (30d) | `lastActiveAt >= 30dAgo` | ✅ |
| Top 5 communities | `orderBy: { memberCount: 'desc' }, take: 5` | ✅ |
| Pending invitations | `status: 'PENDING'` | ✅ |

### 1.2 Available via Enterprise Intelligence

Integrated into `EnterpriseIntelligenceService.getDashboard()`:

| Metric | Source | Available |
|--------|--------|-----------|
| Community health score | Members per community ratio | ✅ |
| Community growth trend | Period-over-period comparison | ✅ |
| Community forecast | 15% growth projection | ✅ |

---

## 2. Missing Metrics

### 2.1 Content Metrics (CRITICAL)

| Metric | Query | Priority |
|--------|-------|----------|
| Total posts (all time) | `prisma.socialPost.count()` | HIGH |
| Posts today | `count where createdAt >= today` | HIGH |
| Posts this week | `count where createdAt >= weekStart` | HIGH |
| Posts this month | `count where createdAt >= monthStart` | HIGH |
| Average posts/community/day | `totalPosts / communityCount / days` | HIGH |
| Average likes/post | `totalLikes / totalPosts` | MEDIUM |
| Average comments/post | `totalComments / totalPosts` | MEDIUM |
| Average saves/post | `totalSaves / totalPosts` | MEDIUM |
| Average engagement rate | `(likes + comments + bookmarks) / totalPosts` | MEDIUM |

### 2.2 User Metrics

| Metric | Query | Priority |
|--------|-------|----------|
| Active posters (30d) | `distinct authorId where post.createdAt >= 30dAgo` | HIGH |
| Unique posters (30d) | Count of users who posted | HIGH |
| Poster-to-lurker ratio | Active posters / (members - posters) | MEDIUM |
| Follow rate | `totalFollows / totalUsers` | LOW |
| Daily active authors | `distinct authorId where post.createdAt >= today` | MEDIUM |
| Top posters | `group by authorId, order by count desc, take 10` | MEDIUM |

### 2.3 AI Metrics

| Metric | Query | Priority |
|--------|-------|----------|
| AI usage rate | `AI actions / totalPosts` | HIGH |
| Most used AI features | Track per-action usage from posts | MEDIUM |
| AI-assisted vs manual posts | Compare count with/without AI | MEDIUM |
| AI actions/user | `totalAIactions / distinctUsers` | LOW |

### 2.4 Community Engagement Metrics

| Metric | Query | Priority |
|--------|-------|----------|
| Community retention rate | Members active 30d / total members | HIGH |
| Churned communities (30d) | Communities with zero new posts in 30d | MEDIUM |
| Community conversion rate | Invitations accepted / invitations sent | MEDIUM |
| Top communities by post count | `group by communityId, order by count desc` | MEDIUM |
| Cross-community posters | Users posting in 2+ communities | LOW |

### 2.5 Trend & Content Quality Metrics

| Metric | Query | Priority |
|--------|-------|----------|
| Top hashtags (by frequency) | Extract + aggregate from content | LOW |
| Posts with media ratio | `count where mediaUrls.length > 0 / total` | LOW |
| Posts with links ratio | `count where linkUrl != null / total` | LOW |
| Reply rate (comments per post) | `totalComments / totalPosts` | LOW |

---

## 3. Growth Tracking Coverage

### 3.1 Currently Tracked Events (TradeSocial)

| Event | Location | Status |
|-------|----------|--------|
| POST_CREATED | create-post.tsx:50 | ✅ |
| POST_VIEWED | feed-list.tsx:41 | ✅ |
| POST_LIKED | feed-list.tsx:48 | ✅ |
| POST_UNLIKED | feed-list.tsx:48 | ✅ |
| POST_SAVED | feed-list.tsx:60 | ✅ |
| POST_UNSAVED | feed-list.tsx:60 | ✅ |
| POST_DELETED | feed-list.tsx:71 | ✅ |
| POST_COMMENTED | comment-thread.tsx:39 | ✅ |
| POST_COMMENT_REPLIED | comment-thread.tsx:39 | ✅ |
| USER_FOLLOWED | follow-button.tsx:43 | ✅ |
| USER_UNFOLLOWED | follow-button.tsx:33 | ✅ |
| COMPANY_FOLLOWED | follow-button.tsx:43 | ✅ |
| COMPANY_UNFOLLOWED | follow-button.tsx:33 | ✅ |
| AI_POST_GENERATED | ai-content-assistant.tsx:66 | ✅ |
| AI_POST_REWRITTEN | ai-content-assistant.tsx:66 | ✅ |

### 3.2 Defined But Not Tracked

| Event | Missing From | Impact |
|-------|-------------|--------|
| POST_EDITED | Defined in events.ts, never wired | Cannot measure post updates |
| CONTENT_FLAGGED | Defined in events.ts, never wired | Moderation funnel invisible |
| CONTENT_APPROVED | Defined in events.ts, never wired | Moderation funnel invisible |
| POST_COMMENT_DELETED | Not in events.ts | Cannot measure removal |
| COMMUNITY_CREATED | Not in events.ts | Cannot measure creation |
| COMMUNITY_JOINED | Not in events.ts | Cannot measure join |
| COMMUNITY_LEFT | Not in events.ts | Cannot measure churn |

---

## 4. Growth Intelligence Integration

### 4.1 Current Coverage

| Dashboard | Metrics Available | Gap |
|-----------|------------------|-----|
| Founder AI | Community growth, member growth | No post/engagement metrics |
| Enterprise Intelligence | Community health, forecast | No content velocity |
| Admin Analytics | (Social channel in traffic sources) | No TradeTalk-specific analytics |
| Growth Intelligence | Acquisition funnel, campaign perf | No TradeTalk-specific events |

### 4.2 Recommended Addition to Founder AI

```typescript
// Add to FounderAiService.tradetalkIntelligence():
async contentVelocity() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const [totalPosts, postsToday, posts30d] = await Promise.all([
    this.prisma.socialPost.count({ where: { deletedAt: null } }),
    this.prisma.socialPost.count({ where: { createdAt: { gte: todayStart }, deletedAt: null } }),
    this.prisma.socialPost.count({ where: { createdAt: { gte: thirtyDaysAgo }, deletedAt: null } }),
  ]);

  const [totalLikes, totalComments, totalSaves] = await Promise.all([
    this.prisma.socialPostLike.count(),
    this.prisma.message.count({ where: { conversation: { type: 'POST_COMMENT' } } }),
    this.prisma.socialSavedPost.count(),
  ]);

  const engagementRate = totalPosts > 0
    ? ((totalLikes + totalComments + totalSaves) / totalPosts).toFixed(2)
    : '0';

  return { totalPosts, postsToday, posts30d, engagementRate: Number(engagementRate), avgPostsPerDay: Math.round(posts30d / 30) };
}
```

---

## 5. Recommendations

### P0 (Pre-Production)
- Add `totalPosts`, `postsToday`, `posts30d`, `engagementRate` to `FounderAiService.tradetalkIntelligence()`
- Wire `POST_EDITED` tracking event in post edit flow
- Add `COMMUNITY_CREATED`, `COMMUNITY_JOINED`, `COMMUNITY_LEFT` tracking events

### P1 (Next Sprint)
- Add AI usage rate tracking across all 15 actions
- Add `activePosters30d` and `posterToLurkerRatio` metrics
- Add `topCommunitiesByPostCount` to community insights

### P2 (Backlog)
- Top hashtag extraction and trending topics
- Community retention rate and churn detection
- Cross-community poster identification

---

## 6. Scorecard

| Category | Score | Status |
|----------|-------|--------|
| Community Metrics | 90/100 | All major metrics available |
| Content Metrics | 30/100 | Missing post count, velocity, trends |
| Engagement Metrics | 40/100 | Missing engagement rate, retention |
| AI Metrics | 10/100 | Missing AI adoption tracking |
| Growth Tracking | 65/100 | 15/21 events tracked |
| Founder Integration | 80/100 | Community metrics consumed by Founder AI |

**Overall**: 53/100 — Content velocity and AI adoption metrics are the most critical gaps. Adding 3 P0 items will bring this to 70%.
