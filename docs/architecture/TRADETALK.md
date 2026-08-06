# TradeTalk Community API Guide

## Overview

TradeTalk is the community messaging and conversation platform within TradHexa. It enables structured conversations between marketplace participants with support for labels, folders, templates, and AI-powered assistance. TradeTalk serves as the primary communication channel for negotiations, inquiries, support tickets, and general marketplace discussions.

## Authentication

All TradeTalk endpoints require authentication. Users can only access conversations they are participants in, unless they have an ADMIN role.

```
Authorization: Bearer <access_token>
```

## Conversations

### Create a Conversation

```typescript
const API = 'https://api.tradhexa.com/api/v1';

async function createConversation(conversation: {
  subject: string;
  message: string;
  participantIds: string[];
  category?: 'NEGOTIATION' | 'INQUIRY' | 'SUPPORT' | 'GENERAL' | 'DISPUTE';
  relatedEntityType?: string;
  relatedEntityId?: string;
  labels?: string[];
  folderId?: string;
}) {
  const res = await fetch(`${API}/tradetalk/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(conversation),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### List Conversations

```typescript
async function getConversations(params: {
  folderId?: string;
  label?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'RESOLVED';
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API}/tradetalk/conversations?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}

// Response shape:
// {
//   success: true,
//   data: [
//     {
//       id: "conv_abc",
//       subject: "Quote inquiry for industrial widgets",
//       lastMessage: { content: "...", createdAt: "..." },
//       participantCount: 2,
//       unreadCount: 1,
//       status: "ACTIVE",
//       category: "INQUIRY",
//       labels: ["urgent", "pricing"],
//       createdAt: "2026-07-16T10:30:00.000Z"
//     }
//   ],
//   meta: { total: 25, page: 1, limit: 10, ... }
// }
```

### Get Conversation Detail

```typescript
async function getConversation(id: string) {
  const res = await fetch(`${API}/tradetalk/conversations/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Update Conversation

```typescript
async function updateConversation(id: string, updates: Partial<{
  subject: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'RESOLVED';
  labels: string[];
  folderId: string | null;
}>) {
  const res = await fetch(`${API}/tradetalk/conversations/${id}`, {
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
```

## Messages

### Send a Message

```typescript
async function sendMessage(conversationId: string, message: {
  content: string;
  attachments?: Array<{
    fileName: string;
    url: string;
    mimeType: string;
    size?: number;
  }>;
}) {
  const res = await fetch(
    `${API}/tradetalk/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(message),
    }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

### Get Messages

```typescript
async function getMessages(
  conversationId: string,
  params: {
    before?: string; // cursor pagination: message ID
    limit?: number;
  } = {}
) {
  const query = new URLSearchParams();
  if (params.before) query.set('before', params.before);
  if (params.limit) query.set('limit', String(params.limit));

  const res = await fetch(
    `${API}/tradetalk/conversations/${conversationId}/messages?${query}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}

