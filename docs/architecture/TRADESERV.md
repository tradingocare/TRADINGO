# TradeServ Professional Services API Guide

## Overview

TradeServ is the professional services marketplace within TradHexa, enabling businesses to discover, book, and engage with verified professional service providers. TradeServ covers categories such as consulting, legal, accounting, IT services, design, marketing, engineering, and more.

## Authentication

All TradeServ endpoints require authentication. Some public endpoints (search, profile viewing) are accessible with a BUYER or SELLER role, while management endpoints require the professional's authorization.

```
Authorization: Bearer <access_token>
```

## Professional Profiles

### Create/Update Professional Profile

Professionals must first have a company account (SELLER role) and then create their TradeServ profile:

```typescript
const API = 'https://api.tradhexa.com/api/v1';

async function createProfessionalProfile(profile: {
  professionalType: 'INDIVIDUAL' | 'FIRM' | 'AGENCY' | 'CONSULTANT';
  bio: string;
  yearsOfExperience: number;
  hourlyRate?: number;
  currency?: string;
  languages?: string[];
  serviceAreas?: string[];
  availability?: {
    monday?: { start: string; end: string }[];
    tuesday?: { start: string; end: string }[];
    wednesday?: { start: string; end: string }[];
    thursday?: { start: string; end: string }[];
    friday?: { start: string; end: string }[];
    saturday?: { start: string; end: string }[];
    sunday?: { start: string; end: string }[];
  };
}) {
  const res = await fetch(`${API}/tradeserv/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function updateProfile(updates: Partial<{
  bio: string;
  yearsOfExperience: number;
  hourlyRate: number;
  currency: string;
}>) {
  const res = await fetch(`${API}/tradeserv/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function getMyProfile() {
  const res = await fetch(`${API}/tradeserv/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Services

Define the specific services you offer:

```typescript
async function addService(service: {
  name: string;
  description: string;
  categoryId: string;
  priceType: 'FIXED' | 'HOURLY' | 'PROJECT_BASED';
  price?: number;
  currency?: string;
  estimatedDuration?: string;
  isActive?: boolean;
}) {
  const res = await fetch(`${API}/tradeserv/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(service),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function updateService(serviceId: string, updates: Partial<{
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}>) {
  const res = await fetch(`${API}/tradeserv/services/${serviceId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updates),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function listMyServices() {
  const res = await fetch(`${API}/tradeserv/services`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Portfolio

Showcase past work and projects:

```typescript
async function addPortfolioItem(item: {
  title: string;
  description: string;
  imageUrls?: string[];
  projectUrl?: string;
  clientName?: string;
  completionDate?: string;
  category?: string;
}) {
  const res = await fetch(`${API}/tradeserv/portfolio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function deletePortfolioItem(itemId: string) {
  const res = await fetch(`${API}/tradeserv/portfolio/${itemId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Certifications

```typescript
async function addCertification(cert: {
  title: string;
  issuingOrganization: string;
  credentialId?: string;
  issueDate: string;
  expiryDate?: string;
  verificationUrl?: string;
}) {
  const res = await fetch(`${API}/tradeserv/certifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(cert),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Availability & Service Areas

```typescript
async function setAvailability(availability: {
  timezone: string;
  slots: Array<{
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
  }>;
}) {
  const res = await fetch(`${API}/tradeserv/availability`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(availability),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function setServiceAreas(areas: string[]) {
  const res = await fetch(`${API}/tradeserv/service-areas`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ cities: areas }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

## Service Discovery and Search

### Search Professionals

```typescript
async function searchProfessionals(params: {
  q?: string;
  categoryId?: string;
  city?: string;
  minRating?: number;
  maxHourlyRate?: number;
  professionalType?: string;
  verificationLevel?: string;
  languages?: string[];
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'rating' | 'experience' | 'price_low' | 'price_high';
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => query.append(key, v));
      } else {
        query.set(key, String(value));
      }
    }
  });

  const res = await fetch(`${API}/tradeserv/search?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}
```

### View Professional Profile

```typescript
async function getProfessionalProfile(companyId: string) {
  const res = await fetch(`${API}/tradeserv/professionals/${companyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  // Returns: profile, services, portfolio, certifications, reviews, availability
  return body.data;
}
```

## Booking Lifecycle

### Create Booking Request

```typescript
async function createBooking(booking: {
  professionalId: string;
  serviceId: string;
  description: string;
  proposedDate: string;
  proposedDuration: number; // hours
  budget?: number;
  currency?: string;
  location?: string;
  isRemote?: boolean;
}) {
  const res = await fetch(`${API}/tradeserv/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(booking),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Manage Bookings

```typescript
// Accept booking (professional)
async function acceptBooking(bookingId: string, message?: string) {
  const res = await fetch(
    `${API}/tradeserv/bookings/${bookingId}/accept`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Complete booking
async function completeBooking(bookingId: string) {
  const res = await fetch(
    `${API}/tradeserv/bookings/${bookingId}/complete`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Cancel booking
async function cancelBooking(bookingId: string, reason: string) {
  const res = await fetch(
    `${API}/tradeserv/bookings/${bookingId}/cancel`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// List my bookings
async function getMyBookings(status?: string, page = 1, limit = 10) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) params.set('status', status);

  const res = await fetch(`${API}/tradeserv/bookings?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}
```

Booking statuses: `PENDING`, `ACCEPTED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DISPUTED`.

## Proposals and Inquiries

Buyers can send inquiries to professionals, who respond with proposals:

```typescript
// Send inquiry
async function sendInquiry(professionalId: string, message: string, projectDescription: string) {
  const res = await fetch(`${API}/tradeserv/inquiries`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ professionalId, message, projectDescription }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Submit proposal (professional)
async function submitProposal(inquiryId: string, proposal: {
  description: string;
  timeline: string;
  price: number;
  currency?: string;
  terms?: string;
  attachmentUrls?: string[];
}) {
  const res = await fetch(`${API}/tradeserv/proposals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ inquiryId, ...proposal }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Accept proposal (buyer)
async function acceptProposal(proposalId: string) {
  const res = await fetch(
    `${API}/tradeserv/proposals/${proposalId}/accept`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  // Returns: { bookingId, status: "ACCEPTED" }
  return body.data;
}
```

## Professional Reviews

```typescript
// Submit review (after completed booking)
async function createReview(bookingId: string, review: {
  rating: number; // 1-5
  title?: string;
  description?: string;
  categories?: {
    communication?: number;
    quality?: number;
    timeliness?: number;
    value?: number;
  };
}) {
  const res = await fetch(`${API}/tradeserv/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookingId, ...review }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Get professional reviews
async function getProfessionalReviews(companyId: string, page = 1, limit = 10) {
  const res = await fetch(
    `${API}/tradeserv/professionals/${companyId}/reviews?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}

// Get review summary
async function getReviewSummary(companyId: string) {
  const res = await fetch(
    `${API}/tradeserv/professionals/${companyId}/reviews/summary`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  // Returns: { averageRating, totalReviews, distribution: { 1: n, 2: n, 3: n, 4: n, 5: n } }
  return body.data;
}
```

## Professional Verification Levels

TradeServ supports 8 verification levels:

| Level | Requirements |
|-------|-------------|
| LEVEL_1 | Email verified |
| LEVEL_2 | Phone verified |
| LEVEL_3 | Identity verified (government ID) |
| LEVEL_4 | Business verified (company registration) |
| LEVEL_5 | Professional verified (certifications + portfolio) |
| LEVEL_6 | Premium verified (background check) |
| LEVEL_7 | Enterprise verified (audited) |
| LEVEL_8 | Trusted Partner (top-tier, manually reviewed) |

Higher verification levels result in better search ranking and increased buyer trust. Verification is managed through the company verification flow.

## Saved Searches

```typescript
// Save a search for later
async function saveSearch(params: {
  query: string;
  filters?: Record<string, unknown>;
  notifyOnNew?: boolean;
}) {
  const res = await fetch(`${API}/tradeserv/saved-searches`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function listSavedSearches() {
  const res = await fetch(`${API}/tradeserv/saved-searches`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

async function deleteSavedSearch(searchId: string) {
  const res = await fetch(`${API}/tradeserv/saved-searches/${searchId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```
