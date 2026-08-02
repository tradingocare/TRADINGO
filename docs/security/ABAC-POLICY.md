# Attribute-Based Access Control (ABAC) Policy

## 1. Overview

This document defines the Attribute-Based Access Control policy for the TRADINGO B2B platform. ABAC evaluates access by combining **user attributes**, **resource attributes**, and **environment attributes** against policy rules.

## 2. User Attributes

| Attribute | Type | Values | Description |
|-----------|------|--------|-------------|
| `role` | Enum | `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `VIEWER` | System role assigned to user |
| `userId` | UUID | `string` | Unique user identifier |
| `companyId` | UUID | `string` | User's primary company |
| `department` | String | `sales`, `procurement`, `admin`, `support`, `finance` | Functional department |
| `verificationLevel` | Enum | `LEVEL_0` - `LEVEL_6` | KYC / company verification tier |
| `trustScore` | Int | `0` - `100` | TradTrust algorithmic score |
| `permissions` | String[] | `users:read`, `rfq:create`, `order:approve`, ... | Granular permission flags |
| `organizationId` | UUID | `string` | Organization membership |
| `isActive` | Boolean | `true`, `false` | Account active status |
| `emailVerified` | Boolean | `true`, `false` | Email verification status |
| `mfaEnabled` | Boolean | `true`, `false` | Multi-factor authentication status |
| `subscriptionTier` | Enum | `TRADE_START`, `TRADE_SMART`, `TRADE_PLUS`, `TRADE_PRO`, `TRADE_PREMIUM`, `TRADE_ELITE`, `TRADBUY` | Active subscription plan |

## 3. Resource Attributes

| Attribute | Type | Values | Description |
|-----------|------|--------|-------------|
| `resourceType` | Enum | `rfq`, `quote`, `order`, `company`, `product`, `payment`, `dispute`, `user`, `chat` | Type of resource |
| `sensitivity` | Enum | `public`, `internal`, `confidential`, `restricted` | Data classification level |
| `ownerId` | UUID | `string` | User who owns the resource |
| `ownerCompanyId` | UUID | `string` | Company that owns the resource |
| `category` | String | `buyer`, `seller`, `admin`, `system` | Resource category |
| `status` | String | Varies by resource type | Current lifecycle status |
| `visibility` | Enum | `PUBLIC`, `PRIVATE`, `INVITE_ONLY` | RFQ visibility level |
| `amount` | Decimal | `0.00` - `∞` | Transaction monetary value |
| `createdAt` | DateTime | ISO 8601 | Resource creation timestamp |

## 4. Environment Attributes

| Attribute | Type | Values | Description |
|-----------|------|--------|-------------|
| `accessTime` | Time | `HH:mm` | Time of access request |
| `accessDate` | Date | ISO 8601 | Date of access request |
| `ipAddress` | String | IPv4/IPv6 | Request origin IP |
| `userAgent` | String | Browser/device string | Request client identification |
| `geoLocation` | String | Country/Region code | Geographic origin |
| `deviceType` | Enum | `desktop`, `mobile`, `tablet`, `api` | Device classification |
| `sessionId` | UUID | `string` | Active session identifier |
| `requestMethod` | Enum | `GET`, `POST`, `PATCH`, `DELETE`, `PUT` | HTTP method |
| `apiVersion` | String | semantic version | API version requested |
| `threatScore` | Int | `0` - `100` | Real-time risk assessment |

## 5. Policy Rules Matrix

### 5.1 Resource Access Rules

| Resource | Action | Allowed Roles | Additional Conditions |
|----------|--------|---------------|----------------------|
| RFQ | Create | `VIEWER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN` | `companyId` must exist |
| RFQ | Read (own) | `VIEWER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN` | `ownerCompanyId == user.companyId` |
| RFQ | Read (public) | `ANY` | `visibility == PUBLIC` |
| RFQ | Update | `MANAGER`, `ADMIN`, `SUPER_ADMIN` | `ownerCompanyId == user.companyId` |
| RFQ | Delete | `ADMIN`, `SUPER_ADMIN` | `ownerCompanyId == user.companyId` |
| Quote | Create | `MANAGER`, `ADMIN`, `SUPER_ADMIN` | Matched to user's company |
| Quote | Read | `VIEWER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN` | `ownerCompanyId == user.companyId` OR rfq owner |
| Quote | Update | `MANAGER`, `ADMIN`, `SUPER_ADMIN` | `ownerCompanyId == user.companyId` |
| Order | Create | `MANAGER`, `ADMIN`, `SUPER_ADMIN` | Buyer or Seller company match |
| Order | Read | `VIEWER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN` | `buyerCompanyId` OR `sellerCompanyId` matches |
| Order | Cancel | `MANAGER`, `ADMIN`, `SUPER_ADMIN` | Own company order |
| Company | Create | `VIEWER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN` | Rate limited |
| Company | Read (public) | `ANY` | Public endpoint |
| Company | Update | `MANAGER`, `ADMIN`, `SUPER_ADMIN` | `CompanyOwner` check passes |
| Company | Delete | `ADMIN`, `SUPER_ADMIN` | Soft-delete only |
| Company | Subscription | `ADMIN`, `SUPER_ADMIN` | Admin-only endpoint |
| Company | Assign RM | `ADMIN`, `SUPER_ADMIN` | Admin-only endpoint |
| User | List | `ADMIN`, `SUPER_ADMIN` | Admin-only |
| User | Read (own) | `ANY` (authenticated) | `userId == requester.sub` |
| User | Read (other) | `ADMIN`, `SUPER_ADMIN` | Permission check |
| User | Update Role | `SUPER_ADMIN`, `ADMIN` | Requires `users:write:role` permission |
| User | Delete | `ADMIN`, `SUPER_ADMIN` | Soft-delete |
| Payment | Read | `MANAGER`, `ADMIN`, `SUPER_ADMIN` | Own company payments |
| Payment | Refund | `ADMIN`, `SUPER_ADMIN` | Admin-only |
| Dispute | Create | `MANAGER`, `ADMIN`, `SUPER_ADMIN` | Order participant |
| Dispute | Resolve | `ADMIN`, `SUPER_ADMIN` | Admin arbitration |
| Chat | Send | `VIEWER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN` | Conversation participant |
| Chat | Read | `VIEWER`, `MANAGER`, `ADMIN`, `SUPER_ADMIN` | Conversation participant |
| Escrow | Release | `ADMIN`, `SUPER_ADMIN` | Admin or automated trigger |
| Certifications | Approve | `ADMIN`, `SUPER_ADMIN` | Admin review required |
| Verification | Review | `ADMIN`, `SUPER_ADMIN` | Admin review required |

### 5.2 Environment-Based Conditions

```
Rule E1: GEO_IP_MISMATCH
  IF access.geoLocation != user.profile.country
  AND resource.sensitivity IN ('confidential', 'restricted')
  THEN require MFA challenge

