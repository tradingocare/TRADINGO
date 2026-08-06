# TradeSocial Security Review

**Phase**: D8 — TradeSocial Enterprise Certification
**Date**: 2026-07-19
**Status**: COMPLETE

---

## 1. Authentication & Authorization

### 1.1 Current Guards

| Controller | Guard | Risk |
|------------|-------|------|
| TradeTalkController | `@UseGuards(AuthGuard('jwt'))` class-level | ✅ All methods require auth |
| TradeTalkAdminController | `@UseGuards(AuthGuard('jwt'), RolesGuard)` + `@Roles('ADMIN','SUPER_ADMIN')` | ✅ Properly isolated |
| AiTradeTalkController | `@UseGuards(AuthGuard('jwt'))` class-level | ✅ AI requires auth |

### 1.2 Endpoint Access Analysis

| Endpoint | Guard | Public | Protected | Notes |
|----------|-------|--------|-----------|-------|
| GET /tradetalk/communities | JwtAuthGuard | ❌ | ✅ | Requires login to browse communities |
| GET /tradetalk/communities/featured | JwtAuthGuard | ❌ | ✅ | Requires login |
| GET /tradetalk/communities/leaders | JwtAuthGuard | ❌ | ✅ | Requires login |
| GET /tradetalk/communities/:id | JwtAuthGuard | ❌ | ✅ | Requires login |
| GET /tradetalk/communities/:id/posts | JwtAuthGuard | ❌ | ✅ | Requires login |
| POST /tradetalk/* | JwtAuthGuard | ❌ | ✅ | All mutations require auth |
| GET /tradetalk/my-invitations | JwtAuthGuard | ❌ | ✅ | User-scoped |
| POST /tradetalk/ai/* | JwtAuthGuard | ❌ | ✅ | All AI requires auth |
| GET /tradetalk/admin/* | JwtAuthGuard + RolesGuard | ❌ | ADMIN only | ✅ Properly restricted |

**Finding**: All endpoints require authentication. No public endpoints for TradeSocial — acceptable for a B2B platform where users must register.

---

## 2. Rate Limiting

### 2.1 Current State

| Endpoint Group | Rate Limit | Risk |
|----------------|------------|------|
| TradeTalkController (all) | ❌ None | Any endpoint can be spammed |
| AiTradeTalkController (all) | ❌ None | 15 AI endpoints have no rate limit |
| TradeTalkAdminController | ❌ None | Admin endpoints can be spammed |

### 2.2 Risk Assessment

| Attack Vector | Likelihood | Impact | Current Defense |
|---------------|-----------|--------|-----------------|
| AI endpoint spam | HIGH | HIGH — $$$ AI costs | None |
| Comment spam | HIGH | MEDIUM — content moderation | None |
| Follow/unfollow abuse | MEDIUM | LOW — rate-limited DB | None |
| Like/unlike abuse | MEDIUM | LOW | None |
| Post creation flood | LOW (throttled by UI) | MEDIUM | None |
| Community creation flood | LOW | LOW | None |

### 2.3 Recommended Throttle Configuration

```typescript
// Class-level throttles
@Controller('tradetalk')
@UseGuards(AuthGuard('jwt'))
@Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 req/min base
export class TradeTalkController {
  @Post('communities/:id/posts')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 posts/min
  createPost() {}
}

@Controller('tradetalk/ai')
@Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 AI calls/min
@UseGuards(AuthGuard('jwt'))
export class AiTradeTalkController { }

@Controller('tradetalk/admin')
@Throttle({ default: { limit: 120, ttl: 60000 } })
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class TradetalkAdminController { }
```

---

## 3. Community Permission Enforcement

### 3.1 Membership Validation

| Operation | Membership Check | Enforcement |
|-----------|-----------------|-------------|
| Join community | ✅ Service validates + creates member | ✅ Secure |
| Leave community | ✅ Service validates + removes | ✅ Secure |
| Create post | ❌ NO membership check | 🔴 Can post in any public community |
| List posts | ❌ NO membership check | 🟡 Non-members see public community posts |
| Comment on post | ❌ NO membership check | 🟡 Non-members can comment |
| List members | ❌ NO membership check | 🟡 Non-members see member list |
| Invite members | ✅ Service checks moderator status | ✅ Secure |
| Remove members | ✅ Service checks moderator status | ✅ Secure |
| Update member role | ✅ Service checks moderator status | ✅ Secure |
| Pin post | ❌ Service may check | 🟡 Need to verify |

### 3.2 Community Visibility Enforcement

The Community model supports `visibility` (PUBLIC, PRIVATE, RESTRICTED) but:
- `getCommunity()` does NOT filter by visibility for non-members
- `getCommunityFeed()` does NOT check if user is a member for PRIVATE communities
- `createPost()` does NOT validate community membership

**Risk**: Private community content is accessible to any authenticated user.

### 3.3 Recommended Fix for TradeTalkService

```typescript
async createPost(userId: string, communityId: string, dto: CreatePostDto) {
  const community = await this.prisma.community.findUnique({
    where: { id: communityId },
    select: { visibility: true, id: true },
  });
  if (!community) throw new NotFoundException('Community not found');

  if (community.visibility !== 'PUBLIC') {
    const member = await this.prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId } },
    });
    if (!member) throw new ForbiddenException('Not a community member');
  }

  // ... proceed with post creation
}
```

---

## 4. Input Validation & Injection

| Aspect | Status | Notes |
|--------|--------|-------|
| DTO validation | ✅ All DTOs use class-validator | Consistent with platform standard |
| HTML sanitization | ❌ Not applied | Post content, comments rendered as-is |
| XSS prevention | 🟡 React handles JSX escaping | Post content rendered as text, not dangerouslySetInnerHTML |
| Link URL validation | 🟡 Links stored as strings | No validation that URL is safe |
| Media URL validation | 🟡 Stored as string array | No malware scanning |
| Slug injection | ✅ Unique constraint | Slug validated at DB level |
| Pagination bounds | ✅ skip/take validated | Default limits applied |

---

## 5. AI Security

| Aspect | Status | Notes |
|--------|--------|-------|
| AI Gateway guards | ✅ | All AI via AiGatewayService with JwtAuthGuard |
| Rate limiting | 🔴 None | 15 AI endpoints unprotected |
| Content moderation | 🟡 Passive | detectSpam/detectOffensive exist but are NOT automatically applied |
| Prompt injection | 🟡 Via existing AiGatewayService | Gateway has prompt injection guards |
| AI credit check | 🟡 Via AiCreditsService | Gateway enforces credits, but no local pre-check |
| Cost control | 🔴 No budget | Unlimited AI calls possible without rate limiting |

---

## 6. Data Privacy

| Aspect | Status | Notes |
|--------|--------|-------|
| User profile exposure | ✅ Controlled by select statements | Author info limited to id/name/avatar |
| Email exposure | ✅ Not exposed | Never returned in post/comment data |
| IP address tracking | ❌ Not logged | No IP tracking on posts/comments |
| Delete propagation | ✅ SocialPost deletion cascades | Soft-delete pattern used |
| GDPR compliance | 🟡 No data export endpoint | No user data export for posts/comments |

---

## 7. Security Scorecard

| Category | Score | Critical Issues |
|----------|-------|-----------------|
| Authentication | 95/100 | All endpoints guarded with JwtAuthGuard |
| Authorization | 70/100 | Missing membership validation for private communities |
| Rate Limiting | 10/100 | Zero rate limits on any endpoint |
| Input Validation | 85/100 | DTOs validated, HTML not sanitized |
| AI Security | 40/100 | Rate limiting and cost control missing |
| Data Privacy | 75/100 | No GDPR export, IP not tracked |
| Community Access Control | 60/100 | Private communities not enforced |

**Overall**: 62/100 — Rate limiting is the most critical gap. AI endpoint abuse could cause significant cost. Private community enforcement is a data exposure risk.