// Response:
// {
//   success: true,
//   data: [
//     {
//       id: "msg_xyz",
//       senderId: "usr_abc",
//       senderName: "John Buyer",
//       content: "Can you provide a bulk discount?",
//       attachments: [],
//       createdAt: "2026-07-16T10:35:00.000Z"
//     }
//   ],
//   meta: { hasMore: true, nextCursor: "msg_def" }
// }
```

### Mark as Read

```typescript
async function markAsRead(conversationId: string) {
  const res = await fetch(
    `${API}/tradetalk/conversations/${conversationId}/read`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

## Labels

Labels provide a flexible way to organize conversations.

```typescript
// Create a label
async function createLabel(label: {
  name: string;
  color?: string;
}) {
  const res = await fetch(`${API}/tradetalk/labels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(label),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// List labels
async function getLabels() {
  const res = await fetch(`${API}/tradetalk/labels`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Delete label
async function deleteLabel(labelId: string) {
  const res = await fetch(`${API}/tradetalk/labels/${labelId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Apply labels to a conversation
async function applyLabels(conversationId: string, labelIds: string[]) {
  const res = await fetch(
    `${API}/tradetalk/conversations/${conversationId}/labels`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ labelIds }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

## Folders

Folders provide hierarchical organization for conversations.

```typescript
// Create folder
async function createFolder(folder: {
  name: string;
  parentId?: string;
  icon?: string;
}) {
  const res = await fetch(`${API}/tradetalk/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(folder),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// List folders (tree structure)
async function getFolders() {
  const res = await fetch(`${API}/tradetalk/folders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  // Returns nested tree: [{ id, name, children: [...] }]
  return body.data;
}

// Move conversation to folder
async function moveToFolder(conversationId: string, folderId: string | null) {
  const res = await fetch(
    `${API}/tradetalk/conversations/${conversationId}/move`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ folderId }),
    }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

## Templates

Templates enable quick responses for common scenarios.

```typescript
// Create a template
async function createTemplate(template: {
  name: string;
  subject?: string;
  content: string;
  category?: 'NEGOTIATION' | 'INQUIRY' | 'SUPPORT' | 'GENERAL';
  variables?: string[]; // e.g., ["buyerName", "productName"]
  isShared?: boolean; // admin only
}) {
  const res = await fetch(`${API}/tradetalk/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(template),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// List templates
async function getTemplates(category?: string) {
  const query = category ? `?category=${category}` : '';
  const res = await fetch(`${API}/tradetalk/templates${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Use a template (renders with variables)
async function renderTemplate(templateId: string, variables: Record<string, string>) {
  const res = await fetch(`${API}/tradetalk/templates/${templateId}/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ variables }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  // Returns: { subject, content } with variables replaced
  return body.data;
}
```

## Unread Count

```typescript
async function getUnreadCount() {
  const res = await fetch(`${API}/tradetalk/unread`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data; // { total: number, byConversation: { [convId]: number } }
}
```

## AI-Powered Conversation Assistance

TradeTalk integrates with the AI Gateway for conversation intelligence. See [AI_PLATFORM.md](AI_PLATFORM.md) for credit costs and availability.

```typescript
// Summarize conversation
async function summarizeConversation(conversationId: string) {
  const res = await fetch(
    `${API}/tradetalk/conversations/${conversationId}/ai/summarize`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data; // { summary: string, keyPoints: string[] }
}

// Suggest reply
async function suggestReply(conversationId: string) {
  const res = await fetch(
    `${API}/tradetalk/conversations/${conversationId}/ai/suggest-reply`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data; // { suggestions: string[] }
}

// Detect sentiment
async function detectSentiment(conversationId: string) {
  const res = await fetch(
    `${API}/tradetalk/conversations/${conversationId}/ai/sentiment`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  // Returns: { overall: "positive" | "neutral" | "negative", score: number, trends: [...] }
  return body.data;
}
```

## Moderation (Admin)

Admin users can access moderation endpoints to manage community health:

```typescript
// Get flagged conversations
async function getFlaggedConversations(page = 1, limit = 10) {
  const res = await fetch(
    `${API}/admin/tradetalk/flagged?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const body = await res.json();
  if (!res.ok) throw body;
  return body;
}

// Mute user
async function muteUser(userId: string, durationHours: number, reason: string) {
  const res = await fetch(`${API}/admin/tradetalk/mute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ userId, durationHours, reason }),
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}

// Delete message (admin)
async function deleteMessage(messageId: string) {
  const res = await fetch(`${API}/admin/tradetalk/messages/${messageId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  if (!res.ok) throw body;
  return body.data;
}
```

## Webhook Events

TradeTalk emits webhook events for real-time integration:

| Event | Description |
|-------|-------------|
| `tradetalk.message.sent` | A new message is posted |
| `tradetalk.conversation.created` | A new conversation is started |
| `tradetalk.conversation.status_changed` | Conversation status changes |

See [WEBHOOKS.md](WEBHOOKS.md) for webhook registration and handling.