Rule E2: OFF_HOURS_ACCESS
  IF access.accessTime NOT BETWEEN '09:00' AND '18:00'
  AND access.accessDate IS WEEKDAY
  AND resource.sensitivity = 'restricted'
  THEN log as anomalous + require re-authentication

Rule E3: NEW_DEVICE
  IF access.userAgent NOT IN user.knownDevices
  AND resource.sensitivity = 'restricted'
  THEN require email OTP verification

Rule E4: HIGH_VALUE_TRANSACTION
  IF resource.amount > 100000
  AND action IN ('order:create', 'payment:process')
  THEN require dual approval (2FA + manager authorization)

Rule E5: RAPID_SUCCESSIVE_ACCESS
  IF request count > THRESHOLD in TIME_WINDOW
  AND resource.sensitivity = 'restricted'
  THEN throttle + require CAPTCHA
```

### 5.3 Attribute Combination Rules

```
Rule C1: Company Owner Bypass
  IF user.role IN ('ADMIN', 'SUPER_ADMIN')
  THEN bypass company-owner check

Rule C2: Cross-Company Visibility
  IF resource.visibility = 'PUBLIC'
  AND resource.sensitivity = 'public'
  THEN allow ANY authenticated read

Rule C3: Sensitive Data Redaction
  IF resource.sensitivity = 'confidential'
  AND user.role = 'VIEWER'
  THEN redact financial fields

Rule C4: Escalation Prevention
  IF action IN ('user:role:update', 'user:permissions:update')
  AND user.role NOT IN ('SUPER_ADMIN')
  THEN deny

Rule C5: Rate Limit by Role
  IF action = 'rfq:create'
  AND user.subscriptionTier = 'TRADE_START'
  THEN limit: 5/day
  IF user.subscriptionTier = 'TRADE_PREMIUM'
  THEN limit: 50/day
```

## 6. Example ABAC Policies

### Policy 1: Supplier RFQ Access
```
ALLOW access TO rfq:read
WHEN rfq.visibility = 'PUBLIC'
  AND user.role IN ('VIEWER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN')
  AND user.isActive = true
  AND environment.threatScore < 70
```

### Policy 2: Order Management
```
ALLOW access TO order:update
WHEN (user.companyId = order.buyerCompanyId
   OR user.companyId = order.sellerCompanyId
   OR user.role IN ('ADMIN', 'SUPER_ADMIN'))
  AND user.verificationLevel >= 'LEVEL_2'
  AND order.status NOT IN ('COMPLETED', 'CANCELLED')
```

### Policy 3: Financial Data Access
```
ALLOW access TO payment:read
WHEN user.companyId = payment.companyId
  AND user.role IN ('MANAGER', 'ADMIN', 'SUPER_ADMIN')
  AND user.trustScore >= 30
  AND environment.accessTime BETWEEN '06:00' AND '22:00'
```

### Policy 4: Admin Arbitration
```
ALLOW access TO dispute:resolve
WHEN user.role IN ('ADMIN', 'SUPER_ADMIN')
  AND user.department = 'support'
  AND dispute.status = 'ADMIN_ARBITRATION'
  AND environment.mfaEnabled = true
```

### Policy 5: Profile Update
```
ALLOW access TO user:update
WHEN user.userId = resource.ownerId
  AND action NOT IN ('role', 'permissions')
  (Role and permission changes require ADMIN role)
```

### Policy 6: Cross-Entity Chat
```
ALLOW access TO chat:send
WHEN user.companyId IN conversation.participantCompanies
  AND user.isActive = true
  AND conversation.blockedUsers NOT CONTAINS user.userId
  AND environment.rateLimit.messageCount < 30/min
```

## 7. Policy Enforcement Points

| Layer | Enforcement | Technology |
|-------|-------------|------------|
| API Gateway | JWT validation | `@nestjs/passport` + `passport-jwt` |
| Controller | Role + Permission guards | `RolesGuard`, `PermissionsGuard` |
| Service | Business logic checks | `CompanyOwnerGuard`, custom validators |
| Database | Row-level security | Prisma `where` clause injection |
| WebSocket | Connection auth + event validation | Socket.IO middleware + `checkRateLimit()` |
| File Upload | MIME type + size + scan validation | `FileScanService` + S3 presigned URLs |

## 8. Policy Review Schedule

- **Quarterly**: Full policy review and update
- **Monthly**: Anomaly detection threshold tuning
- **Per Release**: New resource types and action definitions
- **Incident-Driven**: Immediate rule modification on security events
