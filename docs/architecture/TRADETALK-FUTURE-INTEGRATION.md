# TradeTalk™ Business Community — Future Integration Plan

## Architecture Overview

TradeTalk is an invite-only business community for Verified Partners inside TRADINGO. It is designed as an **ecosystem module** (not a separate app/social platform) that reuses the existing TRADINGO architecture, authentication, design system, and shared services.

### What TradeTalk IS
- Professional community for verified businesses (buyers + sellers + trade service professionals)
- Business networking, deal discussions, industry insights, peer learning
- AI-moderated topics, verified-only participation, TradTrust-scored profiles
- Invite-only (existing TRADINGO verified partners auto-enrolled)

### What TradeTalk is NOT
- Facebook, LinkedIn, WhatsApp, Telegram, Reddit
- Marketplace, Freelancer Platform
- Social media, chat app, public forum
- Consumer community

---

## Integration Points (Phase 20.3+)

### 1. TradeServ ↔ TradeTalk
- Professionals auto-join industry-specific TradeTalk groups (Chartered Accountants, GST Consultants, etc.)
- TradeServ profile reputation influences TradeTalk trust level
- TradeTalk activity feeds into TradeServ professional score

### 2. Trading Marketplace ↔ TradeTalk
- Buyers/sellers with completed trades auto-invited to deal room discussions
- Trade history shown as credibility badge in community posts
- Product/service discussions linked back to marketplace listings

### 3. TradTrust ↔ TradeTalk
- TradTrust score (0-1000) determines TradeTalk permissions:
  - < 400: Read-only, limited daily interactions
  - 400-699: Standard member, can post/reply
  - 700-899: Trusted member, can create groups, moderate
  - 900+: Elite, can verify others, mentor
- Post reputation scoring using TradTrust signals

### 4. GOCASH ↔ TradeTalk
- Rewards for quality contributions (helpful answers, verified advice)
- GOCASH tipping between members for exceptional guidance
- GOCASH staking for premium community features

### 5. Membership ↔ TradeTalk
- Plan-based access tiers:
  - Trade Smart: Read-only community access
  - Trade Plus: 5 posts/week, basic groups
  - Trade Pro: Unlimited, create groups
  - Trade Premium: Priority visibility, analytics
  - Trade Elite: Moderation tools, API access

### 6. Founder AI / AI Gateway ↔ TradeTalk
- AI content moderation (auto-flag spam, hate speech, off-topic)
- AI topic summarization, trending insights
- Smart recommendations for groups/members to follow
- Automated welcome messages, onboarding flows
- AI-generated weekly digests

### 7. Advertising ↔ TradeTalk
- Sponsored posts within community feeds (opt-in by group)
- Targeted ads by industry/role/experience level
- Native advertising through expert Q&A sponsorships

### 8. Analytics ↔ TradeTalk
- Community health metrics (DAU/MAU, engagement rate, top contributors)
- Sentiment analysis by industry/region
- Content performance tracking
- Member retention/churn analytics

### 9. Notifications ↔ TradeTalk
- In-app notifications for replies, mentions, group invites
- Digest preferences (daily/weekly/real-time)
- Push notifications for urgent/important community interactions
- Do-not-disturb mode per group

### 10. Marketplace Intelligence ↔ TradeTalk
- Trending topics/discussions fed into market intelligence reports
- Supplier/buyer sentiment analysis from community posts
- Industry pain points identified through discussion patterns

### 11. Near→Far→Best Engine ↔ TradeTalk
- Nearby business networking groups (geo-based)
- Local industry meetups/events discovery
- Regional market discussions

### 12. Core Event Bus ↔ TradeTalk
- Events emitted: `community.post.created`, `community.member.joined`, `community.group.created`, `community.post.flagged`
- Event consumers: Notifications, Analytics, GOCASH Rewards, TradTrust Scoring, Founder AI

---

## Data Model (Reserved — Phase 20.3)

No Prisma models created in Phase 20.2. Reserved for Phase 20.3+:

```
CommunityGroup {
  id, name, slug, description, industry, coverImage
  memberCount, postCount, isPrivate, requiresApproval
  rules, tags[], createdBy, createdAt, updatedAt
}

CommunityMember {
  id, groupId, userId/companyId, role (MEMBER/MODERATOR/ADMIN)
  joinedAt, lastReadAt, contributionScore, isActive
}

CommunityPost {
  id, groupId, authorId, title, body, tags[]
  media[], likes, replies, views, isPinned
  isFlagged, moderationStatus, aiScore, createdAt
}

CommunityReply {
  id, postId, authorId, body, parentId
  likes, isAcceptedAnswer, createdAt
}

CommunityLike {
  id, postId/replyId, userId, createdAt
}

CommunityModerationLog {
  id, postId/replyId, moderatorId, action, reason, aiConfidence
}

CommunityAnalytics {
  id, groupId, date, posts, members, activeMembers, engagement
}
```

---

## Route Architecture (Future)

| Route | Type | Description |
|-------|------|-------------|
| `/tradetalk` | Public | Landing page (Phase 20.2 ✅) |
| `/tradetalk/discover` | Public | Discover groups, trending topics |
| `/tradetalk/group/[slug]` | Public | Group page with posts (read-only for non-members) |
| `/tradetalk/post/[id]` | Public | Single post view |
| `/buyer/tradetalk` | Protected | Buyer community hub |
| `/buyer/tradetalk/groups` | Protected | My groups |
| `/buyer/tradetalk/feed` | Protected | Personalized feed |
| `/seller/tradetalk` | Protected | Seller community hub |
| `/seller/tradetalk/groups` | Protected | My groups |
| `/seller/tradetalk/feed` | Protected | Personalized feed |
| `/admin/tradetalk` | Admin | Community management dashboard |
| `/admin/tradetalk/moderation` | Admin | Moderation queue |
| `/admin/tradetalk/analytics` | Admin | Community analytics |

---

## Shared Components to Reuse (Future)

- `Card` (existing) — Group/post cards
- `Avatar` (existing) — Member avatars
- `DropdownMenu` (existing) — Post/share menus
- `Dialog` (existing) — Create post, report
- `Tabs` (existing) — Feed/trending/groups
- `Input` (existing) — Search, create post
- `Textarea` (existing) — Post body
- `Skeleton` (existing) — Loading states
- `Toast` (existing) — Notifications
- `Badge` (existing) — Trust level, role badges

---

## Phase Roadmap

### Phase 20.2 (Current) — Foundation
- Public landing page ✅
- Navigation entries ✅
- Architecture audit ✅
- Integration plan ✅
- No backend/database

### Phase 20.3 — Prisma Models + Core Backend API
- Create CommunityGroup, CommunityMember, CommunityPost, CommunityReply, CommunityLike, CommunityModerationLog
- CRUD endpoints for groups, posts, replies, likes
- Invite-only enrollment (existing partners auto-enrolled)
- Moderation queue endpoints
- Notification events

### Phase 20.4 — Frontend Community Experience
- Discover groups page
- Group page with feed
- Create/edit post
- Reply, like, share
- Member profiles within community
- Mobile-responsive

### Phase 20.5 — AI Moderation + Intelligence
- AI Gateway integration for content moderation
- Topic summarization
- Trending insights
- Smart recommendations
- Automated moderation queue

### Phase 20.6 — GOCASH Rewards + Trading Integration
- Quality contribution rewards
- GOCASH tipping
- Deal room discussions tied to marketplace
- TradTrust scoring integration
