# Tradingo API Authentication Guide

## Overview

Tradingo uses JWT (JSON Web Token) bearer authentication with refresh token rotation. All authenticated endpoints require a valid access token in the `Authorization` header. This guide covers registration, login, token management, and security best practices.

## Registration

There are three registration flows depending on the account type. All registration endpoints accept `Content-Type: application/json`.

### Buyer Registration

```typescript
const API_BASE = 'https://api.tradhexa.com/api/v1';

async function registerBuyer() {
  const response = await fetch(`${API_BASE}/auth/register/buyer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'buyer@example.com',
      password: 'SecurePass123!',
      name: 'John Buyer',
      companyName: 'Acme Corp',
      mobile: '+919876543210',
    }),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

Required fields:

| Field | Type | Description |
|-------|------|-------------|
| `email` | string | Valid email address |
| `password` | string | Min 8 chars, 1 uppercase, 1 number |
| `name` | string | Full name |
| `companyName` | string | Company or organization name |
| `mobile` | string | Mobile number with country code |

### Vendor Registration

```typescript
async function registerVendor() {
  const response = await fetch(`${API_BASE}/auth/register/vendor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'vendor@example.com',
      password: 'SecurePass123!',
      name: 'Jane Vendor',
      companyName: 'SupplyCo Ltd',
      businessType: 'MANUFACTURER',
      mobile: '+919876543211',
    }),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

Additional vendor fields:

| Field | Type | Description |
|-------|------|-------------|
| `businessType` | string | MANUFACTURER, DISTRIBUTOR, WHOLESALER, SUPPLIER, SERVICE_PROVIDER |
| `gstin` | string | Optional GST identification number |
| `businessAddress` | string | Optional business address |

### General Registration

For administrators or users who will be assigned roles later:

```typescript
async function register() {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: 'Alex User',
    }),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

## Login

Login returns an access token (15-minute expiry), a refresh token (7-day expiry), and the authenticated user object.

```typescript
async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const body = await response.json();
  if (!response.ok) throw body;

  const { accessToken, refreshToken, user } = body.data;

  // Store tokens securely (e.g., httpOnly cookie, secure storage)
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);

  return { accessToken, refreshToken, user };
}
```

Response shape:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
    "user": {
      "id": "usr_abc123",
      "email": "buyer@example.com",
      "name": "John Buyer",
      "role": "BUYER",
      "companyId": "comp_xyz789",
      "emailVerified": true,
      "verificationLevel": "LEVEL_2"
    }
  },
  "timestamp": "2026-07-16T10:30:00.000Z"
}
```

## Using the Access Token

Attach the access token to all authenticated requests:

```typescript
async function authenticatedRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('accessToken');
  if (!token) throw new Error('No access token available');

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired — attempt refresh
    const newToken = await refreshAccessToken();
    return authenticatedRequest(endpoint, options);
  }

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

## Token Refresh

When the access token expires (HTTP 401), use the refresh token to obtain a new one:

```typescript
async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    // Refresh failed — force re-login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const { accessToken, refreshToken: newRefreshToken } = body.data;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', newRefreshToken);

  return accessToken;
}
```

## Password Management

### Forgot Password

Initiates a password reset by sending an OTP to the registered email:

```typescript
async function forgotPassword(email: string) {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

### Reset Password

Completes password reset using the OTP received via email:

```typescript
async function resetPassword(email: string, otp: string, newPassword: string) {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword }),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

### Change Password

Changes the password for an authenticated user:

```typescript
async function changePassword(currentPassword: string, newPassword: string) {
  const response = await fetch(`${API_BASE}/auth/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

## Email Verification

```typescript
async function verifyEmail(otp: string) {
  const response = await fetch(`${API_BASE}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify({ otp }),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

An OTP is sent to the registered email address automatically after registration. The OTP expires in 10 minutes.

## Mobile Verification

```typescript
async function verifyMobile(otp: string) {
  const response = await fetch(`${API_BASE}/auth/verify-mobile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify({ otp }),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

## Social / OAuth Login

```typescript
interface SocialLoginParams {
  provider: 'google' | 'facebook' | 'linkedin' | 'github';
  accessToken: string; // OAuth token from the provider
}

async function socialLogin(params: SocialLoginParams) {
  const response = await fetch(`${API_BASE}/auth/social-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data; // { accessToken, refreshToken, user }
}
```

## Update Profile / Settings

```typescript
async function updateSettings(settings: {
  name?: string;
  mobile?: string;
  notificationPreferences?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
}) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(settings),
  });

  const body = await response.json();
  if (!response.ok) throw body;
  return body.data;
}
```

## Role-Based Access Control

The API enforces role-based access control (RBAC) using the following roles:

| Role | Description |
|------|-------------|
| `BUYER` | Can browse products, create RFQs, manage quotes, place orders |
| `SELLER` | Can manage products, respond to RFQs, create quotes, fulfill orders |
| `ADMIN` | Platform administration privileges |
| `SUPER_ADMIN` | Full system access, including system configuration |

Permissions are checked at the controller level using `@Roles()` decorators. Attempting to access an endpoint without the required role returns HTTP 403.

## Security Best Practices

### Token Storage

- **Mobile apps**: Store tokens in secure device storage (iOS Keychain, Android Keystore).
- **Web apps**: Use httpOnly cookies when possible. If using localStorage, ensure the site is served over HTTPS and has no XSS vulnerabilities.
- **Server-side apps**: Store tokens in environment variables or a secure secrets manager.

### HTTPS

All API requests must be made over HTTPS. HTTP requests will be rejected in production.

### Short-Lived Tokens

Access tokens expire after 15 minutes. Never increase this expiry window. Use refresh tokens for long-lived sessions.

### Token Revocation

Refresh tokens can be revoked server-side. Call `POST /auth/logout` when a user signs out to invalidate the current refresh token.

### Rate Limiting

Auth endpoints are strictly rate-limited to 5 requests per minute per IP. This prevents brute-force attacks. See [RATE_LIMITING.md](RATE_LIMITING.md).

### OTP Security

- OTPs expire after 10 minutes.
- OTPs are single-use.
- Multiple failed OTP attempts will temporarily lock the verification flow.

## Complete Auth Flow Example

```typescript
// Full login-to-api-call flow with automatic refresh
class TradingoClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(
    private baseUrl: string = 'https://api.tradhexa.com/api/v1'
  ) {}

  async login(email: string, password: string) {
    const res = await this.request('POST', '/auth/login', { email, password });
    this.accessToken = res.accessToken;
    this.refreshToken = res.refreshToken;
  }

  async request<T>(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && this.refreshToken) {
      await this.doRefresh();
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      const retry = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      const retryBody = await retry.json();
      if (!retry.ok) throw retryBody;
      return retryBody.data;
    }

    const responseBody = await response.json();
    if (!response.ok) throw responseBody;
    return responseBody.data;
  }

  private async doRefresh() {
    const res = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.refreshToken}`,
      },
    });
    const body = await res.json();
    if (!res.ok) throw new Error('Refresh failed');
    this.accessToken = body.data.accessToken;
    this.refreshToken = body.data.refreshToken;
  }
}
```
